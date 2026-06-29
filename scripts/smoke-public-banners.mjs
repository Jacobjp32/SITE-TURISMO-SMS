/**
 * smoke-public-banners.mjs — Smoke test do carregador PÚBLICO (Blocos 4F + 4G).
 * Carrega js/public-banners.js num sandbox (vm) com window/document stubbados
 * (sem Firebase) e valida os contratos de exibição pública.
 *
 * Bloco 4F (banners):
 *   - published + type banner + página compatível → selecionado;
 *   - draft / archived NÃO são selecionados;
 *   - banner sem imagem NÃO é selecionado;
 *   - fora do período (startAt/endAt) NÃO é selecionado;
 *   - targetPages incompatível NÃO é selecionado;
 *   - placement 'all' / 'custom' funcionam;
 *   - ordenação por priority desc; limite MAX_BANNERS;
 *   - render escapa título malicioso; CTA perigoso ignorado; rel noopener.
 *
 * Bloco 4G (pop-ups):
 *   - popup published + página compatível → selecionado;
 *   - draft / archived NÃO renderizam;
 *   - fora do período NÃO renderiza;
 *   - targetPages incompatível NÃO renderiza;
 *   - showPopup injeta modal com role=dialog / aria-modal / aria-labelledby;
 *   - frequency once bloqueia segunda exibição;
 *   - frequency session bloqueia na mesma sessão;
 *   - frequency always permite exibir sempre;
 *   - CTA perigoso (javascript:) é ignorado no modal;
 *   - ESC fecha quando dismissible; NÃO fecha quando dismissible === false
 *     (mas o botão de fechar continua presente — nunca prende o usuário);
 *   - maxWidth é limitado a faixa segura; showDelayMs idem;
 *   - banner do 4F NÃO regrediu.
 *
 * Uso: node scripts/smoke-public-banners.mjs
 */
import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

let failures = 0;
function check(name, cond) {
    if (cond) {
        console.log("  ✓ " + name);
    } else {
        failures++;
        console.log("  ✗ " + name);
    }
}

// ---- DOM stub funcional (suficiente para banners + pop-up) ----
let activeElement = null;
const keydownHandlers = [];

function makeEl(tag) {
    return {
        tagName: (tag || "div").toUpperCase(),
        children: [],
        parentNode: null,
        style: {},
        attributes: {},
        _listeners: {},
        innerHTML: "",
        className: "",
        hidden: false,
        disabled: false,
        setAttribute(k, v) { this.attributes[k] = String(v); },
        getAttribute(k) { return this.attributes[k]; },
        addEventListener(t, fn) { (this._listeners[t] = this._listeners[t] || []).push(fn); },
        removeEventListener(t, fn) {
            const a = this._listeners[t];
            if (a) { const i = a.indexOf(fn); if (i >= 0) a.splice(i, 1); }
        },
        appendChild(c) { c.parentNode = this; this.children.push(c); return c; },
        removeChild(c) { const i = this.children.indexOf(c); if (i >= 0) this.children.splice(i, 1); c.parentNode = null; return c; },
        querySelector() { return null; },
        querySelectorAll() { return []; },
        focus() { activeElement = this; }
    };
}

const bodyStub = makeEl("body");

const documentStub = {
    // readyState 'loading' garante que loadBanners NÃO roda (só anexa listener),
    // evitando qualquer import() dinâmico durante o smoke.
    readyState: "loading",
    body: bodyStub,
    head: null,
    get activeElement() { return activeElement; },
    addEventListener(t, fn) { if (t === "keydown") keydownHandlers.push(fn); },
    removeEventListener(t, fn) { if (t === "keydown") { const i = keydownHandlers.indexOf(fn); if (i >= 0) keydownHandlers.splice(i, 1); } },
    getElementById: () => null,
    querySelector: () => null,
    createElement: (tag) => makeEl(tag)
};

function makeStorage() {
    const m = {};
    return {
        getItem: (k) => (Object.prototype.hasOwnProperty.call(m, k) ? m[k] : null),
        setItem: (k, v) => { m[k] = String(v); },
        removeItem: (k) => { delete m[k]; }
    };
}

