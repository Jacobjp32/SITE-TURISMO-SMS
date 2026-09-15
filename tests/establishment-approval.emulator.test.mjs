import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test, { after, before } from "node:test";
import vm from "node:vm";
import { assertFails, assertSucceeds, initializeTestEnvironment } from "@firebase/rules-unit-testing";
import { collection, deleteDoc, deleteField, doc, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, where } from "firebase/firestore";

const PROJECT_ID = "demo-turismo-sms-admin-finalization";
const ADMIN_UID = "approval-admin";
const MODERATOR_UID = "approval-moderator";
const USER_A_UID = "approval-user-a";
const USER_B_UID = "approval-user-b";
const GROUPS = [
  "core", "content", "contact", "location", "media",
  "relationshipsRouteIds", "relationshipsRelatedPlaceIds", "relationshipsRelatedEventIds",
  "display", "seo", "review", "source", "lifecycle",
];

const root = new URL("../", import.meta.url);
const [firestoreRules, storageRules, bridgeSource, publicationSource, moduleSource, authSource, adapterSource] = await Promise.all([
  readFile(new URL("firestore.rules", root), "utf8"),
  readFile(new URL("storage.rules", root), "utf8"),
  readFile(new URL("js/establishment-submission-bridge.js", root), "utf8"),
  readFile(new URL("js/publication-contracts.js", root), "utf8"),
  readFile(new URL("js/admin/modules/empreendimentos.js", root), "utf8"),
  readFile(new URL("js/firebase-auth.js", root), "utf8"),
  readFile(new URL("js/cms-public-establishments-adapter.js", root), "utf8"),
]);

let testEnv;
let adminDb;
let adminRuntimeDb;
let adminStorage;
let adminModule;
let adminSystem;
let moderatorSystem;
let storageFacade;
let storagePutCount = 0;
let storageFailurePath = "";
let storageFailureRemaining = 0;
let storageAmbiguousPath = "";
let storageAmbiguousRemaining = 0;
let storageBeforePutHook = null;
let requestTrackingFailureId = "";
let requestTrackingFailureRemaining = 0;
let legacyApprovedBaseline = 0;
const sourceBlobsByPath = new Map();

function firestoreFunction(db) {
  const api = () => db;
  api.FieldValue = { serverTimestamp: () => serverTimestamp(), delete: () => deleteField() };
  return api;
}

function plainRealm(value) {
  if (value == null || typeof value !== "object") return value;
  if (value instanceof Date || typeof value.toMillis === "function" || value._methodName) return value;
  if (Array.isArray(value)) return Array.from(value, plainRealm);
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, plainRealm(item)]));
}

function compatDb(db) {
  function compatRef(name, id) {
    const raw = db.collection(name).doc(id);
    return {
      id, raw,
      get: () => raw.get(),
      set: (data) => raw.set(plainRealm(data)),
      update: (patch) => {
        if (name === "establishment_update_requests" && id === requestTrackingFailureId &&
            requestTrackingFailureRemaining > 0 && (patch.appliedAt || patch.mediaAppliedAt)) {
          requestTrackingFailureRemaining -= 1;
          return Promise.reject(new Error("synthetic-request-tracking-failure"));
        }
        return raw.update(plainRealm(patch));
      },
    };
  }
  return {
    collection(name) {
      const raw = db.collection(name);
      return {
        doc: (id) => compatRef(name, id),
        get: () => raw.get(),
        where: (...args) => ({ get: () => raw.where(...args).get() }),
      };
    },
    runTransaction(callback) {
      return db.runTransaction((transaction) => callback({
        get: (ref) => transaction.get(ref.raw),
        set: (ref, data) => transaction.set(ref.raw, plainRealm(data)),
        update: (ref, patch) => transaction.update(ref.raw, plainRealm(patch)),
      }));
    },
  };
}

function makeStorageFacade(storage) {
  return {
    ref(path) {
      const target = storage.ref(path);
      return {
        async getBlob() {
          const blob = sourceBlobsByPath.get(path);
          if (!blob) throw new Error(`Test source blob not registered: ${path}`);
          await target.getMetadata();
          return blob;
        },
        async getBytes() {
          const blob = sourceBlobsByPath.get(path);
          if (!blob) throw new Error(`Test source blob not registered: ${path}`);
          await target.getMetadata();
          return new Uint8Array(await blob.arrayBuffer());
        },
        async getMetadata() { return target.getMetadata(); },
        async getDownloadURL() {
          await target.getMetadata();
          return `https://firebasestorage.googleapis.com/v0/b/${PROJECT_ID}.appspot.com/o/${encodeURIComponent(path)}?alt=media&token=synthetic`;
        },
        async put(blob, metadata) {
          if (typeof storageBeforePutHook === "function") {
            const hook = storageBeforePutHook;
            storageBeforePutHook = null;
            await hook(path);
          }
          if (path === storageFailurePath && storageFailureRemaining > 0) {
            storageFailureRemaining -= 1;
            throw new Error("synthetic-storage-promotion-failure");
          }
          const result = await target.put(blob, metadata);
          storagePutCount += 1;
          if (path === storageAmbiguousPath && storageAmbiguousRemaining > 0) {
            storageAmbiguousRemaining -= 1;
            throw new Error("synthetic-ambiguous-storage-response");
          }
          return result;
        },
      };
    },
  };
}

function loadBridgeAndContracts() {
  const context = { URL, TextEncoder, encodeURIComponent };
  vm.runInNewContext(bridgeSource, context);
  vm.runInNewContext(publicationSource, context);
  return {
    bridge: context.EstablishmentSubmissionBridge,
    contracts: context.SMSPublicationContracts,
  };
}

function loadAdminRuntime(uid, role, runtimeDb = adminRuntimeDb, runtimeStorage = storageFacade) {
  const { bridge, contracts } = loadBridgeAndContracts();
  const document = {
    getElementById: () => null,
    addEventListener() {}, querySelectorAll: () => [], querySelector: () => null,
    createElement: () => ({ style: {}, setAttribute() {}, appendChild() {}, remove() {} }),
    body: { appendChild() {} },
  };
  const firestore = firestoreFunction(runtimeDb);
  const firebase = { firestore, storage: () => runtimeStorage, apps: [] };
  const window = {
    EstablishmentSubmissionBridge: bridge,
    SMSPublicationContracts: contracts,
    AdminContext: { db: runtimeDb, storage: runtimeStorage, currentUser: { uid, role, ativo: true } },
    firebase,
    currentUser: { uid, role, ativo: true },
    document,
    location: { hostname: "localhost", search: "" },
    addEventListener() {}, dispatchEvent() {},
    crypto: globalThis.crypto,
  };
  window.window = window;
  const context = {
    window, document, firebase, SMSPublicationContracts: contracts,
    CONFIG: { firebase: { projectId: PROJECT_ID } },
    CustomEvent: class CustomEvent { constructor(type, init) { this.type = type; this.detail = init?.detail; } },
    URL, URLSearchParams, TextEncoder, Blob, File, console, setTimeout, clearTimeout, Promise, Date,
  };
  vm.runInNewContext(moduleSource, context, { filename: "js/admin/modules/empreendimentos.js" });
  vm.runInNewContext(`${authSource}\ncurrentUser = { uid: ${JSON.stringify(uid)}, role: ${JSON.stringify(role)}, ativo: true }; window.currentUser = currentUser;`, context, { filename: "js/firebase-auth.js" });
  return { module: window.AdminEstablishmentsModule, system: window.FirebaseSystem };
}

function sourcePath(uid, submissionId, index) {
  return `submissions/establishments/${uid}/${submissionId}/${index}.webp`;
}

function sourceToken(path) {
  return createHash("sha256").update(path).digest("hex").slice(0, 24);
}

