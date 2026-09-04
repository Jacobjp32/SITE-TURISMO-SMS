import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

function browserHarness(extra = {}) {
  const document = {
    readyState: "loading",
    addEventListener() {},
    getElementById() { return null; },
    querySelector() { return null; },
    querySelectorAll() { return []; },
    documentElement: { dataset: {}, classList: { toggle() {} } },
  };
  const window = { addEventListener() {}, location: { pathname: "/" }, ...extra };
  return vm.createContext({ window, document, console, Intl, Date, Image: function () {}, setTimeout() {}, CustomEvent: function () {} });
}

test("galeria pública filtra não publicados e ordena deterministicamente", async () => {
  const context = browserHarness();
  vm.runInContext(await read("js/public-gallery.js"), context);
  const normalized = context.window.SMSPublicGallery.normalize([
    { id: "b", published: true, mediaType: "image", url: "b", displayOrder: 2 },
    { id: "hidden", published: false, mediaType: "image", url: "x", displayOrder: 0 },
    { id: "a", published: true, mediaType: "image", url: "a", displayOrder: 1 },
    { id: "video", published: true, mediaType: "video", url: "v", displayOrder: 0 },
  ]);
  assert.deepEqual(Array.from(normalized, (item) => item.id), ["a", "b"]);
});

test("fallback estático conserva cinco vídeos", async () => {
  const html = await read("galeria.html");
  assert.equal((html.match(/<video\b/g) || []).length, 2);
  assert.equal((html.match(/youtube\.com\/embed\//g) || []).length, 3);
  assert.match(await read("js/public-gallery.js"), /catch \(error\) \{\s*return false;/);
});

test("controle sazonal preserva legado quando ausente ou desativado e aceita manual válido", async () => {
  const context = browserHarness();
  vm.runInContext(await read("js/season-theme.js"), context);
  const resolve = context.window.SMSSeasonTheme.resolveAdminMode;
  assert.equal(resolve(null, "winter"), "winter");
  assert.equal(resolve({ enabled: false, mode: "MANUAL", seasonOverride: "summer" }, "winter"), "winter");
  assert.equal(resolve({ enabled: true, mode: "AUTO", seasonOverride: null }, "winter"), "auto");
  assert.equal(resolve({ enabled: true, mode: "MANUAL", seasonOverride: "spring" }, "winter"), "spring");
  assert.equal(resolve({ enabled: true, mode: "MANUAL", seasonOverride: "invalid" }, "winter"), "winter");
});

test("controle do mascote preserva legado e bloqueia somente enabled=false", async () => {
  const context = browserHarness();
  vm.runInContext(await read("js/tourism-mascot.js"), context);
  const resolve = context.window.SMSMascotConfig.resolveEnabled;
  assert.equal(resolve(null), true);
  assert.equal(resolve({ enabled: true }), true);
  assert.equal(resolve({ enabled: false }), false);
});
