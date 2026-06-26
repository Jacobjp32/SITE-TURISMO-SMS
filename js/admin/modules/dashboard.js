/**
 * modules/dashboard.js — Admin CMS (Bloco 1 / Etapa 2)
 * ----------------------------------------------------
 * Migração SOMENTE do Dashboard (seção `home`) para o sistema modular.
 *
 * Princípios:
 *  - Reaproveita o markup existente de `#section-home` (NÃO recria visual,
 *    NÃO altera cards, rótulos ou ações rápidas).
 *  - `load()` faz exatamente o que o `loadDashboardData` legado fazia,
 *    via `FirebaseSystem.getAdminStats()`, com guardas extras contra
 *    undefined/NaN.
 *  - Não cria CRUD, não cria collection, não consulta nada novo.
 *  - Integração viva: o `loadDashboardData` inline passa a delegar a este
 *    módulo (com fallback legado) — ver admin-firebase.html.
 *
 * IIFE, sem build step, sem import/export.
 */
(function () {
    "use strict";

    if (window.AdminDashboardModule) return;

    var SECTION_ID = "home";
    var activated = false;

    function setText(id, value) {
        var el = document.getElementById(id);
        if (el) el.textContent = value;
    }

    function pick(value, fallback) {
        return value === null || value === undefined ? fallback : value;
    }

    function resolveApi(context) {
        if (context && context.api) return context.api;
        if (window.AdminContext && window.AdminContext.api) return window.AdminContext.api;
        return window.FirebaseSystem || null;
    }

    var AdminDashboardModule = {
        // ---- Contrato de módulo ----
        id: SECTION_ID,
        label: "Dashboard",
        icon: "📊",
        requiredRole: "admin",
        master: false,
        navGroup: "Operação",
        order: 10,

        render: function (container, context) {
            // Reaproveita o DOM já existente em #section-home; nada é recriado.
            // Mantém a data do topo, se o helper legado existir (idempotente).
            if (typeof window.updateDate === "function") {
                try { window.updateDate(); } catch (error) {}
            }
            return container || document.getElementById("section-" + SECTION_ID);
        },

        load: async function (context) {
            var api = resolveApi(context);
            if (!api || typeof api.getAdminStats !== "function") {
                return false;
            }

            var stats = null;
            try {
                stats = await api.getAdminStats();
            } catch (error) {
                console.warn("[admin-dashboard] getAdminStats falhou.", error);
                return false;
            }

            // Sem stats (Firebase indisponível, role não carregada, sem permissão):
            // mantém os valores atuais ("-"), igual ao comportamento legado.
            if (!stats) return false;

            setText("stat-usuarios", pick(stats.totalUsers, "-"));
            setText("stat-pendentes", stats.pendingEventsLoadError ? "Erro" : pick(stats.pendingEvents, "-"));
            setText("stat-aprovados", pick(stats.approvedEvents, "-"));
            setText("stat-estabelecimentos", pick(stats.pendingEstablishments, "-"));
            return true;
        },

        dispose: function () {
            // Sem listeners/timers próprios: nada a limpar.
        }
    };

    // Registro imediato (AdminRegistry já está disponível neste ponto da carga).
    if (window.AdminRegistry && typeof window.AdminRegistry.register === "function") {
        window.AdminRegistry.register(AdminDashboardModule);
    }

    // Ativação tardia: registrar a ponte legada no router só depois que o
    // `showSection` inline existir (o inline roda após estes scripts).
    function activate() {
        if (activated) return;
        activated = true;

        if (window.AdminRouter) {
            if (typeof window.AdminRouter.init === "function") {
                window.AdminRouter.init(window.AdminContext || null);
            }
            if (typeof window.AdminRouter.registerLegacyBridge === "function" &&
                typeof window.showSection === "function") {
                // Usa o showSection ORIGINAL como ponte → navigate() nunca recursa.
                window.AdminRouter.registerLegacyBridge(window.showSection);
            }
        }
    }

    window.AdminDashboardModule = AdminDashboardModule;

    window.addEventListener("firebaseReady", activate);
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", activate, { once: true });
    } else {
        window.setTimeout(activate, 0);
    }
})();
