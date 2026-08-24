import { strict as assert } from "node:assert";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import { test } from "node:test";

const routesSource = await readFile(new URL("../js/cms-public-routes-adapter.js", import.meta.url), "utf8");
const establishmentsSource = await readFile(new URL("../js/cms-public-establishments-adapter.js", import.meta.url), "utf8");
const dataSource = await readFile(new URL("../js/data/turismo-data.js", import.meta.url), "utf8");
const searchSource = await readFile(new URL("../js/search-index.js", import.meta.url), "utf8");
const statsSource = await readFile(new URL("../js/site-stats.js", import.meta.url), "utf8");

function routeData(id = "rota-a", overrides = {}) {
  return {
    id,
    slug: id,
    name: `Rota ${id}`,
    category: "Cultura",
    description: "Descricao publica",
    color: "#123456",
    icon: "R",
    cover: { url: "images/rota.webp" },
    tags: ["cultura"],
    status: "published",
    displayOrder: 10,
    ...overrides,
  };
}

function browserContext(overrides = {}) {
  const listeners = {};
  const window = {
    TURISMO_ROTAS: [{ id: "static-route", nome: "Static", categoria: "Cultura", descricao: "Fallback", imagem: "images/static.webp" }],
    setTimeout,
    clearTimeout,
    console,
    location: { search: "", pathname: "/" },
    localStorage: { getItem: () => null },
    addEventListener(type, listener) { (listeners[type] ||= []).push(listener); },
    dispatchEvent(event) { (listeners[event.type] || []).forEach((listener) => listener(event)); },
    CustomEvent: class CustomEvent { constructor(type, init) { this.type = type; this.detail = init?.detail; } },
    ...overrides,
  };
  const document = {
    readyState: "complete",
    addEventListener() {},
    querySelectorAll() { return []; },
  };
  window.window = window;
  window.document = document;
  const context = vm.createContext({ window, document, console, URLSearchParams, setTimeout, clearTimeout, Promise, Date, isFinite });
  return { context, window };
}

function loadRoutesAdapter() {
  const env = browserContext();
  vm.runInContext(routesSource, env.context);
  return env;
}

test("Firestore published routes resulta em SUCCESS", () => {
  const { window } = loadRoutesAdapter();
  const result = window.CMSPublicRoutesAdapter.resolveDocuments([{ id: "rota-a", data: routeData() }]);
  assert.equal(result.state, "SUCCESS");
  assert.equal(result.count, 1);
  assert.equal(result.source, "firestore");
});

test("zero published routes resulta em AUTHORITATIVE_EMPTY sem fallback", () => {
  const { window } = loadRoutesAdapter();
  const result = window.CMSPublicRoutesAdapter.resolveDocuments([]);
  assert.equal(result.state, "AUTHORITATIVE_EMPTY");
  assert.equal(result.source, "firestore");
  assert.equal(result.error, null);
});

test("permission-denied resulta em TECHNICAL_FAILURE", async () => {
  const { window } = loadRoutesAdapter();
  const result = await window.CMSPublicRoutesAdapter.readPublished({ force: true, reader: () => Promise.reject({ code: "permission-denied" }) });
  assert.equal(result.state, "TECHNICAL_FAILURE");
  assert.equal(result.error.code, "permission-denied");
});

test("timeout resulta em TECHNICAL_FAILURE", async () => {
  const { window } = loadRoutesAdapter();
  const result = await window.CMSPublicRoutesAdapter.readPublished({ force: true, timeoutMs: 5, reader: () => new Promise(() => {}) });
  assert.equal(result.state, "TECHNICAL_FAILURE");
  assert.equal(result.error.code, "timeout");
});

test("falha técnica usa fallback estático", async () => {
  const { window } = loadRoutesAdapter();
  const result = await window.CMSPublicRoutesAdapter.readPublished({ force: true, reader: () => Promise.reject(new Error("network unavailable")) });
  assert.equal(result.source, "static-fallback");
  assert.equal(result.items.length, 1);
});

test("normalização de rota preserva o shape público e URL canônica", () => {
  const { window } = loadRoutesAdapter();
  const item = window.CMSPublicRoutesAdapter.normalizeDocument(routeData(), "rota-a");
  assert.equal(item.nome, "Rota rota-a");
  assert.equal(item.url, "/mapa-turistico?grupo=roteiros&rota=rota-a");
  assert.deepEqual(Array.from(item.galeria), ["images/rota.webp"]);
});

test("rota malformed não quebra o portal e aciona fallback técnico", () => {
  const { window } = loadRoutesAdapter();
  const result = window.CMSPublicRoutesAdapter.resolveDocuments([{ id: "rota-a", data: routeData("rota-a", { cover: {} }) }]);
  assert.equal(result.state, "TECHNICAL_FAILURE");
  assert.equal(result.fallbackReason, "malformed-route");
});

test("IDs ou slugs duplicados falham fechado", () => {
  const { window } = loadRoutesAdapter();
  const result = window.CMSPublicRoutesAdapter.resolveDocuments([
    { id: "rota-a", data: routeData("rota-a", { slug: "slug-igual" }) },
    { id: "rota-b", data: routeData("rota-b", { slug: "slug-igual" }) },
  ]);
  assert.equal(result.state, "TECHNICAL_FAILURE");
  assert.equal(result.fallbackReason, "duplicate-route-identity");
});