const windowStub = {
    location: { pathname: "/index.html" },
    addEventListener: () => {},
    console: { warn: () => {} },
    localStorage: makeStorage(),
    sessionStorage: makeStorage(),
    setTimeout: (fn) => { /* no-op: testes usam showDelayMs = 0 */ return 0; }
    // window.SMSecurity ausente de propósito → exercita o fallback interno.
};

const sandbox = {
    window: windowStub,
    document: documentStub,
    console: { warn: () => {}, log: () => {}, error: () => {} }
};
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(read("js/public-banners.js"), sandbox, { filename: "js/public-banners.js" });

const PB = sandbox.window.PublicBanners;

console.log("Smoke test — Public Banners + Pop-ups (Blocos 4F + 4G)");
console.log("");

check("PublicBanners exposto", !!PB);
check("_selectBanners exposto", PB && typeof PB._selectBanners === "function");
check("_selectPopups exposto", PB && typeof PB._selectPopups === "function");
check("_renderBanner exposto", PB && typeof PB._renderBanner === "function");
check("_showPopup exposto", PB && typeof PB._showPopup === "function");

// ---- Fixtures ----
const ts = (ms) => ({ toMillis: () => ms, seconds: Math.floor(ms / 1000) });
const NOW = Date.now();
const DAY = 86400000;

const base = {
    title: "Campanha",
    type: "banner",
    status: "published",
    imageUrl: "https://exemplo.com/banner.jpg",
    imageAlt: "Alt",
    placement: "home",
    targetPages: [],
    priority: 50,
    updatedAt: ts(NOW)
};
const mk = (over) => Object.assign({}, base, over);

// ======================================================================
// Bloco 4F — banners (não pode regredir)
// ======================================================================

console.log("Bloco 4F — banners");

check("published/banner/home é selecionado na home",
    PB._selectBanners([mk({})], "index.html").length === 1);

check("draft NÃO é selecionado",
    PB._selectBanners([mk({ status: "draft" })], "index.html").length === 0);

check("archived NÃO é selecionado",
    PB._selectBanners([mk({ status: "archived" })], "index.html").length === 0);

check("popup NÃO entra na lista de banners",
    PB._selectBanners([mk({ type: "popup" })], "index.html").length === 0);

check("banner sem imageUrl NÃO é selecionado",
    PB._selectBanners([mk({ imageUrl: "" })], "index.html").length === 0);

check("banner com endAt no passado NÃO é selecionado",
    PB._selectBanners([mk({ startAt: ts(NOW - 2 * DAY), endAt: ts(NOW - DAY) })], "index.html").length === 0);

check("banner com startAt no futuro NÃO é selecionado",
    PB._selectBanners([mk({ startAt: ts(NOW + DAY) })], "index.html").length === 0);

check("banner dentro do período é selecionado",
    PB._selectBanners([mk({ startAt: ts(NOW - DAY), endAt: ts(NOW + DAY) })], "index.html").length === 1);

check("placement 'home' NÃO aparece em eventos.html",
    PB._selectBanners([mk({})], "eventos.html").length === 0);

check("placement 'all' casa com eventos.html",
    PB._selectBanners([mk({ placement: "all" })], "eventos.html").length === 1);

check("placement 'eventos' casa com eventos.html",
    PB._selectBanners([mk({ placement: "eventos" })], "eventos.html").length === 1);

check("placement 'custom' + targetPages casa com a página alvo",
    PB._selectBanners([mk({ placement: "custom", targetPages: ["sabores.html"] })], "sabores.html").length === 1);
check("placement 'custom' + targetPages NÃO casa com página diferente",
    PB._selectBanners([mk({ placement: "custom", targetPages: ["sabores.html"] })], "eventos.html").length === 0);

const ordered = PB._selectBanners([
    mk({ title: "baixa", priority: 10 }),
    mk({ title: "alta", priority: 90 }),
    mk({ title: "media", priority: 50 })
], "index.html");
check("ordena por priority desc",
    ordered[0].title === "alta" && ordered[2].title === "baixa");

const many = [];
for (let i = 0; i < 10; i++) many.push(mk({ title: "b" + i, priority: i }));
check("respeita limite MAX_BANNERS",
    PB._selectBanners(many, "index.html").length === PB._MAX_BANNERS);