function provenanceId(submissionId) {
  return "submission-sha256-" + createHash("sha256")
    .update(`establishment-submission:${submissionId}`)
    .digest("hex");
}

function approvedPath(cmsId, submissionId, index, source, name = `${index}.webp`) {
  return `approved-media/cms-establishments/${cmsId}/${String(index).padStart(2, "0")}-${sourceToken(source)}.webp`;
}

function managerSourcePath(uid, requestId, index) {
  return `submissions/establishment-updates/${uid}/${requestId}/${index}.webp`;
}

function pendingFixture(uid, id, phone, submittedAt, overrides = {}) {
  const images = Array.from({ length: 5 }, (_, index) => ({
    path: sourcePath(uid, id, index + 1),
    url: `https://firebasestorage.googleapis.com/v0/b/${PROJECT_ID}.appspot.com/o/${encodeURIComponent(sourcePath(uid, id, index + 1))}?alt=media&token=private`,
    name: `${index + 1}.webp`, contentType: "image/webp", size: 8,
  }));
  return {
    id, nome: "Chess Choperia", name: "Chess Choperia",
    categoria: "restaurante", category: "restaurante",
    endereco: "R. Barão do Rio Branco, 1085, Centro", address: "R. Barão do Rio Branco, 1085, Centro",
    descricao: "Cadastro Chess sintético.", description: "Cadastro Chess sintético.",
    telefone: phone, phone, whatsapp: "", website: "https://chess.example/cardapio", site: "https://chess.example/cardapio",
    openingHours: "18:00–23:00", images, mainImage: images[0].url, imageCount: images.length,
    submittedBy: uid, submittedByName: "Pessoa sintética", submittedByEmail: `${uid}@example.test`,
    ownerUid: uid, ownerName: "Pessoa sintética", ownerEmail: `${uid}@example.test`,
    status: "pendente", source: "portal_usuario", createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
    submittedAt, reviewedAt: null, reviewedBy: null, reviewNotes: "",
    ...overrides,
  };
}

async function seedSubmission(uid, id, phone, submittedAt, overrides = {}) {
  const userContext = testEnv.authenticatedContext(uid);
  const db = userContext.firestore();
  const storage = userContext.storage();
  const payload = pendingFixture(uid, id, phone, submittedAt, overrides);
  for (const image of payload.images) {
    const blob = new Blob([new Uint8Array([82, 73, 70, 70, 1, 2, 3, 4])], { type: "image/webp" });
    sourceBlobsByPath.set(image.path, blob);
    await storage.ref(image.path).put(blob, { contentType: "image/webp" });
  }
  await setDoc(doc(db, "estabelecimentos_pendentes", id), payload);
}

function loadAdapter() {
  const document = { readyState: "complete", addEventListener() {} };
  const window = {
    document, console, location: { search: "", hostname: "localhost" },
    localStorage: { getItem: () => null }, setTimeout, clearTimeout,
  };
  window.window = window;
  vm.runInNewContext(adapterSource, { window, document, console, URLSearchParams, setTimeout, clearTimeout, Promise, Date, isFinite });
  return window.CMSPublicEstablishmentsAdapter;
}

async function publicCmsResult() {
  const publicDb = testEnv.unauthenticatedContext().firestore();
  return loadAdapter().readPublished({
    force: true,
    reader: async () => {
      const snapshot = await getDocs(query(collection(publicDb, "cms_establishments"), where("status", "==", "published")));
      return snapshot.docs.map((entry) => ({ id: entry.id, data: entry.data() }));
    },
  });
}

before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { rules: firestoreRules, host: "127.0.0.1", port: 8080 },
    storage: { rules: storageRules, host: "127.0.0.1", port: 9199 },
  });
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await Promise.all([
      setDoc(doc(db, "usuarios", ADMIN_UID), { role: "admin", ativo: true }),
      setDoc(doc(db, "usuarios", MODERATOR_UID), { role: "moderator", ativo: true }),
      setDoc(doc(db, "usuarios", USER_A_UID), { role: "user", ativo: true }),
      setDoc(doc(db, "usuarios", USER_B_UID), { role: "user", ativo: true }),
    ]);
  });
  adminDb = testEnv.authenticatedContext(ADMIN_UID).firestore();
  legacyApprovedBaseline = (await getDocs(collection(adminDb, "estabelecimentos_aprovados"))).size;
  adminRuntimeDb = compatDb(adminDb);
  adminStorage = testEnv.authenticatedContext(ADMIN_UID).storage();
  storageFacade = makeStorageFacade(adminStorage);
  const adminRuntime = loadAdminRuntime(ADMIN_UID, "admin");
  adminModule = adminRuntime.module;
  adminSystem = adminRuntime.system;
  moderatorSystem = loadAdminRuntime(MODERATOR_UID, "moderator").system;
});

after(async () => { await testEnv?.cleanup(); });

test("consulta do Portal lista somente as submissões do próprio usuário nos três estados", async () => {
  const ownerDb = testEnv.authenticatedContext(USER_A_UID).firestore();
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await Promise.all([
      setDoc(doc(db, "estabelecimentos_pendentes", "portal-status-pending"), {
        submittedBy: USER_A_UID, status: "pendente", submittedAt: new Date("2026-09-14T09:00:00Z"),
      }),
      setDoc(doc(db, "estabelecimentos_pendentes", "portal-status-approved"), {
        submittedBy: USER_A_UID, status: "aprovado", cmsImportState: "draft_created", submittedAt: new Date("2026-09-14T09:01:00Z"),
      }),
      setDoc(doc(db, "estabelecimentos_pendentes", "portal-status-rejected"), {
        submittedBy: USER_A_UID, status: "rejeitado", reviewNotes: "Motivo sintético", submittedAt: new Date("2026-09-14T09:02:00Z"),
      }),
      setDoc(doc(db, "estabelecimentos_pendentes", "portal-status-other-user"), {
        submittedBy: USER_B_UID, status: "pendente", submittedAt: new Date("2026-09-14T09:03:00Z"),
      }),
    ]);
  });

  const result = await assertSucceeds(getDocs(query(
    collection(ownerDb, "estabelecimentos_pendentes"),
    where("submittedBy", "==", USER_A_UID),
  )));
  assert.deepEqual(result.docs.map((entry) => entry.data().status).sort(), ["aprovado", "pendente", "rejeitado"]);
  await assertFails(getDocs(collection(ownerDb, "estabelecimentos_pendentes")));
});

