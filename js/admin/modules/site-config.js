(function () {
    "use strict";

    var context = null;
    var SEASONS = ["summer", "autumn", "winter", "spring"];

    function requireAdmin(target) {
        if (context && context.db && context.isActiveAdmin()) return true;
        window.AdminUI.states.error(target, "Acesso restrito a administrador ativo.");
        return false;
    }

    function seasonalShell(container) {
        container.innerHTML = '<div class="page-header"><h1>🌦️ Sazonal / Clima</h1></div><div class="card"><form id="seasonal-form">' +
            '<label><input type="checkbox" name="enabled"> Ativado</label>' +
            '<label>Modo<select name="mode"><option value="AUTO">Automático</option><option value="MANUAL">Manual</option></select></label>' +
            '<label>Estação manual<select name="seasonOverride"><option value="">Selecione</option><option value="summer">Verão</option><option value="autumn">Outono</option><option value="winter">Inverno</option><option value="spring">Primavera</option></select></label>' +
            '<p id="seasonal-feedback" role="status" aria-live="polite"></p><button class="btn-primary" type="submit">Salvar</button></form></div>';
        var form = container.querySelector("form");
        form.elements.mode.addEventListener("change", function () { form.elements.seasonOverride.disabled = this.value !== "MANUAL"; });
        form.addEventListener("submit", saveSeasonal);
    }

    async function loadSeasonal() {
        var form = document.getElementById("seasonal-form");
        if (!form || !requireAdmin(form)) return;
        try {
            var snap = await context.db.collection("site_config").doc("seasonal").get();
            var data = snap.exists ? snap.data() : { enabled: true, mode: "AUTO", seasonOverride: null };
            form.elements.enabled.checked = data.enabled !== false;
            form.elements.mode.value = data.mode === "MANUAL" ? "MANUAL" : "AUTO";
            form.elements.seasonOverride.value = SEASONS.indexOf(data.seasonOverride) >= 0 ? data.seasonOverride : "";
            form.elements.seasonOverride.disabled = form.elements.mode.value !== "MANUAL";
        } catch (error) { window.AdminUI.showToast("Não foi possível carregar a configuração sazonal.", "error"); }
    }

    async function saveSeasonal(event) {
        event.preventDefault();
        var form = event.currentTarget;
        if (!requireAdmin(form)) return;
        var mode = form.elements.mode.value;
        var season = form.elements.seasonOverride.value || null;
        if (mode === "MANUAL" && SEASONS.indexOf(season) < 0) return window.AdminUI.showToast("Selecione uma estação válida.", "error");
        if (mode === "AUTO") season = null;
        var ref = context.db.collection("site_config").doc("seasonal");
        var existing = await ref.get();
        var payload = { enabled: form.elements.enabled.checked, mode: mode, seasonOverride: season, updatedAt: context.serverTimestamp(), updatedBy: context.currentUser.uid, schemaVersion: 1 };
        try { existing.exists ? await ref.update(payload) : await ref.set(payload); window.AdminUI.showToast("Configuração sazonal salva.", "success"); }
        catch (error) { window.AdminUI.showToast("Não foi possível salvar.", "error"); }
    }

    function mascotShell(container) {
        container.innerHTML = '<div class="page-header"><h1>🐾 Mascote</h1></div><div class="card"><form id="mascot-form"><p class="admin-helper-text">Controla a exibição pública do guia de turismo existente.</p>' +
            '<label><input type="checkbox" name="enabled"> Ativado</label><p role="status" aria-live="polite"></p><button class="btn-primary" type="submit">Salvar</button></form></div>';
        container.querySelector("form").addEventListener("submit", saveMascot);
    }

    async function loadMascot() {
        var form = document.getElementById("mascot-form");
        if (!form || !requireAdmin(form)) return;
        try { var snap = await context.db.collection("site_config").doc("mascot").get(); form.elements.enabled.checked = !snap.exists || snap.data().enabled !== false; }
        catch (error) { window.AdminUI.showToast("Não foi possível carregar a configuração do mascote.", "error"); }
    }

    async function saveMascot(event) {
        event.preventDefault();
        var form = event.currentTarget;
        if (!requireAdmin(form)) return;
        var ref = context.db.collection("site_config").doc("mascot");
        var existing = await ref.get();
        var payload = { enabled: form.elements.enabled.checked, updatedAt: context.serverTimestamp(), updatedBy: context.currentUser.uid, schemaVersion: 1 };
        try { existing.exists ? await ref.update(payload) : await ref.set(payload); window.AdminUI.showToast("Configuração do mascote salva.", "success"); }
        catch (error) { window.AdminUI.showToast("Não foi possível salvar.", "error"); }
    }

    function register(id, label, icon, order, shell, load) {
        var module = { id: id, label: label, icon: icon, requiredRole: "admin", navGroup: "Sistema", order: order,
            render: function (container) { if (container && !container.dataset.configReady) { shell(container); container.dataset.configReady = "true"; } },
            load: load, dispose: function () {},
            activate: function (ctx) { context = ctx || window.AdminContext; this.render(document.getElementById("section-" + id)); this.load(); }
        };
        window.AdminRegistry.register(module);
        return module;
    }
    window.AdminSeasonalModule = register("sazonal", "Sazonal / Clima", "🌦️", 61, seasonalShell, loadSeasonal);
    window.AdminMascotModule = register("mascote", "Mascote", "🐾", 62, mascotShell, loadMascot);
})();
