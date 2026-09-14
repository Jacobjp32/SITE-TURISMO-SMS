import { strict as assert } from "node:assert";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import vm from "node:vm";

const [catalogSource, adminSource, portalSource] = await Promise.all([
  readFile(new URL("../js/establishment-catalog.js", import.meta.url), "utf8"),
  readFile(new URL("../admin-firebase.html", import.meta.url), "utf8"),
  readFile(new URL("../portal-usuario.html", import.meta.url), "utf8"),
]);

function publishedItem(id, overrides = {}) {
  return {
    id,
    slug: id,
    name: id === "chess-choperia" ? "Chess Choperia" : `Empreendimento ${id}`,
    category: { id: "gastronomia", label: "Gastronomia" },
    categoria: "Gastronomia",
    status: "published",
    content: { description: "Descrição pública", openingHours: "18h às 23h" },
    contact: {
      phone: "(42) 99999-0000",
      whatsapp: "(42) 99999-0000",
      instagram: "@publico",
      website: "https://example.test",
    },
    location: { address: "Rua Pública, 100" },
    media: {
      mainImage: { url: "https://example.test/main.webp" },
      gallery: [
        { url: "https://example.test/main.webp" },
        { url: "https://example.test/gallery.webp" },
      ],
    },
    display: { claimable: true },
    ...overrides,
  };
}

function authoritative(items, state = "SUCCESS") {
  return {
    items,
    count: items.length,
    authoritativeCount: items.length,
    source: "firestore",
    state,
    collection: "cms_establishments",
    queriedStatus: "published",
  };
}

