import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { runInNewContext } from "node:vm";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

const VISIBLE_MODULES = [
  { id: "home", source: "js/admin/modules/dashboard.js", idPattern: /SECTION_ID\s*=\s*["']home["']/ },
  { id: "aprovacoes", dispatch: /section\s*===\s*["']aprovacoes["'][\s\S]*?loadPendingData\(\)/, implementation: /(?:async\s+)?function\s+loadPendingData\s*\(/ },
  { id: "vinculos", dispatch: /section\s*===\s*["']vinculos["'][\s\S]*?loadEstablishmentClaims\(\)/, implementation: /(?:async\s+)?function\s+loadEstablishmentClaims\s*\(/ },
  { id: "gerenciar-vinculos", dispatch: /section\s*===\s*["']gerenciar-vinculos["'][\s\S]*?loadEstablishmentManagers\(\)/, implementation: /(?:async\s+)?function\s+loadEstablishmentManagers\s*\(/ },
  { id: "usuarios", dispatch: /section\s*===\s*["']usuarios["'][\s\S]*?loadUsers\(\)/, implementation: /(?:async\s+)?function\s+loadUsers\s*\(/ },
  { id: "eventos", dispatch: /section\s*===\s*["']eventos["'][\s\S]*?loadApprovedEvents\(\)/, implementation: /(?:async\s+)?function\s+loadApprovedEvents\s*\(/ },
  { id: "noticias", dispatch: /section\s*===\s*["']noticias["'][\s\S]*?AdminContentCMS\.loadNews\(\)/, implementationSource: "js/admin-content-cms.js", implementation: /loadNews\s*:/ },
  { id: "midia", dispatch: /section\s*===\s*["']midia["'][\s\S]*?AdminContentCMS\.loadMedia\(\)/, implementationSource: "js/admin-content-cms.js", implementation: /loadMedia\s*:/ },
  { id: "banners", source: "js/admin/modules/banners.js", idPattern: /SECTION_ID\s*=\s*["']banners["']/ },
  { id: "empreendimentos", source: "js/admin/modules/empreendimentos.js", idPattern: /SECTION_ID\s*=\s*["']empreendimentos["']/ },
  { id: "rotas", source: "js/admin/modules/rotas.js", idPattern: /SECTION_ID\s*=\s*["']rotas["']/ },
  { id: "galeria", source: "js/admin/modules/gallery.js", idPattern: /id\s*:\s*["']galeria["']/ },
  { id: "sazonal", source: "js/admin/modules/site-config.js", idPattern: /register\(["']sazonal["']/ },
  { id: "mascote", source: "js/admin/modules/site-config.js", idPattern: /register\(["']mascote["']/ },
  { id: "audit-logs", source: "js/admin/modules/audit-logs.js", idPattern: /id\s*:\s*["']audit-logs["']/ }
];

function validateVisibleModuleContract(html, sources) {
  const visibleIds = [...html.matchAll(/<a[^>]+data-section="([^"]+)"[^>]*>/g)].map((match) => match[1]);
  assert.deepEqual(visibleIds, VISIBLE_MODULES.map(({ id }) => id));
  assert.equal(new Set(visibleIds).size, visibleIds.length);
  assert.equal(/Em preparação|sidebar-master-tag|>Master</i.test(html), false);

  const placeholder = sources.get("js/admin/modules/placeholder.js");
  assert.match(placeholder, /list: function \(\) \{ return \[\]; \}/);

  for (const item of VISIBLE_MODULES) {
    const containerMatches = html.match(new RegExp(`id="section-${item.id}"`, "g")) || [];
    assert.equal(containerMatches.length, 1, `${item.id} deve ter exatamente um container`);
    assert.doesNotMatch(placeholder, new RegExp(`["']${item.id}["']`));

    if (item.source) {
      const source = sources.get(item.source);
      assert.ok(source, `fonte ausente para ${item.id}`);
      assert.doesNotMatch(source, /isPlaceholder\s*:\s*true/);
      assert.match(source, item.idPattern);
      assert.match(source, /AdminRegistry\.register\(/);
      assert.ok(html.includes(`src="${item.source}`), `${item.source} deve ser carregado pelo Admin`);
      assert.equal(evaluateRegisteredIds(sources.get("js/admin/admin-registry.js"), source, item.source).includes(item.id), true, `${item.id} deve registrar em runtime`);
      continue;
    }

    assert.match(html, item.dispatch);
    assert.match(sources.get(item.implementationSource || "admin-firebase.html"), item.implementation);
  }
}

function evaluateRegisteredIds(registrySource, source, filename) {
  const document = {
    addEventListener() {},
    getElementById() { return null; },
    querySelector() { return null; },
    querySelectorAll() { return []; }
  };
  const window = {
    AdminRoutesHelpers: {},
    addEventListener() {},
    setTimeout() { return 0; },
    clearTimeout() {},
    document
  };
  window.window = window;
  const context = {
    window,
    document,
    console: { log() {}, warn() {}, error() {} },
    setTimeout() { return 0; },
    clearTimeout() {}
  };
  runInNewContext(registrySource, context, { filename: "js/admin/admin-registry.js" });
  runInNewContext(source, context, { filename });
  return window.AdminRegistry.list().map(({ id }) => id);
}

test("sidebar final não expõe seção provisória, genérica ou master", async () => {
  const html = await read("admin-firebase.html");
  const visible = [...html.matchAll(/<a[^>]+data-section="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)];
  const ids = visible.map((match) => match[1]);
  assert.deepEqual(ids, VISIBLE_MODULES.map(({ id }) => id));
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(ids.includes("configuracoes"), false);
  assert.equal(/Em preparação|sidebar-master-tag|>Master</i.test(html), false);
  for (const id of ids) assert.match(html, new RegExp(`id="section-${id}"`));
});

test("os quinze itens visíveis têm container, dispatch e implementação reais", async () => {
  const sourcePaths = new Set([
    "admin-firebase.html",
    "js/admin-content-cms.js",
    "js/admin/admin-registry.js",
    "js/admin/modules/placeholder.js",
    ...VISIBLE_MODULES.flatMap(({ source }) => source ? [source] : [])
  ]);
  const entries = await Promise.all([...sourcePaths].map(async (path) => [path, await read(path)]));
  const sources = new Map(entries);
  const html = sources.get("admin-firebase.html");

  validateVisibleModuleContract(html, sources);

  assert.throws(() => validateVisibleModuleContract(html.replace('id="section-home"', 'id="section-home-missing"'), sources));
  assert.throws(() => validateVisibleModuleContract(html.replace('data-section="home"', 'data-section="galeria"'), sources));

  const missingRegistration = new Map(sources);
  missingRegistration.set("js/admin/modules/dashboard.js", sources.get("js/admin/modules/dashboard.js").replace("AdminRegistry.register(", "AdminRegistry.missing("));
  assert.throws(() => validateVisibleModuleContract(html, missingRegistration));

  const placeholderGallery = new Map(sources);
  placeholderGallery.set("js/admin/modules/gallery.js", `${sources.get("js/admin/modules/gallery.js")}\nconst injected = { isPlaceholder: true };`);
  assert.throws(() => validateVisibleModuleContract(html, placeholderGallery));
});

test("CSP de produção não libera endpoints locais", async () => {
  const html = await read("admin-firebase.html");
  const csp = html.match(/<meta\s+http-equiv="Content-Security-Policy"\s+content="([^"]+)"/i)?.[1];
  assert.ok(csp, "meta CSP deve existir");
  assert.doesNotMatch(csp, /localhost|127\.0\.0\.1|0\.0\.0\.0|\[?::1\]?/i);
});

test("consumidores e rotas preservam contratos congelados", async () => {
  const [gallery, season, mascot, eventData, eventAdapter] = await Promise.all([
    read("js/public-gallery.js"), read("js/season-theme.js"), read("js/tourism-mascot.js"),
    read("js/data/eventos.js"), read("js/event-occurrence-adapter.js")
  ]);
  assert.match(gallery, /published === true/);
  assert.match(gallery, /section\.sec/);
  assert.match(season, /if \(!config \|\| config\.enabled === false\) return legacyMode/);
  assert.match(mascot, /config\.enabled !== false/);
  assert.match(eventData, /AgroSamas/);
  assert.match(eventData, /rua-do-mathe/);
  assert.match(eventData, /-25\.878/);
  assert.match(eventData, /-50\.385/);
  assert.match(eventAdapter, /event/i);
});
