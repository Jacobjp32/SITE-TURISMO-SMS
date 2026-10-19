// Regressão do incidente de 2026-10-19: administradores ativos recebiam
// "permission-denied" ao salvar empreendimentos publicados porque a avaliação
// das Rules passava do limite de 1000 expressões. Executa o módulo real do
// painel contra as Rules locais no Firestore Emulator, com dados sintéticos
// (formato igual ao dos cadastros reais, sem dados de produção).
import { strict as assert } from "node:assert";
import { readFile } from "node:fs/promises";
import { after, before, test } from "node:test";
import vm from "node:vm";

import { assertFails, assertSucceeds, initializeTestEnvironment } from "@firebase/rules-unit-testing";
import { deleteField, doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";

const PROJECT_ID = "demo-turismo-sms-admin-finalization";
const ADMIN = "admin-budget";
const INACTIVE_ADMIN = "admin-budget-inativo";
const COMMON_USER = "usuario-budget";
const NO_PROFILE = "sem-perfil-budget";
const GROUPS = [
  "core", "content", "contact", "location", "media",
  "relationshipsRouteIds", "relationshipsRelatedPlaceIds", "relationshipsRelatedEventIds",
  "display", "seo", "review", "source", "lifecycle",
];

const adminSource = await readFile(new URL("../js/admin/modules/empreendimentos.js", import.meta.url), "utf8");

function image(id, index) {
  // Imagem com todos os metadados que o painel grava (crédito, legenda, revisão...).
  return {
    url: `https://example.test/${id}/foto-${index}.webp?alt=media&token=${"t".repeat(36)}`,
    path: `approved-media/cms-establishments/${id}/foto-${index}.webp`,
    alt: "Texto alternativo da foto ".repeat(6).slice(0, 160),
    caption: "Legenda descritiva da foto ".repeat(9).slice(0, 240),
    credit: "Foto: Autor Sintético / Agência Sintética ".repeat(4).slice(0, 160),
    source: "cms-media", status: "active", position: index + 1,
    sourceRequestId: `req-${index}`, sourceImagePath: `establishment-submissions/${id}/${index}.webp`,
    uploadedBy: "uid-sintetico", uploadedAt: "2026-10-01T12:00:00.000Z",
    reviewedBy: "uid-sintetico", reviewedAt: "2026-10-01T12:00:00.000Z",
    updatedAt: "2026-10-01T12:00:00.000Z", updatedBy: "uid-sintetico", removedAt: "", removedBy: "",
  };
}

const list = (prefix, size) => Array.from({ length: size }, (_, index) => `${prefix}-${index}`);

function publishedFixture(id, sizes) {
  return {
    id, slug: id, name: "Empreendimento Sintético", categoryId: "gastronomia", categoryLabel: "Gastronomia",
    status: "published",
    content: {
      summary: "Resumo sintético", description: "Descrição sintética", longDescription: "Texto longo. ".repeat(300),
      accessibility: "", openingHours: "Ter a Dom", tags: list("tag", sizes.tags), notesInternal: "",
    },
    contact: { phone: "(42) 3000-0000", whatsapp: "", email: "", website: "", instagram: "", facebook: "" },
    location: {
      address: "Colônia Sintética", neighborhood: "", city: "São Mateus do Sul", state: "PR", postalCode: "",
      coordinates: { lat: -25.82, lng: -50.31 }, mapsUrl: "https://maps.example.test/x", coordStatus: "ok", coordNote: "",
    },
    media: {
      mainImage: image(id, 99),
      gallery: Array.from({ length: sizes.gallery }, (_, index) => image(id, index)),
      publicPaths: [], videoUrl: "", sourceCredits: "",
    },
    relationships: {
      routeIds: list("rota", sizes.routes), relatedPlaceIds: list("lugar", sizes.places),
      relatedEventIds: list("evento", sizes.events), legacyRoute: "", legacyRouteName: "",
    },
    display: { featured: false, priority: 10, mapVisible: true, claimable: true },
    seo: { title: "", description: "", canonicalPath: `/local?id=${id}` },
    publishing: { publishedAt: new Date("2026-10-01T12:00:00Z"), publishedBy: ADMIN, archivedAt: null, archivedBy: "", archiveReason: "" },
    review: {
      lastAppliedRequestId: "", lastAppliedAt: null, lastAppliedBy: "", lastReviewNotes: "",
      lastMediaEditedAt: null, lastMediaEditedBy: "", mediaEditReason: "",
    },
    source: {
      origin: "admin", sourceFile: "", originalId: id, originalCategory: "",
      legacyIds: list("legado", sizes.legacy), seededAt: null, sourceUpdatedAt: null,
    },
    createdAt: new Date("2026-10-01T12:00:00Z"), createdBy: ADMIN,
    updatedAt: new Date("2026-10-01T12:00:00Z"), updatedBy: ADMIN,
    schemaVersion: 2,
    validatedGroups: Object.fromEntries(GROUPS.map((group) => [group, 2])),
    revision: 14,
  };
}

// Cadastro realista (como os maiores publicados hoje) e o máximo que o painel
// consegue produzir: galeria de 60 fotos, tags 30, rotas 20, IDs legados 20 e
// lugares/eventos relacionados no teto das Rules (50).
const FIXTURES = {
  realista: { gallery: 9, tags: 15, routes: 2, places: 0, events: 0, legacy: 3 },
  maximoDoPainel: { gallery: 60, tags: 30, routes: 20, places: 50, events: 50, legacy: 20 },
};

const CHANGES = {
  core: () => ({ name: "Nome alterado" }),
  content: () => ({ "content.summary": "Resumo alterado" }),
  contact: () => ({ "contact.phone": "(42) 3111-1111" }),
  location: () => ({ "location.address": "Espigãozinho", "location.coordinates": { lat: -25.8243901, lng: -50.3306747 } }),
  media: (d) => ({ "media.gallery": d.media.gallery.map((g, i) => ({ ...g, credit: `Foto: Crédito novo ${i}` })) }),
  relationshipsRouteIds: () => ({ "relationships.legacyRouteName": "Rota alterada" }),
  relationshipsRelatedPlaceIds: (d) => ({ "relationships.relatedPlaceIds": d.relationships.relatedPlaceIds.slice(0, 49).concat(["lugar-novo"]) }),
  relationshipsRelatedEventIds: (d) => ({ "relationships.relatedEventIds": d.relationships.relatedEventIds.slice(0, 49).concat(["evento-novo"]) }),
  display: () => ({ "display.priority": 11 }),
  seo: () => ({ "seo.title": "Título alterado" }),
  review: () => ({ "review.lastReviewNotes": "Nota alterada" }),
  source: () => ({ "source.originalCategory": "categoria-alterada" }),
};

function plainRealm(value) {
  if (value == null || typeof value !== "object") return value;
  if (value instanceof Date || typeof value.toMillis === "function" || value._methodName) return value;
  if (Array.isArray(value)) return value.map(plainRealm);
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, plainRealm(item)]));
}

