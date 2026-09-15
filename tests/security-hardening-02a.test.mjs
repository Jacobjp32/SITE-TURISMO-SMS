import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { runInNewContext } from "node:vm";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const parse5 = require("parse5");
const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");
const publicationSource = await read("js/publication-contracts.js");
const publicationSandbox = { URL, TextEncoder };
runInNewContext(publicationSource, publicationSandbox, { filename: "js/publication-contracts.js" });
const contracts = publicationSandbox.SMSPublicationContracts;

const PRIVATE_FIELDS = [
  "submittedBy", "submittedByName", "submittedByEmail",
  "ownerUid", "ownerName", "ownerEmail", "linkedManagerId", "linkedEstablishmentRole",
  "reviewedAt", "reviewedBy", "reviewNotes", "updatedAt", "updatedBy",
  "internalNote", "moderationMetadata", "requestMetadata", "ip", "debugData", "unknownField",
];

function parseFirstElement(markup) {
  const fragment = parse5.parseFragment(markup);
  return fragment.childNodes.find((node) => node.nodeName !== "#text");
}

function attrsOf(node) {
  return Object.fromEntries(node.attrs.map((attr) => [attr.name, attr.value]));
}

function pendingFixture(overrides = {}) {
  return {
    title: "Evento sintético",
    description: "Descrição pública",
    date: "2026-10-20",
    time: "19:00",
    location: "Centro",
    category: "cultural",
    website: "https://evento.example/programacao",
    mapUrl: "https://maps.example/local",
    images: [{
      url: "https://cdn.example/evento.webp",
      path: "submissions/private/evento.webp",
      name: "Capa",
      contentType: "image/webp",
      size: 1234,
      uploadedAt: "private-metadata",
    }],
    submittedBy: "uid-private",
    submittedByName: "Pessoa privada",
    submittedByEmail: "private@example.test",
    ownerUid: "uid-private",
    ownerName: "Pessoa privada",
    ownerEmail: "private@example.test",
    linkedManagerId: "manager-private",
    linkedEstablishmentRole: "owner-private",
    reviewedAt: "private-time",
    reviewedBy: "moderator-private",
    reviewNotes: "nota privada",
    updatedAt: "private-time",
    updatedBy: "moderator-private",
    internalNote: "não publicar",
    moderationMetadata: { fixture: true },
    requestMetadata: { fixture: true },
    ip: "192.0.2.1",
    debugData: "private-debug",
    unknownField: "extra",
    ...overrides,
  };
}

function assertNoPrivateFields(document) {
  assert.deepEqual(PRIVATE_FIELDS.filter((field) => Object.hasOwn(document, field)), []);
}

function approvalHarness(pendingCollection, publicCollection, pendingData, documentId, options = {}) {
  const writes = { publicDocument: null, privatePatch: null, committed: false };
  const refs = new Map();

  function ref(collection, id) {
    const key = `${collection}/${id}`;
    if (!refs.has(key)) {
      refs.set(key, {
        collection,
        id,
        async get() {
          if (collection === pendingCollection && id === documentId) {
            return { exists: true, data: () => pendingData };
          }
          if (collection === publicCollection && id === documentId && options.publicExists) {
            return { exists: true, data: () => ({ id: documentId }) };
          }
          return { exists: false, data: () => ({}) };
        },
      });
    }
    return refs.get(key);
  }

  const db = {
    collection(collection) {
      return { doc(id) { return ref(collection, id); } };
    },
    batch() {
      return {
        set(target, data) {
          assert.equal(target.collection, publicCollection);
          assert.equal(target.id, documentId);
          writes.publicDocument = data;
        },
        update(target, data) {
          assert.equal(target.collection, pendingCollection);
          assert.equal(target.id, documentId);
          writes.privatePatch = data;
        },
        async commit() { writes.committed = true; },
      };
    },
  };

  return { db, writes };
}

