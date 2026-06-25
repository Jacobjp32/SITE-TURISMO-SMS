/**
 * admin-ui.js — Fundação modular do Admin CMS (Bloco 1 / Etapa 1)
 * ---------------------------------------------------------------
 * Helpers pequenos e seguros para módulos futuros. NÃO altera o visual
 * atual, NÃO unifica modais, NÃO toca em `#managerModal` nem `#contentModal`.
 *
 * Tudo aqui é aditivo e inerte: nada é montado automaticamente. Os helpers
 * só agem sobre elementos passados explicitamente pelo chamador.
 *
 * IIFE, sem build step, sem import/export.
 */
(function () {
    "use strict";

    if (window.AdminUI) return;

    function escapeHtml(value) {
        // Reaproveita SMSecurity quando disponível; senão, fallback local equivalente.
        if (window.SMSecurity && typeof window.SMSecurity.html === "function") {
            return window.SMSecurity.html(value, "");
        }
        return String(value == null ? "" : value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function timestampToMillis(value) {
        if (!value) return 0;
        if (typeof value.toMillis === "function") return value.toMillis();
        if (typeof value.toDate === "function") {
            try { return value.toDate().getTime(); } catch (e) { return 0; }
        }
        if (typeof value.seconds === "number") return value.seconds * 1000;
        var parsed = Date.parse(value);
        return Number.isFinite(parsed) ? parsed : 0;
    }

    // Formatação de data alinhada ao padrão pt-BR já usado no admin.
    function formatDate(value) {
        var millis = timestampToMillis(value);
        return millis ? new Date(millis).toLocaleString("pt-BR") : "";
    }

    function isElement(node) {
        return !!(node && node.nodeType === 1);
    }

    // Estados padronizados — agem SOMENTE sobre o container recebido.
    var states = {
        loading: function (container, message) {
            if (!isElement(container)) return;
            container.innerHTML =
                '<p style="text-align:center;padding:2rem;color:#888;">' +
                escapeHtml(message || "Carregando...") +
                "</p>";
        },
        empty: function (container, message) {
            if (!isElement(container)) return;
            container.innerHTML =
                '<p style="text-align:center;padding:2rem;color:#888;">' +
                escapeHtml(message || "Nenhum item encontrado.") +
                "</p>";
        },
        error: function (container, message) {
            if (!isElement(container)) return;
            container.innerHTML =
                '<p style="text-align:center;padding:2rem;color:#b42318;">' +
                escapeHtml(message || "Erro ao carregar.") +
                "</p>";
        }
    };

    // Wrapper de notificação reaproveitando o sistema existente.
    function showToast(message, type) {
        if (window.FirebaseSystem && typeof window.FirebaseSystem.showNotification === "function") {
            return window.FirebaseSystem.showNotification(message, type);
        }
        return null;
    }

    var AdminUI = {
        escapeHtml: escapeHtml,
        formatDate: formatDate,
        timestampToMillis: timestampToMillis,
        states: states,
        showToast: showToast,
        // Açúcar opcional para estados, sem mudar nada visualmente.
        setEmptyState: states.empty,
        setErrorState: states.error,
        showLoading: states.loading
    };

    window.AdminUI = AdminUI;
})();