function compatDb(db) {
  return {
    collection(name) {
      return { doc(id) { const raw = db.collection(name).doc(id); return { id, raw, get: () => raw.get() }; } };
    },
    runTransaction(callback) {
      return db.runTransaction((t) => callback({
        get: (ref) => t.get(ref.raw),
        update: (ref, patch) => t.update(ref.raw, plainRealm(patch)),
      }));
    },
  };
}

function loadModule(db) {
  const sandbox = {
    console: { ...console, warn() {} },
    document: { getElementById: () => null },
    window: {
      setTimeout,
      AdminContext: { db: compatDb(db), storage: null, currentUser: { uid: ADMIN } },
      AdminUI: { showToast() {} },
      crypto: globalThis.crypto,
      firebase: { firestore: { FieldValue: { serverTimestamp: () => serverTimestamp(), delete: () => deleteField() } } },
    },
  };
  vm.runInNewContext(adminSource, sandbox);
  return sandbox.window.AdminEstablishmentsModule;
}

let testEnv;
let adminDb;

async function seed(id, data) {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "cms_establishments", id), data);
  });
}

async function read(id) {
  let data;
  await testEnv.withSecurityRulesDisabled(async (context) => {
    data = (await getDoc(doc(context.firestore(), "cms_establishments", id))).data();
  });
  return data;
}