const xss = PB._renderBanner(mk({
    title: '<img src=x onerror=alert(1)>',
    description: "desc <script>",
    ctaUrl: "https://exemplo.com/ir",
    ctaLabel: "Saiba mais",
    ctaTarget: "_blank"
}));
check("render escapa título malicioso (sem <img onerror direto do título)",
    xss.indexOf("<img src=x onerror=alert(1)>") === -1 && xss.indexOf("&lt;img") !== -1);
check("render inclui a imagem do banner",
    xss.indexOf("https://exemplo.com/banner.jpg") !== -1);
check("render inclui CTA https com rel=noopener noreferrer",
    xss.indexOf('href="https://exemplo.com/ir"') !== -1 &&
    xss.indexOf('rel="noopener noreferrer"') !== -1);
check("img tem onerror que oculta o card",
    xss.indexOf("onerror=") !== -1 && xss.indexOf("display") !== -1);

const evil = PB._renderBanner(mk({ ctaUrl: "javascript:alert(1)", ctaLabel: "clique" }));
check("CTA javascript: é ignorado (sem link)",
    evil.indexOf("public-banner__cta") === -1 && evil.indexOf("javascript:") === -1);

check("_safeUrl aceita https e rejeita javascript:",
    PB._safeUrl("https://ok.com/a.jpg", "") === "https://ok.com/a.jpg" &&
    PB._safeUrl("javascript:alert(1)", "") === "");

const fakeMount = { innerHTML: "x", hidden: false };
const shown = PB._renderInto(fakeMount, []);
check("renderInto oculta o slot quando não há banners",
    shown === false && fakeMount.hidden === true && fakeMount.innerHTML === "");

// ======================================================================
// Bloco 4G — pop-ups
// ======================================================================

console.log("");
console.log("Bloco 4G — pop-ups");

const pop = (over) => mk(Object.assign({ type: "popup" }, over));

// ---- Seleção ----
check("popup published/home é selecionado na home",
    PB._selectPopups([pop({})], "index.html").length === 1);
check("popup draft NÃO é selecionado",
    PB._selectPopups([pop({ status: "draft" })], "index.html").length === 0);
check("popup archived NÃO é selecionado",
    PB._selectPopups([pop({ status: "archived" })], "index.html").length === 0);
check("banner NÃO entra na lista de pop-ups",
    PB._selectPopups([mk({})], "index.html").length === 0);
check("popup fora do período NÃO é selecionado",
    PB._selectPopups([pop({ endAt: ts(NOW - DAY) })], "index.html").length === 0);
check("popup com targetPages incompatível NÃO é selecionado",
    PB._selectPopups([pop({ placement: "custom", targetPages: ["sabores.html"] })], "eventos.html").length === 0);
check("popup sem imageUrl NÃO é selecionado",
    PB._selectPopups([pop({ imageUrl: "" })], "index.html").length === 0);

// ---- Markup / segurança ----
const markup = PB._buildPopupMarkup(pop({
    title: "Promo <b>",
    description: "texto <script>",
    ctaUrl: "https://exemplo.com/ir",
    ctaLabel: "Quero ver",
    ctaTarget: "_blank"
}), "t1");
check("modal tem role=dialog / aria-modal / aria-labelledby",
    markup.indexOf('role="dialog"') !== -1 &&
    markup.indexOf('aria-modal="true"') !== -1 &&
    markup.indexOf('aria-labelledby="public-popup-title-t1"') !== -1);
check("modal tem botão de fechar acessível",
    markup.indexOf('data-popup-close="1"') !== -1 && markup.indexOf('aria-label="Fechar"') !== -1);
check("modal escapa título/descrição maliciosos",
    markup.indexOf("Promo <b>") === -1 && markup.indexOf("texto <script>") === -1 &&
    markup.indexOf("&lt;") !== -1);
check("modal inclui CTA https com rel=noopener noreferrer",
    markup.indexOf('href="https://exemplo.com/ir"') !== -1 &&
    markup.indexOf('rel="noopener noreferrer"') !== -1);

const evilPop = PB._buildPopupMarkup(pop({ ctaUrl: "javascript:alert(1)", ctaLabel: "x" }), "t2");
check("modal ignora CTA javascript: (sem link)",
    evilPop.indexOf("public-popup__cta") === -1 && evilPop.indexOf("javascript:") === -1);

