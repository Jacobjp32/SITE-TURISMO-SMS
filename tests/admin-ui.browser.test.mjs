// Testes de INTERFACE do painel administrativo (Rodada 1, 2026-10).
// Abre o painel real num Chrome headless (Chrome DevTools Protocol, sem
// dependências novas) contra o Firebase Emulator, com dados sintéticos.
//
//   npm run test:admin-ui
//
// Exige Auth/Firestore/Storage Emulator (o script npm usa emulators:exec) e um
// Chrome instalado (CHROME_PATH para outro caminho). Nunca toca produção.
import { strict as assert } from "node:assert";
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, test } from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const PROJECT_ID = "demo-turismo-sms-admin-finalization";
const PORT = 4191;
const ORIGIN = `http://127.0.0.1:${PORT}`;
const ADMIN = { uid: "ui-admin", email: "ui.admin@example.invalid", password: "UiLocal-2026!", nome: "Admin Interface" };
const EST_ID = "ui-publicado";
const NEWS_REL_ID = "ui-noticia-relativa";
const NEWS_PENDING_ID = "noticia_prefeitura_9001";
const MEDIA = [
  { id: "ui-media-1", title: "[UI] Foto 1", url: "images/ui-foto-1.jpg" },
  { id: "ui-media-2", title: "[UI] Foto 2", url: "images/ui-foto-2.jpg" },
];

