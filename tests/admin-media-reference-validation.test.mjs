import { strict as assert } from "node:assert";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import vm from "node:vm";

const source = await readFile(
  new URL("../js/admin/modules/empreendimentos.js", import.meta.url),
  "utf8",
);

function createModuleHarness() {
  const context = vm.createContext({
    window: {},
    document: {
      getElementById() {
        return null;
      },
      addEventListener() {},
    },
    console,
    setTimeout,
    clearTimeout,
    Date,
    Math,
    JSON,
    Number,
    String,
    Object,
    Array,
    RegExp,
    Promise,
    Error,
  });
  context.window = context;
  context.window.AdminRegistry = null;
  vm.runInContext(source, context, { filename: "empreendimentos.js" });
  return context.window.AdminEstablishmentsModule;
}

const module = createModuleHarness();
const isValidMediaReference = module._isValidMediaReference;

test("isValidMediaReference aceita URL absoluta https", () => {
  assert.equal(isValidMediaReference("https://example.com/foto.webp"), true);
  assert.equal(isValidMediaReference("https://firebasestorage.googleapis.com/v0/b/x/o/foto.jpg?alt=media"), true);
});

test("isValidMediaReference aceita URL absoluta http (dev/local)", () => {
  assert.equal(isValidMediaReference("http://localhost:8765/foto.webp"), true);
  assert.equal(isValidMediaReference("http://127.0.0.1:8080/images/foto.jpg"), true);
});

test("isValidMediaReference aceita path root-relative", () => {
  assert.equal(isValidMediaReference("/images/empreendimentos/teste/foto.jpg"), true);
});

test("isValidMediaReference aceita path relativo legado", () => {
  assert.equal(isValidMediaReference("images/empreendimentos/teste/foto.jpg"), true);
  assert.equal(
    isValidMediaReference("images/empreendimentos/ribeiro-pesca/ribeiro-pesca-01.jpeg"),
    true,
  );
});

test("isValidMediaReference aceita paths relativos reais do dataset", () => {
  const legacyPaths = [
    "images/empreendimentos/ribeiro-pesca/ribeiro-pesca-09.png",
    "images/WEBP/NATAL-_17_.webp",
    "images/rotas/rota-polonesa.webp",
    "images/IGREJA_MATRIZ_FRONTAL.jpg",
  ];
  for (const value of legacyPaths) {
    assert.equal(isValidMediaReference(value), true, `deveria aceitar ${value}`);
  }
});

test("isValidMediaReference aceita vazio (campo opcional)", () => {
  assert.equal(isValidMediaReference(""), true);
  assert.equal(isValidMediaReference("   "), true);
  assert.equal(isValidMediaReference(null), true);
  assert.equal(isValidMediaReference(undefined), true);
});

test("isValidMediaReference rejeita esquemas perigosos", () => {
  assert.equal(isValidMediaReference("javascript:alert(1)"), false);
  assert.equal(isValidMediaReference("data:text/html,test"), false);
  assert.equal(isValidMediaReference("data:image/png;base64,AAAA"), false);
  assert.equal(isValidMediaReference("vbscript:msgbox(1)"), false);
  assert.equal(isValidMediaReference("file:///etc/passwd"), false);
});

test("isValidMediaReference rejeita whitespace e controle", () => {
  assert.equal(isValidMediaReference("images/empreendimentos/teste/foto.jpg\r\n"), true);
  assert.equal(isValidMediaReference("images/em preendimentos/foto.jpg"), false);
  assert.equal(isValidMediaReference("images/empreendimentos/foto.jpg\nX"), false);
  assert.equal(isValidMediaReference("images/empreendimentos/foto\u0000.jpg"), false);
});

test("isValidMediaReference rejeita string arbitraria sem referencia de midia", () => {
  assert.equal(isValidMediaReference("texto qualquer"), false);
  assert.equal(isValidMediaReference("images/empreendimentos/teste/arquivo"), false);
  assert.equal(isValidMediaReference("ftp://example.com/foto.jpg"), false);
  assert.equal(isValidMediaReference("//example.com/foto.jpg"), true);
});

test("LEGACY_FORM_RELATIVE_MEDIA_PATH_DOES_NOT_TRIGGER_NATIVE_URL_BLOCK", () => {
  assert.doesNotMatch(
    source,
    /field\(\s*"URL da imagem principal"\s*,\s*"est_mainImageUrl"\s*,\s*mainImage\.url\s*,\s*"url"\s*\)/,
  );
  assert.match(
    source,
    /field\(\s*"URL da imagem principal"\s*,\s*"est_mainImageUrl"\s*,\s*mainImage\.url\s*,\s*"text"\s*\)/,
  );
  assert.doesNotMatch(
    source,
    /field\(\s*"Video URL"\s*,\s*"est_videoUrl"\s*,\s*item\.media\.videoUrl\s*,\s*"url"\s*\)/,
  );
  assert.match(
    source,
    /field\(\s*"Video URL"\s*,\s*"est_videoUrl"\s*,\s*item\.media\.videoUrl\s*,\s*"text"\s*\)/,
  );
});

test("campos nao-midia preservam type=url", () => {
  assert.match(
    source,
    /id="est_website" type="url"/,
  );
  assert.match(
    source,
    /field\(\s*"Google Maps URL"\s*,\s*"est_mapsUrl"\s*,\s*item\.location\.mapsUrl\s*,\s*"url"\s*\)/,
  );
});

test("LEGACY_MEDIA_REFERENCE_PRESERVED_ON_SAVE", () => {
  const legacyPath = "images/empreendimentos/ribeiro-pesca/ribeiro-pesca-01.jpeg";
  const doc = {
    id: "ribeiro-pesca",
    slug: "ribeiro-pesca",
    name: "Ribeiro Pesca e Turismo",
    categoryId: "gastronomia",
    categoryLabel: "Gastronomia",
    content: { summary: "Resumo" },
    location: { coordinates: { lat: -25.87, lng: -50.38 } },
    media: {
      mainImage: { url: legacyPath },
      videoUrl: "",
    },
  };
  assert.equal(module._validateDocForSave(doc), "");
  assert.equal(doc.media.mainImage.url, legacyPath);
});

test("validateDocForSave rejeita referencia de midia invalida", () => {
  const base = {
    id: "x",
    slug: "x",
    name: "X",
    categoryId: "gastronomia",
    categoryLabel: "Gastronomia",
    content: { summary: "Resumo" },
    location: { coordinates: { lat: null, lng: null } },
    media: { mainImage: { url: "javascript:alert(1)" }, videoUrl: "" },
  };
  assert.match(module._validateDocForSave(base), /imagem principal invalida/i);

  const videoInvalid = {
    ...base,
    media: { mainImage: { url: "images/ok/foto.jpg" }, videoUrl: "data:text/html,x" },
  };
  assert.match(module._validateDocForSave(videoInvalid), /Video URL invalido/i);
});
