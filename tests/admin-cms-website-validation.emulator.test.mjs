// Regressão HTTPS: namespace independente, sem limpar o projeto de homologação.
// Executa o módulo real do painel (js/admin/modules/empreendimentos.js) contra as
// Rules locais no Firestore Emulator, com dados sintéticos.
import { strict as assert } from "node:assert";
import { readFile } from "node:fs/promises";
import { after, before, beforeEach, test } from "node:test";
import vm from "node:vm";

import { initializeTestEnvironment } from "@firebase/rules-unit-testing";
import { deleteField, doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";

const PROJECT_ID = "demo-turismo-sms-cms-https-regression";
const ADMIN_A = "admin-cms-https-a";
const ADMIN_B = "admin-cms-https-b";
const ID = "cms-https-publicado";
const GROUPS = [
  "core", "content", "contact", "location", "media",
  "relationshipsRouteIds", "relationshipsRelatedPlaceIds", "relationshipsRelatedEventIds",
  "display", "seo", "review", "source", "lifecycle",
];

const adminSource = await readFile(new URL("../js/admin/modules/empreendimentos.js", import.meta.url), "utf8");

let testEnv;
let dbA;
let dbB;

function publishedFixture() {
  return {
    id: ID,
    slug: ID,
    name: "Sítio Sintético",
    categoryId: "gastronomia",
    categoryLabel: "Gastronomia",
    status: "published",
    content: {
      summary: "Resumo original", description: "", longDescription: "", accessibility: "",
      openingHours: "", tags: ["sintetico"], notesInternal: "",
    },
    contact: { phone: "", whatsapp: "", email: "", website: "", instagram: "", facebook: "" },
    location: {
      address: "Rua Sintética, 1", neighborhood: "", city: "São Mateus do Sul", state: "PR",
      postalCode: "", coordinates: { lat: -25.87, lng: -50.38 }, mapsUrl: "", coordStatus: "", coordNote: "",
    },
    media: {
      mainImage: { url: "https://example.test/capa.webp", path: "", alt: "Capa", caption: "", credit: "", source: "cms-media", status: "active" },
      gallery: [], videoUrl: "", sourceCredits: "",
    },
    relationships: { routeIds: [], relatedPlaceIds: [], relatedEventIds: [], legacyRoute: "", legacyRouteName: "" },
    display: { featured: false, priority: 10, mapVisible: true, claimable: true },
    seo: { title: "", description: "", canonicalPath: `/local?id=${ID}` },
    publishing: {
      publishedAt: new Date("2026-10-01T12:00:00Z"), publishedBy: ADMIN_A,
      archivedAt: null, archivedBy: "", archiveReason: "",
    },
    review: {
      lastAppliedRequestId: "", lastAppliedAt: null, lastAppliedBy: "", lastReviewNotes: "",
      lastMediaEditedAt: null, lastMediaEditedBy: "", mediaEditReason: "",
    },
    source: {
      origin: "admin", sourceFile: "", originalId: ID, originalCategory: "",
      legacyIds: [], seededAt: null, sourceUpdatedAt: null,
    },
    createdAt: new Date("2026-10-01T12:00:00Z"),
    createdBy: ADMIN_A,
    updatedAt: new Date("2026-10-01T12:00:00Z"),
    updatedBy: ADMIN_A,
    schemaVersion: 2,
    validatedGroups: Object.fromEntries(GROUPS.map((group) => [group, 2])),
    revision: 5,
  };
}

function plainRealm(value) {
  if (value == null || typeof value !== "object") return value;
  if (value instanceof Date || typeof value.toMillis === "function" || value._methodName) return value;
  if (Array.isArray(value)) return value.map(plainRealm);
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, plainRealm(item)]));
}

// Adaptador compat sobre o SDK modular, com sondas: registra as opções de get()
// e permite observar o documento depois de cada transação ou forçar uma falha.
function compatDb(db, probe = {}) {
  let transactions = 0;
  return {
    getCalls: [],
    collection(name) {
      const self = this;
      return {
        doc(id) {
          const raw = db.collection(name).doc(id);
          return {
            id,
            raw,
            get(options) {
              self.getCalls.push(options || null);
              const stale = probe.staleGet ? probe.staleGet() : null;
              return stale ? Promise.resolve(stale) : raw.get();
            },
          };
        },
      };
    },
    async runTransaction(callback) {
      transactions += 1;
      if (probe.failOnTransaction === transactions) throw new Error("falha-sintetica-de-rede");
      const result = await db.runTransaction((transaction) => callback({
        get: (ref) => transaction.get(ref.raw),
        update: (ref, patch) => transaction.update(ref.raw, plainRealm(patch)),
      }));
      if (probe.afterTransaction) await probe.afterTransaction(transactions);
      return result;
    },
  };
}

