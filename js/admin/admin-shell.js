/**
 * admin-shell.js — Fundação modular do Admin CMS (Bloco 1 / Etapa 1)
 * ------------------------------------------------------------------
 * Inicializa a camada modular DEPOIS que o admin atual já está disponível,
 * de forma totalmente aditiva e inerte:
 *
 *  - cria/garante o contexto (AdminContext);
 *  - inicializa registry/router em modo passthrough;
 *  - NÃO altera o visual, o login, o gate de auth ou a expiração de sessão;
 *  - NÃO impede o admin legado de funcionar (não liga listeners de UI);
 *  - registra apenas logs discretos em modo debug;
 *  - é seguro mesmo se alguma dependência ainda não estiver pronta.
 *
 * IIFE, sem build step, sem import/export.
 */
(function () {
    "use strict";

    if (window.AdminShell && window.AdminShell.__initialized) return;

    function isDebug() {
        try {
            if (window.localStorage && window.localStorage.getItem("sms-admin-debug") === "1") {
                return true;
            }
        } catch (error) {}
        var meta = window.SITE_META || {};
        return meta.environment && meta.environment !== "production";
    }

    function debugLog() {
        if (!isDebug()) return;
        try {
            var args = Array.prototype.slice.call(arguments);
            args.unshift("[admin-shell]");
            console.debug.apply(console, args);
        } catch (error) {}
    }

    var AdminShell = {
        __initialized: false,
        ready: false,

        boot: function () {
            if (this.ready) return this;

            var context = window.AdminContext || null;
            if (!context) {
                debugLog("AdminContext indisponível no boot; camada modular permanece inerte.");
                return this;
            }

            if (window.AdminRouter && typeof window.AdminRouter.init === "function") {
                window.AdminRouter.init(context);
            }

            this.ready = true;
            debugLog("Camada modular inicializada (modo passthrough).", {
                firebaseReady: context.isFirebaseReady ? context.isFirebaseReady() : false,
                modulesRegistered: window.AdminRegistry ? window.AdminRegistry.count() : 0
            });
            return this;
        }
    };

    function init() {
        if (AdminShell.__initialized) return;
        AdminShell.__initialized = true;
        AdminShell.boot();
    }

    window.AdminShell = AdminShell;

    // Boot tardio: depois do Firebase pronto e/ou DOM carregado, sem competir
    // com o handshake do admin legado (firebaseReady -> bind login/sidebar).
    window.addEventListener("firebaseReady", init);

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init, { once: true });
    } else {
        // Já carregado: agenda boot para o próximo tick, sem bloquear nada.
        window.setTimeout(init, 0);
    }
})();