const emulatorsReady = Boolean(process.env.FIRESTORE_EMULATOR_HOST && process.env.FIREBASE_AUTH_EMULATOR_HOST);
const CHROME = process.env.CHROME_PATH ||
  ["C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    "/usr/bin/google-chrome", "/usr/bin/chromium", "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"]
    .find((path) => existsSync(path));
const SKIP = !emulatorsReady ? "exige Auth/Firestore Emulator (npm run test:admin-ui)" : (!CHROME ? "Chrome não encontrado (CHROME_PATH)" : false);

let server;
let chrome;
let profileDir;
let ws;
let messageId = 0;
const pending = new Map();
let adminApp;

// ---------------- Dados sintéticos ----------------
const GROUPS = ["core", "content", "contact", "location", "media", "relationshipsRouteIds",
  "relationshipsRelatedPlaceIds", "relationshipsRelatedEventIds", "display", "seo", "review", "source", "lifecycle"];

function establishment(Timestamp) {
  const at = Timestamp.fromDate(new Date("2026-10-01T12:00:00Z"));
  return {
    id: EST_ID, slug: EST_ID, name: "[UI] Sítio Sintético", categoryId: "gastronomia", categoryLabel: "Gastronomia",
    status: "published",
    content: { summary: "Resumo original", description: "", longDescription: "", accessibility: "", openingHours: "", tags: [], notesInternal: "" },
    contact: { phone: "", whatsapp: "", email: "", website: "", instagram: "", facebook: "" },
    location: { address: "Rua Sintética, 1", neighborhood: "", city: "São Mateus do Sul", state: "PR", postalCode: "",
      coordinates: { lat: -25.87, lng: -50.38 }, mapsUrl: "", coordStatus: "ok", coordNote: "" },
    media: { mainImage: { url: "", path: "", alt: "", caption: "", credit: "", source: "", status: "active" }, gallery: [], videoUrl: "", sourceCredits: "" },
    relationships: { routeIds: [], relatedPlaceIds: [], relatedEventIds: [], legacyRoute: "", legacyRouteName: "" },
    display: { featured: false, priority: 10, mapVisible: true, claimable: true },
    seo: { title: "", description: "", canonicalPath: `/local?id=${EST_ID}` },
    publishing: { publishedAt: at, publishedBy: ADMIN.uid, archivedAt: null, archivedBy: "", archiveReason: "" },
    review: { lastAppliedRequestId: "", lastAppliedAt: null, lastAppliedBy: "", lastReviewNotes: "", lastMediaEditedAt: null, lastMediaEditedBy: "", mediaEditReason: "" },
    source: { origin: "admin", sourceFile: "", originalId: EST_ID, originalCategory: "", legacyIds: [], seededAt: null, sourceUpdatedAt: null },
    createdAt: at, createdBy: ADMIN.uid, updatedAt: at, updatedBy: ADMIN.uid,
    schemaVersion: 2, validatedGroups: Object.fromEntries(GROUPS.map((g) => [g, 2])), revision: 3,
  };
}

async function seed() {
  const requireFromFunctions = createRequire(join(ROOT, "functions/package.json"));
  const { initializeApp } = requireFromFunctions("firebase-admin/app");
  const { getAuth } = requireFromFunctions("firebase-admin/auth");
  const { getFirestore, Timestamp } = requireFromFunctions("firebase-admin/firestore");
  adminApp = initializeApp({ projectId: PROJECT_ID }, `admin-ui-${Date.now()}`);
  const auth = getAuth(adminApp);
  const db = getFirestore(adminApp);
  try { await auth.deleteUser(ADMIN.uid); } catch {}
  await auth.createUser({ uid: ADMIN.uid, email: ADMIN.email, password: ADMIN.password, displayName: ADMIN.nome, emailVerified: true });
  await db.collection("usuarios").doc(ADMIN.uid).set({ nome: ADMIN.nome, email: ADMIN.email, role: "admin", tipo: "admin", ativo: true });
  await db.collection("cms_establishments").doc(EST_ID).set(establishment(Timestamp));
  for (const m of MEDIA) {
    await db.collection("media_library").doc(m.id).set({ ...m, category: "geral", alt: m.title, storagePath: "", contentType: "image/jpeg", size: 0,
      createdAt: Timestamp.now(), updatedAt: Timestamp.now(), updatedBy: ADMIN.uid });
  }
  await db.collection("noticias").doc(NEWS_REL_ID).set({
    id: NEWS_REL_ID, titulo: "[UI] Notícia com imagem local", slug: NEWS_REL_ID, resumo: "Resumo", conteudo: "Texto",
    categoria: "Turismo", imagem: "images/noticia-local.jpg", galeria: [], videoUrl: "", linkOrigem: "",
    destaque: false, publicado: false, status: "rascunho", data: "2026-10-10", publishedAt: "2026-10-10",
    updatedAt: Timestamp.now(), updatedBy: ADMIN.uid,
  });
  await db.collection("noticias").doc(NEWS_PENDING_ID).set({
    id: NEWS_PENDING_ID, titulo: "[UI] Notícia no ar", slug: "ui-noticia-no-ar", resumo: "Resumo no ar", conteudo: "Texto no ar",
    categoria: "Cultura e Turismo", imagem: "", galeria: [], videoUrl: "", linkOrigem: "https://www.saomateusdosul.pr.gov.br/portal/noticias/0/3/9001/ui",
    destaque: false, publicado: true, status: "publicado", data: "2026-10-09", publishedAt: "2026-10-09",
    origemTipo: "prefeitura", origemId: "9001", origemHash: "hash-antigo", autor: "Prefeitura de São Mateus do Sul",
    atualizacaoPendente: true,
    atualizacaoOrigem: { titulo: "[UI] Notícia no ar — versão nova da Prefeitura", resumo: "Resumo novo", conteudo: "Texto novo", imagem: "",
      galeria: [], linkOrigem: "https://www.saomateusdosul.pr.gov.br/portal/noticias/0/3/9001/ui", origemHash: "hash-novo", autor: "Prefeitura de São Mateus do Sul" },
    updatedAt: Timestamp.now(), updatedBy: ADMIN.uid,
  });
  return db;
}

// ---------------- Chrome DevTools Protocol ----------------
function send(method, params = {}) {
  const id = ++messageId;
  ws.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}

async function evaluate(expression) {
  const result = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) throw new Error("Erro na página: " + (result.exceptionDetails.exception?.description || result.exceptionDetails.text));
  return result.result.value;
}