function loadModule(compat, uid) {
  const sandbox = {
    console,
    document: { getElementById: () => null },
    window: {
      setTimeout,
      AdminContext: { db: compat, storage: null, currentUser: { uid } },
      AdminUI: { showToast() {} },
      crypto: globalThis.crypto,
      firebase: { firestore: { FieldValue: {
        serverTimestamp: () => serverTimestamp(),
        delete: () => deleteField(),
      } } },
    },
  };
  vm.runInNewContext(adminSource, sandbox);
  return sandbox.window.AdminEstablishmentsModule;
}

async function current() {
  return (await getDoc(doc(dbA, "cms_establishments", ID))).data();
}

before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: await readFile(new URL("../firestore.rules", import.meta.url), "utf8"),
      host: "127.0.0.1",
      port: 8080,
    },
  });
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "usuarios", ADMIN_A), { role: "admin", ativo: true });
    await setDoc(doc(context.firestore(), "usuarios", ADMIN_B), { role: "admin", ativo: true });
  });
  dbA = testEnv.authenticatedContext(ADMIN_A).firestore();
  dbB = testEnv.authenticatedContext(ADMIN_B).firestore();
});

beforeEach(async () => {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "cms_establishments", ID), publishedFixture());
  });
});

after(async () => {
  await testEnv?.cleanup();
});

test('Rules continuam recusando contato HTTP sem mutação nem despublicação', async () => {
  const raw = await current();
  await assert.rejects(updateDoc(doc(dbA, 'cms_establishments', ID), {
    contact: { ...raw.contact, website: 'http://hotel.example' },
    revision: raw.revision + 1, updatedAt: serverTimestamp(), updatedBy: ADMIN_A,
  }), error => error.code === 'permission-denied');
  const after = await current();
  assert.equal(after.contact.website, '');
  assert.equal(after.status, 'published');
  assert.equal(after.revision, 5);
});

test('edição de contato HTTPS mantém publicado em cada transação', async () => {
  const observed = [];
  const module = loadModule(compatDb(dbA, { afterTransaction: async () => observed.push((await current()).status) }), ADMIN_A);
  await module._applyCanonicalFields(ID, {
    'contact.phone': '(42) 3000-1111', 'contact.website': 'https://hotel.example/contato',
  }, { flow: 'cms-https-regression' });
  const final = await current();
  assert.ok(observed.length > 0);
  assert.deepEqual(observed, observed.map(() => 'published'));
  assert.equal(final.contact.website, 'https://hotel.example/contato');
  assert.equal(final.contact.phone, '(42) 3000-1111');
  assert.equal(final.publishing.publishedBy, ADMIN_A);
  assert.equal('editSession' in final, false);
});

test('legado HTTP bloqueia validação do telefone e permite correção HTTPS sem retirar do ar', async () => {
  const legacy = publishedFixture();
  legacy.contact.website = 'http://hotel.example';
  await testEnv.withSecurityRulesDisabled(context => setDoc(doc(context.firestore(), 'cms_establishments', ID), legacy));
  const observed = [];
  const module = loadModule(compatDb(dbA, { afterTransaction: async () => observed.push((await current()).status) }), ADMIN_A);
  const desired = module._normalizeDoc(await current(), ID);
  desired.contact.phone = '(42) 3000-2222';
  assert.match(module._validateDocForSave(desired), /Site.*HTTPS/);
  assert.equal((await current()).revision, 5, 'o bloqueio preventivo não escreve');
  desired.contact.website = 'https://hotel.example';
  assert.equal(module._validateDocForSave(desired), '');
  await module._applyCanonicalFields(ID, {
    'contact.phone': desired.contact.phone, 'contact.website': desired.contact.website,
  }, { flow: 'cms-https-legacy-correction' });
  assert.deepEqual(observed, observed.map(() => 'published'));
  assert.ok(observed.length > 0);
  const final = await current();
  assert.equal(final.status, 'published');
  assert.equal(final.contact.website, 'https://hotel.example');
  assert.equal(final.contact.phone, '(42) 3000-2222');
  assert.equal(final.publishing.publishedBy, ADMIN_A);
});

test('website vazio permanece válido ao salvar contato de empreendimento publicado', async () => {
  const module = loadModule(compatDb(dbA), ADMIN_A);
  const desired = module._normalizeDoc(await current(), ID);
  desired.contact.phone = '(42) 3000-3333';
  assert.equal(module._validateDocForSave(desired), '');
  await module._applyCanonicalFields(ID, { 'contact.phone': desired.contact.phone, 'contact.website': '' });
  const final = await current();
  assert.equal(final.contact.website, '');
  assert.equal(final.contact.phone, desired.contact.phone);
  assert.equal(final.status, 'published');
});

