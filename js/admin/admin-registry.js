/**
 * admin-registry.js — Fundação modular do Admin CMS (Bloco 1 / Etapa 1)
 * ---------------------------------------------------------------------
 * Registro de módulos do admin. Nesta etapa NÃO migra módulos reais e
 * NÃO substitui a sidebar atual nem gera menu novo. Apenas oferece a
 * infraestrutura para registrar/consultar módulos futuros.
 *
 * Contrato mínimo de um módulo:
 *   { id, label, icon, requiredRole, master, navGroup, order,
 *     render(container, context), load(context), dispose() }
 *
 * IIFE, sem build step, sem import/export.
 */
(function () {
    "use strict";

    if (window.AdminRegistry) return;

    var modules = {};
    var order = [];

    function validate(def) {
        if (!def || typeof def !== "object") {
            return "Definição de módulo inválida.";
        }
        if (!def.id || typeof def.id !== "string") {
            return "Módulo sem 'id' válido.";
        }
        if (typeof def.render !== "function") {
            return "Módulo '" + def.id + "' sem render().";
        }
        return "";
    }

    function normalize(def) {
        return {
            id: def.id,
            label: def.label || def.id,
            icon: def.icon || "",
            requiredRole: def.requiredRole || "admin",
            master: def.master === true,
            navGroup: def.navGroup || "Geral",
            order: typeof def.order === "number" ? def.order : 100,
            render: def.render,
            load: typeof def.load === "function" ? def.load : function () {},
            dispose: typeof def.dispose === "function" ? def.dispose : function () {},
            actions: def.actions && typeof def.actions === "object" ? def.actions : {},
            emptyState: def.emptyState || "",
            errorState: def.errorState || ""
        };
    }

    var AdminRegistry = {
        register: function (def) {
            var error = validate(def);
            if (error) {
                console.warn("[admin-registry] " + error);
                return false;
            }
            if (Object.prototype.hasOwnProperty.call(modules, def.id)) {
                console.warn("[admin-registry] Módulo duplicado ignorado: '" + def.id + "'.");
                return false;
            }
            modules[def.id] = normalize(def);
            order.push(def.id);
            return true;
        },

        has: function (id) {
            return Object.prototype.hasOwnProperty.call(modules, id);
        },

        get: function (id) {
            return this.has(id) ? modules[id] : null;
        },

        list: function () {
            return order.map(function (id) {
                return modules[id];
            });
        },

        // Lista ordenada por navGroup + order (para futura montagem de sidebar).
        listSorted: function () {
            return this.list().slice().sort(function (a, b) {
                if (a.navGroup !== b.navGroup) {
                    return String(a.navGroup).localeCompare(String(b.navGroup), "pt-BR");
                }
                return a.order - b.order;
            });
        },

        count: function () {
            return order.length;
        }
    };

    window.AdminRegistry = AdminRegistry;
})();
