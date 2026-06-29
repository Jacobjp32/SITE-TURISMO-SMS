/**
 * smoke-public-banners.mjs — Smoke test do carregador PÚBLICO (Bloco 4F).
 * Carrega js/public-banners.js num sandbox (vm) com window/document stubbados
 * (sem Firebase) e valida os contratos de exibição pública:
 *
 *   - published + type banner + página compatível → selecionado;
 *   - draft NÃO é selecionado;
 *   - archived NÃO é selecionado;
 *   - popup é IGNORADO nesta etapa (4G);
 *   - banner sem imagem NÃO é selecionado;
 *   - banner fora do período (startAt/endAt) NÃO é selecionado;
 *   - targetPages incompatível NÃO é selecionado;
 *   - placement 'all' casa com qualquer página;
 *   - placement 'custom' usa targetPages;
 *   - ordenação por priority desc (depois updatedAt desc);
 *   - limite MAX_BANNERS respeitado;
 *   - render escapa título malicioso (sem XSS);
 *   - CTA perigoso (javascript:) é ignorado;
 *   - CTA externo recebe rel="noopener noreferrer";
 *   - imagem tem onerror que oculta o card (não quebra layout);
 *   - renderInto oculta o slot quando não há banners.
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

// ---- Stubs mínimos de DOM/janela ----
const documentStub = {
    // readyState 'loading' garante que loadBanners NÃO roda (só anexa listener),
    // evitando qualquer import() dinâmico durante o smoke.
    readyState: "loading",
    addEventListener: () => {},
    getElementById: () => null,
    querySelector: () => null,
    head: null,
    createElement: () => ({ setAttribute: () => {} })
};
const windowStub = {
    location: { pathname: "/index.html" },
    addEventListener: () => {},
    console: { warn: () => {} }
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

console.log("Smoke test — Public Banners (Bloco 4F)");
console.log("");

check("PublicBanners exposto", !!PB);
check("_selectBanners exposto", PB && typeof PB._selectBanners === "function");
check("_renderBanner exposto", PB && typeof PB._renderBanner === "function");

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

// published + banner + home → selecionado em index.html.
check("published/banner/home é selecionado na home",
    PB._selectBanners([mk({})], "index.html").length === 1);

// draft não seleciona.
check("draft NÃO é selecionado",
    PB._selectBanners([mk({ status: "draft" })], "index.html").length === 0);

// archived não seleciona.
check("archived NÃO é selecionado",
    PB._selectBanners([mk({ status: "archived" })], "index.html").length === 0);

// popup é ignorado nesta etapa.
check("popup é IGNORADO (Bloco 4G)",
    PB._selectBanners([mk({ type: "popup" })], "index.html").length === 0);

// sem imagem não seleciona.
check("banner sem imageUrl NÃO é selecionado",
    PB._selectBanners([mk({ imageUrl: "" })], "index.html").length === 0);

// fora do período (já encerrado) não seleciona.
check("banner com endAt no passado NÃO é selecionado",
    PB._selectBanners([mk({ startAt: ts(NOW - 2 * DAY), endAt: ts(NOW - DAY) })], "index.html").length === 0);

// fora do período (ainda não começou) não seleciona.
check("banner com startAt no futuro NÃO é selecionado",
    PB._selectBanners([mk({ startAt: ts(NOW + DAY) })], "index.html").length === 0);

// dentro do período seleciona.
check("banner dentro do período é selecionado",
    PB._selectBanners([mk({ startAt: ts(NOW - DAY), endAt: ts(NOW + DAY) })], "index.html").length === 1);

// página incompatível: placement home não aparece em eventos.
check("placement 'home' NÃO aparece em eventos.html",
    PB._selectBanners([mk({})], "eventos.html").length === 0);

// placement 'all' casa com qualquer página.
check("placement 'all' casa com eventos.html",
    PB._selectBanners([mk({ placement: "all" })], "eventos.html").length === 1);

// placement nomeado eventos casa só com eventos.html.
check("placement 'eventos' casa com eventos.html",
    PB._selectBanners([mk({ placement: "eventos" })], "eventos.html").length === 1);

// placement 'custom' usa targetPages.
check("placement 'custom' + targetPages casa com a página alvo",
    PB._selectBanners([mk({ placement: "custom", targetPages: ["sabores.html"] })], "sabores.html").length === 1);
check("placement 'custom' + targetPages NÃO casa com página diferente",
    PB._selectBanners([mk({ placement: "custom", targetPages: ["sabores.html"] })], "eventos.html").length === 0);

// ordenação por prioridade desc.
const ordered = PB._selectBanners([
    mk({ title: "baixa", priority: 10 }),
    mk({ title: "alta", priority: 90 }),
    mk({ title: "media", priority: 50 })
], "index.html");
check("ordena por priority desc",
    ordered[0].title === "alta" && ordered[2].title === "baixa");

// limite MAX_BANNERS.
const many = [];
for (let i = 0; i < 10; i++) many.push(mk({ title: "b" + i, priority: i }));
check("respeita limite MAX_BANNERS",
    PB._selectBanners(many, "index.html").length === PB._MAX_BANNERS);

// ---- Render / segurança ----
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

// CTA perigoso é ignorado (sem <a>).
const evil = PB._renderBanner(mk({ ctaUrl: "javascript:alert(1)", ctaLabel: "clique" }));
check("CTA javascript: é ignorado (sem link)",
    evil.indexOf("public-banner__cta") === -1 && evil.indexOf("javascript:") === -1);

// safeUrl direto.
check("_safeUrl aceita https e rejeita javascript:",
    PB._safeUrl("https://ok.com/a.jpg", "") === "https://ok.com/a.jpg" &&
    PB._safeUrl("javascript:alert(1)", "") === "");

// renderInto oculta quando vazio.
const fakeMount = { innerHTML: "x", hidden: false };
const shown = PB._renderInto(fakeMount, []);
check("renderInto oculta o slot quando não há banners",
    shown === false && fakeMount.hidden === true && fakeMount.innerHTML === "");

console.log(failures === 0
    ? "\nTodos os checks passaram ✅"
    : "\n" + failures + " check(s) falharam ❌");
process.exit(failures === 0 ? 0 : 1);
