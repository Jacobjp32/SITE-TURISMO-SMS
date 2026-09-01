import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path) => readFileSync(join(root, path), "utf8");
const hub = read("mes-polones.html");
const nav = read("js/nav-shared.js");
const search = read("js/search-index.js");
const sitemap = read("sitemap.xml");
const home = read("index.html");
const htmlFilesWithNav = [
  "eventos.html", "galeria.html", "index.html", "local.html", "mapa-3d.html",
  "mapa-completo.html", "mapa-turistico.html", "mes-polones-2026.html", "mes-polones.html",
  "noticia.html", "noticias.html", "o-que-fazer.html", "onde-ficar.html", "para-o-trade.html",
  "portal-usuario.html", "reservas.html", "rotas-completas.html", "roteiro-ia.html",
  "sabores.html", "transparencia.html"
];

function localImageSources(html) {
  return [...html.matchAll(/<img\b[^>]*\bsrc="([^"]+)"[^>]*>/gi)]
    .map((match) => match[1])
    .filter((src) => !/^(?:https?:|data:|blob:)/i.test(src));
}

function internalAnchors(html) {
  return [...html.matchAll(/\bhref="#([^"]+)"/gi)].map((match) => match[1]);
}

test("hub permanente existe com SEO e estrutura sem redirecionamento", () => {
  assert.ok(existsSync(join(root, "mes-polones.html")));
  assert.match(hub, /<link rel="canonical" href="https:\/\/turismo\.saomateusdosul\.pr\.gov\.br\/mes-polones">/);
  assert.equal((hub.match(/<h1\b/gi) || []).length, 1);
  assert.doesNotMatch(hub, /http-equiv="refresh"|location\.(?:href|replace).*mes-polones-2026/i);
});

test("menu leva Capital Polonesa ao hub e remove destino antigo", () => {
  assert.match(nav, /href="\/mes-polones"[^>]*>Capital Polonesa do Paraná<\/a>/);
  assert.doesNotMatch(nav, /href="\/mapa-turistico\?categoria=Cultura"[^>]*>Capital Polonesa do Paraná<\/a>/);
});

test("busca prioriza hub, preserva 2026 e aponta Capital Polonesa ao hub", () => {
  const permanent = search.indexOf('makeEntry("Mês Polonês — Tradycje Polskie"');
  const archive = search.indexOf('makeEntry("32º Mês Polonês 2026"');
  assert.ok(permanent >= 0);
  assert.ok(archive > permanent);
  assert.match(search, /makeEntry\("Capital Polonesa do Paraná"[^\n]+"\/mes-polones"/);
});

test("sitemap contém hub permanente e arquivo 2026", () => {
  assert.match(sitemap, /<loc>https:\/\/turismo\.saomateusdosul\.pr\.gov\.br\/mes-polones<\/loc>/);
  assert.match(sitemap, /<loc>https:\/\/turismo\.saomateusdosul\.pr\.gov\.br\/mes-polones-2026<\/loc>/);
});

test("hub contém retrospectiva, educação, destaques e arquivo", () => {
  assert.match(hub, /id="edicao-2026"/);
  assert.match(hub, /Rede Municipal de Ensino/);
  assert.match(hub, /A tradição também foi para a sala de aula/);
  assert.match(hub, /7ª Polskie Smaki/);
  assert.match(hub, /34ª Festa Polonesa/);
  assert.match(hub, /Água Branca/);
  assert.match(hub, /href="\/mes-polones-2026(?:#polskie-smaki)?"/);
  assert.match(hub, /href="https:\/\/www\.saomateusdosul\.pr\.gov\.br\/portal\/noticias\/0\/3\/3630\//);
});

test("imagens são locais, existem e usam carregamento adequado", () => {
  const images = localImageSources(hub);
  assert.ok(images.length >= 12);
  for (const src of images) assert.ok(existsSync(join(root, src)), `imagem ausente: ${src}`);
  assert.equal((hub.match(/<img\b[^>]*loading="lazy"/gi) || []).length, images.length - 1);
  assert.doesNotMatch(hub, /<img\b[^>]*src="https?:/i);
});

test("links de âncora internos possuem destinos", () => {
  for (const id of internalAnchors(hub)) {
    const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    assert.match(hub, new RegExp(`\\bid="${escaped}"`));
  }
});

test("home preserva policy e não restaura destaque temporário", () => {
  assert.match(home, /js\/home-eventos\.js\?v=events-home-policy-25bebd00/);
  assert.doesNotMatch(home, /id="mes-polones-feature"|temporary-polish-month-feature/i);
});

test("consumidores usam geração coerente de cache", () => {
  for (const path of htmlFilesWithNav) {
    assert.match(read(path), /js\/nav-shared\.js\?v=site-polish-hub-20260901/, path);
  }
  assert.match(read("index.html"), /js\/search-index\.js\?v=site-polish-hub-20260901/);
  assert.match(nav, /js\/search-index\.js[\s\S]*?site-polish-hub-20260901/);
  for (const path of htmlFilesWithNav) {
    assert.doesNotMatch(read(path), /js\/nav-shared\.js\?v=(?!site-polish-hub-20260901)/, path);
  }
});