async function waitFor(expression, timeoutMs = 15000, label = expression) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try { if (await evaluate(`Boolean(${expression})`)) return; } catch {}
    await new Promise((r) => setTimeout(r, 100));
  }
  const context = await evaluate(`JSON.stringify({ avisos: [...document.querySelectorAll("[role=alert],[role=status]")].map((e) => e.textContent.trim()).filter(Boolean).slice(-3),
    dialogo: (document.querySelector("dialog[open]") || {}).textContent || "", hash: location.hash,
    modal: document.getElementById("contentModal") && !document.getElementById("contentModal").hidden })`).catch(() => "");
  throw new Error("Tempo esgotado esperando: " + label + " — estado: " + context);
}

async function clickSelector(selector) {
  // Avisos (toasts) ficam no canto inferior direito e podem cobrir o botão de
  // salvar do modal por alguns segundos (achado de UX registrado no relatório).
  await evaluate(`document.querySelectorAll(".adm-toast").forEach((t) => t.remove())`);
  // Rolagem instantânea + um quadro de espera: com rolagem suave as coordenadas
  // seriam medidas antes do fim da animação. Confere o alvo no ponto do clique.
  // Listas podem ser redesenhadas logo depois de aparecer: tenta por até ~3 s.
  let box = null;
  for (let attempt = 0; attempt < 15; attempt += 1) {
    box = await evaluate(`(async () => { const el = document.querySelector(${JSON.stringify(selector)}); if (!el) return null;
      el.scrollIntoView({ block: "center", behavior: "instant" });
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      const r = el.getBoundingClientRect(); const x = r.left + r.width / 2; const y = r.top + r.height / 2;
      const hit = document.elementFromPoint(x, y);
      return { x, y, onTarget: el.isConnected && !!hit && (hit === el || el.contains(hit)), hit: hit ? hit.tagName + "." + hit.className : null }; })()`);
    if (box && box.onTarget) break;
    await new Promise((r) => setTimeout(r, 200));
  }
  assert.ok(box, "elemento não encontrado: " + selector);
  assert.ok(box.onTarget, "outro elemento cobre o alvo " + selector + ": " + box.hit);
  for (const type of ["mousePressed", "mouseReleased"]) {
    await send("Input.dispatchMouseEvent", { type, x: box.x, y: box.y, button: "left", clickCount: 1 });
  }
}

async function clickButtonText(text, scope = "document") {
  const marker = `ui-click-${++messageId}`;
  const found = await evaluate(`(() => { const root = ${scope}; const el = [...root.querySelectorAll("button, a")].find((b) => b.offsetParent !== null && b.textContent.trim() === ${JSON.stringify(text)});
    if (!el) return false; el.setAttribute("data-ui-test", ${JSON.stringify(marker)}); return true; })()`);
  assert.ok(found, "botão não encontrado: " + text);
  await clickSelector(`[data-ui-test="${marker}"]`);
}

async function typeInto(selector, text) {
  await clickSelector(selector);
  await evaluate(`(() => { const el = document.querySelector(${JSON.stringify(selector)}); el.setSelectionRange && el.setSelectionRange(el.value.length, el.value.length); })()`);
  await send("Input.insertText", { text });
}

async function pressKey(key) {
  const codes = { Escape: 27, Tab: 9 };
  for (const type of ["keyDown", "keyUp"]) {
    await send("Input.dispatchKeyEvent", { type, key, code: key, windowsVirtualKeyCode: codes[key], nativeVirtualKeyCode: codes[key] });
  }
}

async function goTo(section) {
  await evaluate(`document.querySelector('.sidebar-menu a[href="#${section}"]').click()`);
}

async function confirmDialogOpen() {
  return evaluate(`(document.querySelector("dialog[open] h2") || {}).textContent || null`);
}

async function answerDialog(label) {
  await clickButtonText(label, `document.querySelector("dialog[open]")`);
  await waitFor(`!document.querySelector("dialog[open]")`, 5000, "diálogo fechar");
}

async function serverDoc(collection, id) {
  return evaluate(`firebase.firestore().collection(${JSON.stringify(collection)}).doc(${JSON.stringify(id)}).get({ source: "server" }).then((s) => s.data())`);
}

