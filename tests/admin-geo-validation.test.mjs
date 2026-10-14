// Validações do verificador de coordenadas do editor de empreendimentos.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";

const source = await readFile(new URL("../js/admin/admin-geo-picker.js", import.meta.url), "utf8");
const window = {};
runInNewContext(source, { window, document: {}, console });
const { validatePoint, parseMapsUrl } = window.AdminGeoPicker;

const REF = { lat: -25.874, lng: -50.383, raioKm: 45 };
const input = (value) => ({ value: String(value), validity: { badInput: false } });
// Objetos vêm de outro contexto (vm): normaliza antes de comparar.
const plain = (value) => JSON.parse(JSON.stringify(value));
const check = (lat, lng, neighbors) => plain(validatePoint({ lat: input(lat), lng: input(lng) }, REF, neighbors));

test("ponto válido no município não gera erro nem aviso", () => {
  const result = check("-25.867689", "-50.369225");
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.warnings, []);
  assert.deepEqual(result.point, { lat: -25.867689, lng: -50.369225 });
});

test("campos vazios são aceitos (sem coordenadas), um só campo não", () => {
  assert.deepEqual(check("", "").errors, []);
  assert.equal(check("-25.86", "").errors.length, 1);
});

test("entrada não numérica, fora dos limites e 0,0 bloqueiam", () => {
  const bad = plain(validatePoint({ lat: { value: "", validity: { badInput: true } }, lng: input("-50.3") }, REF));
  assert.match(bad.errors[0], /somente números/);
  assert.match(check("-125.1", "-50.3").errors[0], /Fora dos limites/);
  assert.match(check("0", "0").errors[0], /0, 0/);
});

test("latitude e longitude invertidas são detectadas com sugestão de correção", () => {
  const result = check("-50.369225", "-25.867689");
  assert.match(result.errors[0], /invertidas/);
  assert.deepEqual(result.swap, { lat: -25.867689, lng: -50.369225 });
});

test("sinal de menos ausente é detectado com sugestão", () => {
  const result = check("25.867689", "50.369225");
  assert.match(result.errors[0], /sinal de menos/);
  assert.deepEqual(result.swap, { lat: -25.867689, lng: -50.369225 });
});

test("fora da região é aviso (não bloqueia)", () => {
  const result = check("-25.4284", "-49.2733"); // Curitiba
  assert.deepEqual(result.errors, []);
  assert.match(result.warnings[0], /Fora da região/);
});

test("pouca precisão, centro da cidade e ponto copiado geram avisos", () => {
  assert.ok(check("-25.87", "-50.37").warnings.some((w) => /Pouca precisão/.test(w)));
  assert.ok(check("-25.874000", "-50.383000").warnings.some((w) => /centro da cidade/.test(w)));
  const copied = check("-25.867689", "-50.369225", [{ name: "Outro lugar", lat: -25.86769, lng: -50.36923 }]);
  assert.ok(copied.warnings.some((w) => /Outro lugar/.test(w)));
});

test("links completos do Google Maps continuam sendo lidos", () => {
  assert.deepEqual(plain(parseMapsUrl("https://www.google.com/maps/place/X/@-25.8676,-50.3692,17z/data=!3d-25.867689!4d-50.369225")), { lat: -25.867689, lng: -50.369225 });
  assert.equal(parseMapsUrl("https://maps.app.goo.gl/abc123"), null);
});