async function loadFirebaseSystem(db, storage) {
  const authSource = await read("js/firebase-auth.js");
  const firestore = () => db;
  firestore.FieldValue = { serverTimestamp: () => ({ __serverTimestamp: true }) };
  const document = {
    addEventListener() {},
    querySelectorAll() { return []; },
    querySelector() { return null; },
    createElement() { return { style: {}, setAttribute() {}, appendChild() {}, remove() {} }; },
    body: { appendChild() {} },
  };
  const window = {
    location: { hostname: "localhost", search: "" },
    addEventListener() {},
    dispatchEvent() {},
    crypto: globalThis.crypto,
  };
  const firebase = { firestore, apps: [] };
  if (storage) firebase.storage = () => storage;
  const context = {
    CONFIG: { firebase: { projectId: "demo-turismo-sms-admin-finalization" } },
    SMSPublicationContracts: contracts,
    firebase,
    window,
    document,
    CustomEvent: class CustomEvent { constructor(type, init) { this.type = type; this.detail = init?.detail; } },
    URL,
    URLSearchParams,
    TextEncoder,
    Blob,
    console: { log() {}, info() {}, warn() {}, error() {} },
    setTimeout,
    clearTimeout,
  };
  runInNewContext(`${authSource}\ncurrentUser = { uid: 'moderator-fixture', role: 'moderator', ativo: true };`, context, {
    filename: "js/firebase-auth.js",
  });
  return context.window.FirebaseSystem;
}

test("contrato de URL bloqueia esquemas inseguros, protocol-relative e entradas malformadas", () => {
  const denied = [
    "javascript:alert(1)", "data:text/html,fixture", "blob:https://evil.example/fixture",
    "file:///tmp/fixture", "vbscript:msgbox(1)", "//evil.example/path",
    "http://insecure.example/path", "https://user:password@example.test/path", "https://exa mple.test/path",
  ];
  for (const value of denied) {
    assert.equal(contracts.url.externalHttps(value, ""), "", value);
    assert.equal(contracts.url.map(value, ""), "", value);
  }
  for (const value of denied.slice(0, 7)) assert.equal(contracts.url.publicNavigation(value, ""), "", value);
});

test("contrato de URL permite HTTPS e paths internos apenas nas políticas correspondentes", () => {
  assert.equal(contracts.url.externalHttps("https://example.test/path?q=1#map"), "https://example.test/path?q=1#map");
  assert.equal(contracts.url.map("https://maps.example/place"), "https://maps.example/place");
  assert.equal(contracts.url.publicNavigation("/eventos?id=fixture"), "/eventos?id=fixture");
  assert.equal(contracts.url.publicAsset("images/evento.webp"), "images/evento.webp");
  assert.equal(contracts.url.publicAsset("../images/evento.webp"), "../images/evento.webp");
  assert.equal(contracts.url.externalHttps("/eventos"), "");
  assert.equal(contracts.url.map("/mapa-turistico"), "");
});

test("contrato de mídia bloqueia URLs que ainda expõem namespace privado de submissions", () => {
  const privateUrl = "https://firebasestorage.googleapis.com/v0/b/demo/o/submissions%2Fevents%2Fuid-private%2Fevt-media%2Fimage.png?alt=media&token=secret";
  assert.equal(contracts.url.publicAsset(privateUrl, ""), "");
  assert.equal(contracts.url.publicAsset(privateUrl.replace(/%2F/gi, "%252F"), ""), "");
  assert.equal(contracts.url.publicAsset("submissions/events/uid-private/evt-media/image.png", ""), "");
  assert.throws(() => contracts.projectPublicEvent(pendingFixture({ images: [{ url: privateUrl }] }), "evt-media"), {
    code: "publication/invalid-field",
    field: "images[0].url",
  });
});

test("projeção pública de evento contém somente a allowlist e remove PII/metadados", () => {
  const projected = contracts.projectPublicEvent(pendingFixture(), "evt-fixture");
  assert.deepEqual(Object.keys(projected).filter((field) => !contracts.EVENT_PUBLIC_FIELDS.includes(field)), []);
  assertNoPrivateFields(projected);
  assert.equal(projected.id, "evt-fixture");
  assert.equal(projected.title, "Evento sintético");
  assert.equal(projected.website, "https://evento.example/programacao");
  assert.equal(projected.mapUrl, "https://maps.example/local");
  assert.equal(projected.status, "aprovado");
  assert.equal(projected.publicado, true);
  assert.equal(projected.images[0].path, undefined);
  assert.equal(projected.images[0].uploadedAt, undefined);
});

