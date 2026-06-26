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
         * Faz a alternância visual via navegação legada (sempre) e, se a seção
         * tiver um módulo registrado (Etapa 2: apenas o Dashboard), renderiza e
         * carrega esse módulo. Seções sem módulo continuam 100% legadas.
         *
         * Sem recursão: a "ponte legada" registrada é o `showSection` ORIGINAL,
         * nunca um wrapper.
         */
        navigate: function (sectionId) {
            if (!sectionId) return false;

            this.disposeCurrent();
            currentSection = sectionId;
            if (window.AdminContext && window.AdminContext.state) {
                window.AdminContext.state.currentModuleId = sectionId;
            }

            // 1) Alternância visual + loaders legados (preserva comportamento atual).
            var nav = resolveLegacyNavigate();
            if (nav) {
                nav(sectionId);
            }

            // 2) Se houver módulo para esta seção, renderiza/carrega (modo modular).
            var mod = getModule(sectionId);
            if (mod) {
                try {
                    var activeCtx = ctx || window.AdminContext || null;
                    var container = (typeof document !== "undefined" && document.getElementById)
                        ? document.getElementById("section-" + sectionId)
                        : null;
                    if (typeof mod.render === "function") mod.render(container, activeCtx);
                    if (typeof mod.load === "function") mod.load(activeCtx);
                } catch (error) {
                    console.warn("[admin-router] Falha ao renderizar módulo '" + sectionId + "'.", error);
                }
                return true;
            }

            if (!nav) {
                console.warn("[admin-router] Navegação legada indisponível para '" + sectionId + "'.");
                return false;
            }
            return true;
        }
    };

    window.AdminRouter = AdminRouter;
})();