test("Portal -> admin approval -> draft CMS -> publish explícito permanece idempotente", async (t) => {
  const submissionA = "cpf-000-000-000-00";
  const submissionB = "est_1002";
  const orphanPath = "approved-media/cms-establishments/chess-choperia/orphan-synthetic.webp";
  await seedSubmission(USER_A_UID, submissionA, "(42) 99832-0172", new Date("2026-09-14T10:00:00Z"));
  await seedSubmission(USER_B_UID, submissionB, "42 9832-0172", new Date("2026-09-14T10:01:00Z"));

  await t.test("moderator não pode criar draft CMS", async () => {
    const denied = await moderatorSystem.approveEstablishment(submissionA);
    assert.equal(denied.success, false);
    assert.equal(denied.code, "ADMIN_REQUIRED_FOR_CMS_DRAFT");
  });

  await t.test("aprovar A cria exatamente um draft completo e nenhuma coleção legada", async () => {
    storagePutCount = 0;
    const result = await adminSystem.approveEstablishment(submissionA, "nota privada sintética");
    assert.equal(result.success, true, JSON.stringify(result));
    assert.equal(result.code, "CMS_DRAFT_CREATED");
    assert.equal(result.cmsEstablishmentId, "chess-choperia");
    assert.equal(storagePutCount, 5);

    const cmsSnapshot = await getDoc(doc(adminDb, "cms_establishments", "chess-choperia"));
    assert.equal(cmsSnapshot.exists(), true);
    const cms = cmsSnapshot.data();
    assert.equal(cms.status, "draft");
    assert.equal(cms.schemaVersion, 2);
    assert.deepEqual(Object.keys(cms.validatedGroups).sort(), [...GROUPS].sort());
    assert.equal(cms.source.originalId, provenanceId(submissionA));
    assert.equal(cms.media.gallery.length, 5);
    assert.deepEqual(cms.media.publicPaths.sort(), cms.media.gallery.map((image) => image.path).sort());
    assert.equal(cms.media.gallery.every((image) =>
      image.path.startsWith("approved-media/cms-establishments/chess-choperia/") &&
      !image.path.includes(submissionA) &&
      !image.path.includes("submissions/")), true);
    const serialized = JSON.stringify(cms);
    for (const forbidden of [submissionA, "@example.test", "nota privada sintética", USER_A_UID, "submissions/"]) {
      assert.equal(serialized.includes(forbidden), false, forbidden);
    }
    assert.equal((await getDocs(collection(adminDb, "estabelecimentos_aprovados"))).size, legacyApprovedBaseline);
    assert.equal((await publicCmsResult()).items.some((item) => item.id === "chess-choperia"), false);
    await assertFails(testEnv.unauthenticatedContext().storage().ref(cms.media.mainImage.path).getDownloadURL());
    await adminStorage.ref(orphanPath).put(new Blob([new Uint8Array([1, 3, 3, 7])], { type: "image/webp" }), { contentType: "image/webp" });
  });

  await t.test("aprovar B não cria chess-choperia-2 nem nova mídia", async () => {
    const putsBefore = storagePutCount;
    const duplicate = await adminSystem.approveEstablishment(submissionB);
    assert.equal(duplicate.success, false);
    assert.equal(duplicate.code, "ALREADY_IN_CMS");
    assert.equal(storagePutCount, putsBefore);
    const chessDocs = (await getDocs(collection(adminDb, "cms_establishments"))).docs
      .filter((entry) => entry.id === "chess-choperia" || entry.id === "chess-choperia-2");
    assert.equal(chessDocs.length, 1);
    assert.equal((await getDoc(doc(adminDb, "cms_establishments", "chess-choperia-2"))).exists(), false);
  });

  await t.test("retry de A confirma o mesmo draft e não recopia mídia", async () => {
    const putsBefore = storagePutCount;
    const retry = await adminSystem.approveEstablishment(submissionA);
    assert.equal(retry.success, true, JSON.stringify(retry));
    assert.equal(retry.code, "CMS_DRAFT_ALREADY_EXISTS");
    assert.equal(storagePutCount, putsBefore);
    const chessDocs = (await getDocs(collection(adminDb, "cms_establishments"))).docs
      .filter((entry) => entry.id === "chess-choperia" || entry.id === "chess-choperia-2");
    assert.equal(chessDocs.length, 1);
  });

  await t.test("publish manual torna o item e a mídia públicos", async () => {
    const ref = adminRuntimeDb.collection("cms_establishments").doc("chess-choperia");
    const snapshot = await ref.get();
    const base = adminModule._normalizeDoc(snapshot.data(), snapshot.id);
    await adminModule._executeSaga(adminRuntimeDb, adminModule._buildSaga(
      ref, adminModule._lifecyclePublished(base, ADMIN_UID), base, ADMIN_UID, ["lifecycle"],
    ));
    const result = await publicCmsResult();
    assert.equal(result.items.filter((item) => item.id === "chess-choperia").length, 1);
    const published = (await getDoc(doc(adminDb, "cms_establishments", "chess-choperia"))).data();
    const publicUrl = await testEnv.unauthenticatedContext().storage().ref(published.media.mainImage.path).getDownloadURL();
    assert.match(publicUrl, /^http:/);
    await assertFails(testEnv.unauthenticatedContext().storage().ref(orphanPath).getDownloadURL());
  });

  await t.test("duplicata de item published orienta claim/update e não cria draft", async () => {
    const duplicate = await adminSystem.approveEstablishment(submissionB);
    assert.equal(duplicate.success, false);
    assert.equal(duplicate.code, "EXISTING_PUBLISHED_ESTABLISHMENT");
    assert.match(duplicate.message, /vínculo ou solicitação de atualização/);
    const chessDocs = (await getDocs(collection(adminDb, "cms_establishments"))).docs
      .filter((entry) => entry.id === "chess-choperia" || entry.id === "chess-choperia-2");
    assert.equal(chessDocs.length, 1);
  });
});

test("claims concorrentes da mesma identidade reservam um único shell CMS", async () => {
  const submissionA = "est_race_a";
  const submissionB = "est_race_b";
  const shared = {
    nome: "Corrida Sintética",
    name: "Corrida Sintética",
    endereco: "Rua da Concorrência, 50, Centro",
    address: "Rua da Concorrência, 50, Centro",
    website: "https://race.example/teste",
    site: "https://race.example/teste",
  };
  await seedSubmission(USER_A_UID, submissionA, "(42) 99999-0505", new Date("2026-09-14T10:10:00Z"), shared);
  await seedSubmission(USER_B_UID, submissionB, "42 99999 0505", new Date("2026-09-14T10:11:00Z"), shared);

  const bridge = loadBridgeAndContracts().bridge;
  const pendingRefA = adminRuntimeDb.collection("estabelecimentos_pendentes").doc(submissionA);
  const pendingRefB = adminRuntimeDb.collection("estabelecimentos_pendentes").doc(submissionB);
  const pendingA = { ...(await pendingRefA.get()).data(), id: submissionA };
  const pendingB = { ...(await pendingRefB.get()).data(), id: submissionB };
  storagePutCount = 0;

  const results = await Promise.allSettled([
    adminModule.reserveSubmissionImport({
      db: adminRuntimeDb,
      uid: ADMIN_UID,
      pendingRef: pendingRefA,
      submissionId: submissionA,
      publicSourceId: provenanceId(submissionA),
      cmsId: "corrida-sintetica",
      submission: pendingA,
      expectedSubmissionFingerprint: bridge.approvalFingerprint(pendingA),
    }),
    adminModule.reserveSubmissionImport({
      db: adminRuntimeDb,
      uid: ADMIN_UID,
      pendingRef: pendingRefB,
      submissionId: submissionB,
      publicSourceId: provenanceId(submissionB),
      cmsId: "corrida-sintetica",
      submission: pendingB,
      expectedSubmissionFingerprint: bridge.approvalFingerprint(pendingB),
    }),
  ]);

  assert.equal(results.filter((result) => result.status === "fulfilled").length, 1);
  const rejected = results.find((result) => result.status === "rejected");
  assert.equal(rejected?.reason?.code, "establishment-import-duplicate-lock");
  assert.equal((await getDoc(doc(adminDb, "cms_establishments", "corrida-sintetica"))).exists(), true);
  const reserved = await Promise.all([
    getDoc(doc(adminDb, "estabelecimentos_pendentes", submissionA)),
    getDoc(doc(adminDb, "estabelecimentos_pendentes", submissionB)),
  ]);
  assert.equal(reserved.filter((snapshot) => snapshot.data().cmsImportState === "media_preparing").length, 1);
  assert.equal(storagePutCount, 0);
  assert.equal((await getDocs(collection(adminDb, "estabelecimentos_aprovados"))).size, legacyApprovedBaseline);
});