test("projeção pública de estabelecimento contém somente a allowlist e remove PII/metadados", () => {
  const projected = contracts.projectPublicEstablishment({
    ...pendingFixture(), name: "Hospedagem sintética", address: "Rua de Teste, 123",
    phone: "(42) 3000-0000", openingHours: "08:00–18:00",
  }, "est-fixture");
  assert.deepEqual(Object.keys(projected).filter((field) => !contracts.ESTABLISHMENT_PUBLIC_FIELDS.includes(field)), []);
  assertNoPrivateFields(projected);
  assert.equal(projected.id, "est-fixture");
  assert.equal(projected.name, "Hospedagem sintética");
  assert.equal(projected.address, "Rua de Teste, 123");
  assert.equal(projected.status, "aprovado");
});

test("projetor de evento rejeita cada classe de URL pública insegura", () => {
  for (const value of ["javascript:alert(1)", "data:text/html,x", "blob:https://evil.example/x", "file:///x", "//evil.example/x", "not a url"]) {
    assert.throws(() => contracts.projectPublicEvent(pendingFixture({ mapUrl: value }), "evt-url"), {
      code: "publication/invalid-field", field: "mapUrl",
    });
  }
});

test("projetores rejeitam site e mídia inseguros em vez de descartá-los silenciosamente", () => {
  assert.throws(() => contracts.projectPublicEvent(pendingFixture({ website: "javascript:alert(1)" }), "evt-site"), {
    code: "publication/invalid-field", field: "website",
  });
  assert.throws(() => contracts.projectPublicEstablishment(pendingFixture({ images: [{ url: "data:text/html,x" }] }), "est-image"), {
    code: "publication/invalid-field", field: "images[0].url",
  });
});

test("IDs Firestore com aspas/markup permanecem exatos; paths e controles são rejeitados", () => {
  const accepted = ['evt"double', "evt'single", "evt<tag>", "evt');fixture();"];
  for (const id of accepted) {
    assert.equal(contracts.validDocumentId(id), true, id);
    assert.equal(contracts.publicDocumentId(id), id, id);
  }
  for (const id of ["", ".", "..", "folder/id", "evt\u0000id", "__reserved__"]) {
    assert.equal(contracts.validDocumentId(id), false, JSON.stringify(id));
  }
});

test("approveEvent grava DTO público e preserva decisão/PII apenas no documento privado", async () => {
  const harness = approvalHarness("eventos_pendentes", "eventos_aprovados", pendingFixture({ images: [], mainImage: "", image: "" }), "evt-runtime");
  const system = await loadFirebaseSystem(harness.db);
  const result = await system.approveEvent("evt-runtime", "nota privada de revisão");
  assert.equal(result.success, true, result.message);
  assert.equal(harness.writes.committed, true);
  assertNoPrivateFields(harness.writes.publicDocument);
  assert.equal(harness.writes.privatePatch.status, "aprovado");
  assert.equal(harness.writes.privatePatch.reviewNotes, "nota privada de revisão");
  assert.equal(harness.writes.privatePatch.reviewedBy, "moderator-fixture");
});

test("approveEstablishment exige admin e não grava a coleção pública legada", async () => {
  const pending = { ...pendingFixture({ images: [], mainImage: "", image: "" }), name: "Restaurante sintético", address: "Rua de Teste, 50", phone: "(42) 3000-0000" };
  const harness = approvalHarness("estabelecimentos_pendentes", "estabelecimentos_aprovados", pending, "est-runtime");
  const system = await loadFirebaseSystem(harness.db);
  const result = await system.approveEstablishment("est-runtime", "nota privada de revisão");
  assert.equal(result.success, false);
  assert.equal(result.code, "ADMIN_REQUIRED_FOR_CMS_DRAFT");
  assert.equal(harness.writes.committed, false);
  assert.equal(harness.writes.publicDocument, null);
  assert.equal(harness.writes.privatePatch, null);
});

