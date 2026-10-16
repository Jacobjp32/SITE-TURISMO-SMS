// Rodada 1 (2026-10) — editar um empreendimento publicado não pode tirá-lo do ar.
// Executa o módulo real do painel (js/admin/modules/empreendimentos.js) contra as
// Rules locais no Firestore Emulator, com dados sintéticos.
import { strict as assert } from "node:assert";
import { readFile } from "node:fs/promises";
import { after, before, beforeEach, test } from "node:test";
import vm from "node:vm";

import { initializeTestEnvironment } from "@firebase/rules-unit-testing";
import { deleteField, doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";

const PROJECT_ID = "demo-turismo-sms-admin-finalization";
const ADMIN_A = "admin-rodada1-a";
const ADMIN_B = "admin-rodada1-b";
const ID = "rodada1-publicado";
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
              return raw.get();
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

test("editar publicado mantém o item no ar em cada etapa do salvamento", async () => {
  const observed = [];
  const compat = compatDb(dbA, {
    afterTransaction: async () => { observed.push((await current()).status); },
  });
  const module = loadModule(compat, ADMIN_A);
  await module._applyCanonicalFields(ID, {
    name: "Sítio Sintético Renovado",
    "content.summary": "Resumo novo",
    "contact.phone": "(42) 3000-0000",
  }, { flow: "rodada1-multigrupo" });

  assert.ok(observed.length >= 3, `esperava 3+ transações, houve ${observed.length}`);
  assert.deepEqual(observed, observed.map(() => "published"));
  const final = await current();
  assert.equal(final.status, "published");
  assert.equal("editSession" in final, false);
  assert.equal(final.name, "Sítio Sintético Renovado");
  assert.equal(final.content.summary, "Resumo novo");
  assert.equal(final.contact.phone, "(42) 3000-0000");
  assert.equal(final.revision, 5 + observed.length);
  assert.equal(final.publishing.publishedBy, ADMIN_A, "a publicação original é preservada");
});

test("falha no meio do salvamento não tira do ar e a nova tentativa conclui", async () => {
  const failing = loadModule(compatDb(dbA, { failOnTransaction: 2 }), ADMIN_A);
  await assert.rejects(failing._applyCanonicalFields(ID, {
    "content.summary": "Resumo depois da falha",
    "contact.phone": "(42) 3111-1111",
  }, { flow: "rodada1-falha" }), /falha-sintetica-de-rede/);

  const partial = await current();
  assert.equal(partial.status, "published", "o item continua publicado depois da falha");
  assert.equal("editSession" in partial, false);
  assert.equal(partial.content.summary, "Resumo depois da falha", "o primeiro grupo foi gravado");
  assert.equal(partial.contact.phone, "", "o segundo grupo não foi gravado");

  const retry = loadModule(compatDb(dbA), ADMIN_A);
  await retry._applyCanonicalFields(ID, {
    "content.summary": "Resumo depois da falha",
    "contact.phone": "(42) 3111-1111",
  }, { flow: "rodada1-retry" });
  const final = await current();
  assert.equal(final.status, "published");
  assert.equal(final.contact.phone, "(42) 3111-1111");
});

test("dados que deixariam o item impublicável são recusados antes de qualquer gravação", async () => {
  const module = loadModule(compatDb(dbA), ADMIN_A);
  await assert.rejects(module._applyCanonicalFields(ID, {
    "content.summary": "",
    "content.description": "",
  }, { flow: "rodada1-impublicavel" }), { code: "establishment-not-publishable" });
  const after = await current();
  assert.equal(after.status, "published");
  assert.equal(after.revision, 5, "nada foi gravado");
  assert.equal(after.content.summary, "Resumo original");
});

test("dois administradores: a alteração do outro é detectada e nunca sobrescrita", async () => {
  const compatA = compatDb(dbA);
  const moduleA = loadModule(compatA, ADMIN_A);
  const stale = moduleA._normalizeDoc(await current(), ID);
  const desired = moduleA._normalizeDoc(stale, ID);
  desired.content.summary = "Versão do administrador A";
  const sagaA = moduleA._buildSaga(compatA.collection("cms_establishments").doc(ID), desired, stale, ADMIN_A, ["content"]);

  const moduleB = loadModule(compatDb(dbB), ADMIN_B);
  await moduleB._applyCanonicalFields(ID, { "content.summary": "Versão do administrador B" }, { flow: "rodada1-admin-b" });

  await assert.rejects(moduleA._executeSaga(compatA, sagaA), { code: "establishment-conflict" });
  const final = await current();
  assert.equal(final.content.summary, "Versão do administrador B");
  assert.equal(final.updatedBy, ADMIN_B);
  assert.equal(final.status, "published");
});

test("reconciliação lê sempre do servidor, nunca do cache local", async () => {
  const compat = compatDb(dbA);
  const module = loadModule(compat, ADMIN_A);
  await module._applyCanonicalFields(ID, { "content.summary": "Leitura do servidor" }, { flow: "rodada1-server" });
  assert.ok(compat.getCalls.length > 0);
  assert.deepEqual(compat.getCalls.map((options) => JSON.stringify(options)), compat.getCalls.map(() => "{\"source\":\"server\"}"));
});

test("conflito real de outro admin entre o início e a gravação é detectado", async () => {
  // A abre o registro (revisão 5); B grava direto pelas Rules; A tenta salvar com
  // expectedRevision antigo e precisa receber conflito, sem tocar no documento.
  const raw = await current();
  await updateDoc(doc(dbB, "cms_establishments", ID), {
    content: { ...raw.content, summary: "Gravado por B direto" },
    schemaVersion: 2,
    validatedGroups: raw.validatedGroups,
    revision: raw.revision + 1,
    updatedAt: serverTimestamp(),
    updatedBy: ADMIN_B,
  });
  const moduleA = loadModule(compatDb(dbA), ADMIN_A);
  await assert.rejects(moduleA._applyCanonicalFields(ID, { "content.summary": "Gravado por A" }, {
    flow: "rodada1-expected-revision",
    expectedRevision: 5,
  }), { code: "establishment-conflict" });
  assert.equal((await current()).content.summary, "Gravado por B direto");
});
