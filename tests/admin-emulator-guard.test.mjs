// Garante que o modo de demonstração (?emulator=1 + contas fictícias) não alcança o
// Firebase real: ativação restrita a localhost, projeto demo-*, App Check só fora do
// modo demo, seed recusando projetos reais e rótulo de ambiente fiel à conexão.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { runInNewContext } from "node:vm";
import { fileURLToPath } from "node:url";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8").then((text) => text.replace(/\r\n/g, "\n"));

const authSource = await read("js/firebase-auth.js");
const navSource = await read("js/admin/admin-nav.js");
const seedPath = fileURLToPath(new URL("scripts/admin-painel-demo-seed.mjs", root));
const devServerSource = await read("scripts/admin-painel-dev-server.mjs");

const expressionMatch = authSource.match(/const localEmulatorRequested = ([\s\S]*?);\n/);

function emulatorRequested(href) {
  const url = new URL(href);
  return runInNewContext(expressionMatch[1], {
    window: { location: { hostname: url.hostname, search: url.search } },
    URLSearchParams,
  });
}

test("modo emulador só liga em localhost/127.0.0.1 com ?emulator=1", () => {
  assert.ok(expressionMatch, "expressão localEmulatorRequested não encontrada em firebase-auth.js");
  assert.equal(emulatorRequested("http://127.0.0.1:4173/admin-firebase.html?emulator=1"), true);
  assert.equal(emulatorRequested("http://localhost:4173/admin-firebase.html?emulator=1"), true);
  for (const href of [
    "https://turismo.saomateusdosul.pr.gov.br/admin-firebase.html?emulator=1",
    "https://localhost.example.com/admin-firebase.html?emulator=1",
    "https://127.0.0.1.nip.io/admin-firebase.html?emulator=1",
    "http://127.0.0.1:4173/admin-firebase.html",
    "http://127.0.0.1:4173/admin-firebase.html?emulator=true",
  ]) {
    assert.equal(emulatorRequested(href), false, href);
  }
});

test("modo emulador troca para projeto demo-* e emuladores em loopback", () => {
  const branch = authSource.slice(authSource.indexOf("const runtimeFirebaseConfig"), authSource.indexOf("window.firebaseAuth = { auth };"));
  assert.match(branch, /projectId: 'demo-turismo-sms-admin-finalization'/);
  assert.match(branch, /db\.settings\(\{ host: '127\.0\.0\.1:8080'/);
  assert.match(branch, /auth\.useEmulator\('http:\/\/127\.0\.0\.1:9099'/);
  assert.match(branch, /useEmulator\('127\.0\.0\.1', 9199\)/);
  // App Check (proteção do projeto real) é pulado somente no modo demo.
  assert.match(branch, /if \(!localEmulatorRequested\) \{\n\s*const \{ initCompatAppCheck \}/);
  // Nenhuma credencial/conta de demonstração no runtime do site.
  assert.doesNotMatch(authSource, /example\.invalid|AdminLocal-/);
});

test("seed de demonstração recusa projeto real e ausência de emuladores", () => {
  const cases = [
    {},
    { GCLOUD_PROJECT: "turismo-sms", FIRESTORE_EMULATOR_HOST: "127.0.0.1:8080", FIREBASE_AUTH_EMULATOR_HOST: "127.0.0.1:9099" },
    { GCLOUD_PROJECT: "demo-turismo-sms-admin-finalization", FIREBASE_AUTH_EMULATOR_HOST: "127.0.0.1:9099" },
    { GCLOUD_PROJECT: "demo-turismo-sms-admin-finalization", FIRESTORE_EMULATOR_HOST: "127.0.0.1:8080" },
  ];
  for (const extra of cases) {
    const env = { PATH: process.env.PATH, SystemRoot: process.env.SystemRoot, ...extra };
    const run = spawnSync(process.execPath, [seedPath, "nao-existe.json"], { env, encoding: "utf8", timeout: 20000 });
    assert.notEqual(run.status, 0, JSON.stringify(extra));
    assert.match(run.stderr, /exige projeto demo-\* e Auth\/Firestore Emulator/, JSON.stringify(extra));
  }
});

test("servidor de desenvolvimento escuta só em loopback", () => {
  assert.match(devServerSource, /\.listen\(PORT, "127\.0\.0\.1"/);
});

test("rótulo de ambiente segue a conexão real, não só o parâmetro da URL", () => {
  const fn = navSource.slice(navSource.indexOf("function renderEnvironment()"), navSource.indexOf("// Atalhos do Painel"));
  assert.match(fn, /window\.__SMSFirebaseEmulatorsConnected === true/);
  assert.match(fn, /"Dados reais"/);
  const make = (hostname, search, connected) => {
    const tag = { hidden: true, textContent: "", title: "", classList: { set: new Set(), add(...c) { c.forEach((x) => this.set.add(x)); }, remove(...c) { c.forEach((x) => this.set.delete(x)); } } };
    const window = { location: { hostname, search }, __SMSFirebaseEmulatorsConnected: connected };
    runInNewContext(fn + "\nrenderEnvironment();", { window, URLSearchParams, $: () => tag });
    return tag;
  };
  const prodWithParam = make("turismo.saomateusdosul.pr.gov.br", "?emulator=1", undefined);
  assert.equal(prodWithParam.hidden, false);
  assert.equal(prodWithParam.textContent, "Dados reais");
  assert.equal(make("turismo.saomateusdosul.pr.gov.br", "", undefined).hidden, true);
  assert.equal(make("127.0.0.1", "?emulator=1", true).textContent, "Ambiente local · dados de teste");
  assert.equal(make("127.0.0.1", "", undefined).textContent, "Dados reais");
});