test("aprovação republica mídia privada em namespace neutro antes do DTO público", async () => {
  const sourcePath = "submissions/events/uid-private/evt-media/image.png";
  const sourceToken = createHash("sha256").update(sourcePath).digest("hex").slice(0, 24);
  const destinationPath = `approved-media/events/evt-media/01-${sourceToken}-image.png`;
  const privateUrl = "https://firebasestorage.googleapis.com/v0/b/demo/o/submissions%2Fevents%2Fuid-private%2Fevt-media%2Fimage.png?alt=media&token=secret";
  const publicUrl = "https://firebasestorage.googleapis.com/v0/b/demo/o/approved-media%2Fevents%2Fevt-media%2F01-image.png?alt=media&token=public";
  const uploads = [];
  const storage = {
    ref(path) {
      return {
        async getBlob() {
          assert.equal(path, sourcePath);
          return new Blob(["synthetic-image"], { type: "image/png" });
        },
        async getDownloadURL() {
          if (path === sourcePath) return privateUrl;
          if (!uploads.includes(path)) {
            const error = new Error("not found");
            error.code = "storage/object-not-found";
            throw error;
          }
          return publicUrl;
        },
        async put(blob, metadata) {
          assert.equal(path, destinationPath);
          assert.equal(blob.type, "image/png");
          assert.equal(metadata.cacheControl, "public,max-age=31536000,immutable");
          uploads.push(path);
        },
      };
    },
  };
  const pending = pendingFixture({
    ownerUid: "uid-private",
    submittedBy: "uid-private",
    images: [{ url: privateUrl, path: sourcePath, name: "image.png", contentType: "image/png" }],
    mainImage: privateUrl,
  });
  const harness = approvalHarness("eventos_pendentes", "eventos_aprovados", pending, "evt-media");
  const system = await loadFirebaseSystem(harness.db, storage);
  const result = await system.approveEvent("evt-media", "");
  assert.equal(result.success, true, result.message);
  assert.deepEqual(uploads, [destinationPath]);
  assert.equal(harness.writes.publicDocument.mainImage, publicUrl);
  assert.equal(harness.writes.publicDocument.images[0].url, publicUrl);
  assert.equal(JSON.stringify(harness.writes.publicDocument).includes("uid-private"), false);
  assert.equal(JSON.stringify(harness.writes.publicDocument).includes("submissions"), false);
});

test("aprovação rejeita mídia externa que não comprova origem privada da submissão", async () => {
  const harness = approvalHarness(
    "eventos_pendentes",
    "eventos_aprovados",
    pendingFixture({
      images: [{ url: "https://tracker.example/pixel.png", name: "pixel.png", contentType: "image/png" }],
      mainImage: "https://tracker.example/pixel.png",
    }),
    "evt-external-media",
  );
  const system = await loadFirebaseSystem(harness.db);
  const result = await system.approveEvent("evt-external-media", "");
  assert.equal(result.success, false);
  assert.match(result.message, /origem privada verificável/);
  assert.equal(harness.writes.committed, false);
});

test("autoria canônica submittedBy impede cópia de mídia apontada por ownerUid forjado", async () => {
  const foreignPath = "submissions/events/uid-foreign/evt-owner/image.png";
  const harness = approvalHarness(
    "eventos_pendentes",
    "eventos_aprovados",
    pendingFixture({
      submittedBy: "uid-private",
      ownerUid: "uid-foreign",
      images: [{ path: foreignPath, url: "https://firebasestorage.googleapis.com/v0/b/demo/o/submissions%2Fevents%2Fuid-foreign%2Fevt-owner%2Fimage.png?alt=media&token=foreign" }],
      mainImage: "",
      image: "",
    }),
    "evt-owner",
  );
  const system = await loadFirebaseSystem(harness.db);
  const result = await system.approveEvent("evt-owner", "");
  assert.equal(result.success, false);
  assert.match(result.message, /não pertence à submissão aprovada/);
  assert.equal(harness.writes.committed, false);
});