before(async () => {
  if (SKIP) return;
  await seed();
  server = spawn(process.execPath, [join(ROOT, "scripts/admin-painel-dev-server.mjs"), String(PORT)], { stdio: "ignore" });
  profileDir = mkdtempSync(join(tmpdir(), "admin-ui-chrome-"));
  chrome = spawn(CHROME, ["--headless=new", "--remote-debugging-port=0", `--user-data-dir=${profileDir}`,
    "--no-first-run", "--no-default-browser-check", "--window-size=1366,900", "about:blank"], { stdio: "ignore" });
  const portFile = join(profileDir, "DevToolsActivePort");
  const started = Date.now();
  while (!existsSync(portFile) && Date.now() - started < 20000) await new Promise((r) => setTimeout(r, 100));
  const debugPort = readFileSync(portFile, "utf8").split(/\r?\n/)[0];
  const targets = await (await fetch(`http://127.0.0.1:${debugPort}/json/list`)).json();
  const page = targets.find((t) => t.type === "page");
  ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) reject(new Error(message.error.message)); else resolve(message.result);
    }
  };
  await send("Page.enable");
  await send("Runtime.enable");
  await send("Page.navigate", { url: `${ORIGIN}/admin-firebase.html?emulator=1` });
  await waitFor(`document.getElementById("adminLoginForm")`, 20000, "tela de login");
  await waitFor(`window.__SMSFirebaseEmulatorsConnected === true`, 20000, "emuladores conectados");
  // Diagnóstico do login: sequência de eventos de autenticação e de sessão.
  await evaluate(`(() => { window.__uiLoginTrace = []; const t0 = performance.now(); const log = (m) => window.__uiLoginTrace.push(Math.round(performance.now() - t0) + "ms " + m);
    window.addEventListener("authStateChanged", () => { const u = window.currentUser; log("authStateChanged " + (u ? (u._profilePending ? "pendente" : (u.role || "?")) : "null")); });
    const set = localStorage.setItem.bind(localStorage), rem = localStorage.removeItem.bind(localStorage);
    localStorage.setItem = (k, v) => { if (/sms-admin/.test(k)) log("set " + k); return set(k, v); };
    localStorage.removeItem = (k) => { if (/sms-admin/.test(k)) log("remove " + k); return rem(k); };
    ["focus", "visibilitychange", "click", "keydown", "scroll"].forEach((n) => (n === "visibilitychange" ? document : window).addEventListener(n, () => log("evento " + n), true)); })()`);
  await evaluate(`(() => { document.getElementById("loginEmail").value = ${JSON.stringify(ADMIN.email)};
    document.getElementById("loginPass").value = ${JSON.stringify(ADMIN.password)};
    document.getElementById("adminLoginForm").requestSubmit(); })()`);
  try {
    await waitFor(`document.getElementById("dashboard").classList.contains("active")`, 20000, "painel após login");
  } catch (error) {
    const feedback = await evaluate(`(document.getElementById("loginFeedback") || {}).textContent || ""`).catch(() => "");
    const trace = await evaluate(`(window.__uiLoginTrace || []).join(" | ")`).catch(() => "");
    throw new Error(error.message + " — mensagem de login: " + feedback + " — sequência: " + trace);
  }
});

after(async () => {
  try { ws?.close(); } catch {}
  try { chrome?.kill(); } catch {}
  try { server?.kill(); } catch {}
  await new Promise((r) => setTimeout(r, 500));
  if (profileDir) try { rmSync(profileDir, { recursive: true, force: true }); } catch {}
  if (adminApp) { const { deleteApp } = createRequire(join(ROOT, "functions/package.json"))("firebase-admin/app"); await deleteApp(adminApp).catch(() => {}); }
});