test("aprovações concorrentes de submissões equivalentes finalizam um único draft", async () => {
  const submissionA = "est_full_race_a";
  const submissionB = "est_full_race_b";
  const shared = {
    nome: "Café Corrida Final",
    name: "Café Corrida Final",
    endereco: "Rua da Corrida, 77, Centro",
    address: "Rua da Corrida, 77, Centro",
    website: "https://race-final.example/teste",
    site: "https://race-final.example/teste",
  };
  await seedSubmission(USER_A_UID, submissionA, "(42) 99999-0777", new Date("2026-09-14T10:20:00Z"), shared);
  await seedSubmission(USER_B_UID, submissionB, "42 99999 0777", new Date("2026-09-14T10:21:00Z"), shared);
  const locksBefore = (await getDocs(collection(adminDb, "cms_establishment_submission_locks"))).size;
  storagePutCount = 0;

  const results = await Promise.all([
    adminSystem.approveEstablishment(submissionA),
    adminSystem.approveEstablishment(submissionB),
  ]);

  assert.equal(results.filter((result) => result.success).length, 1, JSON.stringify(results));
  const duplicate = results.find((result) => !result.success);
  assert.match(duplicate?.code || "", /^(PENDING_DUPLICATE|ALREADY_IN_CMS)$/);
  const cms = (await getDoc(doc(adminDb, "cms_establishments", "cafe-corrida-final"))).data();
  assert.equal(cms.status, "draft");
  assert.equal(new Set(cms.media.gallery.map((image) => image.path)).size, 5);
  assert.equal(cms.media.gallery.every((image) => image.path.startsWith(
    "approved-media/cms-establishments/cafe-corrida-final/",
  )), true);
  assert.equal((await getDocs(collection(adminDb, "cms_establishment_submission_locks"))).size, locksBefore + 1);
  assert.equal((await getDocs(collection(adminDb, "estabelecimentos_aprovados"))).size, legacyApprovedBaseline);
});

test("aprovações concorrentes da mesma submissão convergem para o mesmo draft", async () => {
  const submissionId = "est_same_submission_race";
  const overrides = {
    nome: "Pousada Concorrência Única",
    name: "Pousada Concorrência Única",
    endereco: "Rua Única, 88, Centro",
    address: "Rua Única, 88, Centro",
    website: "https://same-race.example/teste",
    site: "https://same-race.example/teste",
  };
  await seedSubmission(USER_A_UID, submissionId, "(42) 99999-0888", new Date("2026-09-14T10:22:00Z"), overrides);
  const locksBefore = (await getDocs(collection(adminDb, "cms_establishment_submission_locks"))).size;
  storagePutCount = 0;

  const results = await Promise.all([
    adminSystem.approveEstablishment(submissionId),
    adminSystem.approveEstablishment(submissionId),
  ]);

  assert.equal(results.some((result) => result.success), true, JSON.stringify(results));
  const cmsId = "pousada-concorrencia-unica";
  const cms = (await getDoc(doc(adminDb, "cms_establishments", cmsId))).data();
  assert.equal(cms.status, "draft");
  assert.equal(cms.source.originalId, provenanceId(submissionId));
  assert.equal(cms.media.gallery.length, 5);
  assert.equal(new Set(cms.media.gallery.map((image) => image.path)).size, 5);
  assert.equal(cms.revision, GROUPS.length);
  assert.equal((await getDocs(collection(adminDb, "cms_establishment_submission_locks"))).size, locksBefore + 1);
  const pending = (await getDoc(doc(adminDb, "estabelecimentos_pendentes", submissionId))).data();
  assert.equal(pending.status, "aprovado");
  assert.equal(pending.cmsImportState, "draft_created");
  assert.equal((await getDocs(collection(adminDb, "estabelecimentos_aprovados"))).size, legacyApprovedBaseline);
});

test("falha de promoção Storage preserva shell único e retry conclui sem duplicar mídia", async () => {
  const submissionId = "est_failure";
  await seedSubmission(
    USER_A_UID,
    submissionId,
    "(42) 99999-0101",
    new Date("2026-09-14T11:00:00Z"),
    {
      nome: "Falha Sintética",
      name: "Falha Sintética",
      endereco: "Rua dos Testes, 77, Centro",
      address: "Rua dos Testes, 77, Centro",
      website: "https://failure.example/teste",
      site: "https://failure.example/teste",
    },
  );

  storagePutCount = 0;
  storageFailurePath = approvedPath("falha-sintetica", submissionId, 3, sourcePath(USER_A_UID, submissionId, 3));
  storageFailureRemaining = 1;
  const failed = await adminSystem.approveEstablishment(submissionId);
  assert.equal(failed.success, false);
  assert.notEqual(failed.message, "Cadastro aprovado e enviado ao catálogo editorial como rascunho. Revise em Empreendimentos antes de publicar no portal.");
  const shell = (await getDoc(doc(adminDb, "cms_establishments", "falha-sintetica"))).data();
  assert.equal(shell.status, "draft");
  assert.equal(shell.revision, 0);
  assert.deepEqual(shell.validatedGroups, {});
  const pendingAfterFailure = (await getDoc(doc(adminDb, "estabelecimentos_pendentes", submissionId))).data();
  assert.equal(pendingAfterFailure.status, "pendente");
  assert.equal(pendingAfterFailure.cmsImportState, "media_preparing");
  assert.equal(storagePutCount, 2);

  storageFailurePath = "";
  const retried = await adminSystem.approveEstablishment(submissionId);
  assert.equal(retried.success, true, JSON.stringify(retried));
  assert.equal(retried.code, "CMS_DRAFT_ALREADY_EXISTS");
  assert.equal(storagePutCount, 5);
  const completed = (await getDoc(doc(adminDb, "cms_establishments", "falha-sintetica"))).data();
  assert.equal(completed.media.gallery.length, 5);
  assert.equal(new Set(completed.media.gallery.map((image) => image.path)).size, 5);
  assert.equal((await getDoc(doc(adminDb, "estabelecimentos_pendentes", submissionId))).data().cmsImportState, "draft_created");
});

test("retry com origem de mídia alterada não reutiliza bytes da tentativa anterior", async () => {
  const submissionId = "est_source_retry";
  await seedSubmission(
    USER_A_UID,
    submissionId,
    "(42) 99999-0151",
    new Date("2026-09-14T11:30:00Z"),
    {
      nome: "Origem Sintética",
      name: "Origem Sintética",
      endereco: "Rua da Proveniência, 15, Centro",
      address: "Rua da Proveniência, 15, Centro",
    },
  );

  storagePutCount = 0;
  storageFailurePath = approvedPath("origem-sintetica", submissionId, 3, sourcePath(USER_A_UID, submissionId, 3));
  storageFailureRemaining = 1;
  const failed = await adminSystem.approveEstablishment(submissionId);
  assert.equal(failed.success, false);
  assert.equal(storagePutCount, 2);

  const replacementPath = sourcePath(USER_A_UID, submissionId, 6);
  const replacementUrl = `https://firebasestorage.googleapis.com/v0/b/${PROJECT_ID}.appspot.com/o/${encodeURIComponent(replacementPath)}?alt=media&token=private`;
  const replacementBlob = new Blob([new Uint8Array([82, 73, 70, 70, 9, 8, 7, 6])], { type: "image/webp" });
  sourceBlobsByPath.set(replacementPath, replacementBlob);
  await testEnv.authenticatedContext(USER_A_UID).storage().ref(replacementPath).put(replacementBlob, { contentType: "image/webp" });
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const pendingRef = doc(context.firestore(), "estabelecimentos_pendentes", submissionId);
    const current = (await getDoc(pendingRef)).data();
    const images = [...current.images];
    images[0] = { ...images[0], path: replacementPath, url: replacementUrl, name: "1.webp" };
    await setDoc(pendingRef, { ...current, images, mainImage: replacementUrl, image: replacementUrl });
  });

  storageFailurePath = "";
  const retried = await adminSystem.approveEstablishment(submissionId);
  assert.equal(retried.success, true, JSON.stringify(retried));
  assert.equal(retried.code, "CMS_DRAFT_ALREADY_EXISTS");
  assert.equal(storagePutCount, 6);
  const completed = (await getDoc(doc(adminDb, "cms_establishments", "origem-sintetica"))).data();
  const expectedReplacementPath = approvedPath("origem-sintetica", submissionId, 1, replacementPath, "1.webp");
  assert.equal(completed.media.gallery[0].path, expectedReplacementPath);
  assert.equal(completed.media.publicPaths.includes(expectedReplacementPath), true);
});