test("proveniência exige que a mídia pertença ao documento aprovado, não apenas ao mesmo autor", async () => {
  const harness = approvalHarness(
    "eventos_pendentes",
    "eventos_aprovados",
    pendingFixture({
      images: [{
        path: "submissions/events/uid-private/evt-other/image.png",
        url: "https://firebasestorage.googleapis.com/v0/b/demo/o/submissions%2Fevents%2Fuid-private%2Fevt-other%2Fimage.png?alt=media&token=foreign-document",
      }],
      mainImage: "",
      image: "",
    }),
    "evt-target",
  );
  const system = await loadFirebaseSystem(harness.db);
  const result = await system.approveEvent("evt-target", "");
  assert.equal(result.success, false);
  assert.match(result.message, /não pertence à submissão aprovada/);
  assert.equal(harness.writes.publicDocument, null);
  assert.equal(harness.writes.privatePatch, null);
  assert.equal(harness.writes.committed, false);
});

test("aprovação falha antes da mídia quando o ID já existe na collection pública", async () => {
  const cases = [
    ["eventos_pendentes", "eventos_aprovados", "evt-collision", "approveEvent"],
  ];
  for (const [pendingCollection, publicCollection, id, method] of cases) {
    const harness = approvalHarness(
      pendingCollection,
      publicCollection,
      pendingFixture({ images: [], mainImage: "", image: "" }),
      id,
      { publicExists: true },
    );
    const system = await loadFirebaseSystem(harness.db);
    const result = await system[method](id, "");
    assert.equal(result.success, false, `${method}: ${result.message}`);
    assert.match(result.message, /Já existe/);
    assert.equal(harness.writes.publicDocument, null);
    assert.equal(harness.writes.privatePatch, null);
    assert.equal(harness.writes.committed, false);
  }
});

test("aprovação falha fechada e não escreve quando a URL pendente é insegura", async () => {
  const harness = approvalHarness("eventos_pendentes", "eventos_aprovados", pendingFixture({ images: [], mainImage: "", image: "", mapUrl: "javascript:alert(1)" }), "evt-blocked");
  const system = await loadFirebaseSystem(harness.db);
  const result = await system.approveEvent("evt-blocked", "");
  assert.equal(result.success, false);
  assert.match(result.message, /URL de mapa inválida/);
  assert.equal(harness.writes.publicDocument, null);
  assert.equal(harness.writes.privatePatch, null);
  assert.equal(harness.writes.committed, false);
});

test("Home valida URL antes do href e usa fallback interno para valor inválido", async () => {
  const source = await read("js/home-eventos.js");
  assert.match(source, /publicationContracts\.url\.map\(rawEvent\.mapUrl \|\| rawEvent\.mapaUrl, ''\)/);
  assert.match(source, /publicationContracts\.url\.publicNavigation\(mapUrl \|\| evento\.url, '\/eventos'\)/);
  assert.match(source, /href="\$\{esc\(detalheUrl\)\}"/);
  assert.doesNotMatch(source, /mapUrl:\s*rawEvent\.mapUrl\s*\|\|\s*rawEvent\.mapaUrl/);
});

test("sink final da Home recebe fallback para URL hostil e preserva HTTPS legítimo", () => {
  for (const hostile of ["javascript:alert(1)", "data:text/html,x", "blob:https://evil.example/x", "file:///x", "//evil.example/x"]) {
    const safeTarget = contracts.url.publicNavigation(contracts.url.map(hostile, ""), "/eventos");
    const attrs = attrsOf(parseFirstElement(`<a href="${safeTarget}" class="home-event-link">Abrir</a>`));
    assert.equal(attrs.href, "/eventos");
  }
  const legitimate = "https://maps.example/place";
  const safeTarget = contracts.url.publicNavigation(contracts.url.map(legitimate, ""), "/eventos");
  assert.equal(attrsOf(parseFirstElement(`<a href="${safeTarget}">Abrir</a>`)).href, legitimate);
});

test("agenda pública usa o contrato canônico em URLs de imagem, site e WhatsApp", async () => {
  const source = await read("eventos.html");
  assert.match(source, /sanitizePublicAssetUrl/);
  assert.match(source, /sanitizePublicNavigationUrl/);
  assert.match(source, /url\.externalHttps\(text, ''\)/);
  assert.doesNotMatch(source, /function sanitizePublicUrl/);
});

