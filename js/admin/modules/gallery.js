(function () {
    "use strict";

    var unsubscribe = null;
    var context = null;

    function esc(value) {
        return window.AdminUI.escapeHtml(value == null ? "" : value);
    }

    function shell(container) {
        container.innerHTML =
            '<div class="page-header"><h1>🖼️ Galeria</h1><button type="button" class="btn-primary" id="gallery-reload">Atualizar</button></div>' +
            '<div class="card"><p class="admin-helper-text">Gerencie as imagens públicas existentes. Esta versão não envia nem exclui arquivos.</p>' +
            '<div id="gallery-feedback" role="status" aria-live="polite"></div><div id="gallery-items"><div class="loading">Carregando...</div></div></div>';
        container.querySelector("#gallery-reload").addEventListener("click", load);
    }

    function render(snapshot) {
        var target = document.getElementById("gallery-items");
        if (!target) return;
        if (snapshot.empty) {
            window.AdminUI.states.empty(target, "Nenhuma imagem cadastrada. Execute a migração autorizada antes de editar.");
            return;
        }
        target.innerHTML = snapshot.docs.map(function (doc) {
            var item = doc.data();
            return '<form class="card gallery-admin-item" data-id="' + esc(doc.id) + '" style="margin-bottom:1rem;display:grid;grid-template-columns:minmax(120px,180px) 1fr;gap:1rem;">' +
                '<img src="' + esc(item.url) + '" alt="' + esc(item.alt) + '" style="width:100%;max-height:140px;object-fit:cover;border-radius:.5rem;">' +
                '<div><label>Categoria<input name="category" value="' + esc(item.category) + '" required></label>' +
                '<label>Legenda<input name="caption" value="' + esc(item.caption) + '"></label>' +
                '<label>Texto alternativo<input name="alt" value="' + esc(item.alt) + '" required></label>' +
                '<label>Ordem<input name="displayOrder" type="number" min="0" step="1" value="' + Number(item.displayOrder || 0) + '" required></label>' +
                '<label><input name="published" type="checkbox" ' + (item.published ? "checked" : "") + '> Publicada</label>' +
                '<button type="submit" class="btn-primary">Salvar</button></div></form>';
        }).join("");
        target.querySelectorAll("form").forEach(function (form) {
            form.addEventListener("submit", save);
        });
    }

    async function save(event) {
        event.preventDefault();
        if (!context || !context.isActiveAdmin()) return window.AdminUI.showToast("Acesso restrito a administrador ativo.", "error");
        var form = event.currentTarget;
        var button = form.querySelector("button[type=submit]");
        button.disabled = true;
        try {
            await context.db.collection("gallery_items").doc(form.dataset.id).update({
                category: form.elements.category.value.trim(),
                caption: form.elements.caption.value.trim(),
                alt: form.elements.alt.value.trim(),
                displayOrder: Number(form.elements.displayOrder.value),
                published: form.elements.published.checked,
                updatedAt: context.serverTimestamp(),
                updatedBy: context.currentUser.uid
            });
            window.AdminUI.showToast("Imagem atualizada.", "success");
        } catch (error) {
            window.AdminUI.showToast("Não foi possível salvar a imagem.", "error");
        } finally {
            button.disabled = false;
        }
    }

    function load() {
        var target = document.getElementById("gallery-items");
        if (!target || !context || !context.db) return;
        if (!context.isActiveAdmin()) return window.AdminUI.states.error(target, "Acesso restrito a administrador ativo.");
        window.AdminUI.states.loading(target);
        if (unsubscribe) unsubscribe();
        unsubscribe = context.db.collection("gallery_items").orderBy("displayOrder", "asc").onSnapshot(render, function () {
            window.AdminUI.states.error(target, "Não foi possível carregar a galeria.");
        });
    }

    var module = {
        id: "galeria", label: "Galeria", icon: "🖼️", requiredRole: "admin", navGroup: "Conteúdo", order: 43,
        render: function (container) { if (container && !container.dataset.galleryReady) { shell(container); container.dataset.galleryReady = "true"; } },
        load: load,
        dispose: function () { if (unsubscribe) unsubscribe(); unsubscribe = null; },
        activate: function (ctx) { context = ctx || window.AdminContext; this.render(document.getElementById("section-galeria")); this.load(); }
    };
    window.AdminGalleryModule = module;
    window.AdminRegistry.register(module);
})();