test("falha ao criar shell ocorre antes de qualquer promoção de mídia", async () => {
  const submissionId = "est_shell_failure";
  await seedSubmission(
    USER_B_UID,
    submissionId,
    "(42) 99999-0202",
    new Date("2026-09-14T12:00:00Z"),
    {
      nome: "Shell Sintético",
      name: "Shell Sintético",
      endereco: "Rua das Transações, 20, Centro",
      address: "Rua das Transações, 20, Centro",
    },
  );
  const failingDb = {
    collection: (name) => adminRuntimeDb.collection(name),
    runTransaction: () => Promise.reject(new Error("synthetic-shell-create-failure")),
  };
  const failingSystem = loadAdminRuntime(ADMIN_UID, "admin", failingDb, storageFacade).system;
  storagePutCount = 0;
  const result = await failingSystem.approveEstablishment(submissionId);
  assert.equal(result.success, false);
  assert.equal(storagePutCount, 0);
  assert.equal((await getDoc(doc(adminDb, "cms_establishments", "shell-sintetico"))).exists(), false);
  const pending = (await getDoc(doc(adminDb, "estabelecimentos_pendentes", submissionId))).data();
  assert.equal(pending.status, "pendente");
  assert.equal(pending.cmsImportState, undefined);
});

test("metadado editorial inválido falha antes do shell e da promoção", async () => {
  const submissionId = "est_invalid_category";
  await seedSubmission(
    USER_A_UID,
    submissionId,
    "(42) 99999-0250",
    new Date("2026-09-14T12:30:00Z"),
    {
      nome: "Categoria Sintética",
      name: "Categoria Sintética",
      categoria: "categoria_desconhecida",
      category: "categoria_desconhecida",
      endereco: "Rua da Validação, 25, Centro",
      address: "Rua da Validação, 25, Centro",
    },
  );
  storagePutCount = 0;
  const result = await adminSystem.approveEstablishment(submissionId);
  assert.equal(result.success, false);
  assert.equal(result.code, "establishment-bridge/unknown-category");
  assert.equal(storagePutCount, 0);
  assert.equal((await getDoc(doc(adminDb, "cms_establishments", "categoria-sintetica"))).exists(), false);
  assert.equal((await getDoc(doc(adminDb, "estabelecimentos_pendentes", submissionId))).data().cmsImportState, undefined);
});

test("mainImage fora da galeria falha sem copiar objeto órfão", async () => {
  const submissionId = "est_orphan_cover";
  const privateCoverPath = sourcePath(USER_B_UID, submissionId, 1);
  const privateCoverUrl = `https://firebasestorage.googleapis.com/v0/b/${PROJECT_ID}.appspot.com/o/${encodeURIComponent(privateCoverPath)}?alt=media&token=private`;
  await seedSubmission(
    USER_B_UID,
    submissionId,
    "(42) 99999-0275",
    new Date("2026-09-14T12:45:00Z"),
    {
      nome: "Capa Órfã Sintética",
      name: "Capa Órfã Sintética",
      endereco: "Rua da Capa, 27, Centro",
      address: "Rua da Capa, 27, Centro",
      images: [],
      mainImage: privateCoverUrl,
      image: privateCoverUrl,
    },
  );
  storagePutCount = 0;
  const result = await adminSystem.approveEstablishment(submissionId);
  assert.equal(result.success, false);
  assert.equal(result.code, "publication/invalid-field");
  assert.equal(storagePutCount, 0);
  const shell = (await getDoc(doc(adminDb, "cms_establishments", "capa-orfa-sintetica"))).data();
  assert.equal(shell.status, "draft");
  assert.equal(shell.revision, 0);
});

test("falha de grupo preserva progresso e retry retoma o mesmo draft", async () => {
  const submissionId = "est_group_failure";
  await seedSubmission(
    USER_A_UID,
    submissionId,
    "(42) 99999-0303",
    new Date("2026-09-14T13:00:00Z"),
    {
      nome: "Grupo Sintético",
      name: "Grupo Sintético",
      endereco: "Rua dos Grupos, 30, Centro",
      address: "Rua dos Grupos, 30, Centro",
    },
  );
  let transactionCalls = 0;
  const failingDb = {
    collection: (name) => adminRuntimeDb.collection(name),
    runTransaction(callback) {
      transactionCalls += 1;
      if (transactionCalls === 5) return Promise.reject(new Error("synthetic-group-update-failure"));
      return adminRuntimeDb.runTransaction(callback);
    },
  };
  const failingSystem = loadAdminRuntime(ADMIN_UID, "admin", failingDb, storageFacade).system;
  storagePutCount = 0;
  const failed = await failingSystem.approveEstablishment(submissionId);
  assert.equal(failed.success, false);
  assert.equal(storagePutCount, 5);
  const partial = (await getDoc(doc(adminDb, "cms_establishments", "grupo-sintetico"))).data();
  assert.equal(partial.status, "draft");
  assert.equal(Object.keys(partial.validatedGroups).length > 0, true);
  assert.equal(Object.keys(partial.validatedGroups).length < GROUPS.length, true);

  const retried = await adminSystem.approveEstablishment(submissionId);
  assert.equal(retried.success, true, JSON.stringify(retried));
  assert.equal(retried.code, "CMS_DRAFT_ALREADY_EXISTS");
  assert.equal(storagePutCount, 5);
  const completed = (await getDoc(doc(adminDb, "cms_establishments", "grupo-sintetico"))).data();
  assert.deepEqual(Object.keys(completed.validatedGroups).sort(), [...GROUPS].sort());
  assert.equal(completed.revision, GROUPS.length);
});

test("retry após edição manual de grupo validado falha fechado sem sobrescrever", async () => {
  const submissionId = "est_manual_after_failure";
  await seedSubmission(
    USER_B_UID,
    submissionId,
    "(42) 99999-0353",
    new Date("2026-09-14T13:30:00Z"),
    {
      nome: "Edição Sintética",
      name: "Edição Sintética",
      endereco: "Rua da Revisão, 35, Centro",
      address: "Rua da Revisão, 35, Centro",
      website: "https://manual-review.example/teste",
      site: "https://manual-review.example/teste",
    },
  );
  let transactionCalls = 0;
  const failingDb = {
    collection: (name) => adminRuntimeDb.collection(name),
    runTransaction(callback) {
      transactionCalls += 1;
      if (transactionCalls === 5) return Promise.reject(new Error("synthetic-group-update-failure-before-manual-edit"));
      return adminRuntimeDb.runTransaction(callback);
    },
  };
  const failingSystem = loadAdminRuntime(ADMIN_UID, "admin", failingDb, storageFacade).system;
  storagePutCount = 0;
  const failed = await failingSystem.approveEstablishment(submissionId);
  assert.equal(failed.success, false);
  assert.equal(storagePutCount, 5);

  const ref = adminRuntimeDb.collection("cms_establishments").doc("edicao-sintetica");
  const partialSnapshot = await ref.get();
  const base = adminModule._normalizeDoc(partialSnapshot.data(), partialSnapshot.id);
  assert.equal(base.validatedGroups.content, 2);
  const edited = adminModule._normalizeDoc(partialSnapshot.data(), partialSnapshot.id);
  edited.content.summary = "Resumo revisado manualmente.";
  edited.content.description = "Descrição revisada manualmente.";
  await adminModule._executeSaga(adminRuntimeDb, adminModule._buildSaga(
    ref, edited, base, ADMIN_UID, ["content"],
  ));

  const putsBeforeRetry = storagePutCount;
  const retry = await adminSystem.approveEstablishment(submissionId);
  assert.equal(retry.success, false);
  assert.equal(retry.code, "establishment-import-manual-change");
  assert.equal(storagePutCount, putsBeforeRetry);
  const afterRetry = (await getDoc(doc(adminDb, "cms_establishments", "edicao-sintetica"))).data();
  assert.equal(afterRetry.content.description, "Descrição revisada manualmente.");
  assert.equal((await getDoc(doc(adminDb, "estabelecimentos_pendentes", submissionId))).data().status, "pendente");
});