async function openEstablishmentEditor() {
  await goTo("empreendimentos");
  await waitFor(`[...document.querySelectorAll("table tbody tr")].some((r) => r.textContent.includes(${JSON.stringify(EST_ID)}))`, 15000, "lista de empreendimentos");
  await evaluate(`(() => { const row = [...document.querySelectorAll("table tbody tr")].find((r) => r.textContent.includes(${JSON.stringify(EST_ID)}));
    [...row.querySelectorAll("button")].find((b) => b.textContent.trim() === "Editar").setAttribute("data-ui-edit", "1"); })()`);
  await clickSelector('[data-ui-edit="1"]');
  await waitFor(`document.getElementById("establishmentForm")`, 10000, "editor do empreendimento");
}

test("salvar empreendimento publicado: continua no ar durante todo o salvamento", { skip: SKIP }, async () => {
  await openEstablishmentEditor();
  await typeInto("#establishmentForm textarea", " [salvo pela interface]");
  // Monitor de leituras concorrentes (também simula carga de outras telas).
  await evaluate(`(() => { window.__uiPoll = []; window.__uiPolling = true; const ref = firebase.firestore().collection("cms_establishments").doc(${JSON.stringify(EST_ID)});
    (async () => { while (window.__uiPolling) { try { const d = (await ref.get({ source: "server" })).data(); window.__uiPoll.push(d.status); } catch (e) { window.__uiPoll.push("erro"); }
      await new Promise((r) => setTimeout(r, 50)); } })(); })()`);
  await clickButtonText("Salvar e publicar alteracoes");
  await waitFor(`!document.getElementById("establishmentForm")`, 20000, "editor fechar após salvar");
  await evaluate(`window.__uiPolling = false`);
  const statuses = await evaluate(`[...new Set(window.__uiPoll)]`);
  const doc = await serverDoc("cms_establishments", EST_ID);
  assert.deepEqual(statuses, ["published"], "o item nunca saiu do ar");
  assert.equal(doc.status, "published");
  assert.ok(doc.content.summary.endsWith("[salvo pela interface]"));
});

test("alteração não salva: confirmação ao trocar de seção; sem alteração navega direto", { skip: SKIP }, async () => {
  await openEstablishmentEditor();
  await clickSelector("#establishmentForm textarea");
  await goTo("noticias");
  await waitFor(`location.hash === "#noticias"`, 5000, "navegação sem alteração");
  assert.equal(await confirmDialogOpen(), null);

  await openEstablishmentEditor();
  await typeInto("#establishmentForm textarea", " rascunho");
  await goTo("eventos");
  await waitFor(`document.querySelector("dialog[open]")`, 5000, "diálogo de descarte");
  assert.equal(await confirmDialogOpen(), "Descartar alterações?");
  assert.equal(await evaluate("location.hash"), "#empreendimentos");
  await answerDialog("Continuar editando");
  assert.ok(await evaluate(`document.querySelector("#establishmentForm textarea").value.endsWith(" rascunho")`), "texto preservado");

  // Voltar do navegador também pergunta e mantém o endereço.
  await evaluate("history.back()");
  await waitFor(`document.querySelector("dialog[open]")`, 5000, "diálogo no Voltar");
  await answerDialog("Continuar editando");
  await waitFor(`location.hash === "#empreendimentos"`, 5000, "endereço restaurado");

  // beforeunload só bloqueia com alteração pendente.
  const blockedWhenDirty = await evaluate(`(() => { const e = new Event("beforeunload", { cancelable: true }); window.dispatchEvent(e); return e.defaultPrevented; })()`);
  assert.equal(blockedWhenDirty, true);

  await clickButtonText("Cancelar", `document.getElementById("establishmentForm")`);
  await waitFor(`document.querySelector("dialog[open]")`, 5000, "diálogo no Cancelar");
  await answerDialog("Descartar alterações");
  await waitFor(`!document.getElementById("establishmentForm")`, 5000, "editor fechado");
  const blockedWhenClean = await evaluate(`(() => { const e = new Event("beforeunload", { cancelable: true }); window.dispatchEvent(e); return e.defaultPrevented; })()`);
  assert.equal(blockedWhenClean, false);
  const doc = await serverDoc("cms_establishments", EST_ID);
  assert.ok(!doc.content.summary.endsWith(" rascunho"), "nada foi gravado ao descartar");
});

