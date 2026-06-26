/**
 * modules/banners.js — Admin CMS · Bloco 4C (CRUD inicial Banners / Pop-ups)
 * --------------------------------------------------------------------------
 * Substitui o placeholder `banners` por um módulo funcional em MODO RASCUNHO.
 * Collection Firestore: `banners` (rules do Bloco 4B já publicadas).
 *
 * Esta etapa PERMITE:
 *  - listar banners; filtrar por status e tipo;
 *  - criar rascunho (status sempre `draft`);
 *  - editar rascunho; arquivar (status `archived`); duplicar como rascunho;
 *  - ver detalhes básicos.
 *
 * Esta etapa NÃO faz (deliberadamente — etapas futuras):
 *  - upload de imagem / seleção de mídia;
 *  - publicar banner (botão exibido DESABILITADO);
 *  - exibição pública no site / pop-up público;
 *  - delete definitivo (rules já bloqueiam `delete`).
 *
 * Segurança: as Firestore Rules são a proteção REAL. A sanitização aqui é
 * apenas para evitar enviar lixo (undefined/NaN, URLs perigosas, enums
 * inválidos). Nunca confiar só no client.
 *
 * IIFE, sem build step, sem import/export. Namespace: window.AdminBannersModule.
 */
(function () {
    "use strict";

    if (window.AdminBannersModule) return;

    var COLLECTION = "banners";
    var SECTION_ID = "banners";

    // ---- Enums permitidos (espelham firestore.rules + doc 4/4B) ----
    var TYPES = ["banner", "popup"];
    var STATUSES = ["draft", "published", "archived"];
    var PLACEMENTS = ["home", "mapa", "eventos", "noticias", "sabores", "all", "custom"];
    var FREQUENCIES = ["always", "oncePerSession", "oncePerDay", "oncePerCampaign"];
    var CTA_TARGETS = ["_self", "_blank"];
    // Páginas reais do site (alvo de targetPages quando placement == custom).
    var TARGET_PAGES = ["index.html", "eventos.html", "mapa-turistico.html", "sabores.html", "noticias.html"];

    var LIMITS = {
        title: 120,
        slug: 80,
        description: 500,
        ctaLabel: 40,
        imageAlt: 160,
        url: 600
    };
    var PRIORITY_MIN = 0;
    var PRIORITY_MAX = 100;
    var SHOW_DELAY_MAX = 60000;
    var MAXWIDTH_MIN = 240;
    var MAXWIDTH_MAX = 960;

    // ---- Estado leve do módulo ----
    var state = {
        items: [],
        loading: false,
        error: "",
        permissionDenied: false,
        filterStatus: "all",
        filterType: "all"
    };

    // ======================================================================
    // Helpers seguros
    // ======================================================================

    function escapeHtml(value) {
        if (window.AdminUI && typeof window.AdminUI.escapeHtml === "function") {
            return window.AdminUI.escapeHtml(value);
        }
        return String(value == null ? "" : value)
            .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    }

    function escapeAttr(value) {
        return escapeHtml(value);
    }

    function escapeJs(value) {
        return String(value == null ? "" : value).replace(/\\/g, "\\\\").replace(/'/g, "\\'");
    }

    function clean(value) {
        return String(value == null ? "" : value).trim();
    }

    function limit(value, max) {
        var text = clean(value);
        return text.length > max ? text.slice(0, max) : text;
    }

    function ctx() {
        return window.AdminContext || null;
    }

    function getFirebase() {
        var c = ctx();
        if (c && c.firebase) return c.firebase;
        return typeof window.firebase !== "undefined" ? window.firebase : null;
    }

    function getDb() {
        var c = ctx();
        if (c && c.db) return c.db;
        if (window.firebaseDB && window.firebaseDB.db) return window.firebaseDB.db;
        return null;
    }

    function currentUid() {
        if (window.currentUser && window.currentUser.uid) return window.currentUser.uid;
        var c = ctx();
        if (c && c.currentUser && c.currentUser.uid) return c.currentUser.uid;
        return "";
    }

    function serverTimestamp() {
        var fb = getFirebase();
        try {
            return fb.firestore.FieldValue.serverTimestamp();
        } catch (e) {
            return null;
        }
    }

    function timestampFromMillis(millis) {
        var fb = getFirebase();
        try {
            return fb.firestore.Timestamp.fromMillis(millis);
        } catch (e) {
            return null;
        }
    }

    function toMillis(value) {
        if (window.AdminUI && typeof window.AdminUI.timestampToMillis === "function") {
            return window.AdminUI.timestampToMillis(value);
        }
        if (!value) return 0;
        if (typeof value.toMillis === "function") return value.toMillis();
        if (typeof value.seconds === "number") return value.seconds * 1000;
        var parsed = Date.parse(value);
        return Number.isFinite(parsed) ? parsed : 0;
    }

    function formatDateTime(value) {
        var millis = toMillis(value);
        return millis ? new Date(millis).toLocaleString("pt-BR") : "";
    }

    function formatDateShort(value) {
        var millis = toMillis(value);
        return millis ? new Date(millis).toLocaleDateString("pt-BR") : "";
    }

    function toast(message, type) {
        if (window.AdminUI && typeof window.AdminUI.showToast === "function") {
            return window.AdminUI.showToast(message, type);
        }
        if (window.FirebaseSystem && typeof window.FirebaseSystem.showNotification === "function") {
            return window.FirebaseSystem.showNotification(message, type);
        }
        return null;
    }

    function makeSlug(value) {
        var base = clean(value).normalize("NFD").replace(/[̀-ͯ]/g, "")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");
        return base.slice(0, LIMITS.slug) || "banner";
    }

    function makeId(title) {
        var slug = makeSlug(title);
        var suffix = Date.now().toString(36) + Math.floor(Math.random() * 1296).toString(36);
        return (slug + "-" + suffix).slice(0, 120);
    }

    // URL segura (mesmo espírito de isAllowedImageUrl do CMS legado).
    function isAllowedUrl(url) {
        var value = clean(url);
        if (!value) return false;
        if (/['"()\\<>]/.test(value)) return false;
        if (value.charAt(0) === "/" || /^(images|docs|videos|css|js)\//i.test(value)) return true;
        if (/\.html(\?|#|$)/i.test(value) && !/^[a-z]+:/i.test(value)) return true; // caminho interno tipo eventos.html
        return /^https?:\/\//i.test(value);
    }

    function inEnum(value, allowed, fallback) {
        return allowed.indexOf(value) !== -1 ? value : fallback;
    }

    function clampInt(value, min, max, fallback) {
        var num = Number(value);
        if (!Number.isFinite(num)) return fallback;
        num = Math.round(num);
        if (num < min) num = min;
        if (num > max) num = max;
        return num;
    }

    // datetime-local <-> millis
    function millisToInputValue(value) {
        var millis = toMillis(value);
        if (!millis) return "";
        var d = new Date(millis);
        function pad(n) { return (n < 10 ? "0" : "") + n; }
        return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) +
            "T" + pad(d.getHours()) + ":" + pad(d.getMinutes());
    }

    function inputValueToMillis(value) {
        var text = clean(value);
        if (!text) return 0;
        var parsed = Date.parse(text);
        return Number.isFinite(parsed) ? parsed : 0;
    }

    // ======================================================================
    // Firestore — leitura
    // ======================================================================

    function load(context) {
        var db = getDb();
        if (!db) {
            state.loading = false;
            state.error = "Firebase indisponível. Faça login no admin e tente novamente.";
            state.permissionDenied = false;
            renderList();
            return false;
        }

        state.loading = true;
        state.error = "";
        state.permissionDenied = false;
        renderList();

        // Admin lê todos (rules: isAdmin()). Sem orderBy no servidor para não
        // exigir índice composto: ordenamos no client por updatedAt desc.
        return db.collection(COLLECTION).get().then(function (snapshot) {
            var items = [];
            snapshot.forEach(function (doc) {
                var data = doc.data() || {};
                data.__id = doc.id;
                items.push(data);
            });
            items.sort(function (a, b) {
                return toMillis(b.updatedAt || b.createdAt) - toMillis(a.updatedAt || a.createdAt);
            });
            state.items = items;
            state.loading = false;
            state.error = "";
            renderList();
            return true;
        }).catch(function (error) {
            state.loading = false;
            state.items = [];
            var code = error && error.code ? error.code : "";
            if (code === "permission-denied") {
                state.permissionDenied = true;
                state.error = "As regras de banners ainda não parecem publicadas (ou seu usuário não é admin). " +
                    "Publique as Firestore Rules do Bloco 4B antes de usar este módulo.";
            } else {
                state.error = "Erro ao carregar banners. Verifique o console e tente novamente.";
            }
            console.warn("[admin-banners] Falha ao carregar banners.", error);
            renderList();
            return false;
        });
    }

    // ======================================================================
    // Render — shell + lista
    // ======================================================================

    function getSection() {
        return document.getElementById ? document.getElementById("section-" + SECTION_ID) : null;
    }

    function render(container, context) {
        var target = (container && container.nodeType === 1) ? container : getSection();
        if (!target) return null;
        target.innerHTML = buildShell();
        renderList();
        return target;
    }

    function buildShell() {
        return '' +
            '<div class="page-header">' +
                '<h1>📢 Banners / Pop-ups</h1>' +
                '<span class="badge badge-info">Rascunhos · sem publicação</span>' +
            '</div>' +

            '<div class="card">' +
                '<div class="card-header"><h2>Campanhas visuais</h2></div>' +
                '<p class="admin-helper-text">Gerencie campanhas e pop-ups do site (imagem, texto, CTA, período e páginas-alvo). ' +
                'Nesta etapa só é possível trabalhar em <strong>rascunho</strong>: publicar e enviar imagem chegam em etapas futuras.</p>' +
                '<div class="banners-toolbar" style="display:flex;flex-wrap:wrap;gap:0.75rem;align-items:flex-end;margin-top:0.75rem;">' +
                    '<div class="admin-field" style="margin:0;">' +
                        '<label for="bannersFilterStatus">Status</label>' +
                        buildSelect("bannersFilterStatus", [
                            { value: "all", label: "Todos" },
                            { value: "draft", label: "Rascunho" },
                            { value: "published", label: "Publicado" },
                            { value: "archived", label: "Arquivado" }
                        ], state.filterStatus, "AdminBannersModule.onFilterChange()") +
                    '</div>' +
                    '<div class="admin-field" style="margin:0;">' +
                        '<label for="bannersFilterType">Tipo</label>' +
                        buildSelect("bannersFilterType", [
                            { value: "all", label: "Todos" },
                            { value: "banner", label: "Banner" },
                            { value: "popup", label: "Pop-up" }
                        ], state.filterType, "AdminBannersModule.onFilterChange()") +
                    '</div>' +
                    '<div style="margin-left:auto;display:flex;gap:0.5rem;">' +
                        '<button class="btn-secondary" type="button" onclick="AdminBannersModule.refresh()">↻ Atualizar</button>' +
                        '<button class="btn-primary" type="button" onclick="AdminBannersModule.openForm()">➕ Novo rascunho</button>' +
                    '</div>' +
                '</div>' +
            '</div>' +

            '<div class="card">' +
                '<div id="banners-list"></div>' +
            '</div>';
    }

    function buildSelect(id, options, selected, onchange) {
        return '<select class="admin-input" id="' + id + '"' +
            (onchange ? ' onchange="' + onchange + '"' : '') + '>' +
            options.map(function (opt) {
                return '<option value="' + escapeAttr(opt.value) + '"' +
                    (opt.value === selected ? " selected" : "") + '>' + escapeHtml(opt.label) + '</option>';
            }).join("") +
            '</select>';
    }

    function filteredItems() {
        return state.items.filter(function (item) {
            var status = clean(item.status) || "draft";
            var type = clean(item.type) || "banner";
            if (state.filterStatus !== "all" && status !== state.filterStatus) return false;
            if (state.filterType !== "all" && type !== state.filterType) return false;
            return true;
        });
    }

    function statusBadge(status) {
        var map = {
            draft: { cls: "badge-warning", label: "Rascunho" },
            published: { cls: "badge-success", label: "Publicado" },
            archived: { cls: "badge-info", label: "Arquivado" }
        };
        var info = map[status] || { cls: "badge-info", label: status || "—" };
        return '<span class="badge ' + info.cls + '">' + escapeHtml(info.label) + '</span>';
    }

    function placementText(item) {
        var placement = clean(item.placement) || "—";
        if (placement === "custom" && Array.isArray(item.targetPages) && item.targetPages.length) {
            return escapeHtml(item.targetPages.join(", "));
        }
        return escapeHtml(placement);
    }

    function periodText(item) {
        var start = formatDateShort(item.startAt);
        var end = formatDateShort(item.endAt);
        if (!start && !end) return "—";
        return escapeHtml((start || "?") + " → " + (end || "?"));
    }

    function renderList() {
        var list = document.getElementById("banners-list");
        if (!list) return;

        if (state.loading) {
            if (window.AdminUI && window.AdminUI.showLoading) {
                window.AdminUI.showLoading(list, "Carregando banners...");
            } else {
                list.innerHTML = '<p style="text-align:center;padding:2rem;color:#888;">Carregando banners...</p>';
            }
            return;
        }

        if (state.error) {
            list.innerHTML = '<p style="text-align:center;padding:2rem;color:#b42318;">' + escapeHtml(state.error) + '</p>' +
                '<p style="text-align:center;"><button class="btn-secondary" type="button" onclick="AdminBannersModule.refresh()">Tentar novamente</button></p>';
            return;
        }

        var items = filteredItems();
        if (!items.length) {
            var msg = state.items.length
                ? "Nenhum banner para os filtros selecionados."
                : "Nenhum banner cadastrado ainda. Use “Novo rascunho” para começar.";
            list.innerHTML = '<p style="text-align:center;padding:2rem;color:#888;">' + escapeHtml(msg) + '</p>';
            return;
        }

        var rows = items.map(function (item) {
            var id = item.__id;
            var jsId = "'" + escapeJs(id) + "'";
            var isArchived = clean(item.status) === "archived";
            var actions = '' +
                '<button class="btn-secondary btn-sm" type="button" onclick="AdminBannersModule.openForm(' + jsId + ')">Editar</button> ' +
                '<button class="btn-secondary btn-sm" type="button" onclick="AdminBannersModule.viewDetails(' + jsId + ')">Detalhes</button> ' +
                '<button class="btn-secondary btn-sm" type="button" onclick="AdminBannersModule.duplicate(' + jsId + ')">Duplicar</button> ' +
                (isArchived
                    ? '<button class="btn-secondary btn-sm" type="button" disabled title="Já arquivado">Arquivar</button> '
                    : '<button class="btn-secondary btn-sm" type="button" onclick="AdminBannersModule.archive(' + jsId + ')">Arquivar</button> ') +
                '<button class="btn-secondary btn-sm" type="button" disabled title="Publicação disponível em etapa futura">Publicar</button>';

            return '<tr>' +
                '<td>' + escapeHtml(clean(item.title) || "(sem título)") + '<br><small style="color:#888;">' + escapeHtml(clean(item.slug)) + '</small></td>' +
                '<td>' + escapeHtml(clean(item.type) || "—") + '</td>' +
                '<td>' + statusBadge(clean(item.status) || "draft") + '</td>' +
                '<td>' + placementText(item) + '</td>' +
                '<td>' + escapeHtml(String(Number.isFinite(Number(item.priority)) ? Number(item.priority) : "—")) + '</td>' +
                '<td>' + periodText(item) + '</td>' +
                '<td>' + escapeHtml(formatDateTime(item.updatedAt)) + '</td>' +
                '<td class="banners-actions" style="white-space:nowrap;">' + actions + '</td>' +
            '</tr>';
        }).join("");

        list.innerHTML = '<div style="overflow-x:auto;"><table class="data-table">' +
            '<thead><tr>' +
                '<th>Título</th><th>Tipo</th><th>Status</th><th>Páginas</th>' +
                '<th>Prioridade</th><th>Período</th><th>Atualizado</th><th>Ações</th>' +
            '</tr></thead><tbody>' + rows + '</tbody></table></div>';
    }

    // ======================================================================
    // Filtros / refresh
    // ======================================================================

    function onFilterChange() {
        var statusEl = document.getElementById("bannersFilterStatus");
        var typeEl = document.getElementById("bannersFilterType");
        if (statusEl) state.filterStatus = statusEl.value;
        if (typeEl) state.filterType = typeEl.value;
        renderList();
    }

    function refresh() {
        load(ctx());
    }

    // ======================================================================
    // Modal (reusa o contentModal do AdminContentCMS quando disponível)
    // ======================================================================

    function openModal(title, html) {
        if (window.AdminContentCMS && typeof window.AdminContentCMS.openModal === "function") {
            window.AdminContentCMS.openModal(title, html);
            return true;
        }
        var modal = document.getElementById("contentModal");
        var body = document.getElementById("contentModalBody");
        var titleEl = document.getElementById("contentModalTitle");
        if (modal && body) {
            if (titleEl) titleEl.textContent = title;
            body.innerHTML = html;
            modal.hidden = false;
            return true;
        }
        return false;
    }

    function closeModal() {
        if (window.AdminContentCMS && typeof window.AdminContentCMS.closeModal === "function") {
            window.AdminContentCMS.closeModal();
            return;
        }
        var modal = document.getElementById("contentModal");
        var body = document.getElementById("contentModalBody");
        if (modal) modal.hidden = true;
        if (body) body.innerHTML = "";
    }

    function findItem(id) {
        for (var i = 0; i < state.items.length; i++) {
            if (state.items[i].__id === id) return state.items[i];
        }
        return null;
    }

    // ======================================================================
    // Formulário criar / editar
    // ======================================================================

    function openForm(id) {
        var item = id ? findItem(id) : null;
        var isEdit = !!item;
        openModal(isEdit ? "Editar rascunho" : "Novo rascunho", buildForm(item));
    }

    function fieldText(name, label, value, opts) {
        opts = opts || {};
        var type = opts.type || "text";
        return '<div class="admin-field' + (opts.full ? " full" : "") + '">' +
            '<label for="banner_' + name + '">' + escapeHtml(label) + '</label>' +
            '<input class="admin-input" id="banner_' + name + '" name="' + name + '" type="' + type + '" ' +
            'value="' + escapeAttr(value == null ? "" : String(value)) + '"' +
            (opts.required ? " required" : "") +
            (opts.maxlength ? ' maxlength="' + opts.maxlength + '"' : "") +
            (opts.min != null ? ' min="' + opts.min + '"' : "") +
            (opts.max != null ? ' max="' + opts.max + '"' : "") +
            '></div>';
    }

    function fieldTextarea(name, label, value, maxlength) {
        return '<div class="admin-field full">' +
            '<label for="banner_' + name + '">' + escapeHtml(label) + '</label>' +
            '<textarea class="admin-textarea" id="banner_' + name + '" name="' + name + '"' +
            (maxlength ? ' maxlength="' + maxlength + '"' : "") + '>' +
            escapeHtml(value == null ? "" : String(value)) + '</textarea></div>';
    }

    function fieldSelect(name, label, options, selected) {
        return '<div class="admin-field">' +
            '<label for="banner_' + name + '">' + escapeHtml(label) + '</label>' +
            '<select class="admin-input" id="banner_' + name + '" name="' + name + '">' +
            options.map(function (opt) {
                return '<option value="' + escapeAttr(opt.value) + '"' +
                    (opt.value === selected ? " selected" : "") + '>' + escapeHtml(opt.label) + '</option>';
            }).join("") + '</select></div>';
    }

    function buildForm(item) {
        item = item || {};
        var isEdit = !!item.__id;
        var targetPages = Array.isArray(item.targetPages) ? item.targetPages.join("\n") : "";

        var typeOptions = TYPES.map(function (t) {
            return { value: t, label: t === "banner" ? "Banner (faixa)" : "Pop-up (modal)" };
        });
        var placementOptions = PLACEMENTS.map(function (p) {
            var labels = { home: "Home", mapa: "Mapa", eventos: "Eventos", noticias: "Notícias", sabores: "Sabores", all: "Todas", custom: "Personalizado (targetPages)" };
            return { value: p, label: labels[p] || p };
        });
        var freqOptions = FREQUENCIES.map(function (f) {
            var labels = { always: "Sempre", oncePerSession: "1x por sessão", oncePerDay: "1x por dia", oncePerCampaign: "1x por campanha" };
            return { value: f, label: labels[f] || f };
        });
        var targetOptions = CTA_TARGETS.map(function (t) {
            return { value: t, label: t === "_self" ? "Mesma aba (_self)" : "Nova aba (_blank)" };
        });

        return '<form id="bannerForm" onsubmit="AdminBannersModule.submitForm(event);return false;">' +
            '<div class="admin-modal-body">' +
                '<input type="hidden" name="bannerId" value="' + escapeAttr(item.__id || "") + '">' +
                '<p class="admin-helper-text" style="margin-bottom:0.75rem;">Status fixo em <strong>rascunho</strong> nesta etapa. ' +
                'Imagem por upload e publicação chegam depois.</p>' +
                '<div class="admin-modal-grid">' +
                    fieldText("title", "Título *", item.title || "", { required: true, maxlength: LIMITS.title }) +
                    fieldSelect("type", "Tipo *", typeOptions, inEnum(clean(item.type), TYPES, "banner")) +
                    fieldSelect("placement", "Posição", placementOptions, inEnum(clean(item.placement), PLACEMENTS, "home")) +
                    fieldText("priority", "Prioridade (0–100)", item.priority != null ? item.priority : 50, { type: "number", min: PRIORITY_MIN, max: PRIORITY_MAX }) +
                    fieldSelect("frequency", "Frequência", freqOptions, inEnum(clean(item.frequency), FREQUENCIES, "always")) +
                    fieldText("showDelayMs", "Atraso do pop-up (ms)", item.showDelayMs != null ? item.showDelayMs : 0, { type: "number", min: 0, max: SHOW_DELAY_MAX }) +
                    fieldText("maxWidth", "Largura máx. pop-up (px)", item.maxWidth != null ? item.maxWidth : "", { type: "number", min: MAXWIDTH_MIN, max: MAXWIDTH_MAX }) +
                    fieldText("startAt", "Início", millisToInputValue(item.startAt), { type: "datetime-local" }) +
                    fieldText("endAt", "Fim", millisToInputValue(item.endAt), { type: "datetime-local" }) +
                    fieldText("ctaLabel", "Texto do botão (CTA)", item.ctaLabel || "", { maxlength: LIMITS.ctaLabel }) +
                    fieldText("ctaUrl", "Link do CTA", item.ctaUrl || "", { type: "url", maxlength: LIMITS.url }) +
                    fieldSelect("ctaTarget", "Abertura do CTA", targetOptions, inEnum(clean(item.ctaTarget), CTA_TARGETS, "_self")) +
                    fieldText("imageUrl", "Imagem (URL manual, opcional)", item.imageUrl || "", { type: "url", maxlength: LIMITS.url }) +
                    fieldText("imageAlt", "Texto alternativo da imagem", item.imageAlt || "", { maxlength: LIMITS.imageAlt }) +
                    '<div class="admin-field full"><label><input type="checkbox" name="dismissible" ' +
                        (item.dismissible === false ? "" : "checked") + '> Permitir fechar (dismissible)</label></div>' +
                    fieldTextarea("targetPages", "Páginas-alvo (uma por linha — só quando posição = personalizado)", targetPages) +
                    fieldTextarea("description", "Descrição / texto", item.description || "", LIMITS.description) +
                '</div>' +
            '</div>' +
            '<div class="admin-modal-footer">' +
                '<button class="btn-secondary" type="button" onclick="AdminBannersModule.cancelForm()">Cancelar</button>' +
                '<button class="btn-primary" type="submit">' + (isEdit ? "Salvar rascunho" : "Criar rascunho") + '</button>' +
            '</div>' +
        '</form>';
    }

    function cancelForm() {
        closeModal();
    }

    // Lê os campos do form e devolve {data, error}.
    function readForm(form) {
        function val(name) {
            var el = form.elements[name];
            return el ? el.value : "";
        }
        function checked(name) {
            var el = form.elements[name];
            return !!(el && el.checked);
        }

        var title = limit(val("title"), LIMITS.title);
        if (!title) return { error: "Informe o título do banner." };

        var type = inEnum(clean(val("type")), TYPES, "");
        if (!type) return { error: "Selecione um tipo válido (banner ou pop-up)." };

        var ctaUrl = limit(val("ctaUrl"), LIMITS.url);
        if (ctaUrl && !isAllowedUrl(ctaUrl)) {
            return { error: "Link do CTA inválido. Use http(s) ou um caminho interno permitido." };
        }
        var imageUrl = limit(val("imageUrl"), LIMITS.url);
        if (imageUrl && !isAllowedUrl(imageUrl)) {
            return { error: "URL da imagem inválida. Use http(s) ou um caminho interno permitido." };
        }

        var startMillis = inputValueToMillis(val("startAt"));
        var endMillis = inputValueToMillis(val("endAt"));
        if (startMillis && endMillis && endMillis <= startMillis) {
            return { error: "A data de fim deve ser maior que a de início." };
        }

        var priorityRaw = clean(val("priority"));
        if (priorityRaw !== "" && !Number.isFinite(Number(priorityRaw))) {
            return { error: "Prioridade deve ser um número." };
        }

        var placement = inEnum(clean(val("placement")), PLACEMENTS, "home");

        // targetPages: uma por linha, filtradas para páginas conhecidas.
        var targetPages = clean(val("targetPages")).split(/\r?\n/).map(function (line) {
            return clean(line);
        }).filter(function (line) {
            return line && TARGET_PAGES.indexOf(line) !== -1;
        });

        var data = {
            title: title,
            description: limit(val("description"), LIMITS.description),
            type: type,
            placement: placement,
            targetPages: targetPages,
            ctaLabel: limit(val("ctaLabel"), LIMITS.ctaLabel),
            ctaUrl: ctaUrl,
            ctaTarget: inEnum(clean(val("ctaTarget")), CTA_TARGETS, "_self"),
            imageUrl: imageUrl,
            imageAlt: limit(val("imageAlt"), LIMITS.imageAlt),
            priority: clampInt(priorityRaw === "" ? 50 : priorityRaw, PRIORITY_MIN, PRIORITY_MAX, 50),
            frequency: inEnum(clean(val("frequency")), FREQUENCIES, "always"),
            dismissible: checked("dismissible"),
            showDelayMs: clampInt(clean(val("showDelayMs")) === "" ? 0 : val("showDelayMs"), 0, SHOW_DELAY_MAX, 0),
            maxWidth: clean(val("maxWidth")) === "" ? null : clampInt(val("maxWidth"), MAXWIDTH_MIN, MAXWIDTH_MAX, null),
            startMillis: startMillis,
            endMillis: endMillis
        };
        return { data: data };
    }

    // Monta o payload final (apenas campos permitidos pelas rules).
    function buildPayload(form, base) {
        // base: documento original (em edição) ou null (criação).
        var data = form.data;
        var uid = currentUid();
        var isCreate = !base;

        var id = isCreate ? makeId(data.title) : base.__id;
        var slug = isCreate ? makeSlug(data.title) : (clean(base.slug) || makeSlug(data.title));

        var payload = {
            id: id,
            title: data.title,
            slug: slug,
            description: data.description,
            type: data.type,
            // status nunca vira 'published' por aqui. Criação = draft.
            status: isCreate ? "draft" : inEnum(clean(base.status), ["draft", "archived"], "draft"),
            placement: data.placement,
            targetPages: data.targetPages,
            imageUrl: data.imageUrl,
            imageAlt: data.imageAlt,
            ctaLabel: data.ctaLabel,
            ctaUrl: data.ctaUrl,
            ctaTarget: data.ctaTarget,
            startAt: data.startMillis ? timestampFromMillis(data.startMillis) : null,
            endAt: data.endMillis ? timestampFromMillis(data.endMillis) : null,
            priority: data.priority,
            frequency: data.frequency,
            dismissible: data.dismissible,
            showDelayMs: data.showDelayMs,
            maxWidth: data.maxWidth,
            updatedAt: serverTimestamp(),
            updatedBy: uid
        };

        if (isCreate) {
            payload.createdAt = serverTimestamp();
            payload.createdBy = uid;
        } else {
            payload.createdAt = base.createdAt;            // preservado (rules: imutável)
            payload.createdBy = base.createdBy || uid;     // preservado
            // Preserva imagePath/mediaId existentes (não há upload nesta etapa).
            if (clean(base.imagePath)) payload.imagePath = base.imagePath;
            if (clean(base.mediaId)) payload.mediaId = base.mediaId;
            if (base.publishedAt) payload.publishedAt = base.publishedAt;
            if (base.archivedAt) payload.archivedAt = base.archivedAt;
        }

        return { id: id, payload: payload };
    }

    function submitForm(event) {
        if (event && event.preventDefault) event.preventDefault();
        var form = event && event.target ? event.target : document.getElementById("bannerForm");
        if (!form) return;

        var parsed = readForm(form);
        if (parsed.error) {
            toast(parsed.error, "error");
            return;
        }

        var db = getDb();
        if (!db) {
            toast("Firebase indisponível.", "error");
            return;
        }
        var uid = currentUid();
        if (!uid) {
            toast("Sessão de admin não identificada. Faça login novamente.", "error");
            return;
        }

        var bannerId = clean(form.elements.bannerId ? form.elements.bannerId.value : "");
        var base = bannerId ? findItem(bannerId) : null;
        var built = buildPayload({ data: parsed.data }, base);

        var submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = "Salvando..."; }

        db.collection(COLLECTION).doc(built.id).set(built.payload).then(function () {
            closeModal();
            toast(base ? "Rascunho atualizado." : "Rascunho criado.", "success");
            return load(ctx());
        }).catch(function (error) {
            if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = base ? "Salvar rascunho" : "Criar rascunho"; }
            handleWriteError(error, "salvar o rascunho");
        });
    }

    // ======================================================================
    // Arquivar / duplicar / detalhes
    // ======================================================================

    function archive(id) {
        var item = findItem(id);
        if (!item) return;
        if (clean(item.status) === "archived") {
            toast("Este banner já está arquivado.", "info");
            return;
        }
        var ok = window.confirm('Arquivar "' + (clean(item.title) || "este banner") + '"? Ele sai de circulação mas não é apagado.');
        if (!ok) return;

        var db = getDb();
        if (!db) { toast("Firebase indisponível.", "error"); return; }
        var uid = currentUid();
        if (!uid) { toast("Sessão de admin não identificada.", "error"); return; }

        var payload = buildArchivePayload(item, uid);
        db.collection(COLLECTION).doc(item.__id).set(payload).then(function () {
            toast("Banner arquivado.", "success");
            return load(ctx());
        }).catch(function (error) {
            handleWriteError(error, "arquivar o banner");
        });
    }

    // Reaproveita os campos atuais, mudando apenas status/archivedAt/updated*.
    function buildArchivePayload(item, uid) {
        var payload = {
            id: item.__id,
            title: limit(item.title, LIMITS.title) || "(sem título)",
            slug: clean(item.slug) || makeSlug(item.title),
            description: limit(item.description, LIMITS.description),
            type: inEnum(clean(item.type), TYPES, "banner"),
            status: "archived",
            placement: inEnum(clean(item.placement), PLACEMENTS, "home"),
            targetPages: Array.isArray(item.targetPages) ? item.targetPages : [],
            imageUrl: clean(item.imageUrl),
            imageAlt: limit(item.imageAlt, LIMITS.imageAlt),
            ctaLabel: limit(item.ctaLabel, LIMITS.ctaLabel),
            ctaUrl: clean(item.ctaUrl),
            ctaTarget: inEnum(clean(item.ctaTarget), CTA_TARGETS, "_self"),
            startAt: item.startAt || null,
            endAt: item.endAt || null,
            priority: clampInt(item.priority, PRIORITY_MIN, PRIORITY_MAX, 50),
            frequency: inEnum(clean(item.frequency), FREQUENCIES, "always"),
            dismissible: item.dismissible !== false,
            showDelayMs: clampInt(item.showDelayMs, 0, SHOW_DELAY_MAX, 0),
            maxWidth: item.maxWidth != null ? clampInt(item.maxWidth, MAXWIDTH_MIN, MAXWIDTH_MAX, null) : null,
            createdAt: item.createdAt,
            createdBy: item.createdBy || uid,
            updatedAt: serverTimestamp(),
            updatedBy: uid,
            archivedAt: serverTimestamp()
        };
        if (clean(item.imagePath)) payload.imagePath = item.imagePath;
        if (clean(item.mediaId)) payload.mediaId = item.mediaId;
        if (item.publishedAt) payload.publishedAt = item.publishedAt;
        return payload;
    }

    function duplicate(id) {
        var item = findItem(id);
        if (!item) return;
        var db = getDb();
        if (!db) { toast("Firebase indisponível.", "error"); return; }
        var uid = currentUid();
        if (!uid) { toast("Sessão de admin não identificada.", "error"); return; }

        var newTitle = limit((clean(item.title) || "Banner") + " (cópia)", LIMITS.title);
        var newId = makeId(newTitle);
        var payload = {
            id: newId,
            title: newTitle,
            slug: makeSlug(newTitle),
            description: limit(item.description, LIMITS.description),
            type: inEnum(clean(item.type), TYPES, "banner"),
            status: "draft", // duplicata sempre nasce rascunho
            placement: inEnum(clean(item.placement), PLACEMENTS, "home"),
            targetPages: Array.isArray(item.targetPages) ? item.targetPages.slice() : [],
            // imageUrl manual pode ser copiada; imagePath/mediaId NÃO (vínculo de storage/mídia).
            imageUrl: clean(item.imageUrl),
            imageAlt: limit(item.imageAlt, LIMITS.imageAlt),
            ctaLabel: limit(item.ctaLabel, LIMITS.ctaLabel),
            ctaUrl: clean(item.ctaUrl),
            ctaTarget: inEnum(clean(item.ctaTarget), CTA_TARGETS, "_self"),
            startAt: item.startAt || null,
            endAt: item.endAt || null,
            priority: clampInt(item.priority, PRIORITY_MIN, PRIORITY_MAX, 50),
            frequency: inEnum(clean(item.frequency), FREQUENCIES, "always"),
            dismissible: item.dismissible !== false,
            showDelayMs: clampInt(item.showDelayMs, 0, SHOW_DELAY_MAX, 0),
            maxWidth: item.maxWidth != null ? clampInt(item.maxWidth, MAXWIDTH_MIN, MAXWIDTH_MAX, null) : null,
            createdAt: serverTimestamp(),
            createdBy: uid,
            updatedAt: serverTimestamp(),
            updatedBy: uid
            // publishedAt/archivedAt deliberadamente NÃO copiados.
        };

        db.collection(COLLECTION).doc(newId).set(payload).then(function () {
            toast("Banner duplicado como rascunho.", "success");
            return load(ctx());
        }).catch(function (error) {
            handleWriteError(error, "duplicar o banner");
        });
    }

    function viewDetails(id) {
        var item = findItem(id);
        if (!item) return;

        function row(label, value) {
            return '<tr><th style="text-align:left;white-space:nowrap;padding-right:1rem;">' + escapeHtml(label) + '</th>' +
                '<td>' + (value || "—") + '</td></tr>';
        }

        var html = '<div class="admin-modal-body"><table class="data-table"><tbody>' +
            row("ID", escapeHtml(item.__id)) +
            row("Título", escapeHtml(clean(item.title))) +
            row("Slug", escapeHtml(clean(item.slug))) +
            row("Tipo", escapeHtml(clean(item.type))) +
            row("Status", statusBadge(clean(item.status) || "draft")) +
            row("Posição", placementText(item)) +
            row("Prioridade", escapeHtml(String(item.priority != null ? item.priority : "—"))) +
            row("Frequência", escapeHtml(clean(item.frequency))) +
            row("Período", periodText(item)) +
            row("CTA", escapeHtml(clean(item.ctaLabel)) + (clean(item.ctaUrl) ? " → " + escapeHtml(clean(item.ctaUrl)) : "")) +
            row("Imagem (URL)", escapeHtml(clean(item.imageUrl))) +
            row("Texto alt.", escapeHtml(clean(item.imageAlt))) +
            row("Descrição", escapeHtml(clean(item.description))) +
            row("Criado em", escapeHtml(formatDateTime(item.createdAt))) +
            row("Atualizado em", escapeHtml(formatDateTime(item.updatedAt))) +
            '</tbody></table></div>' +
            '<div class="admin-modal-footer">' +
                '<button class="btn-secondary" type="button" onclick="AdminBannersModule.cancelForm()">Fechar</button>' +
                '<button class="btn-primary" type="button" onclick="AdminBannersModule.cancelForm();AdminBannersModule.openForm(\'' + escapeJs(item.__id) + '\')">Editar</button>' +
            '</div>';

        openModal("Detalhes do banner", html);
    }

    function handleWriteError(error, action) {
        var code = error && error.code ? error.code : "";
        if (code === "permission-denied") {
            toast("Permissão negada ao " + action + ". Verifique se as Firestore Rules do Bloco 4B estão publicadas e se você é admin.", "error");
        } else {
            toast("Erro ao " + action + ". Veja o console.", "error");
        }
        console.warn("[admin-banners] Falha ao " + action + ".", error);
    }

    // ======================================================================
    // Contrato do módulo + registro
    // ======================================================================

    var AdminBannersModule = {
        id: SECTION_ID,
        label: "Banners / Pop-ups",
        icon: "📢",
        requiredRole: "admin",
        master: false,
        navGroup: "Conteúdo",
        order: 40,

        render: render,
        load: load,
        dispose: function () {
            // Sem listeners/timers globais próprios: nada a limpar.
        },

        // Atalho usado pelo showSection: garante shell + recarrega lista.
        activate: function (context) {
            render(getSection(), context || ctx());
            load(context || ctx());
        },

        // Ações expostas para os handlers inline.
        openForm: openForm,
        submitForm: submitForm,
        cancelForm: cancelForm,
        archive: archive,
        duplicate: duplicate,
        viewDetails: viewDetails,
        onFilterChange: onFilterChange,
        refresh: refresh,

        // Introspecção para smoke tests.
        _state: state,
        _readForm: readForm,
        _buildPayload: buildPayload,
        _isAllowedUrl: isAllowedUrl,
        _makeSlug: makeSlug
    };

    // Registro imediato (admin-registry.js já carregou). Carregar ESTE script
    // ANTES de placeholder.js garante que o módulo real vença o placeholder.
    if (window.AdminRegistry && typeof window.AdminRegistry.register === "function") {
        window.AdminRegistry.register(AdminBannersModule);
    }

    window.AdminBannersModule = AdminBannersModule;
})();