test("resposta de Storage ambígua é reconciliada pelo mesmo path no retry", async () => {
  const submissionId = "est_ambiguous";
  await seedSubmission(
    USER_B_UID,
    submissionId,
    "(42) 99999-0404",
    new Date("2026-09-14T14:00:00Z"),
    {
      nome: "Rede Sintética",
      name: "Rede Sintética",
      endereco: "Rua da Rede, 40, Centro",
      address: "Rua da Rede, 40, Centro",
    },
  );
  storagePutCount = 0;
  storageAmbiguousPath = approvedPath("rede-sintetica", submissionId, 1, sourcePath(USER_B_UID, submissionId, 1));
  storageAmbiguousRemaining = 1;
  const failed = await adminSystem.approveEstablishment(submissionId);
  assert.equal(failed.success, false);
  assert.equal(storagePutCount, 1);

  storageAmbiguousPath = "";
  const retried = await adminSystem.approveEstablishment(submissionId);
  assert.equal(retried.success, true, JSON.stringify(retried));
  assert.equal(retried.code, "CMS_DRAFT_ALREADY_EXISTS");
  assert.equal(storagePutCount, 5);
  const completed = (await getDoc(doc(adminDb, "cms_establishments", "rede-sintetica"))).data();
  assert.equal(completed.media.gallery.length, 5);
  assert.equal(new Set(completed.media.gallery.map((image) => image.path)).size, 5);
});

test("writer textual de gestor não contorna o alias semântico do CMS", async () => {
  const targetId = "grupo-sintetico";
  const before = (await getDoc(doc(adminDb, "cms_establishments", targetId))).data();
  await assert.rejects(
    adminModule._applyCanonicalFields(targetId, {
      name: "Chess Choperia",
      "location.address": "R. Barão do Rio Branco, 1085, Centro",
    }, {
      flow: "approved-text-request",
      enforceSemanticIdentity: true,
    }),
    (error) => error && error.code === "already-exists",
  );
  const after = (await getDoc(doc(adminDb, "cms_establishments", targetId))).data();
  assert.equal(after.name, before.name);
  assert.equal(after.location.address, before.location.address);
  assert.equal(after.revision, before.revision);
});

test("mídia de gestor usa namespace neutro, não projeta PII e retoma upload parcial", async () => {
  const requestId = "manager-media-private-request";
  const images = [1, 2].map((index) => {
    const path = managerSourcePath(USER_A_UID, requestId, index);
    return {
      path,
      url: `https://firebasestorage.googleapis.com/v0/b/${PROJECT_ID}.appspot.com/o/${encodeURIComponent(path)}?alt=media&token=private`,
      name: `cpf-000-000-000-0${index}.webp`,
      contentType: "image/webp",
      size: 8,
    };
  });
  const ownerStorage = testEnv.authenticatedContext(USER_A_UID).storage();
  for (const image of images) {
    const blob = new Blob([new Uint8Array([82, 73, 70, 70, 9, 8, 7, 6])], { type: "image/webp" });
    sourceBlobsByPath.set(image.path, blob);
    await ownerStorage.ref(image.path).put(blob, { contentType: "image/webp" });
  }
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "establishment_update_requests", requestId), {
      id: requestId,
      establishmentId: "chess-choperia",
      ownerUid: USER_A_UID,
      ownerEmail: "private@example.test",
      status: "approved",
      images,
      mediaReview: {
        reviewedBy: "private-reviewer",
        images: images.map((image, index) => ({
          path: image.path,
          url: image.url,
          status: "accepted",
          note: index === 0 ? "foto  aprovada" : "",
        })),
      },
      appliedMedia: [],
    });
  });

  storagePutCount = 0;
  storageFailurePath = approvedPath("chess-choperia", requestId, 2, images[1].path);
  storageFailureRemaining = 1;
  const failed = await adminSystem.applyAcceptedEstablishmentUpdateMedia(requestId);
  assert.equal(failed.success, false);
  assert.equal(storagePutCount, 1);

  storageFailurePath = "";
  const retried = await adminSystem.applyAcceptedEstablishmentUpdateMedia(requestId);
  assert.equal(retried.success, true, retried.message);
  assert.equal(storagePutCount, 2);
  const cms = (await getDoc(doc(adminDb, "cms_establishments", "chess-choperia"))).data();
  const applied = cms.media.gallery.filter((image) => image.source === "portal_request");
  assert.equal(applied.length >= 2, true);
  const recent = applied.slice(-2);
  assert.deepEqual(recent.map((image) => image.path), images.map((image, index) =>
    approvedPath("chess-choperia", requestId, index + 1, image.path)));
  const serialized = JSON.stringify(recent);
  assert.equal(serialized.includes("submissions/"), false);
  assert.equal(serialized.includes(requestId), false);
  assert.equal(serialized.includes(USER_A_UID), false);
  assert.equal(serialized.includes("private-reviewer"), false);
  assert.equal(serialized.includes("cpf-000"), false);
  assert.equal(cms.review.lastAppliedRequestId, "");
  assert.equal(cms.review.lastAppliedBy, "");
  assert.equal(cms.review.lastReviewNotes, "");
});

test("retry de mídia retoma lifecycle parcial sem recopy e republica", async () => {
  const requestId = "manager-media-lifecycle-resume";
  const privatePath = managerSourcePath(USER_A_UID, requestId, 1);
  const image = {
    path: privatePath,
    url: `https://firebasestorage.googleapis.com/v0/b/${PROJECT_ID}.appspot.com/o/${encodeURIComponent(privatePath)}?alt=media&token=private`,
    name: "private-lifecycle.webp",
    contentType: "image/webp",
    size: 8,
  };
  const blob = new Blob([new Uint8Array([82, 73, 70, 70, 6, 6, 6, 6])], { type: "image/webp" });
  sourceBlobsByPath.set(privatePath, blob);
  await testEnv.authenticatedContext(USER_A_UID).storage().ref(privatePath).put(blob, { contentType: "image/webp" });
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "establishment_update_requests", requestId), {
      id: requestId,
      establishmentId: "chess-choperia",
      ownerUid: USER_A_UID,
      status: "approved",
      images: [image],
      mediaReview: { images: [{ path: privatePath, url: image.url, status: "accepted", note: "" }] },
      appliedMedia: [],
    });
  });

  let transactionCalls = 0;
  const failingDb = {
    collection: (name) => adminRuntimeDb.collection(name),
    runTransaction(callback) {
      transactionCalls += 1;
      if (transactionCalls === 4) return Promise.reject(new Error("synthetic-media-group-failure-after-lifecycle"));
      return adminRuntimeDb.runTransaction(callback);
    },
  };
  const failingSystem = loadAdminRuntime(ADMIN_UID, "admin", failingDb, storageFacade).system;
  storagePutCount = 0;
  const failed = await failingSystem.applyAcceptedEstablishmentUpdateMedia(requestId);
  assert.equal(failed.success, false);
  assert.equal(transactionCalls, 4);
  assert.equal(storagePutCount, 1);
  const partial = (await getDoc(doc(adminDb, "cms_establishments", "chess-choperia"))).data();
  assert.equal(partial.status, "draft");
  assert.equal(partial.editSession.resumeStatus, "published");

  const retried = await adminSystem.applyAcceptedEstablishmentUpdateMedia(requestId);
  assert.equal(retried.success, true, retried.message);
  assert.equal(storagePutCount, 1);
  const completed = (await getDoc(doc(adminDb, "cms_establishments", "chess-choperia"))).data();
  assert.equal(completed.status, "published");
  assert.equal(Boolean(completed.editSession), false);
  assert.equal(completed.media.gallery.some((entry) => entry.path === approvedPath(
    "chess-choperia", requestId, 1, privatePath,
  )), true);
  assert.equal((await getDoc(doc(adminDb, "establishment_update_requests", requestId))).data().mediaApplyState, "completed");
});

