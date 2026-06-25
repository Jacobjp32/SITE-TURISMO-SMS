/**
 * admin-context.js — Fundação modular do Admin CMS (Bloco 1 / Etapa 1)
 * ---------------------------------------------------------------------
 * Contexto compartilhado do admin. NÃO reimplementa lógica existente:
 * apenas referencia, de forma segura e tardia (lazy), o que já existe no
 * projeto (firebase, FirebaseSystem, AdminContentCMS, CONFIG, SITE_META,
 * SMSecurity, currentUser/role).
 *
 * Modo passthrough: não altera login, gate de autenticação, expiração de
 * sessão ou roles. Apenas expõe `window.AdminContext` para módulos futuros.
 *
 * Compatível com o modelo atual: IIFE, sem build step, sem import/export.
 */
(function () {
    "use strict";

    if (window.AdminContext) return;

    function safe(fn, fallback) {
        try {
            return fn();
        } catch (error) {
            return fallback;
        }
    }

    var AdminContext = {
        // ---- Referências Firebase (lazy + seguras) ----
        get firebase() {
            return typeof window.firebase !== "undefined" ? window.firebase : null;
        },
        get auth() {
            return safe(function () {
                return window.firebase && window.firebase.auth ? window.firebase.auth() : null;
            }, null);
        },
        get db() {
            if (window.firebaseDB && window.firebaseDB.db) return window.firebaseDB.db;
            return safe(function () {
                return window.firebase && window.firebase.firestore ? window.firebase.firestore() : null;
            }, null);
        },
        get storage() {
            return safe(function () {
                return window.firebase && window.firebase.storage ? window.firebase.storage() : null;
            }, null);
        },

        // ---- Camadas de domínio já existentes (reuso, nunca reimplementar) ----
        get api() {
            return window.FirebaseSystem || null;
        },
        get cms() {
            return window.AdminContentCMS || null;
        },
        get sec() {
            return window.SMSecurity || null;
        },
        get config() {
            return window.CONFIG || null;
        },
        get siteMeta() {
            return window.SITE_META || null;
        },

        // ---- Usuário / sessão (somente leitura; nunca muta auth) ----
        get currentUser() {
            return window.currentUser || null;
        },
        get currentRole() {
            return window.currentUser && window.currentUser.role ? window.currentUser.role : null;
        },
        isAdmin: function () {
            return !!(window.FirebaseSystem && typeof window.FirebaseSystem.isAdmin === "function" && window.FirebaseSystem.isAdmin());
        },
        isModerator: function () {
            return !!(window.FirebaseSystem && typeof window.FirebaseSystem.isModerator === "function" && window.FirebaseSystem.isModerator());
        },
        // Cosmético nesta fase: separação real de "admin master" depende de regras (rodada futura).
        isMaster: function () {
            return !!(window.currentUser && window.currentUser.master === true);
        },

        // ---- Prontidão ----
        isFirebaseReady: function () {
            return !!(this.db && this.api);
        },

        // ---- Helpers seguros ----
        serverTimestamp: function () {
            return safe(function () {
                return window.firebase.firestore.FieldValue.serverTimestamp();
            }, null);
        },
        // Notificação reaproveitando o sistema existente (não cria UI nova).
        toast: function (message, type) {
            if (window.FirebaseSystem && typeof window.FirebaseSystem.showNotification === "function") {
                return window.FirebaseSystem.showNotification(message, type);
            }
            return null;
        },

        // ---- Estado leve compartilhado entre módulos (futuro) ----
        state: {
            currentModuleId: null
        }
    };

    window.AdminContext = AdminContext;
})();
