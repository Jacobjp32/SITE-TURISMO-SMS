/**
 * admin-unsaved-guard.js — alterações não salvas e teclado nos modais (Rodada 1)
 * ------------------------------------------------------------------------------
 * Camada fina, sem substituir os módulos existentes:
 *  - percebe quando um formulário de edição foi alterado (compara o conteúdo
 *    com o estado do primeiro contato do usuário) e pede confirmação antes de
 *    descartá-lo: troca de seção, Voltar do navegador, fechar/cancelar modal,
 *    abrir outro empreendimento, recarregar ou fechar a aba;
 *  - não pergunta nada quando não houve alteração;
 *  - modais legados (#contentModal, #managerModal): foco entra no diálogo,
 *    Tab fica preso dentro dele, Esc fecha (passando pela mesma proteção) e o
 *    foco volta ao botão que abriu;
 *  - avisa cinco minutos antes do encerramento da sessão por inatividade.
 *
 * Salvar com sucesso continua fechando o editor normalmente: a proteção só
 * intercepta ações do usuário, nunca o fechamento feito pelo próprio módulo.
 * IIFE, sem build step.
 */
(function () {
    "use strict";

    if (window.AdminUnsavedGuard) return;

    var EDITOR_SELECTOR = [
        "#eventCmsForm", "#newsCmsForm", "#mediaCmsForm", "#bannerForm", "#routeForm",
        "#establishmentForm", "#managerForm", "#seasonal-form", "#mascot-form", "form.gallery-admin-item"
    ].join(", ");
    // Formulários que continuam na tela depois de salvar: o envio vira o novo estado salvo.
    var PERSISTENT_SELECTOR = "#seasonal-form, #mascot-form, form.gallery-admin-item";
    var MODAL_IDS = ["contentModal", "managerModal"];
    var DISMISS_HANDLER = /closeModal|cancelForm|closeForm|closeManagerModal/;
    var ESTABLISHMENT_ACTION = /AdminEstablishmentsModule\.(openForm|viewDetails)\b/;
    var FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), ' +
        'select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    var SESSION_KEY = "sms-admin-last-activity";
    var SESSION_TIMEOUT_MS = 2 * 60 * 60 * 1000;
    var SESSION_WARNING_MS = 5 * 60 * 1000;

    var snapshots = new WeakMap();
    var modalReturnFocus = {};
    var replaying = false;
    var confirming = null;
    var sessionWarningShownFor = 0;

    // ---------- Estado dos formulários ----------
    function serialize(form) {
        var parts = [];
        Array.prototype.forEach.call(form.elements || [], function (el, index) {
            if (!el || !el.tagName) return;
            var type = String(el.type || "").toLowerCase();
            if (type === "submit" || type === "button" || type === "reset" || el.tagName === "FIELDSET") return;
            var key = el.name || el.id || (el.tagName + ":" + index);
            var value;
            if (type === "checkbox" || type === "radio") {
                value = el.checked ? "1" : "0";
            } else if (type === "file") {
                value = Array.prototype.map.call(el.files || [], function (file) { return file.name + ":" + file.size; }).join("|");
            } else if (el.tagName === "SELECT" && el.multiple) {
                value = Array.prototype.filter.call(el.options, function (option) { return option.selected; })
                    .map(function (option) { return option.value; }).join("|");
            } else {
                value = String(el.value == null ? "" : el.value);
            }
            parts.push(key + "=" + value);
        });
        return parts.join("\n");
    }

    function isShown(element) {
        if (!element || !element.isConnected) return false;
        return !!(element.offsetParent || element.getClientRects().length);
    }

    function ensureSnapshot(form) {
        if (form && !snapshots.has(form)) snapshots.set(form, serialize(form));
    }

    function markClean(form) {
        if (form) snapshots.set(form, serialize(form));
    }

    function isFormDirty(form) {
        return snapshots.has(form) && isShown(form) && serialize(form) !== snapshots.get(form);
    }

    function dirtyForms(scope) {
        return Array.prototype.filter.call(document.querySelectorAll(EDITOR_SELECTOR), function (form) {
            return (!scope || scope.contains(form)) && isFormDirty(form);
        });
    }

    function hasUnsavedChanges(scope) {
        return dirtyForms(scope).length > 0;
    }

    function discard(scope) {
        dirtyForms(scope).forEach(markClean);
    }

    function confirmDiscard() {
        if (confirming) return confirming;
        var feedback = window.AdminFeedback;
        var ask = feedback && typeof feedback.confirm === "function"
            ? feedback.confirm({
                title: "Descartar alterações?",
                message: "Você alterou este formulário e ainda não salvou. Se continuar, essas alterações serão perdidas.",
                confirmLabel: "Descartar alterações",
                cancelLabel: "Continuar editando",
                tone: "danger"
            })
            : Promise.resolve(window.confirm("Você alterou este formulário e ainda não salvou. Descartar as alterações?"));
        confirming = Promise.resolve(ask).then(function (ok) {
            confirming = null;
            return Boolean(ok);
        }, function () {
            confirming = null;
            return false;
        });
        return confirming;
    }

    // ---------- Primeiro contato com o formulário ----------
    function onFirstTouch(event) {
        var target = event.target;
        var form = target && typeof target.closest === "function" ? target.closest(EDITOR_SELECTOR) : null;
        if (form) ensureSnapshot(form);
    }

    function onSubmit(event) {
        var form = event.target;
        if (form && typeof form.matches === "function" && form.matches(PERSISTENT_SELECTOR)) markClean(form);
    }

    // ---------- Ações do usuário que descartariam o formulário ----------
    function dismissScope(element) {
        if (!element || typeof element.closest !== "function") return null;
        var modal = element.closest(".admin-modal");
        if (modal) {
            var isDismiss = element.classList.contains("admin-modal-backdrop") ||
                element.classList.contains("admin-modal-close") ||
                DISMISS_HANDLER.test(element.getAttribute("onclick") || "");
            return isDismiss ? modal : null;
        }
        var handler = element.getAttribute("onclick") || "";
        var establishmentForm = document.getElementById("establishmentForm");
        if (establishmentForm && !establishmentForm.contains(element) &&
            (ESTABLISHMENT_ACTION.test(handler) || /AdminEstablishmentsModule\.cancelForm/.test(handler))) {
            return establishmentForm;
        }
        if (establishmentForm && establishmentForm.contains(element) && /AdminEstablishmentsModule\.cancelForm/.test(handler)) {
            return establishmentForm;
        }
        return null;
    }

    function onClickCapture(event) {
        if (replaying) return;
        var target = event.target;
        var actionable = target && typeof target.closest === "function"
            ? target.closest("button, a, .admin-modal-backdrop")
            : null;
        var scope = dismissScope(actionable);
        if (!scope || !hasUnsavedChanges(scope)) return;
        event.preventDefault();
        event.stopPropagation();
        if (typeof event.stopImmediatePropagation === "function") event.stopImmediatePropagation();
        confirmDiscard().then(function (ok) {
            if (!ok) return;
            discard(scope);
            replaying = true;
            try { actionable.click(); } finally { replaying = false; }
        });
    }

    // ---------- Navegação entre seções ----------
    function currentSection() {
        return window.AdminNav && typeof window.AdminNav.getCurrentSection === "function"
            ? window.AdminNav.getCurrentSection()
            : "";
    }

    function closeOpenModals() {
        if (window.AdminContentCMS && typeof window.AdminContentCMS.closeModal === "function") {
            var content = document.getElementById("contentModal");
            if (content && !content.hidden) window.AdminContentCMS.closeModal();
        }
        var manager = document.getElementById("managerModal");
        if (manager && !manager.hidden) {
            if (typeof window.closeManagerModal === "function") window.closeManagerModal();
            else manager.hidden = true;
        }
    }

    function wrapShowSection() {
        var original = window.showSection;
        if (typeof original !== "function" || original.__unsavedGuard) return false;
        var guarded = function (section) {
            var args = arguments;
            var self = this;
            if (replaying || !hasUnsavedChanges()) {
                closeOpenModals();
                return original.apply(self, args);
            }
            var from = currentSection();
            confirmDiscard().then(function (ok) {
                if (!ok) {
                    // Voltar do navegador já trocou o endereço: devolve ao da seção atual.
                    if (from && window.location.hash !== "#" + from) {
                        try { window.history.pushState({ adminSection: from }, "", "#" + from); } catch (error) {}
                    }
                    return;
                }
                discard();
                closeOpenModals();
                replaying = true;
                try { original.apply(self, args); } finally { replaying = false; }
            });
            return undefined;
        };
        guarded.__unsavedGuard = true;
        guarded.__original = original;
        // Preserva o canal de opções do AdminNav (fromHistory, silentFocus...).
        Object.defineProperty(guarded, "__nextOptions", {
            get: function () { return original.__nextOptions; },
            set: function (value) { original.__nextOptions = value; }
        });
        window.showSection = guarded;
        return true;
    }

    function onBeforeUnload(event) {
        if (!hasUnsavedChanges()) return undefined;
        event.preventDefault();
        event.returnValue = "";
        return "";
    }

    // ---------- Modais: foco, Tab e Esc ----------
    function nativeDialogOpen() {
        return !!document.querySelector("dialog[open]");
    }

    function openModal() {
        for (var i = 0; i < MODAL_IDS.length; i++) {
            var modal = document.getElementById(MODAL_IDS[i]);
            if (modal && !modal.hidden && isShown(modal)) return modal;
        }
        return null;
    }

    function focusables(container) {
        return Array.prototype.filter.call(container.querySelectorAll(FOCUSABLE), isShown);
    }

    function focusIntoModal(modal) {
        var dialog = modal.querySelector(".admin-modal-dialog") || modal;
        var body = dialog.querySelector(".admin-modal-body") || dialog;
        var first = focusables(body).filter(function (el) {
            return !el.classList.contains("admin-modal-close");
        })[0] || focusables(dialog)[0];
        if (!dialog.hasAttribute("tabindex")) dialog.setAttribute("tabindex", "-1");
        try { (first || dialog).focus({ preventScroll: true }); } catch (error) {}
    }

    function watchModal(id) {
        var modal = document.getElementById(id);
        if (!modal || typeof MutationObserver !== "function") return;
        var wasOpen = !modal.hidden;
        var body = id === "contentModal" ? document.getElementById("contentModalBody") : null;
        new MutationObserver(function () {
            var open = !modal.hidden;
            if (open && !wasOpen) {
                modalReturnFocus[id] = document.activeElement;
                // Conteúdo novo: o formulário anterior não conta mais como alterado.
                Array.prototype.forEach.call(modal.querySelectorAll(EDITOR_SELECTOR), function (form) {
                    snapshots.delete(form);
                });
                setTimeout(function () { if (!modal.hidden) focusIntoModal(modal); }, 30);
            } else if (!open && wasOpen) {
                var back = modalReturnFocus[id];
                modalReturnFocus[id] = null;
                if (back && back.isConnected && typeof back.focus === "function" && !nativeDialogOpen()) {
                    try { back.focus({ preventScroll: true }); } catch (error) {}
                }
            }
            wasOpen = open;
        }).observe(modal, { attributes: true, attributeFilter: ["hidden"] });
        if (body) {
            // Troca de conteúdo com o modal já aberto (ex.: Prévia → Editar).
            new MutationObserver(function () {
                if (!modal.hidden && !modal.contains(document.activeElement)) focusIntoModal(modal);
            }).observe(body, { childList: true });
        }
    }

    function onKeydown(event) {
        if (nativeDialogOpen()) return;
        var modal = openModal();
        if (!modal) return;
        if (event.key === "Escape") {
            var close = modal.querySelector(".admin-modal-close");
            if (close) {
                event.preventDefault();
                close.click();
            }
            return;
        }
        if (event.key !== "Tab") return;
        var dialog = modal.querySelector(".admin-modal-dialog") || modal;
        var items = focusables(dialog);
        if (!items.length) {
            event.preventDefault();
            return;
        }
        var first = items[0];
        var last = items[items.length - 1];
        var active = document.activeElement;
        if (!dialog.contains(active)) {
            event.preventDefault();
            first.focus();
        } else if (event.shiftKey && active === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && active === last) {
            event.preventDefault();
            first.focus();
        }
    }

    // ---------- Aviso antes do fim da sessão por inatividade ----------
    function checkSession() {
        var dashboard = document.getElementById("dashboard");
        if (!dashboard || !dashboard.classList.contains("active")) return;
        var last = 0;
        try { last = Number(window.localStorage.getItem(SESSION_KEY)) || 0; } catch (error) { return; }
        if (!last) return;
        var remaining = SESSION_TIMEOUT_MS - (Date.now() - last);
        if (remaining > SESSION_WARNING_MS || remaining <= 0 || sessionWarningShownFor === last) return;
        sessionWarningShownFor = last;
        var unsaved = hasUnsavedChanges();
        var feedback = window.AdminFeedback;
        if (!feedback || typeof feedback.confirm !== "function") return;
        feedback.confirm({
            title: "Sua sessão vai expirar",
            message: "Por segurança, o painel encerra a sessão depois de duas horas sem uso. Faltam cerca de " +
                Math.max(1, Math.round(remaining / 60000)) + " minuto(s)." +
                (unsaved ? " Há alterações não salvas: salve antes de sair." : ""),
            confirmLabel: "Continuar conectado",
            hideCancel: true,
            tone: "primary"
        });
        // O clique no botão conta como atividade para o monitor de sessão do painel.
    }

    function watchLogout() {
        var dashboard = document.getElementById("dashboard");
        if (!dashboard || typeof MutationObserver !== "function") return;
        new MutationObserver(function () {
            // Saiu do painel (logout ou sessão expirada): não deixa modais abertos sobre o login.
            if (!dashboard.classList.contains("active")) closeOpenModals();
        }).observe(dashboard, { attributes: true, attributeFilter: ["class"] });
    }

    function init() {
        wrapShowSection();
        document.addEventListener("focusin", onFirstTouch, true);
        document.addEventListener("pointerdown", onFirstTouch, true);
        document.addEventListener("keydown", onFirstTouch, true);
        document.addEventListener("submit", onSubmit, true);
        document.addEventListener("click", onClickCapture, true);
        document.addEventListener("keydown", onKeydown);
        window.addEventListener("beforeunload", onBeforeUnload);
        MODAL_IDS.forEach(watchModal);
        watchLogout();
        window.setInterval(checkSession, 30000);
    }

    window.AdminUnsavedGuard = {
        hasUnsavedChanges: hasUnsavedChanges,
        confirmDiscard: confirmDiscard,
        markClean: markClean,
        discard: discard,
        _serialize: serialize
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init, { once: true });
    } else {
        init();
    }
})();
