import { strict as assert } from "node:assert";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import vm from "node:vm";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

const [helperSource, rendererSource, mapSource, localSource, mapHtml, navSource, adminSource, adminHtml] = await Promise.all([
  read("js/image-attribution.js"),
  read("js/public-establishments-renderer.js"),
  read("js/mapa-turistico.js"),
  read("local.html"),
  read("mapa-turistico.html"),
  read("js/nav-shared.js"),
  read("js/admin/modules/empreendimentos.js"),
  read("admin-firebase.html"),
]);

function loadHelper(lang = "pt") {
  const window = {
    localStorage: { getItem: (key) => (key === "sms-lang" ? lang : null) },
    navigator: { language: "pt-BR" },
  };
  vm.runInNewContext(helperSource, { window, URL, globalThis: window });
  return window.SMSImageAttribution;
}

const TAQUARAL = "images/empreendimentos/ervateira-taquaral/ervateira-taquaral-01.webp";
const BALDO = "images/empreendimentos/ervateira-baldo/ervateira-baldo-01.webp";

test("registro: cada arquivo licenciado existe no repositório e tem licença, fonte e links https", () => {
  const A = loadHelper();
  const keys = Object.keys(A.REGISTRY);
  assert.ok(keys.length >= 6);
  for (const key of keys) {
    assert.ok(existsSync(new URL(key, root)), `arquivo ausente: ${key}`);
    const attr = A.resolve(key);
    assert.ok(attr.registered && attr.author, key);
    assert.match(attr.sourceUrl, /^https:\/\//, key);
    assert.match(attr.licenseUrl, /^https:\/\//, key);
    assert.ok(attr.license, key);
    assert.ok(attr.modifications, key);
  }
});

test("Commons: autor é a pessoa, não a plataforma; licença CC BY-SA 4.0 com link oficial", () => {
  const A = loadHelper();
  const attr = A.resolve(TAQUARAL);
  assert.equal(attr.author, "Simplus Menegati");
  assert.equal(attr.sourceName, "Wikimedia Commons");
  assert.match(attr.sourceUrl, /^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
  assert.equal(attr.licenseShort, "CC BY-SA 4.0");
  assert.equal(attr.licenseUrl, "https://creativecommons.org/licenses/by-sa/4.0/");
  assert.equal(A.text(attr, "pt"), "Foto: Simplus Menegati · CC BY-SA 4.0");
});

test("AEN: crédito Gilson Abreu/AEN, fonte e termos de reprodução linkados", () => {
  const A = loadHelper();
  const full = A.html(A.resolve(BALDO), "pt", "full");
  assert.match(full, /^Foto: Gilson Abreu\/AEN · Fonte: <a href="https:\/\/www\.parana\.pr\.gov\.br\/aen\/Noticia\/[^"]+"[^>]*>Agência Estadual de Notícias do Paraná \(AEN\)<\/a>/);
  assert.match(full, /Licença: <a href="https:\/\/www\.parana\.pr\.gov\.br\/servicos\/[^"]+" target="_blank" rel="license noopener noreferrer"[^>]*>Reprodução permitida com indicação da fonte<\/a>/);
  assert.match(full, /Modificações: redimensionada e convertida para WebP$/);
  // Forma curta (ficha/mapa): rótulos breves, nome completo preservado no aria-label.
  const short = A.html(A.resolve(BALDO), "pt");
  assert.match(short, />AEN<\/a>/);
  assert.match(short, /aria-label="Agência Estadual de Notícias do Paraná \(AEN\) \(abre em nova aba\)"/);
  assert.match(short, />uso com crédito<\/a>/);
  assert.match(short, /aria-label="Reprodução permitida com indicação da fonte \(abre em nova aba\)"/);
  assert.ok(short.length < full.length);
});

test("quatro idiomas nos rótulos e nos textos localizados", () => {
  const A = loadHelper();
  const attr = A.resolve(BALDO);
  assert.match(A.html(attr, "en", "full"), /^Photo: Gilson Abreu\/AEN · Source: .* · License: .*Reproduction permitted with source credit.* · Changes: resized/);
  assert.match(A.html(attr, "es", "full"), /^Foto: .* · Fuente: .* · Licencia: .*Reproducción permitida.* · Modificaciones: /);
  assert.match(A.html(attr, "pl", "full"), /^Zdjęcie: .* · Źródło: .* · Licencja: .*Powielanie dozwolone.* · Zmiany: /);
  assert.match(A.html(attr, "en"), />use with credit<\/a>/);
  assert.equal(A.text(A.resolve(TAQUARAL), "pl"), "Zdjęcie: Simplus Menegati · CC BY-SA 4.0");
  // Idioma da página vem de sms-lang quando não informado.
  assert.match(loadHelper("en").text(A.resolve(TAQUARAL)), /^Photo: /);
});

test("chave normaliza origem do portal, barra inicial, ./ e query", () => {
  const A = loadHelper();
  for (const url of [
    `https://turismo.saomateusdosul.pr.gov.br/${TAQUARAL}?v=1`,
    `/${TAQUARAL}`,
    `./${TAQUARAL}#x`,
  ]) {
    assert.equal(A.normalizeKey(url), TAQUARAL);
    assert.ok(A.lookup(url));
  }
  assert.equal(A.lookup("https://outro.site/" + TAQUARAL), null);
});

test("crédito do CMS sem registro: só texto, prefixo traduzido, sem links", () => {
  const A = loadHelper();
  const attr = A.resolve({ url: "https://example.test/x.webp", credit: "Foto: Fulana de Tal" });
  assert.equal(attr.registered, false);
  assert.equal(A.text(attr, "en"), "Photo: Fulana de Tal");
  assert.equal(A.html(attr, "pt"), "Foto: Fulana de Tal");
});

test("cadastro sem crédito continua sem nada a exibir", () => {
  const A = loadHelper();
  assert.equal(A.resolve({ url: "images/x.webp", credit: "" }), null);
  assert.equal(A.text(null), "");
  assert.equal(A.html(null), "");
  assert.equal(A.forItemImage({ media: { mainImage: { url: "images/x.webp", credit: "" } } }, "images/x.webp"), null);
  assert.equal(A.forItemImage({}, ""), null);
});

test("metadados não confiáveis são escapados e links não-https são descartados", () => {
  const A = loadHelper();
  const attr = A.resolve({ url: "a.webp", credit: '<img src=x onerror=alert(1)>"' });
  const html = A.html(attr, "pt");
  assert.ok(!html.includes("<img"));
  assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;&quot;/);
  assert.equal(A.safeHttps("javascript:alert(1)"), "");
  assert.equal(A.safeHttps("http://exemplo.test"), "");
  assert.equal(A.safeHttps("https://user:pw@exemplo.test"), "");
  assert.equal(A.safeHttps('https://ok.test/a"onmouseover=x'), "");
});

test("capa automática pela 1ª foto da galeria também recebe atribuição", () => {
  const A = loadHelper();
  const item = { media: { mainImage: { url: "" }, gallery: [{ url: TAQUARAL, credit: "" }] } };
  const attr = A.forItemImage(item, TAQUARAL);
  assert.equal(attr.author, "Simplus Menegati");
  // Crédito do CMS na galeria é usado quando o arquivo não está no registro.
  const cms = { media: { gallery: [{ url: "https://cdn.test/g.webp", credit: "Acervo SMS" }] } };
  assert.equal(A.text(A.forItemImage(cms, "https://cdn.test/g.webp"), "pt"), "Foto: Acervo SMS");
});

function loadRenderer() {
  const window = {
    localStorage: { getItem: () => "pt" },
    navigator: { language: "pt-BR" },
    addEventListener() {},
  };
  const styles = [];
  const document = {
    readyState: "loading",
    head: { appendChild: (node) => styles.push(node) },
    createElement: () => ({ setAttribute() {}, textContent: "" }),
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener() {},
  };
  const context = { window, document, URL, globalThis: window };
  vm.runInNewContext(helperSource, context);
  vm.runInNewContext(rendererSource, context);
  return { renderer: window.PublicEstablishmentsRenderer, styles };
}

test("cards: crédito discreto (texto, sem link aninhado) inclusive com capa vinda da galeria", () => {
  const { renderer, styles } = loadRenderer();
  const target = { innerHTML: "", children: [], setAttribute() {} };
  renderer.renderers.attractions(target, {
    pontos: [
      { id: "taquaral", nome: "Ervateira Taquaral", media: { mainImage: { url: "" }, gallery: [{ url: TAQUARAL }] }, galeria: [TAQUARAL] },
      { id: "sem-credito", nome: "Sem Crédito", imagem: "images/sem-credito.webp" },
    ],
  });
  assert.match(target.innerHTML, /<small class="card-photo-credit">Foto: Simplus Menegati · CC BY-SA 4\.0<\/small>/);
  assert.equal((target.innerHTML.match(/card-photo-credit/g) || []).length, 1);
  assert.ok(!/<a [^>]*href="https:\/\/creativecommons/.test(target.innerHTML), "card é link: não pode ter link aninhado");
  assert.equal(styles.length, 1);
});

test("ficha, mapa e painel carregam e usam o módulo de atribuição", () => {
  assert.match(localSource, /js\/image-attribution\.js\?v=/);
  assert.match(localSource, /ATTR\.forItemImage\(local, local\.imagem\)/);
  assert.match(localSource, /<figcaption class="foto-credito">/);
  assert.match(localSource, /id="lb-credit"/);
  assert.match(mapHtml, /js\/image-attribution\.js\?v=[^"]+" defer><\/script>\s*<script src="js\/mapa-turistico\.js/);
  for (const call of ["getPhotoCreditHtml(item, item.imagem)", "getPhotoCreditCompact(item, item.imagem)"]) {
    assert.ok(mapSource.includes(call), call);
  }
  assert.match(mapSource, /media: item\.media && typeof item\.media === "object"/);
  assert.match(navSource, /'js\/image-attribution\.js',\s*'js\/public-establishments-renderer\.js'/);
  assert.match(adminHtml, /js\/image-attribution\.js\?v=[^"]+"><\/script>\s*<script src="js\/admin\/modules\/empreendimentos\.js/);
  assert.match(adminSource, /registeredLicenseHtml\(image\.url\)/);
  assert.match(adminSource, /galleryCreditSummary\(item\.media\.gallery\)/);
});