test('HTTP legado permite descrição isolada: contato e publicação ficam intactos nas Rules reais', async () => {
  const legacy = publishedFixture();
  legacy.contact.website = 'http://hotel.example';
  await testEnv.withSecurityRulesDisabled(context => setDoc(doc(context.firestore(), 'cms_establishments', ID), legacy));
  const original = await current();
  const observed = [];
  const module = loadModule(compatDb(dbA, { afterTransaction: async () => observed.push(await current()) }), ADMIN_A);
  const base = module._normalizeDoc(original, ID), desired = module._normalizeDoc(original, ID);
  desired.content.description = 'Descrição sintética atualizada';
  assert.deepEqual(Array.from(module._groupsToWrite(base, desired)), ['content']);
  assert.equal(module._validateDocForSave(desired, base), '');
  await module._applyCanonicalFields(ID, { 'content.description': desired.content.description });
  const final = await current();
  assert.equal(final.content.description, desired.content.description);
  assert.deepEqual(final.contact, original.contact);
  assert.deepEqual(final.publishing, original.publishing);
  assert.ok(observed.length > 0);
  assert.ok(observed.every(doc => doc.status === 'published' && !doc.editSession));
  assert.equal(final.revision, original.revision + 1);
});

test('HTTP legado com descrição e telefone bloqueia antes da primeira transação e não deixa conteúdo parcial', async () => {
  const legacy = publishedFixture();
  legacy.contact.website = 'http://hotel.example';
  await testEnv.withSecurityRulesDisabled(context => setDoc(doc(context.firestore(), 'cms_establishments', ID), legacy));
  const original = await current();
  let transactions = 0;
  const compat = compatDb(dbA);
  const run = compat.runTransaction.bind(compat);
  compat.runTransaction = callback => { transactions++; return run(callback); };
  const module = loadModule(compat, ADMIN_A);
  await assert.rejects(module._applyCanonicalFields(ID, {
    'content.description': 'Não pode gravar esta alteração parcial',
    'contact.phone': '(42) 3000-9999',
  }), /Site.*HTTPS/);
  assert.equal(transactions, 0);
  assert.deepEqual(await current(), original);
});

test('migração que exige contato HTTP bloqueia antes de qualquer grupo com mensagem específica', async () => {
  const legacy = publishedFixture();
  legacy.contact.website = 'http://hotel.example';
  delete legacy.validatedGroups.contact;
  await testEnv.withSecurityRulesDisabled(context => setDoc(doc(context.firestore(), 'cms_establishments', ID), legacy));
  const original = await current();
  const module = loadModule(compatDb(dbA, { failOnTransaction: 1 }), ADMIN_A);
  const base = module._normalizeDoc(original, ID), desired = module._normalizeDoc(original, ID);
  desired.content.description = 'Descrição atualizada';
  assert.ok(module._groupsToWrite(base, desired).includes('contact'));
  assert.match(module._validateDocForSave(desired, base), /migra.*contato.*HTTPS/i);
  await assert.rejects(module._applyCanonicalFields(ID, {
    'content.description': desired.content.description,
  }, { groups: ['content', 'contact'] }), /migra.*contato.*HTTPS/i);
  assert.deepEqual(await current(), original);
});

test('retomada publicada legada antecipa migração de contato e não grava lifecycle nem conteúdo parcial', async () => {
  const legacy = publishedFixture();
  legacy.contact.website = 'http://hotel.example';
  delete legacy.validatedGroups.contact;
  legacy.editSession = { resumeStatus: 'published', startedAt: new Date('2026-10-01T13:00:00Z'), startedBy: ADMIN_A };
  await testEnv.withSecurityRulesDisabled(context => setDoc(doc(context.firestore(), 'cms_establishments', ID), legacy));
  const original = await current();
  let transactions = 0;
  const compat = compatDb(dbA);
  const run = compat.runTransaction.bind(compat);
  compat.runTransaction = callback => { transactions++; return run(callback); };
  const module = loadModule(compat, ADMIN_A);
  let failure;
  try {
    await module._applyCanonicalFields(ID, {
      'content.description': 'Descrição que não pode ficar parcialmente gravada',
    }, { groups: ['content'] });
  } catch (error) { failure = error; }
  assert.equal(transactions, 0, 'validar o plano inteiro antes da primeira transação de lifecycle');
  assert.match(failure?.message || '', /migra.*contato.*HTTPS/i);
  assert.deepEqual(await current(), original);
  assert.equal((await current()).status, 'published');
});
