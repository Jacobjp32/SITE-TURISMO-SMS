/**
 * smoke-banners.mjs — Smoke test do módulo Admin Banners (Blocos 4C + 4D).
 * Carrega admin-registry.js + banners.js + placeholder.js num sandbox (vm)
 * com window/document stubbados (sem Firebase) e valida os contratos do bloco:
 *
 * Contratos 4C:
 *   - AdminBannersModule existe e registra no AdminRegistry;
 *   - substitui o placeholder de id `banners` (placeholder cede);
 *   - demais placeholders continuam registrados;
 *   - render() não quebra sem Firebase;
 *   - validação de rascunho funciona (título/tipo obrigatórios, URL, datas);
 *   - buildPayload nasce sempre como `draft` (nunca `published`);
 *   - delete definitivo continua inexistente.
 *
 * Contratos 4D (upload):
 *   - módulo chama .put() e uploadBannerImage para upload;
 *   - upload usa path cms-media/{uid}/banners/{bannerId}/…;
 *   - validateBannerImageFile rejeita tipo inválido e arquivo grande demais;
 *   - validateBannerImageFile aceita image/jpeg ≤ 5 MB;
 *   - buildPayload com uploadResult define imageUrl, imagePath, imageUpdatedAt/By;
 *   - buildPayload preserva imagePath quando URL inalterada em edição;
 *   - buildPayload nunca permite status published;
 *   - formulário contém campo de arquivo e preview de imagem;
 *   - lista renderiza thumbnail <img> quando há imageUrl;
 *   - lista não quebra quando não há imageUrl;
 *   - botão Publicar continua desabilitado.
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

console.log("Smoke test — Admin Banners (Blocos 4C + 4D)");
console.log("");
console.log("--- Contratos 4C ---");

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

// delete() não existe no módulo.
check("módulo NÃO chama .delete()",
    read("js/admin/modules/banners.js").indexOf(".delete(") === -1);

// botão Publicar desabilitado.
check("botão Publicar é exibido como disabled",
    read("js/admin/modules/banners.js").indexOf('disabled title="Publicação disponível em etapa futura"') !== -1);

console.log("");
console.log("--- Contratos 4D (upload) ---");

const src = read("js/admin/modules/banners.js");

// Módulo agora chama .put() para upload.
check("módulo chama .put() para upload de imagem (uploadBannerImage)",
    src.indexOf(".put(") !== -1 && src.indexOf("uploadBannerImage") !== -1);

// Caminho de upload correto (rules 4B: cms-media/{uid}/banners/{bannerId}/...).
check("upload usa path cms-media/{uid}/banners/{bannerId}/...",
    src.indexOf('"cms-media/" + uid + "/banners/" + bannerId +') !== -1);

// Funções expostas para handlers inline.
check("onImageFileChange exposto no módulo", typeof mod.onImageFileChange === "function");
check("clearImageSelection exposto no módulo", typeof mod.clearImageSelection === "function");

// validateBannerImageFile exposta para smoke.
check("_validateBannerImageFile exposta", typeof mod._validateBannerImageFile === "function");
check("_MAX_IMAGE_BYTES = 5 MB", mod._MAX_IMAGE_BYTES === 5 * 1024 * 1024);

// validateBannerImageFile: tipo inválido.
let errTipo = null;
try { mod._validateBannerImageFile({ type: "image/gif", size: 100 }); }
catch (e) { errTipo = e.message; }
check("validateBannerImageFile rejeita image/gif (tipo inválido)", !!errTipo);

// validateBannerImageFile: arquivo grande demais.
let errSize = null;
try { mod._validateBannerImageFile({ type: "image/jpeg", size: 6 * 1024 * 1024 }); }
catch (e) { errSize = e.message; }
check("validateBannerImageFile rejeita arquivo > 5 MB", !!errSize);

// validateBannerImageFile: arquivo válido não lança.
let errOk = null;
try { mod._validateBannerImageFile({ type: "image/jpeg", size: 1 * 1024 * 1024 }); }
catch (e) { errOk = e; }
check("validateBannerImageFile aceita image/jpeg ≤ 5 MB", errOk === null);

let errPng = null;
try { mod._validateBannerImageFile({ type: "image/png", size: 2 * 1024 * 1024 }); }
catch (e) { errPng = e; }
check("validateBannerImageFile aceita image/png ≤ 5 MB", errPng === null);

// buildPayload com uploadResult: imageUrl e imagePath do upload.
const fakeUpload = { url: "https://storage.googleapis.com/fake/banner.jpg", path: "cms-media/admin-uid-test/banners/test-id/12345-banner.jpg" };
const builtWithUpload = mod._buildPayload({ data: r5.data }, null, fakeUpload, "test-banner-id");
check("buildPayload com uploadResult: imageUrl vem do upload",
    builtWithUpload.payload.imageUrl === fakeUpload.url);
check("buildPayload com uploadResult: imagePath vem do upload",
    builtWithUpload.payload.imagePath === fakeUpload.path);
check("buildPayload com uploadResult: imageUpdatedBy = uid atual",
    builtWithUpload.payload.imageUpdatedBy === "admin-uid-test");
check("buildPayload com uploadResult: id sobrescrito pelo overrideId",
    builtWithUpload.id === "test-banner-id" && builtWithUpload.payload.id === "test-banner-id");
check("buildPayload com uploadResult: status ainda é draft",
    builtWithUpload.payload.status === "draft");

// buildPayload em edição: URL inalterada → preserva imagePath existente.
const fakeBase = {
    __id: "banner-existente",
    title: "Banner Existente",
    slug: "banner-existente",
    status: "draft",
    type: "banner",
    imageUrl: "https://storage.googleapis.com/fake/existente.jpg",
    imagePath: "cms-media/admin-uid-test/banners/banner-existente/old.jpg",
    imageAlt: "Alt existente",
    placement: "home",
    targetPages: [],
    ctaLabel: "", ctaUrl: "", ctaTarget: "_self",
    priority: 50, frequency: "always", dismissible: true,
    showDelayMs: 0, maxWidth: null,
    startAt: null, endAt: null,
    description: "",
    createdAt: null, createdBy: "admin-uid-test",
    updatedAt: null, updatedBy: "admin-uid-test"
};
// readForm retorna imageUrl da base (URL preservada).
const r6 = mod._readForm(fakeForm({
    title: "Banner Existente",
    type: "banner",
    imageUrl: "https://storage.googleapis.com/fake/existente.jpg",
    imageAlt: "Alt existente"
}));
const builtEdit = mod._buildPayload({ data: r6.data }, fakeBase, null, "banner-existente");
check("buildPayload (edit, URL inalterada): imagePath preservado do base",
    builtEdit.payload.imagePath === fakeBase.imagePath);
check("buildPayload (edit, URL inalterada): status preservado como draft",
    builtEdit.payload.status === "draft");

// buildPayload em edição com URL trocada → imagePath NÃO copiado.
const r7 = mod._readForm(fakeForm({
    title: "Banner Existente",
    type: "banner",
    imageUrl: "https://outro-servidor.com/nova.jpg",
    imageAlt: "Alt existente"
}));
const builtEditUrl = mod._buildPayload({ data: r7.data }, fakeBase, null, "banner-existente");
check("buildPayload (edit, URL trocada): imagePath não copiado",
    !builtEditUrl.payload.imagePath);

// Formulário contém campo de arquivo e preview.
let formHtml = "";
try {
    const container = makeEl("section-banners");
    // Simula openModal via stub de contentModal.
    const origOpenModal = W.AdminContentCMS;
    W.AdminContentCMS = {
        openModal: function (title, html) { formHtml = html; },
        closeModal: function () {}
    };
    mod.openForm();
    W.AdminContentCMS = origOpenModal;
} catch (e) {
    // openModal direto (sem AdminContentCMS).
    const bodyEl = makeEl("contentModalBody");
    const titleEl = makeEl("contentModalTitle");
    const modalEl = makeEl("contentModal");
    elements["contentModalBody"] = bodyEl;
    elements["contentModalTitle"] = titleEl;
    elements["contentModal"] = modalEl;
    mod.openForm();
    formHtml = bodyEl.innerHTML;
}
check("formulário contém campo de arquivo (banner_imageFile)",
    formHtml.indexOf('id="banner_imageFile"') !== -1 || formHtml.indexOf("name=\"imageFile\"") !== -1);
check("formulário contém área de preview (bannerImagePreview)",
    formHtml.indexOf('id="bannerImagePreview"') !== -1);
check("formulário contém campo de URL de imagem (banner_imageUrl)",
    formHtml.indexOf('id="banner_imageUrl"') !== -1 || formHtml.indexOf("name=\"imageUrl\"") !== -1);
check("formulário contém campo de alt (banner_imageAlt ou name=imageAlt)",
    formHtml.indexOf("banner_imageAlt") !== -1 || formHtml.indexOf("name=\"imageAlt\"") !== -1);

// Lista renderiza thumbnail quando há imageUrl.
W.AdminBannersModule._state.items = [{
    __id: "x1",
    title: "Com imagem",
    slug: "com-imagem",
    type: "banner",
    status: "draft",
    imageUrl: "https://exemplo.com/banner.jpg",
    imageAlt: "Descrição",
    priority: 50,
    updatedAt: null
}];
const listEl = makeEl("banners-list");
elements["banners-list"] = listEl;
try { mod._state.items = W.AdminBannersModule._state.items; } catch(e) {}
// Re-render da lista.
const container2 = makeEl("section-banners");
mod.render(container2, null);
// A lista é renderizada em #banners-list
const listHtml = listEl.innerHTML;
check("lista renderiza thumbnail <img> quando há imageUrl",
    listHtml.indexOf("<img") !== -1 && listHtml.indexOf("https://exemplo.com/banner.jpg") !== -1);

// Lista não quebra sem imageUrl.
W.AdminBannersModule._state.items = [{
    __id: "x2",
    title: "Sem imagem",
    slug: "sem-imagem",
    type: "banner",
    status: "draft",
    imageUrl: "",
    priority: 50,
    updatedAt: null
}];
let listSemImagem = true;
try {
    elements["banners-list"] = makeEl("banners-list");
    mod.render(makeEl("section-banners2"), null);
} catch (e) {
    listSemImagem = false;
}
check("lista não quebra quando não há imageUrl", listSemImagem);

// Após o smoke, garantir que buildPayload nunca produz status published.
[null, { url: "https://x.com/y.jpg", path: "cms-media/u/banners/b/y.jpg" }].forEach(function(up) {
    var b = mod._buildPayload({ data: r5.data }, null, up);
    if (b.payload.status === "published") {
        failures++;
        console.log("  ✗ buildPayload não deve produzir status 'published' (uploadResult=" + (up ? "sim" : "não") + ")");
    }
});
check("buildPayload NUNCA produz status 'published' (com e sem upload)", true);

console.log(failures === 0
    ? "\nTodos os checks passaram ✅"
    : "\n" + failures + " check(s) falharam ❌");
process.exit(failures === 0 ? 0 : 1);
