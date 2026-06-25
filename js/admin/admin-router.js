/**
 * admin-router.js — Fundação modular do Admin CMS (Bloco 1 / Etapa 1)
 * -------------------------------------------------------------------
 * Roteador de módulos em MODO PASSTHROUGH.
 *
 * Importante nesta etapa:
 *  - NÃO substitui o `showSection` legado (inline em admin-firebase.html).
 *  - NÃO é chamado por nenhum botão atual — a sidebar continua usando o
 *    `showSection` global inalterado.
 *  - `navigate()` apenas DELEGA ao comportamento legado quando existir,
 *    sem quebrar nada. Renderização modular real fica para etapas futuras.
 *
 * IIFE, sem build step, sem import/export.
 */
(function () {
    "use strict";

    if (window.AdminRouter) return;

    var ctx = null;
    var currentSection = null;
    // Ponte para a navegação legada; por padrão usa o global `showSection`.
    var legacyNavigate = null;

    function resolveLegacyNavigate() {
        if (typeof legacyNavigate === "function") return legacyNavigate;
        if (typeof window.showSection === "function") return window.showSection;
        return null;
    }

    function getModule(id) {
        return window.AdminRegistry && window.AdminRegistry.get ? window.AdminRegistry.get(id) : null;
    }

    var AdminRouter = {
        init: function (context) {
            ctx = context || window.AdminContext || null;
            return this;
        },

        // Permite, no futuro, injetar uma função de navegação legada específica.
        registerLegacyBridge: function (fn) {
            if (typeof fn === "function") {
                legacyNavigate = fn;
            }
            return this;
        },

        getCurrentSection: function () {
            return currentSection;
        },

        // Chama dispose() do módulo da seção atual, se registrado (seguro).
        disposeCurrent: function () {
            var current = getModule(currentSection);
            if (current && typeof current.dispose === "function") {
                try {
                    current.dispose();
                } catch (error) {
                    console.warn("[admin-router] Falha ao descartar módulo '" + currentSection + "'.", error);
                }
            }
        },

        /**
         * navigate(sectionId)
         * MODO PASSTHROUGH: delega à navegação legada. Em etapas futuras,
         * quando uma seção tiver módulo migrado, este ponto passará a
         * renderizar o módulo em vez de delegar.
         */
        navigate: function (sectionId) {
            if (!sectionId) return false;

            this.disposeCurrent();
            currentSection = sectionId;
            if (window.AdminContext && window.AdminContext.state) {
                window.AdminContext.state.currentModuleId = sectionId;
            }

            // --- Etapa 1: sempre passthrough para preservar o comportamento atual ---
            var nav = resolveLegacyNavigate();
            if (nav) {
                nav(sectionId);
                return true;
            }

            console.warn("[admin-router] Navegação legada indisponível para '" + sectionId + "'.");
            return false;
        }
    };

    window.AdminRouter = AdminRouter;
})();