test("retry de mídia não reintroduz remoção manual que restaurou exatamente o baseline", async () => {
  const requestId = "manager-media-exact-baseline-rollback";
  const privatePath = managerSourcePath(USER_A_UID, requestId, 1);
  const image = {
    path: privatePath,
    url: `https://firebasestorage.googleapis.com/v0/b/${PROJECT_ID}.appspot.com/o/${encodeURIComponent(privatePath)}?alt=media&token=private`,
    name: "private-rollback.webp",
    contentType: "image/webp",
    size: 8,
  };
  const blob = new Blob([new Uint8Array([82, 73, 70, 70, 7, 7, 7, 7])], { type: "image/webp" });
  sourceBlobsByPath.set(privatePath, blob);
  await testEnv.authenticatedContext(USER_A_UID).storage().ref(privatePath).put(blob, { contentType: "image/webp" });
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "establishment_update_requests", requestId), {
      id: requestId,
      establishmentId: "chess-choperia",
      ownerUid: USER_A_UID,
      status: "approved",
      images: [image],
      mediaReview: { images: [{ path: privatePath, url: image.url, status: "accepted", note: "" }] },
      appliedMedia: [],
    });
  });

  const before = (await getDoc(doc(adminDb, "cms_establishments", "chess-choperia"))).data();
  requestTrackingFailureId = requestId;
  requestTrackingFailureRemaining = 1;
  storagePutCount = 0;
  const failed = await adminSystem.applyAcceptedEstablishmentUpdateMedia(requestId);
  assert.equal(failed.success, false);
  assert.equal(storagePutCount, 1);
  const appliedRequest = (await getDoc(doc(adminDb, "establishment_update_requests", requestId))).data();
  assert.equal(appliedRequest.mediaApplyProgress.media, true);

  await adminModule._applyCanonicalFields("chess-choperia", {
    "media.mainImage": before.media.mainImage,
    "media.gallery": before.media.gallery,
  }, { groups: ["media"], flow: "synthetic-exact-media-baseline-rollback" });

  requestTrackingFailureId = "";
  const retried = await adminSystem.applyAcceptedEstablishmentUpdateMedia(requestId);
  assert.equal(retried.success, false);
  assert.equal(storagePutCount, 1);
  const after = (await getDoc(doc(adminDb, "cms_establishments", "chess-choperia"))).data();
  assert.deepEqual(after.media.gallery.map((entry) => entry.path), before.media.gallery.map((entry) => entry.path));
  assert.equal(after.media.mainImage.path, before.media.mainImage.path);
  assert.equal(after.media.gallery.some((entry) => entry.path === approvedPath(
    "chess-choperia", requestId, 1, privatePath,
  )), false);
});

test("writer textual mantém request ID e notas privadas fora do CMS", async () => {
  const requestId = "cpf-000-000-000-09-private-request";
  const privateNote = "nota privada do gestor não publicável";
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "establishment_update_requests", requestId), {
      id: requestId,
      establishmentId: "chess-choperia",
      ownerUid: USER_A_UID,
      ownerEmail: "private@example.test",
      status: "approved",
      requestedChanges: {
        description: "Descrição editorial aprovada sem dados privados.",
        additionalNotes: privateNote,
      },
    });
  });

  const result = await adminSystem.applyApprovedEstablishmentUpdateRequest(requestId);
  assert.equal(result.success, true, result.message);
  const cms = (await getDoc(doc(adminDb, "cms_establishments", "chess-choperia"))).data();
  assert.equal(cms.content.description, "Descrição editorial aprovada sem dados privados.");
  assert.equal(cms.review.lastAppliedRequestId, "");
  assert.equal(cms.review.lastAppliedBy, "");
  assert.equal(cms.review.lastReviewNotes, "");
  assert.equal(JSON.stringify(cms.review).includes(requestId), false);
  assert.equal(JSON.stringify(cms.review).includes(privateNote), false);

  const privateRequest = (await getDoc(doc(adminDb, "establishment_update_requests", requestId))).data();
  assert.equal(privateRequest.requestedChanges.additionalNotes, privateNote);
  assert.deepEqual(privateRequest.appliedFields, ["description"]);
});

test("retry textual retoma saga multi-grupo parcial e restaura publicação", async () => {
  const requestId = "manager-text-multigroup-resume";
  const description = "Descrição aprovada com retomada multi-grupo.";
  const instagram = "@retomada_sintetica";
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "establishment_update_requests", requestId), {
      id: requestId,
      establishmentId: "chess-choperia",
      ownerUid: USER_A_UID,
      status: "approved",
      requestedChanges: { instagram, description },
    });
  });

  let transactionCalls = 0;
  const failingDb = {
    collection: (name) => adminRuntimeDb.collection(name),
    runTransaction(callback) {
      transactionCalls += 1;
      if (transactionCalls === 4) return Promise.reject(new Error("synthetic-text-second-group-failure"));
      return adminRuntimeDb.runTransaction(callback);
    },
  };
  const failingSystem = loadAdminRuntime(ADMIN_UID, "admin", failingDb, storageFacade).system;
  const failed = await failingSystem.applyApprovedEstablishmentUpdateRequest(requestId);
  assert.equal(failed.success, false);
  assert.equal(transactionCalls, 4);
  const partial = (await getDoc(doc(adminDb, "cms_establishments", "chess-choperia"))).data();
  assert.equal(partial.status, "draft");
  assert.equal(partial.editSession.resumeStatus, "published");
  assert.equal(partial.content.description, description);
  assert.notEqual(partial.contact.instagram, instagram);

  const retried = await adminSystem.applyApprovedEstablishmentUpdateRequest(requestId);
  assert.equal(retried.success, true, retried.message);
  const completed = (await getDoc(doc(adminDb, "cms_establishments", "chess-choperia"))).data();
  assert.equal(completed.status, "published");
  assert.equal(Boolean(completed.editSession), false);
  assert.equal(completed.content.description, description);
  assert.equal(completed.contact.instagram, instagram);
  const privateRequest = (await getDoc(doc(adminDb, "establishment_update_requests", requestId))).data();
  assert.equal(privateRequest.textApplyState, "completed");
  assert.deepEqual(privateRequest.appliedFields, ["description", "instagram"]);
});

