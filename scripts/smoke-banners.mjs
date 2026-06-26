/**
 * smoke-banners.mjs — Smoke test do módulo Admin Banners (Bloco 4C).
 * Carrega admin-registry.js + banners.js + placeholder.js num sandbox (vm)
 * com window/document stubbados (sem Firebase) e valida os contratos do bloco:
 *   - AdminBannersModule existe e registra no AdminRegistry;
 *   - substitui o placeholder de id `banners` (placeholder cede);
 *   - demais placeholders continuam registrados;
 *   - render() não quebra sem Firebase;
 *   - validação de rascunho funciona (título/tipo obrigatórios, URL, datas);
 *   - buildPayload nasce sempre como `draft` (nunca `published`);
 *   - código não tenta upload (.put/uploadImage) nem delete (.delete).
 *
 * Uso: node scripts/smoke-banners.mjs
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
const elements = {};
function makeEl(id) {
    return { id, nodeType: 1, innerHTML: "", value: "", checked: false, hidden: true,
        querySelector: () => null, textContent: "" };
}
const documentStub = {
    getElementById: (id) => (elements[id] || (elements[id] = makeEl(id))),
    addEventListener: () => {},
    readyState: "complete"
};
const windowStub = {
    addEventListener: () => {},
    setTimeout: (fn) => { try { fn(); } catch (e) {} return 0; },
    currentUser: { uid: "admin-uid-test" }
};

const sandbox = {
    window: windowStub,
    document: documentStub,
    console: { warn: () => {}, log: () => {}, error: () => {} }
};
sandbox.globalThis = sandbox;
vm.createContext(sandbox);

function run(rel) {
    vm.runInContext(read(rel), sandbox, { filename: rel });
}

// Ordem real do admin-firebase.html: registry → banners → placeholder.
run("js/admin/admin-registry.js");
run("js/admin/modules/banners.js");
run("js/admin/modules/placeholder.js");

const W = sandbox.window;
const reg = W.AdminRegistry;
const mod = W.AdminBannersModule;

console.log("Smoke test — Admin Banners (Bloco 4C)");

check("AdminBannersModule existe", !!mod);
check("id do módulo é 'banners'", mod && mod.id === "banners");
check("registrado no AdminRegistry", reg && reg.has("banners"));
check("registry retorna o módulo REAL (render é o do banners, não placeholder)",
    reg && reg.get("banners").render === mod.render && !reg.get("banners").isPlaceholder);
check("placeholder cedeu: 'banners' NÃO está na lista de placeholders",
    W.AdminPlaceholderModule && W.AdminPlaceholderModule.list().indexOf("banners") === -1);
check("outros placeholders continuam registrados (empreendimentos, configuracoes)",
    reg.has("empreendimentos") && reg.has("configuracoes") &&
    W.AdminPlaceholderModule.list().indexOf("empreendimentos") !== -1);

// render() sem Firebase não deve lançar.
let rendered = false;
try {
    const container = makeEl("section-banners");
    mod.render(container, null);
    rendered = container.innerHTML.indexOf("Banners / Pop-ups") !== -1;
} catch (e) {
    rendered = false;
}
check("render() não quebra sem Firebase e injeta o shell", rendered);

// Validação de rascunho.
function fakeForm(values) {
    const elementsMap = {};
    Object.keys(values).forEach((k) => {
        elementsMap[k] = { value: values[k] === true || values[k] === false ? "" : String(values[k]),
            checked: values[k] === true };
    });
    return { elements: elementsMap, querySelector: () => null };
}

const r1 = mod._readForm(fakeForm({ title: "", type: "banner" }));
check("validação: título vazio é rejeitado", !!r1.error);

const r2 = mod._readForm(fakeForm({ title: "Teste", type: "invalido" }));
check("validação: tipo inválido é rejeitado", !!r2.error);

const r3 = mod._readForm(fakeForm({ title: "Teste", type: "banner", ctaUrl: 'javascript:alert(1)' }));
check("validação: URL de CTA perigosa é rejeitada", !!r3.error);

const r4 = mod._readForm(fakeForm({
    title: "Teste", type: "banner",
    startAt: "2026-07-10T10:00", endAt: "2026-07-01T10:00"
}));
check("validação: endAt < startAt é rejeitado", !!r4.error);

const r5 = mod._readForm(fakeForm({ title: "Campanha Boa", type: "popup", priority: "70", placement: "home" }));
check("validação: rascunho válido passa", !r5.error && r5.data && r5.data.title === "Campanha Boa");

// buildPayload sempre nasce draft no create.
const built = mod._buildPayload({ data: r5.data }, null);
check("buildPayload (create) status === 'draft'", built.payload.status === "draft");
check("buildPayload (create) createdBy/updatedBy = uid atual",
    built.payload.createdBy === "admin-uid-test" && built.payload.updatedBy === "admin-uid-test");
check("buildPayload (create) id == payload.id (rules)", built.id === built.payload.id);
check("buildPayload não produz status 'published'", built.payload.status !== "published");

// URL helper.
check("_isAllowedUrl aceita https e caminho interno",
    mod._isAllowedUrl("https://exemplo.com/x.jpg") && mod._isAllowedUrl("eventos.html"));
check("_isAllowedUrl rejeita aspas/parênteses",
    !mod._isAllowedUrl('http://x.com/a"b') && !mod._isAllowedUrl("javascript:alert(1)"));

// Garantias estáticas: sem upload e sem delete no módulo.
const src = read("js/admin/modules/banners.js");
check("módulo NÃO chama upload (.put/uploadImage)",
    src.indexOf(".put(") === -1 && src.indexOf("uploadImage") === -1);
check("módulo NÃO chama delete()", src.indexOf(".delete(") === -1);
check("botão Publicar é exibido como disabled",
    src.indexOf('disabled title="Publicação disponível em etapa futura"') !== -1);

console.log(failures === 0
    ? "\nTodos os checks passaram ✅"
    : "\n" + failures + " check(s) falharam ❌");
process.exit(failures === 0 ? 0 : 1);