test("scripts carregam o contrato antes de cada produtor ou consumidor afetado", async () => {
  const [home, events, map, admin, portal] = await Promise.all([
    read("index.html"), read("eventos.html"), read("mapa-turistico.html"), read("admin-firebase.html"), read("portal-usuario.html"),
  ]);
  assert.ok(home.indexOf("js/publication-contracts.js") < home.indexOf("js/home-eventos.js"));
  assert.ok(events.indexOf("js/publication-contracts.js") < events.indexOf("function sanitizePublicAssetUrl"));
  assert.ok(map.indexOf("js/publication-contracts.js") < map.indexOf("js/mapa-turistico.js"));
  assert.ok(admin.indexOf("js/publication-contracts.js") < admin.indexOf("js/firebase-auth.js"));
  assert.ok(portal.indexOf("js/publication-contracts.js") < portal.indexOf("js/firebase-auth.js"));
});

test("mapa valida href e src de eventos aprovados com o mesmo contrato", async () => {
  const source = await read("js/mapa-turistico.js");
  assert.match(source, /url\.publicNavigation\(raw, fallback \|\| ""\)/);
  assert.match(source, /url\.publicAsset\(image, ""\)/);
  assert.match(source, /url\.publicAsset\([\s\S]*?raw\.mainImage/);
  assert.doesNotMatch(source, /if \(\/\^\\\/\/.+return raw/);
});

test("consumidores públicos de eventos não reutilizam ownerName privado como fallback editorial", async () => {
  const [home, events, map] = await Promise.all([
    read("js/home-eventos.js"),
    read("eventos.html"),
    read("js/mapa-turistico.js"),
  ]);
  assert.match(home, /if \(adapterInput !== rawEvent\) delete adapterInput\.ownerName;/);
  assert.match(home, /normalizeEventOccurrence\(adapterInput, \{ runtimeSource, sourceId \}\)/);
  assert.doesNotMatch(events, /organizador:\s*asCleanString\([^\n]*ownerName/);
  assert.doesNotMatch(map, /organizer:\s*cleanTextValue\([^\n]*ownerName/);
});

test("filas Admin usam data attributes sem JavaScript inline para IDs controláveis", async () => {
  const [html, authSource, contentSource] = await Promise.all([
    read("admin-firebase.html"),
    read("js/firebase-auth.js"),
    read("js/admin-content-cms.js"),
  ]);
  assert.match(html, /data-admin-action="approve-event" data-admin-target-id="\$\{SEC\.attr\(e\.id\)\}"/);
  assert.match(html, /data-admin-action="approve-claim" data-admin-target-id="\$\{SEC\.attr\(claim\.id\)\}"/);
  assert.match(html, /actionElement\.getAttribute\('data-admin-target-id'\)/);
  assert.match(html, /document\.addEventListener\('click', handleAdminDelegatedClick\)/);
  assert.doesNotMatch(html, /onclick="(?:approveEvent|rejectEvent|viewEvent|approveClaim|rejectClaimReview)\('/);
  assert.doesNotMatch(html, /onchange="changeUserRole\('/);
  assert.match(authSource, /const users = snap\.docs\.map\(function\(d\) \{ return Object\.assign\(\{\}, d\.data\(\), \{ id: d\.id \}\); \}\);/);
  assert.match(authSource, /Object\.assign\(\{\}, d\.data\(\), \{ id: d\.id \}\)/);
  assert.match(contentSource, /Object\.assign\(\{\}, doc\.data\(\), \{ id: doc\.id \}\)/);
  assert.match(html, /snapshot\.docs\.map\(doc => Object\.assign\(\{\}, doc\.data\(\), \{ id: doc\.id \}\)\)/);
  assert.doesNotMatch(html, /\{ id: doc\.id, \.\.\.doc\.data\(\) \}/);
});

test("IDs sintéticos não criam atributos e chegam exatamente ao alvo delegado", async () => {
  const securitySource = await read("js/security-utils.js");
  const sandbox = { window: { location: { origin: "https://turismo.example" } }, URL };
  runInNewContext(securitySource, sandbox, { filename: "js/security-utils.js" });
  for (const id of [
    'evt"double',
    "evt'single",
    "evt<tag>",
    "evt&ampersand&",
    "evt`backtick",
    "evt\nnewline",
    "evt<script>markup</script>",
    "evt');fixture();//",
  ]) {
    const markup = `<button type="button" data-admin-action="approve-event" data-admin-target-id="${sandbox.window.SMSecurity.attr(id)}">Aprovar</button>`;
    const attrs = attrsOf(parseFirstElement(markup));
    assert.equal(attrs["data-admin-target-id"], id);
    assert.equal(attrs["data-admin-action"], "approve-event");
    assert.equal(attrs.onclick, undefined);
    assert.deepEqual(Object.keys(attrs).sort(), ["data-admin-action", "data-admin-target-id", "type"]);
  }
});

test("ação delegada chama o handler legítimo com o ID exatamente decodificado", async () => {
  const source = await read("admin-firebase.html");
  const start = source.indexOf("function runAdminDelegatedAction(actionElement)");
  const end = source.indexOf("function handleAdminDelegatedClick", start);
  assert.ok(start >= 0 && end > start);
  let received = null;
  const sandbox = {
    approveEvent(id) { received = id; },
    console: { error() {} },
    AdminContentCMS: {},
  };
  runInNewContext(`${source.slice(start, end)}\nglobalThis.__run = runAdminDelegatedAction;`, sandbox);
  const id = 'evt"<tag>\'fixture';
  sandbox.__run({
    value: "",
    getAttribute(name) {
      if (name === "data-admin-action") return "approve-event";
      if (name === "data-admin-target-id") return id;
      return null;
    },
  });
  assert.equal(received, id);
});

test("tabela de conteúdo aprovado também remove o caminho inline irmão", async () => {
  const source = await read("js/admin-content-cms.js");
  assert.match(source, /data-admin-action="content-preview-event" data-admin-target-id="' \+ SEC\.attr\(eventItem\.id\)/);
  assert.match(source, /data-admin-action="content-delete-event" data-admin-target-id="' \+ SEC\.attr\(eventItem\.id\)/);
  assert.doesNotMatch(source, /onclick="AdminContentCMS\.(?:previewEvent|openEventModal|duplicateEvent|toggleEventPublish|toggleEventFeatured|deleteEvent)\(\\'/);
});

test("source fix projeta eventos e delega empreendimentos à bridge CMS sem write legado", async () => {
  const source = await read("js/firebase-auth.js");
  const eventBlock = source.slice(source.indexOf("approveEvent:"), source.indexOf("rejectEvent:"));
  const establishmentBlock = source.slice(source.indexOf("approveEstablishment:"), source.indexOf("rejectEstablishment:"));
  assert.match(eventBlock, /preparePublicSubmissionMedia\(doc\.data\(\), 'event', publicEventId\)/);
  assert.match(eventBlock, /projectPublicEvent\(publicSource, publicEventId\)/);
  assert.match(establishmentBlock, /preparePublicSubmissionMedia\(submission, 'establishment', cmsId, submissionId\)/);
  assert.match(establishmentBlock, /adminEstablishments\.reserveSubmissionImport\(/);
  assert.match(establishmentBlock, /adminEstablishments\.importSubmissionDraft\(/);
  assert.doesNotMatch(establishmentBlock, /collection\('estabelecimentos_aprovados'\)\.doc[^\n]*\.set/);
  assert.doesNotMatch(eventBlock, /Object\.assign\(\{\},\s*doc\.data\(\)/);
  assert.doesNotMatch(eventBlock, /ref\.delete\(\)/);
  assert.doesNotMatch(establishmentBlock, /ref\.delete\(\)/);
});

test("portal acompanha eventos aprovados pela trilha privada sem depender de PII no DTO público", async () => {
  const source = await read("js/firebase-auth.js");
  const start = source.indexOf("getUserEvents: async function()");
  const end = source.indexOf("// ========================================\n    // ESTABELECIMENTOS", start);
  assert.ok(start >= 0 && end > start);
  const block = source.slice(start, end);
  assert.match(block, /collection\('eventos_pendentes'\)\.where\('submittedBy', '==', currentUser\.uid\)/);
  assert.doesNotMatch(block, /collection\('eventos_aprovados'\)/);
  assert.match(block, /Object\.assign\(\{\}, d\.data\(\), \{ id: d\.id \}\)/);
});