// ---- maxWidth / delay (limites seguros) ----
check("maxWidth abaixo do mínimo é elevado ao mínimo (240)",
    PB._clampMaxWidth(100) === 240);
check("maxWidth acima do máximo é limitado (960)",
    PB._clampMaxWidth(5000) === 960);
check("maxWidth inválido usa padrão",
    PB._clampMaxWidth("abc") === 520);
check("showDelayMs absurdo é limitado a 60000",
    PB._clampDelay(99999999) === 60000);
check("showDelayMs negativo vira 0",
    PB._clampDelay(-5) === 0);

// ---- Frequência ----
check("frequency always permite sempre",
    PB._frequencyAllows(pop({ __id: "f-always", frequency: "always" })) === true &&
    PB._frequencyAllows(pop({ __id: "f-always", frequency: "always" })) === true);

const onceItem = pop({ __id: "f-once", frequency: "once" });
const onceAllowed1 = PB._frequencyAllows(onceItem);
PB._markShown(onceItem);
const onceAllowed2 = PB._frequencyAllows(onceItem);
check("frequency once bloqueia a segunda exibição",
    onceAllowed1 === true && onceAllowed2 === false);

const sessItem = pop({ __id: "f-sess", frequency: "oncePerSession" });
const sessAllowed1 = PB._frequencyAllows(sessItem);
PB._markShown(sessItem);
const sessAllowed2 = PB._frequencyAllows(sessItem);
check("frequency session bloqueia na mesma sessão",
    sessAllowed1 === true && sessAllowed2 === false);

check("frequency desconhecida cai para 'session' (conservador)",
    PB._normalizeFrequency("qualquer") === "session");

// ---- Exibição real (DOM stub) + ESC ----
PB._resetPopupLoadFlag();
const ov1 = PB._showPopup(pop({ __id: "p-show", frequency: "always", dismissible: true }));
check("showPopup injeta o overlay no body",
    !!ov1 && bodyStub.children.indexOf(ov1) !== -1);
check("overlay contém o modal (role=dialog)",
    ov1.innerHTML.indexOf('role="dialog"') !== -1);

// ESC fecha quando dismissible.
keydownHandlers.slice().forEach((h) => h({ key: "Escape", preventDefault() {} }));
check("ESC fecha o modal quando dismissible",
    bodyStub.children.indexOf(ov1) === -1);

// dismissible === false: ESC NÃO fecha, mas botão de fechar existe.
PB._resetPopupLoadFlag();
const ov2 = PB._showPopup(pop({ __id: "p-nodismiss", frequency: "always", dismissible: false }));
keydownHandlers.slice().forEach((h) => h({ key: "Escape", preventDefault() {} }));
check("ESC NÃO fecha quando dismissible === false",
    bodyStub.children.indexOf(ov2) !== -1);
check("modal não-dismissível ainda tem botão de fechar (não prende o usuário)",
    ov2.innerHTML.indexOf('data-popup-close="1"') !== -1);
// Fecha programaticamente para limpar.
if (ov2.__close) ov2.__close();

// só 1 pop-up por carregamento.
PB._resetPopupLoadFlag();
const first = PB._showPopup(pop({ __id: "p-a", frequency: "always" }));
const second = PB._showPopup(pop({ __id: "p-b", frequency: "always" }));
check("no máximo 1 pop-up por carregamento",
    !!first && second === false);
if (first && first.__close) first.__close();

// maybeShowPopup pula draft e mostra published.
PB._resetPopupLoadFlag();
check("maybeShowPopup ignora quando só há popup draft",
    PB._maybeShowPopup(PB._selectPopups([pop({ status: "draft" })], "index.html")) === false);

PB._resetPopupLoadFlag();
check("maybeShowPopup exibe um popup published apto",
    PB._maybeShowPopup(PB._selectPopups([pop({ __id: "p-ok", frequency: "always" })], "index.html")) === true);

console.log("");
console.log(failures === 0
    ? "Todos os checks passaram ✅"
    : failures + " check(s) falharam ❌");
process.exit(failures === 0 ? 0 : 1);
