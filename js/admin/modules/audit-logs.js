(function () {
    "use strict";
    var context = null;
    var lastDocument = null;

    function esc(value) { return window.AdminUI.escapeHtml(value == null ? "" : value); }
    function shell(container) {
        container.innerHTML = '<div class="page-header"><h1>📜 Logs / Auditoria</h1></div><div class="card"><p class="admin-helper-text">Histórico somente leitura das ações administrativas registradas pelo backend.</p>' +
            '<div id="audit-items"><div class="loading">Carregando...</div></div><button id="audit-more" class="btn-primary" type="button" hidden>Carregar mais</button></div>';
        container.querySelector("#audit-more").addEventListener("click", function () { load(true); });
    }
    function row(doc) {
        var item = doc.data();
        return '<tr><td>' + esc(window.AdminUI.formatDate(item.timestamp)) + '</td><td>' + esc(item.action) + '</td><td>' + esc(item.entityType) + '</td><td>' + esc(item.entityId) + '</td><td>' + esc(item.actorAuthType) + '</td><td>' + esc(item.actorRoleSnapshot || "—") + '</td><td>' + esc(item.summary) + '</td></tr>';
    }
    async function load(append) {
        var target = document.getElementById("audit-items");
        if (!target || !context || !context.db) return;
        if (!context.isActiveAdmin()) return window.AdminUI.states.error(target, "Acesso restrito a administrador ativo.");
        if (!append) { window.AdminUI.states.loading(target); lastDocument = null; }
        try {
            var query = context.db.collection("audit_logs").orderBy("timestamp", "desc").limit(25);
            if (append && lastDocument) query = query.startAfter(lastDocument);
            var snapshot = await query.get();
            lastDocument = snapshot.docs[snapshot.docs.length - 1] || lastDocument;
            var orderedDocs = snapshot.docs.slice().sort(function (a, b) {
                var timeDiff = window.AdminUI.timestampToMillis(b.data().timestamp) - window.AdminUI.timestampToMillis(a.data().timestamp);
                return timeDiff || String(b.data().eventId || b.id).localeCompare(String(a.data().eventId || a.id));
            });
            var rows = orderedDocs.map(row).join("");
            if (!append) target.innerHTML = rows ? '<div style="overflow-x:auto"><table><thead><tr><th>Data</th><th>Ação</th><th>Entidade</th><th>ID</th><th>Autenticação</th><th>Papel</th><th>Resumo</th></tr></thead><tbody>' + rows + '</tbody></table></div>' : '<p>Nenhum log registrado.</p>';
            else if (rows) target.querySelector("tbody").insertAdjacentHTML("beforeend", rows);
            document.getElementById("audit-more").hidden = snapshot.size < 25;
        } catch (error) { window.AdminUI.states.error(target, "Não foi possível carregar os logs."); }
    }
    var module = { id: "audit-logs", label: "Logs / Auditoria", icon: "📜", requiredRole: "admin", navGroup: "Sistema", order: 63,
        render: function (container) { if (container && !container.dataset.auditReady) { shell(container); container.dataset.auditReady = "true"; } },
        load: function () { return load(false); }, dispose: function () {},
        activate: function (ctx) { context = ctx || window.AdminContext; this.render(document.getElementById("section-audit-logs")); this.load(); }
    };
    window.AdminAuditLogsModule = module;
    window.AdminRegistry.register(module);
})();