test("modal de edição: foco entra, Esc fecha sem alteração e pede confirmação com alteração", { skip: SKIP }, async () => {
  await goTo("eventos");
  await waitFor(`[...document.querySelectorAll("button")].some((b) => b.offsetParent && b.textContent.trim() === "Novo evento")`, 10000, "tela de eventos");
  await clickButtonText("Novo evento");
  await waitFor(`!document.getElementById("contentModal").hidden && document.getElementById("contentModal").contains(document.activeElement)`, 5000, "foco no modal");
  await pressKey("Escape");
  await waitFor(`document.getElementById("contentModal").hidden`, 5000, "Esc fecha sem alteração");
  assert.equal(await evaluate(`document.activeElement.textContent.trim()`), "Novo evento", "foco volta ao botão");

  await clickButtonText("Novo evento");
  await waitFor(`!document.getElementById("contentModal").hidden`, 5000, "modal aberto");
  await typeInto("#title", "[UI] Evento");
  await pressKey("Escape");
  await waitFor(`document.querySelector("dialog[open]")`, 5000, "diálogo no Esc");
  await answerDialog("Descartar alterações");
  await waitFor(`document.getElementById("contentModal").hidden`, 5000, "modal fechado após descartar");
});

test("capa do evento pela Biblioteca de mídia: escolher, remover, trocar, salvar e reabrir", { skip: SKIP }, async () => {
  await clickButtonText("Novo evento");
  await waitFor(`document.getElementById("eventMediaId")`, 5000, "editor de evento");
  await typeInto("#title", "[UI] Evento com capa");
  await evaluate(`(() => { const f = document.getElementById("eventCmsForm"); f.date.value = "2026-12-05"; f.date.dispatchEvent(new Event("input", { bubbles: true }));
    if (f.publicado) f.publicado.value = "false"; })()`);
  const select = async (id) => evaluate(`(() => { const s = document.getElementById("eventMediaId"); s.value = ${JSON.stringify(id)}; s.dispatchEvent(new Event("change", { bubbles: true })); return document.getElementById("mainImage").value; })()`);
  assert.equal(await select("ui-media-1"), "images/ui-foto-1.jpg");
  assert.equal(await select("ui-media-2"), "images/ui-foto-2.jpg", "trocar a capa");
  assert.equal(await evaluate(`document.getElementById("mainImage").checkValidity()`), true, "caminho interno é aceito");
  const invalid = await evaluate(`[...document.getElementById("eventCmsForm").elements].filter((el) => el.willValidate && !el.checkValidity()).map((el) => (el.name || el.id) + ": " + el.validationMessage)`);
  assert.deepEqual(invalid, [], "formulário válido antes de salvar");
  await clickButtonText("Salvar evento");
  await waitFor(`document.getElementById("contentModal").hidden || document.querySelector('#eventCmsForm[data-editor-mode="preview"]')`, 10000, "salvar evento");
  await waitFor(`document.getElementById("contentModal").hidden`, 10000, "modal fechado");
  const saved = await evaluate(`firebase.firestore().collection("eventos_aprovados").get({ source: "server" }).then((s) => s.docs.map((d) => d.data()).find((e) => (e.title || e.nome) === "[UI] Evento com capa"))`);
  assert.ok(saved, "evento gravado");
  assert.equal(saved.mainImage, "images/ui-foto-2.jpg");
});