// Gravação de um grupo exatamente como o painel envia (marcador, revisão, auditoria).
function groupWrite(current, uid, group, fields) {
  return {
    ...fields,
    schemaVersion: 2,
    validatedGroups: { ...current.validatedGroups, [group]: 2 },
    revision: current.revision + 1,
    updatedAt: serverTimestamp(),
    updatedBy: uid,
  };
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
    const db = context.firestore();
    await setDoc(doc(db, "usuarios", ADMIN), { role: "admin", ativo: true });
    await setDoc(doc(db, "usuarios", INACTIVE_ADMIN), { role: "admin", ativo: false });
    await setDoc(doc(db, "usuarios", COMMON_USER), { role: "user", ativo: true });
  });
  adminDb = testEnv.authenticatedContext(ADMIN).firestore();
});

after(async () => {
  await testEnv?.cleanup();
});

for (const [name, sizes] of Object.entries(FIXTURES)) {
  for (const [group, change] of Object.entries(CHANGES)) {
    test(`admin ativo salva o grupo ${group} de um publicado (${name}) sem tirá-lo do ar`, async () => {
      const id = `budget-${name}-${group}`.toLowerCase();
      const fixture = publishedFixture(id, sizes);
      await seed(id, fixture);
      const module = loadModule(adminDb);
      await module._applyCanonicalFields(id, change(fixture), { flow: "budget", groups: [group] });
      const saved = await read(id);
      assert.equal(saved.status, "published");
      assert.equal(saved.revision, fixture.revision + 1, "exatamente um grupo gravado");
      assert.equal(saved.updatedBy, ADMIN);
    });
  }

  test(`admin ativo despublica e republica um empreendimento (${name})`, async () => {
    const id = `budget-${name}-lifecycle`.toLowerCase();
    const fixture = publishedFixture(id, sizes);
    await seed(id, fixture);
    const ref = doc(adminDb, "cms_establishments", id);
    await assertSucceeds(updateDoc(ref, groupWrite(fixture, ADMIN, "lifecycle", {
      status: "draft",
      publishing: { publishedAt: null, publishedBy: "", archivedAt: null, archivedBy: "", archiveReason: "" },
    })));
    const draft = await read(id);
    await assertSucceeds(updateDoc(ref, groupWrite(draft, ADMIN, "lifecycle", {
      status: "published",
      publishing: { publishedAt: serverTimestamp(), publishedBy: ADMIN, archivedAt: null, archivedBy: "", archiveReason: "" },
    })));
    assert.equal((await read(id)).status, "published");
  });
}

test("o salvamento pelo formulário do painel (location + mídia) conclui num publicado com galeria", async () => {
  const id = "budget-formulario";
  const fixture = publishedFixture(id, FIXTURES.realista);
  await seed(id, fixture);
  const module = loadModule(adminDb);
  await module._applyCanonicalFields(id, {
    ...CHANGES.location(),
    ...CHANGES.media(fixture),
  }, { flow: "budget-formulario" });
  const saved = await read(id);
  assert.equal(saved.status, "published");
  assert.equal(saved.location.address, "Espigãozinho");
  assert.equal(saved.media.gallery[0].credit, "Foto: Crédito novo 0");
  assert.equal(saved.revision, fixture.revision + 2);
});