test("adapter CMS preserva routeIds, ordem, multirrota e desconhecidos", () => {
  const { context, window } = browserContext();
  vm.runInContext(establishmentsSource, context);
  const item = window.CMSPublicEstablishmentsAdapter.normalizeDocument({
    id: "est-a", slug: "est-a", name: "Estabelecimento A", status: "published",
    categoryId: "atrativo", categoryLabel: "Atrativo",
    relationships: { routeIds: ["rota-b", "rota-a", 10, "rota-desconhecida"] },
  }, "est-a");
  assert.deepEqual(Array.from(item.relationships.routeIds), ["rota-b", "rota-a", "rota-desconhecida"]);
  assert.deepEqual(Array.from(item.routeIds), ["rota-b", "rota-a", "rota-desconhecida"]);
});

async function loadDataWithResults(routesResult, establishmentsResult) {
  const env = browserContext({
    TURISMO_PONTOS: [{ id: "static-point", nome: "Ponto", categoria: "Cultura" }],
    TURISMO_ROTAS: [{ id: "static-route", nome: "Static", categoria: "Cultura" }],
    TURISMO_HOSPEDAGENS: [], TURISMO_RESTAURANTES: [], TURISMO_EVENTOS: [], TURISMO_INFORMACOES_ESSENCIAIS: [],
    CMSPublicRoutesAdapter: { readPublished: async () => routesResult },
    CMSPublicEstablishmentsAdapter: { readPublished: async () => establishmentsResult },
  });
  vm.runInContext(dataSource, env.context);
  await env.window.TURISMO_DATA_READY;
  return env;
}

test("filtro canônico preserva multirrota e falha seguro para rota desconhecida", async () => {
  const env = await loadDataWithResults(
    { state: "SUCCESS", source: "firestore", authoritativeCount: 2, items: [{ id: "rota-a", slug: "a" }, { id: "rota-b", slug: "b" }] },
    { state: "SUCCESS", source: "firestore", count: 1, items: [] },
  );
  const utils = env.window.TURISMO_PUBLIC_DATA_UTILS;
  const establishment = { routeIds: ["rota-a", "rota-b"] };
  assert.equal(utils.resolveRouteCanonical(env.window.TURISMO_DATA.rotas, "b"), "rota-b");
  assert.equal(utils.itemMatchesRoute(establishment, "rota-a"), true);
  assert.equal(utils.itemMatchesRoute(establishment, "rota-b"), true);
  assert.equal(utils.resolveRouteCanonical(env.window.TURISMO_DATA.rotas, "desconhecida"), null);
});

test("SUCCESS dinâmico não mistura rotas estáticas stale", async () => {
  const env = await loadDataWithResults(
    { state: "SUCCESS", source: "firestore", authoritativeCount: 1, items: [{ id: "rota-a", slug: "rota-a", nome: "Rota A", categoria: "Cultura" }] },
    { state: "SUCCESS", source: "firestore", count: 0, items: [] },
  );
  assert.deepEqual(Array.from(env.window.TURISMO_DATA.rotas, (item) => item.id), ["rota-a"]);
  assert.equal(env.window.PUBLIC_CUTOVER_ALLOWED, true);
});

test("AUTHORITATIVE_EMPTY mantém somente static-precutover e bloqueia cutover", async () => {
  const env = await loadDataWithResults(
    { state: "AUTHORITATIVE_EMPTY", source: "firestore", authoritativeCount: 0, count: 0, items: [] },
    { state: "SUCCESS", source: "firestore", count: 1, items: [] },
  );
  assert.equal(env.window.TURISMO_DATA_SOURCE_META.routesSource, "static-precutover");
  assert.equal(env.window.TURISMO_DATA_SOURCE_META.routesCount, 0);
  assert.equal(env.window.TURISMO_DATA.rotas.length, 1);
  assert.equal(env.window.PUBLIC_CUTOVER_ALLOWED, false);
});

test("busca reconstrói URL de rota dinâmica com slug", () => {
  const env = browserContext({ TURISMO_DATA: { pontos: [], rotas: [{ id: "rota-a", slug: "slug-a", nome: "Rota A", categoria: "Cultura", tags: [] }], hospedagens: [], restaurantes: [], eventos: [], informacoesEssenciais: [] } });
  vm.runInContext(searchSource, env.context);
  const entry = env.window.TURISMO_SEARCH_INDEX.find((item) => item.title === "Rota A");
  assert.equal(entry.url, "/mapa-turistico?grupo=roteiros&rota=slug-a");
});

test("SITE_STATS usa a contagem dinâmica de rotas", () => {
  const env = browserContext({ TURISMO_DATA_HELPERS: { getStats: () => ({ totalItems: 1, withCoordinates: 0, categoryCount: 1, routes: 3 }) } });
  vm.runInContext(statsSource, env.context);
  assert.equal(env.window.SITE_STATS.getStats().routes, 3);
});

test("adapters públicos não contêm APIs de escrita Firestore ou Storage", () => {
  const forbidden = /\b(addDoc|setDoc|updateDoc|deleteDoc|writeBatch|runTransaction|uploadBytes|deleteObject)\s*\(/;
  assert.equal(forbidden.test(routesSource), false);
  assert.equal(forbidden.test(establishmentsSource), false);
});

test("query de rotas contém filtro published e não usa leitura ampla compat", () => {
  assert.match(routesSource, /where\("status",\s*"==",\s*STATUS\)/);
  assert.doesNotMatch(routesSource, /collection\([^)]*rotas[^)]*\)\.get\s*\(/);
});