test("notícia: caminho interno aceito, javascript: recusado, autor legível na lista", { skip: SKIP }, async () => {
  await goTo("noticias");
  await waitFor(`document.querySelector('#section-noticias [data-admin-action="content-open-news"][data-admin-target-id="${NEWS_REL_ID}"]')`, 10000, "lista de notícias");
  const author = await evaluate(`(() => { const row = document.querySelector('#section-noticias [data-admin-target-id="${NEWS_REL_ID}"]').closest("tr"); const span = row.querySelector('span[title^="ID da conta"]'); return span ? { text: span.textContent, title: span.title } : null; })()`);
  assert.deepEqual(author, { text: ADMIN.nome, title: "ID da conta: " + ADMIN.uid });

  await clickSelector(`#section-noticias [data-admin-action="content-open-news"][data-admin-target-id="${NEWS_REL_ID}"]`);
  await waitFor(`document.getElementById("newsCmsForm")`, 5000, "editor de notícia");
  assert.equal(await evaluate(`document.getElementById("imagem").checkValidity()`), true, "images/... é aceito");
  await evaluate(`(() => { const f = document.getElementById("linkOrigem"); f.value = "javascript:alert(1)"; f.dispatchEvent(new Event("input", { bubbles: true })); })()`);
  await clickButtonText("Salvar notícia");
  await waitFor(`[...document.querySelectorAll("[role=alert],[role=status]")].some((e) => e.textContent.includes("Link de origem"))`, 5000, "mensagem de link inválido");
  assert.equal((await serverDoc("noticias", NEWS_REL_ID)).linkOrigem, "", "nada gravado com protocolo inseguro");

  await evaluate(`(() => { const f = document.getElementById("linkOrigem"); f.value = "noticias.html"; f.dispatchEvent(new Event("input", { bubbles: true })); })()`);
  await clickButtonText("Salvar notícia");
  await waitFor(`document.getElementById("contentModal").hidden`, 10000, "notícia salva");
  const saved = await serverDoc("noticias", NEWS_REL_ID);
  assert.equal(saved.imagem, "images/noticia-local.jpg");
  assert.equal(saved.linkOrigem, "noticias.html");
});

test("importador: atualização da Prefeitura numa notícia no ar só entra após revisão", { skip: SKIP }, async () => {
  await goTo("noticias");
  await waitFor(`document.querySelector('#section-noticias [data-admin-target-id="${NEWS_PENDING_ID}"]')`, 10000, "notícia pendente na lista");
  const badge = await evaluate(`document.querySelector('#section-noticias [data-admin-target-id="${NEWS_PENDING_ID}"]').closest("tr").textContent.includes("Atualização da Prefeitura para revisar")`);
  assert.equal(badge, true);
  await clickSelector(`#section-noticias [data-admin-action="content-open-news"][data-admin-target-id="${NEWS_PENDING_ID}"]`);
  await waitFor(`document.querySelector("[data-origin-update]")`, 5000, "aviso de atualização");
  assert.equal((await serverDoc("noticias", NEWS_PENDING_ID)).titulo, "[UI] Notícia no ar", "abrir não muda nada");
  await clickButtonText("Usar o texto atualizado da Prefeitura");
  assert.equal(await evaluate(`document.getElementById("titulo").value`), "[UI] Notícia no ar — versão nova da Prefeitura");
  await clickButtonText("Salvar notícia");
  // Notícia no ar: salvar passa pela prévia antes de atualizar o portal.
  await waitFor(`[...document.querySelectorAll("#contentModal button")].some((b) => b.offsetParent && /Confirmar/.test(b.textContent))`, 8000, "prévia obrigatória");
  assert.equal((await serverDoc("noticias", NEWS_PENDING_ID)).titulo, "[UI] Notícia no ar", "nada gravado antes de confirmar");
  const confirmLabel = await evaluate(`[...document.querySelectorAll("#contentModal button")].find((b) => b.offsetParent && /Confirmar/.test(b.textContent)).textContent.trim()`);
  await clickButtonText(confirmLabel, `document.getElementById("contentModal")`);
  await waitFor(`document.getElementById("contentModal").hidden`, 10000, "notícia atualizada");
  const saved = await serverDoc("noticias", NEWS_PENDING_ID);
  assert.equal(saved.titulo, "[UI] Notícia no ar — versão nova da Prefeitura");
  assert.equal(saved.publicado, true);
  assert.equal(saved.atualizacaoPendente, false);
  assert.equal("atualizacaoOrigem" in saved, false);
  assert.equal(saved.origemHash, "hash-novo");
});