function loadCatalog(readResult) {
  const calls = [];
  const window = {
    CMSPublicEstablishmentsAdapter: {
      async readPublished(options) {
        calls.push({ ...options });
        return typeof readResult === "function" ? readResult() : readResult;
      },
    },
  };
  window.window = window;
  vm.runInNewContext(catalogSource, { window, console, Promise });
  return { catalog: window.EstablishmentCatalog, calls };
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function deferred() {
  let resolve;
  const promise = new Promise((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

test("CMS_PUBLISHED_INCLUDED e CHESS_CANONICAL_ID=chess-choperia", async () => {
  const { catalog } = loadCatalog(authoritative([publishedItem("chess-choperia")]));
  const items = await catalog.ready();

  assert.equal(items.length, 1);
  assert.equal(items[0].establishmentId, "chess-choperia");
  assert.equal(items[0].establishmentName, "Chess Choperia");
  assert.equal(items[0].category, "Gastronomia");
  assert.equal(items[0].source, "cms_establishments");
  assert.equal(items[0].originalId, "chess-choperia");
  assert.equal(items[0].slug, "chess-choperia");
  assert.deepEqual(Object.keys(plain(items[0])), [
    "establishmentId",
    "establishmentName",
    "category",
    "source",
    "originalId",
    "slug",
    "currentSnapshot",
  ]);
  assert.deepEqual(plain(items[0].currentSnapshot), {
    name: "Chess Choperia",
    category: "Gastronomia",
    source: "cms_establishments",
    originalId: "chess-choperia",
    description: "Descrição pública",
    phone: "(42) 99999-0000",
    whatsapp: "(42) 99999-0000",
    instagram: "@publico",
    website: "https://example.test",
    address: "Rua Pública, 100",
    openingHours: "18h às 23h",
    images: ["https://example.test/main.webp", "https://example.test/gallery.webp"],
    mainImage: "https://example.test/main.webp",
    imageCount: 2,
  });
  assert.equal(catalog.findById("chess-choperia").establishmentName, "Chess Choperia");
});

test("CMS_DRAFT_EXCLUDED e CMS_ARCHIVED_EXCLUDED", async () => {
  const { catalog } = loadCatalog(authoritative([
    publishedItem("published"),
    publishedItem("draft", { status: "draft" }),
    publishedItem("archived", { status: "archived" }),
  ]));

  assert.deepEqual(plain((await catalog.ready()).map((item) => item.establishmentId)), ["published"]);
});

test("ADMIN_PUBLISHED_VISIBLE, CLAIMABLE_TRUE_INCLUDED_USER e CLAIMABLE_FALSE_EXCLUDED_USER", async () => {
  const { catalog } = loadCatalog(authoritative([
    publishedItem("claimable-true", { display: { claimable: true } }),
    publishedItem("claimable-default", { display: {} }),
    publishedItem("claimable-false", { display: { claimable: false } }),
  ]));

  await catalog.ready();
  assert.deepEqual(plain(catalog.list().map((item) => item.establishmentId)), [
    "claimable-default",
    "claimable-false",
    "claimable-true",
  ]);
  assert.deepEqual(plain(catalog.list({ claimableOnly: true }).map((item) => item.establishmentId)), [
    "claimable-default",
    "claimable-true",
  ]);
  assert.equal(catalog.findById("claimable-false", { claimableOnly: true }), null);
});

test("CACHE_REFRESH_SEES_NEW_PUBLICATION", async () => {
  let currentResult = authoritative([publishedItem("primeiro")]);
  const { catalog, calls } = loadCatalog(() => currentResult);

  await catalog.ready();
  currentResult = authoritative([publishedItem("primeiro"), publishedItem("chess-choperia")]);

  assert.deepEqual(plain((await catalog.ready()).map((item) => item.establishmentId)), ["primeiro"]);
  assert.equal(calls.length, 1);

  assert.deepEqual(plain((await catalog.refresh()).map((item) => item.establishmentId)), [
    "chess-choperia",
    "primeiro",
  ]);
  assert.equal(calls.length, 2);
  assert.equal(calls[1].force, true);
});

test("CONCURRENT_FORCED_REFRESH_IGNORES_STALE_COMPLETION", async () => {
  const firstRead = deferred();
  const secondRead = deferred();
  let readCount = 0;
  const { catalog, calls } = loadCatalog(() => {
    readCount += 1;
    return readCount === 1 ? firstRead.promise : secondRead.promise;
  });

  const staleRequest = catalog.ready({ force: true });
  const currentRequest = catalog.ready({ force: true });

  secondRead.resolve(authoritative([publishedItem("novo")]));
  assert.deepEqual(plain((await currentRequest).map((item) => item.establishmentId)), ["novo"]);

  firstRead.resolve(authoritative([
    publishedItem("antigo"),
    publishedItem("antigo"),
  ]));
  assert.deepEqual(plain((await staleRequest).map((item) => item.establishmentId)), ["novo"]);
  assert.deepEqual(plain(catalog.list().map((item) => item.establishmentId)), ["novo"]);
  assert.equal(calls.length, 2);
  assert.equal(calls[0].force, true);
  assert.equal(calls[1].force, true);
});

test("CLAIM_REVALIDATION_REJECTS_STALE_NONCLAIMABLE_DRAFT_AND_TAMPERING", async () => {
  let currentResult = authoritative([publishedItem("claim-target")]);
  const { catalog } = loadCatalog(() => currentResult);

  await catalog.ready({ force: true });
  assert.equal(catalog.findById("claim-target", { claimableOnly: true }).establishmentId, "claim-target");

  currentResult = authoritative([
    publishedItem("claim-target", { display: { claimable: false } }),
    publishedItem("draft-id", { status: "draft" }),
  ]);
  await catalog.ready({ force: true });

  assert.equal(catalog.findById("claim-target", { claimableOnly: true }), null);
  assert.equal(catalog.findById("draft-id", { claimableOnly: true }), null);
  assert.equal(catalog.findById("nonclaimable-id", { claimableOnly: true }), null);
});

test("AUTHORITATIVE_EMPTY_CLEARS_CACHE_WITHOUT_STATIC_FALLBACK", async () => {
  let currentResult = authoritative([publishedItem("primeiro")]);
  const { catalog } = loadCatalog(() => currentResult);

  await catalog.ready();
  currentResult = authoritative([], "AUTHORITATIVE_EMPTY");

  assert.deepEqual(plain(await catalog.ready({ force: true })), []);
  assert.deepEqual(plain(catalog.list()), []);
  assert.equal(catalog.getLastResult().state, "AUTHORITATIVE_EMPTY");
});

test("AUTHORITATIVE_PARTIAL_KEEPS_ACCEPTED_ITEMS_AND_DIAGNOSTICS", async () => {
  const partialResult = {
    ...authoritative([publishedItem("aceito")], "AUTHORITATIVE_PARTIAL"),
    rejectedCount: 1,
    rejections: [{ id: "rejeitado", reason: "invalid-publication-contract" }],
  };
  const { catalog } = loadCatalog(partialResult);

  assert.deepEqual(plain((await catalog.ready()).map((item) => item.establishmentId)), ["aceito"]);
  assert.equal(catalog.getLastResult().state, "AUTHORITATIVE_PARTIAL");
  assert.equal(catalog.getLastResult().rejectedCount, 1);
  assert.deepEqual(plain(catalog.getLastResult().rejections), [
    { id: "rejeitado", reason: "invalid-publication-contract" },
  ]);
});

test("CMS_IDENTITY_DEDUPES_EXACT_ID_ONLY", async () => {
  const sameName = { name: "Mesmo Nome" };
  const { catalog } = loadCatalog(authoritative([
    publishedItem("id-a", sameName),
    publishedItem("id-b", sameName),
    publishedItem("id-a", { ...sameName, content: { description: "duplicado" } }),
    publishedItem("chess-choperia"),
    publishedItem("chess-choperia"),
  ]));

  const items = await catalog.ready();
  assert.equal(items.filter((item) => item.establishmentId === "id-a").length, 1);
  assert.equal(items.filter((item) => item.establishmentId === "id-b").length, 1);
  assert.equal(items.filter((item) => item.establishmentName === "Mesmo Nome").length, 2);
  assert.equal(items.filter((item) => item.establishmentId === "chess-choperia").length, 1);
});

test("TECHNICAL_FAILURE_DOES_NOT_PRETEND_STATIC_IS_CANONICAL", async () => {
  let currentResult = authoritative([publishedItem("primeiro")]);
  const { catalog } = loadCatalog(() => currentResult);

  await catalog.ready();
  currentResult = {
    state: "TECHNICAL_FAILURE",
    source: "static-fallback",
    items: [publishedItem("static-stale")],
    fallbackReason: "network-unavailable",
  };

  assert.deepEqual(plain(await catalog.ready({ force: true })), []);
  assert.deepEqual(plain(catalog.list()), []);
  assert.equal(catalog.getLastResult().state, "TECHNICAL_FAILURE");
  assert.equal(catalog.getLastResult().source, "static-fallback");
});

test("adapter ausente falha fechado sem recorrer às bases estáticas", async () => {
  const window = {
    TURISMO_RESTAURANTES: [publishedItem("static-restaurant")],
    TURISMO_HOSPEDAGENS: [publishedItem("static-hotel")],
  };
  window.window = window;
  vm.runInNewContext(catalogSource, { window, console, Promise });

  assert.deepEqual(plain(await window.EstablishmentCatalog.ready()), []);
  assert.equal(window.EstablishmentCatalog.getLastResult().fallbackReason, "adapter-unavailable");
});

test("catálogo usa somente o adapter CMS read-only", () => {
  assert.match(catalogSource, /CMSPublicEstablishmentsAdapter/);
  assert.match(catalogSource, /readPublished/);
  assert.doesNotMatch(catalogSource, /TURISMO_RESTAURANTES|TURISMO_HOSPEDAGENS|rotas-data\.js/);
  assert.doesNotMatch(catalogSource, /\.set\(|\.add\(|\.update\(|\.delete\(|setDoc|addDoc|updateDoc|deleteDoc|uploadBytes/);
});

test("consumidores aplicam políticas distintas e refresh explícito", () => {
  assert.match(adminSource, /cms-public-establishments-adapter\.js/);
  assert.match(adminSource, /async function loadEstablishmentManagers\(\)[\s\S]*?EstablishmentCatalog\.ready\(\{ force: true \}\)/);
  assert.match(adminSource, /async function ensureManagerFormSources\(\)[\s\S]*?EstablishmentCatalog\.ready\(\{ force: true \}\)/);
  assert.match(portalSource, /claimableOnly: true/);
  assert.match(portalSource, /findById\(selectedId, \{ claimableOnly: true \}\)/);
  assert.match(portalSource, /abrirSecaoSolicitacaoVinculo\(\)/);
  assert.match(portalSource, /findById\(selectedId, \{ claimableOnly: true \}\)[\s\S]*?if \(!selectedItem\)[\s\S]*?return;[\s\S]*?createEstablishmentClaim\(/);
});

test("EXISTING_LEGACY_MANAGER_REMAINS_RENDERABLE", () => {
  assert.match(adminSource, /function ensureManagerEstablishmentOption\(managerData\)/);
  assert.match(adminSource, /data-existing-manager-option/);
  assert.match(adminSource, /item\.id === managerId && item\.establishmentId === establishmentId/);
  assert.match(adminSource, /establishmentName: existingManager\.establishmentName/);
  assert.match(adminSource, /openAddManagerModal\(selectedUserId\)[\s\S]*?populateManagerEstablishmentSelect\(''\)/);
});

test("catalog option rendering escapes CMS values without executable sinks", () => {
  assert.match(adminSource, /SEC\.attr\(item\.establishmentId\)/);
  assert.match(adminSource, /SEC\.html\(item\.establishmentName \+ ' \| ' \+ \(item\.category \|\| 'Sem categoria'\)\)/);
  assert.match(portalSource, /option\.value = item\.establishmentId/);
  assert.match(portalSource, /option\.textContent = item\.establishmentName \+ ' · ' \+ item\.category/);
  assert.doesNotMatch(catalogSource, /\beval\s*\(|\bnew\s+Function\s*\(/);
});
