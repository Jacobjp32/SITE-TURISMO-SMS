/**
 * admin-feedback.js — confirmações, campos de motivo e avisos do painel.
 * ---------------------------------------------------------------------
 * Substitui alert/confirm/prompt do navegador por componentes acessíveis
 * (<dialog> nativo + região aria-live). Nada é executado automaticamente:
 * cada chamada devolve uma Promise e quem chama decide o que fazer.
 *
 *   AdminFeedback.confirm({ title, message, details, confirmLabel, tone, requireText })
 *       → Promise<boolean>
 *   AdminFeedback.prompt({ title, message, label, value, multiline, required, ... })
 *       → Promise<string|null>   (null = cancelado)
 *   AdminFeedback.form({ title, message, fields:[{name,label,value,multiline,required,hint}] })
 *       → Promise<object|null>
 *   AdminFeedback.toast(message, type)   type: success | error | warning | info
 *
 * IIFE, sem build step.
 */
(function () {
    "use strict";

    if (window.AdminFeedback) return;

    var ICONS = {
        danger: '<path d="M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>',
        warning: '<path d="M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>',
        primary: '<circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v5h1"/>',
        success: '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
        error: '<circle cx="12" cy="12" r="9"/><path d="M12 8v5m0 3h.01"/>',
        info: '<circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v5h1"/>'
    };

    function icon(name) {
        return '<svg class="adm-fb-ico" viewBox="0 0 24 24" aria-hidden="true">' + (ICONS[name] || ICONS.info) + "</svg>";
    }

    function esc(value) {
        return String(value == null ? "" : value)
            .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    }

    // Texto simples com quebras de linha → parágrafos e listas "- item".
    function richText(text) {
        var blocks = String(text || "").split(/\n{2,}/);
        return blocks.map(function (block) {
            var lines = block.split("\n").filter(function (line) { return line.trim(); });
            if (!lines.length) return "";
            var bullets = lines.filter(function (line) { return /^\s*[-•]\s+/.test(line); });
            if (bullets.length === lines.length) {
                return "<ul>" + lines.map(function (line) {
                    return "<li>" + esc(line.replace(/^\s*[-•]\s+/, "")) + "</li>";
                }).join("") + "</ul>";
            }
            return "<p>" + lines.map(esc).join("<br>") + "</p>";
        }).join("");
    }

    /* ---------------- Fila de diálogos ---------------- */
    var queue = Promise.resolve();
    var idSeq = 0;

    function enqueue(run) {
        var result = queue.then(run, run);
        queue = result.then(function () {}, function () {});
        return result;
    }

    function openDialog(options) {
        return enqueue(function () {
            return new Promise(function (resolve) {
                var tone = options.tone || "primary";
                var uid = "admFb" + (++idSeq);
                var fields = options.fields || [];
                var dialog = document.createElement("dialog");
                dialog.className = "adm-dialog adm-dialog--" + tone;
                dialog.setAttribute("aria-labelledby", uid + "-title");
                dialog.setAttribute("aria-describedby", uid + "-body");

                var fieldsHtml = fields.map(function (field, index) {
                    var id = uid + "-f" + index;
                    var control = field.multiline
                        ? '<textarea id="' + id + '" name="' + esc(field.name) + '" rows="' + (field.rows || 3) + '"' +
                            (field.maxLength ? ' maxlength="' + field.maxLength + '"' : "") +
                            (field.placeholder ? ' placeholder="' + esc(field.placeholder) + '"' : "") + ">" + esc(field.value || "") + "</textarea>"
                        : '<input id="' + id + '" name="' + esc(field.name) + '" type="text" value="' + esc(field.value || "") + '"' +
                            (field.maxLength ? ' maxlength="' + field.maxLength + '"' : "") +
                            (field.placeholder ? ' placeholder="' + esc(field.placeholder) + '"' : "") +
                            ' autocomplete="off" spellcheck="false">';
                    return '<div class="adm-dialog-field">' +
                        '<label for="' + id + '">' + esc(field.label) +
                            (field.required ? ' <span class="adm-dialog-req">obrigatório</span>' : ' <span class="adm-dialog-opt">opcional</span>') +
                        "</label>" + control +
                        (field.hint ? '<small class="adm-dialog-hint">' + esc(field.hint) + "</small>" : "") +
                        '<small class="adm-dialog-error" hidden></small>' +
                    "</div>";
                }).join("");

                var detailsHtml = Array.isArray(options.details) && options.details.length
                    ? '<ul class="adm-dialog-details">' + options.details.map(function (item) { return "<li>" + esc(item) + "</li>"; }).join("") + "</ul>"
                    : "";

                dialog.innerHTML =
                    '<form method="dialog" class="adm-dialog-card" novalidate>' +
                        '<div class="adm-dialog-head">' +
                            '<span class="adm-dialog-badge">' + icon(tone) + "</span>" +
                            '<h2 id="' + uid + '-title">' + esc(options.title || "Confirmar ação") + "</h2>" +
                        "</div>" +
                        '<div class="adm-dialog-body" id="' + uid + '-body">' +
                            richText(options.message) + detailsHtml + fieldsHtml +
                        "</div>" +
                        '<div class="adm-dialog-actions">' +
                            (options.hideCancel ? "" : '<button type="button" class="adm-btn adm-btn-ghost" data-fb="cancel">' + esc(options.cancelLabel || "Cancelar") + "</button>") +
                            '<button type="submit" class="adm-btn ' + (tone === "danger" ? "adm-btn-danger" : "adm-btn-primary") + '" data-fb="ok">' +
                                esc(options.confirmLabel || "Confirmar") + "</button>" +
                        "</div>" +
                    "</form>";

                document.body.appendChild(dialog);
                var form = dialog.querySelector("form");
                var okBtn = dialog.querySelector('[data-fb="ok"]');
                var cancelBtn = dialog.querySelector('[data-fb="cancel"]');
                var inputs = Array.prototype.slice.call(dialog.querySelectorAll("input, textarea"));
                var returnFocus = document.activeElement;
                var settled = false;

                function finish(value) {
                    if (settled) return;
                    settled = true;
                    try { dialog.close(); } catch (e) { /* já fechado */ }
                    dialog.remove();
                    if (returnFocus && typeof returnFocus.focus === "function" && document.contains(returnFocus)) {
                        try { returnFocus.focus({ preventScroll: true }); } catch (e) { returnFocus.focus(); }
                    }
                    resolve(value);
                }

                function collect() {
                    var values = {};
                    var firstInvalid = null;
                    fields.forEach(function (field, index) {
                        var input = inputs[index];
                        var value = String(input.value || "").trim();
                        var error = input.parentNode.querySelector(".adm-dialog-error");
                        var message = "";
                        if (field.required && !value) message = field.requiredMessage || "Preencha este campo para continuar.";
                        if (!message && field.mustEqual && value.toLowerCase() !== String(field.mustEqual).trim().toLowerCase() &&
                            !(field.alsoAccept && value.toLowerCase() === String(field.alsoAccept).trim().toLowerCase())) {
                            message = field.mismatchMessage || "O texto digitado não confere.";
                        }
                        error.hidden = !message;
                        error.textContent = message;
                        input.setAttribute("aria-invalid", message ? "true" : "false");
                        if (message && !firstInvalid) firstInvalid = input;
                        values[field.name] = value;
                    });
                    if (firstInvalid) { firstInvalid.focus(); return null; }
                    return values;
                }

                // Confirmação por digitação: botão só habilita quando confere.
                var typed = fields.filter(function (field) { return field.mustEqual; });
                function syncTyped() {
                    if (!typed.length) return;
                    okBtn.disabled = typed.some(function (field) {
                        var input = inputs[fields.indexOf(field)];
                        var value = String(input.value || "").trim().toLowerCase();
                        return value !== String(field.mustEqual).trim().toLowerCase() &&
                            !(field.alsoAccept && value === String(field.alsoAccept).trim().toLowerCase());
                    });
                }
                inputs.forEach(function (input) { input.addEventListener("input", syncTyped); });
                syncTyped();

                form.addEventListener("submit", function (event) {
                    event.preventDefault();
                    if (!fields.length) return finish(true);
                    var values = collect();
                    if (values) finish(values);
                });
                if (cancelBtn) cancelBtn.addEventListener("click", function () { finish(fields.length ? null : false); });
                dialog.addEventListener("cancel", function (event) {
                    event.preventDefault();
                    finish(fields.length ? null : false);
                });
                // Clique fora do cartão cancela (exceto quando há texto digitado).
                dialog.addEventListener("mousedown", function (event) {
                    if (event.target !== dialog) return;
                    var dirty = inputs.some(function (input) { return String(input.value || "").trim(); });
                    if (!dirty) finish(fields.length ? null : false);
                });

                if (typeof dialog.showModal === "function") dialog.showModal();
                else dialog.setAttribute("open", "");

                // Ações perigosas começam com o foco em "Cancelar".
                var first = inputs[0] || (tone === "danger" && cancelBtn) || okBtn;
                setTimeout(function () { first.focus(); }, 30);
            });
        });
    }

    function confirmAction(options) {
        options = typeof options === "string" ? { message: options } : (options || {});
        if (options.requireText) {
            return openDialog(Object.assign({}, options, {
                fields: [{
                    name: "typed",
                    label: options.requireTextLabel || ('Digite "' + options.requireText + '" para confirmar'),
                    required: true,
                    mustEqual: options.requireText,
                    alsoAccept: options.alsoAcceptText,
                    mismatchMessage: "O texto digitado não confere."
                }]
            })).then(function (values) { return Boolean(values); });
        }
        return openDialog(options);
    }

    function promptText(options) {
        options = options || {};
        return openDialog(Object.assign({}, options, {
            fields: [{
                name: "value",
                label: options.label || "Texto",
                value: options.value,
                multiline: options.multiline !== false,
                required: Boolean(options.required),
                placeholder: options.placeholder,
                hint: options.hint,
                maxLength: options.maxLength,
                rows: options.rows
            }]
        })).then(function (values) { return values ? values.value : null; });
    }

    function formDialog(options) {
        return openDialog(options || {});
    }

    /* ---------------- Avisos (toasts) ---------------- */
    var region = null;
    var TITLES = { success: "Concluído", error: "Não foi possível concluir", warning: "Atenção", info: "Aviso" };

    function ensureRegion() {
        if (region && document.body.contains(region)) return region;
        region = document.createElement("div");
        region.className = "adm-toasts";
        region.setAttribute("role", "region");
        region.setAttribute("aria-label", "Avisos do painel");
        document.body.appendChild(region);
        return region;
    }

    function inferType(message) {
        var text = String(message || "").toLowerCase();
        if (/^erro|não foi possível|falha|negad|inválid|não encontrad|não inicializad|obrigatóri|selecione|informe|descreva/.test(text)) return "error";
        return "info";
    }

    function toast(message, type) {
        if (!message) return;
        type = type || inferType(message);
        if (["success", "error", "warning", "info"].indexOf(type) === -1) type = "info";
        var host = ensureRegion();
        var item = document.createElement("div");
        item.className = "adm-toast adm-toast--" + type;
        item.setAttribute("role", type === "error" ? "alert" : "status");
        item.innerHTML = icon(type) +
            '<div class="adm-toast-text"><strong>' + esc(TITLES[type]) + "</strong><span>" + esc(message) + "</span></div>" +
            '<button type="button" class="adm-toast-close" aria-label="Fechar aviso">&times;</button>';
        host.appendChild(item);
        while (host.children.length > 3) host.removeChild(host.firstChild);
        function dismiss() {
            item.classList.add("is-leaving");
            setTimeout(function () { item.remove(); }, 180);
        }
        item.querySelector(".adm-toast-close").addEventListener("click", dismiss);
        var timeout = type === "error" ? 9000 : 5000;
        var timer = setTimeout(dismiss, timeout);
        item.addEventListener("mouseenter", function () { clearTimeout(timer); });
        item.addEventListener("mouseleave", function () { timer = setTimeout(dismiss, 2500); });
        return item;
    }

    window.AdminFeedback = {
        confirm: confirmAction,
        prompt: promptText,
        form: formDialog,
        toast: toast
    };

    // Todos os avisos do painel passam pelo mesmo componente (o Portal do Usuário
    // continua com o aviso original, pois este arquivo só é carregado no admin).
    function adoptLegacyNotifications() {
        if (window.FirebaseSystem && typeof window.FirebaseSystem.showNotification === "function" &&
            !window.FirebaseSystem.showNotification.__adminFeedback) {
            var adopted = function (message, type) { return toast(message, type); };
            adopted.__adminFeedback = true;
            window.FirebaseSystem.showNotification = adopted;
        }
    }
    adoptLegacyNotifications();
    document.addEventListener("DOMContentLoaded", adoptLegacyNotifications);
})();