test("retry textual não reaplica campo restaurado manualmente ao baseline exato", async () => {
  const requestId = "manager-text-exact-baseline-rollback";
  const before = (await getDoc(doc(adminDb, "cms_establishments", "chess-choperia"))).data();
  const baselineDescription = before.content.description;
  const approvedDescription = "Descrição que será revertida exatamente ao baseline.";
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "establishment_update_requests", requestId), {
      id: requestId,
      establishmentId: "chess-choperia",
      ownerUid: USER_A_UID,
      status: "approved",
      requestedChanges: { description: approvedDescription },
    });
  });

  requestTrackingFailureId = requestId;
  requestTrackingFailureRemaining = 1;
  const failed = await adminSystem.applyApprovedEstablishmentUpdateRequest(requestId);
  assert.equal(failed.success, false);
  const appliedRequest = (await getDoc(doc(adminDb, "establishment_update_requests", requestId))).data();
  assert.equal(appliedRequest.textApplyProgress.content, true);

  await adminModule._applyCanonicalFields("chess-choperia", {
    "content.description": baselineDescription,
  }, { flow: "synthetic-exact-text-baseline-rollback" });

  requestTrackingFailureId = "";
  const retried = await adminSystem.applyApprovedEstablishmentUpdateRequest(requestId);
  assert.equal(retried.success, false);
  const after = (await getDoc(doc(adminDb, "cms_establishments", "chess-choperia"))).data();
  assert.equal(after.content.description, baselineDescription);
  assert.notEqual(after.content.description, approvedDescription);
  const privateRequest = (await getDoc(doc(adminDb, "establishment_update_requests", requestId))).data();
  assert.equal(privateRequest.textApplyState, "applying");
  assert.equal(Boolean(privateRequest.appliedAt), false);
});

test("retry textual falha fechado após write CMS, falha de tracking e edição manual", async () => {
  const requestId = "manager-text-tracking-failure";
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "establishment_update_requests", requestId), {
      id: requestId,
      establishmentId: "chess-choperia",
      ownerUid: USER_A_UID,
      ownerEmail: "private@example.test",
      status: "approved",
      requestedChanges: { description: "Descrição aplicada antes da falha de tracking." },
    });
  });

  requestTrackingFailureId = requestId;
  requestTrackingFailureRemaining = 1;
  const failed = await adminSystem.applyApprovedEstablishmentUpdateRequest(requestId);
  assert.equal(failed.success, false);
  assert.equal((await getDoc(doc(adminDb, "cms_establishments", "chess-choperia"))).data().content.description,
    "Descrição aplicada antes da falha de tracking.");

  await adminModule._applyCanonicalFields("chess-choperia", {
    "content.description": "Edição manual posterior preservada.",
  }, { flow: "synthetic-manual-edit-after-tracking-failure" });

  const retried = await adminSystem.applyApprovedEstablishmentUpdateRequest(requestId);
  assert.equal(retried.success, false);
  const cms = (await getDoc(doc(adminDb, "cms_establishments", "chess-choperia"))).data();
  assert.equal(cms.content.description, "Edição manual posterior preservada.");
  const privateRequest = (await getDoc(doc(adminDb, "establishment_update_requests", requestId))).data();
  assert.equal(privateRequest.textApplyState, "applying");
  assert.equal(Boolean(privateRequest.appliedAt), false);
  requestTrackingFailureId = "";
});

test("edição manual de mídia durante upload não é sobrescrita nem reintroduzida no retry", async () => {
  const requestId = "manager-media-concurrent-edit";
  const sourcePath = managerSourcePath(USER_A_UID, requestId, 1);
  const image = {
    path: sourcePath,
    url: `https://firebasestorage.googleapis.com/v0/b/${PROJECT_ID}.appspot.com/o/${encodeURIComponent(sourcePath)}?alt=media&token=private`,
    name: "private-name.webp",
    contentType: "image/webp",
    size: 8,
  };
  const blob = new Blob([new Uint8Array([82, 73, 70, 70, 5, 4, 3, 2])], { type: "image/webp" });
  sourceBlobsByPath.set(sourcePath, blob);
  await testEnv.authenticatedContext(USER_A_UID).storage().ref(sourcePath).put(blob, { contentType: "image/webp" });
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "establishment_update_requests", requestId), {
      id: requestId,
      establishmentId: "chess-choperia",
      ownerUid: USER_A_UID,
      ownerEmail: "private@example.test",
      status: "approved",
      images: [image],
      mediaReview: { images: [{ path: sourcePath, url: image.url, status: "accepted", note: "" }] },
      appliedMedia: [],
    });
  });

  storagePutCount = 0;
  storageBeforePutHook = async () => {
    const before = (await getDoc(doc(adminDb, "cms_establishments", "chess-choperia"))).data();
    const gallery = before.media.gallery.map((item, index) => index === 0
      ? { ...item, caption: "Edição manual concorrente preservada." }
      : item);
    await adminModule._applyCanonicalFields("chess-choperia", { "media.gallery": gallery }, {
      groups: ["media"],
      flow: "synthetic-concurrent-media-edit",
    });
  };

  const failed = await adminSystem.applyAcceptedEstablishmentUpdateMedia(requestId);
  assert.equal(failed.success, false);
  assert.equal(storagePutCount, 1);
  const afterFailure = (await getDoc(doc(adminDb, "cms_establishments", "chess-choperia"))).data();
  assert.equal(afterFailure.media.gallery[0].caption, "Edição manual concorrente preservada.");
  assert.equal(JSON.stringify(afterFailure.media).includes(requestId), false);

  const retried = await adminSystem.applyAcceptedEstablishmentUpdateMedia(requestId);
  assert.equal(retried.success, false);
  assert.equal(storagePutCount, 1);
  const afterRetry = (await getDoc(doc(adminDb, "cms_establishments", "chess-choperia"))).data();
  assert.equal(afterRetry.media.gallery[0].caption, "Edição manual concorrente preservada.");
});

test("Rules congelam decisão de mídia durante aplicação e preservam ownership", async () => {
  const requestId = "manager-media-private-request";
  const adminRef = doc(adminDb, "establishment_update_requests", requestId);
  const moderatorDb = testEnv.authenticatedContext(MODERATOR_UID).firestore();
  const moderatorRef = doc(moderatorDb, "establishment_update_requests", requestId);
  const current = (await getDoc(adminRef)).data();

  await updateDoc(adminRef, {
    mediaApplyState: "applying",
    mediaApplyFingerprint: "locked-fingerprint",
    updatedAt: serverTimestamp(),
  });
  await assertFails(updateDoc(moderatorRef, {
    mediaReview: { ...current.mediaReview, reviewedBy: MODERATOR_UID },
    updatedAt: serverTimestamp(),
  }));
  await assertFails(updateDoc(moderatorRef, { ownerUid: MODERATOR_UID, updatedAt: serverTimestamp() }));
  await assertFails(deleteDoc(moderatorRef));

  await updateDoc(adminRef, {
    mediaApplyState: "reviewed",
    mediaApplyFingerprint: "",
    updatedAt: serverTimestamp(),
  });
  await assertSucceeds(updateDoc(moderatorRef, {
    mediaReview: { ...current.mediaReview, reviewedBy: MODERATOR_UID },
    mediaApplyState: "reviewed",
    mediaApplyFingerprint: "",
    updatedAt: serverTimestamp(),
  }));

  await updateDoc(adminRef, {
    textApplyState: "applying",
    textApplyFingerprint: "locked-text-fingerprint",
    textApplyBaseRevision: 1,
    textApplyBaseStatus: "published",
    updatedAt: serverTimestamp(),
  });
  await assertFails(updateDoc(moderatorRef, {
    reviewNotes: "não pode mudar durante aplicação textual",
    updatedAt: serverTimestamp(),
  }));
  await assertFails(deleteDoc(moderatorRef));
});