// A mensagem do painel não pode culpar a conta quando o perfil está ativo.
async function toastFor(profile) {
  const toasts = [];
  const sandbox = {
    console: { ...console, warn() {} },
    document: { getElementById: () => null },
    window: {
      setTimeout,
      AdminContext: {
        currentUser: { uid: ADMIN },
        storage: null,
        db: {
          collection: () => ({ doc: () => ({
            get: () => (profile instanceof Error
              ? Promise.reject(profile)
              : Promise.resolve({ exists: !!profile, data: () => profile })),
          }) }),
        },
      },
      AdminUI: { showToast: (message) => toasts.push(message) },
      crypto: globalThis.crypto,
      firebase: { firestore: { FieldValue: {} } },
    },
  };
  vm.runInNewContext(adminSource, sandbox);
  sandbox.window.AdminEstablishmentsModule._handleWriteError({ code: "permission-denied" }, "salvar empreendimento", "Localização");
  await new Promise((resolve) => setTimeout(resolve, 20));
  return toasts.join(" | ");
}

test("permission-denied com admin ativo aponta a validação dos dados, não a conta", async () => {
  const message = await toastFor({ role: "admin", ativo: true });
  assert.match(message, /Sua conta está ativa como administradora/);
  assert.match(message, /Localização/);
  assert.doesNotMatch(message, /Confirme que sua conta/);
});

test("permission-denied com perfil inativo ou ausente aponta a conta", async () => {
  assert.match(await toastFor({ role: "admin", ativo: false }), /não está ativa como administradora/);
  assert.match(await toastFor(null), /não está ativa como administradora/);
});

test("permission-denied sem conseguir ler o perfil não afirma a causa", async () => {
  assert.match(await toastFor(new Error("offline")), /Não foi possível confirmar o perfil/);
});

// A correção reduz custo, não permissões: as mesmas recusas continuam valendo.
test("negativas: só admin ativo grava, um grupo por vez, sem campos estranhos e sem quebrar a publicação", async () => {
  const id = "budget-negativas";
  const fixture = publishedFixture(id, FIXTURES.maximoDoPainel);
  await seed(id, fixture);
  const location = { ...fixture.location, address: "Endereço novo" };

  const as = (uid) => doc(testEnv.authenticatedContext(uid).firestore(), "cms_establishments", id);
  await assertFails(updateDoc(doc(testEnv.unauthenticatedContext().firestore(), "cms_establishments", id),
    groupWrite(fixture, "anonimo", "location", { location })));
  await assertFails(updateDoc(as(COMMON_USER), groupWrite(fixture, COMMON_USER, "location", { location })));
  await assertFails(updateDoc(as(INACTIVE_ADMIN), groupWrite(fixture, INACTIVE_ADMIN, "location", { location })));
  await assertFails(updateDoc(as(NO_PROFILE), groupWrite(fixture, NO_PROFILE, "location", { location })));

  const ref = as(ADMIN);
  // Dois grupos na mesma gravação.
  await assertFails(updateDoc(ref, groupWrite(fixture, ADMIN, "location", {
    location, contact: { ...fixture.contact, phone: "(42) 3999-9999" },
  })));
  // Campo fora do esquema.
  await assertFails(updateDoc(ref, groupWrite(fixture, ADMIN, "location", { location, campoEstranho: true })));
  // Autoria original adulterada.
  await assertFails(updateDoc(ref, groupWrite(fixture, ADMIN, "location", { location, createdBy: "outro" })));
  // Revisão fora de sequência.
  await assertFails(updateDoc(ref, { ...groupWrite(fixture, ADMIN, "location", { location }), revision: fixture.revision + 5 }));
  // Auditoria em nome de outro usuário.
  await assertFails(updateDoc(ref, { ...groupWrite(fixture, ADMIN, "location", { location }), updatedBy: "outro" }));
  // Publicado ficaria sem endereço e sem coordenadas.
  await assertFails(updateDoc(ref, groupWrite(fixture, ADMIN, "location", {
    location: { ...fixture.location, address: "", coordinates: { lat: null, lng: null } },
  })));
  // Tipo inválido no grupo.
  await assertFails(updateDoc(ref, groupWrite(fixture, ADMIN, "contact", { contact: { ...fixture.contact, phone: 42 } })));

  // A mesma gravação, correta, passa.
  await assertSucceeds(updateDoc(ref, groupWrite(fixture, ADMIN, "location", { location })));
  const saved = await read(id);
  assert.equal(saved.location.address, "Endereço novo");
  assert.equal(saved.status, "published");
});
