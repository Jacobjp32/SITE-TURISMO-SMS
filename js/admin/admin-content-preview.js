/**
 * admin-content-preview.js — prévia de notícias e eventos como no portal.
 * ----------------------------------------------------------------------
 * Reproduz, com classes próprias (prefixo pv-), os cartões e páginas que o
 * portal monta para notícias (noticias.html / noticia.html) e eventos
 * (eventos.html e "Acontece em breve" da home). Não grava nada e não altera
 * o modelo de dados: lê os campos do formulário que já existe.
 *
 *   AdminContentPreview.newsFromForm(form, existing)  → dados normalizados
 *   AdminContentPreview.eventFromForm(form, existing, coverUrl)
 *   AdminContentPreview.render("news" | "event", data) → HTML
 *   AdminContentPreview.checks("news" | "event", data) → [{tone, text}]
 */
(function () {
    "use strict";

    if (window.AdminContentPreview) return;

    var NEWS_FALLBACK_IMAGE = "images/FOTO_GERAL_SAO_MATEUS_DO_SUL.jpg";
    var MONTHS = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
    var MONTHS_SHORT = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];
    var DAYS = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
    var DAYS_SHORT = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];

    function esc(value) {
        return String(value == null ? "" : value)
            .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    }

    function clean(value) {
        return String(value == null ? "" : value).replace(/\s+/g, " ").trim();
    }

    // Somente http(s), caminhos relativos do site e blob: (upload local).
    function safeUrl(value) {
        var url = clean(value);
        if (!url) return "";
        if (/^(https?:|blob:)/i.test(url)) return url;
        if (/^(\/|images\/|\.\/)/i.test(url) && !/^\/\//.test(url)) return url;
        return "";
    }

    function parseDate(value) {
        var text = clean(value);
        if (!text) return null;
        var match = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (match) return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12);
        var parsed = new Date(text);
        return isNaN(parsed.getTime()) ? null : parsed;
    }

    function longDate(date) {
        return date ? date.getDate() + " de " + MONTHS[date.getMonth()] + " de " + date.getFullYear() : "";
    }

    function paragraphs(text) {
        return String(text || "").split(/\n{2,}/).map(function (block) {
            var line = block.trim();
            return line ? "<p>" + esc(line).replace(/\n/g, "<br>") + "</p>" : "";
        }).join("");
    }

    function field(form, name) {
        var input = form && form.elements ? form.elements[name] : null;
        if (!input) return "";
        if (input.type === "checkbox") return input.checked;
        return input.value;
    }

    function newsFromForm(form, existing) {
        existing = existing || {};
        return {
            kind: "news",
            title: clean(field(form, "titulo")),
            slug: clean(field(form, "slug")),
            category: clean(field(form, "categoria")) || "Turismo",
            date: parseDate(field(form, "publishedAt")),
            image: safeUrl(field(form, "imagem")),
            imageRaw: clean(field(form, "imagem")),
            summary: String(field(form, "resumo") || "").trim(),
            content: String(field(form, "conteudo") || "").trim(),
            gallery: String(field(form, "galeria") || "").split(/\n+/).map(safeUrl).filter(Boolean),
            featured: Boolean(field(form, "destaque")),
            sourceUrl: clean(field(form, "linkOrigem")),
            publish: field(form, "publicado") === "true",
            wasPublished: existing.publicado === true || existing.status === "publicado"
        };
    }

    function newsFromItem(item) {
        item = item || {};
        return {
            kind: "news",
            title: clean(item.titulo),
            slug: clean(item.slug),
            category: clean(item.categoria) || "Turismo",
            date: parseDate(item.publishedAt || item.data),
            image: safeUrl(item.imagem),
            imageRaw: clean(item.imagem),
            summary: String(item.resumo || "").trim(),
            content: String(item.conteudo || "").trim(),
            gallery: (Array.isArray(item.galeria) ? item.galeria : []).map(safeUrl).filter(Boolean),
            featured: Boolean(item.destaque),
            sourceUrl: clean(item.linkOrigem),
            publish: true,
            wasPublished: item.publicado === true || item.status === "publicado"
        };
    }

    function eventFromForm(form, existing, coverUrl) {
        existing = existing || {};
        return {
            kind: "event",
            title: clean(field(form, "title")),
            date: parseDate(field(form, "date")),
            time: clean(field(form, "time")),
            location: clean(field(form, "location")),
            organizer: clean(field(form, "organizer")),
            category: clean(field(form, "category")) || "cultural",
            image: safeUrl(coverUrl),
            imageRaw: clean(coverUrl),
            description: String(field(form, "description") || "").trim(),
            featured: Boolean(field(form, "destaque")),
            publish: field(form, "publicado") === "true",
            wasPublished: Boolean(existing.id) && (existing.publicado === true || (existing.publicado !== false && existing.status !== "rascunho"))
        };
    }

    function eventFromItem(item, coverUrl) {
        item = item || {};
        return {
            kind: "event",
            title: clean(item.title || item.nome || item.titulo),
            date: parseDate(item.date || item.data || item.dataInicio),
            time: clean(item.time || item.hora || item.horario),
            location: clean(item.location || item.local || item.establishmentName),
            organizer: clean(item.organizer || item.organizador || item.ownerName),
            category: clean(item.category || item.categoria) || "cultural",
            image: safeUrl(coverUrl),
            imageRaw: clean(coverUrl),
            description: String(item.description || item.descricao || "").trim(),
            featured: Boolean(item.destaque),
            publish: true,
            wasPublished: false
        };
    }

    /* ---------------- Checagens editoriais ---------------- */
    function checks(kind, data) {
        var list = [];
        function add(tone, text) { list.push({ tone: tone, text: text }); }
        if (!data.title) add("bad", "Sem título — o portal exibiria um cartão vazio.");
        else if (data.title.length > 95) add("warn", "Título longo (" + data.title.length + " caracteres): pode quebrar em várias linhas no celular.");
        if (data.imageRaw && !data.image) add("bad", "O endereço da imagem não é válido (use https:// ou uma imagem da biblioteca).");
        if (kind === "news") {
            if (!data.image) add("warn", "Sem foto de capa: o portal usa a foto geral de São Mateus do Sul.");
            if (!data.summary) add("warn", "Sem resumo: a lista de notícias fica sem texto de chamada.");
            else if (data.summary.length > 260) add("warn", "Resumo longo (" + data.summary.length + " caracteres): o ideal é até 200.");
            if (!data.content && !data.sourceUrl) add("warn", "Sem conteúdo e sem link de origem: a página da notícia fica vazia.");
            if (!data.date) add("warn", "Data de publicação não reconhecida.");
        } else {
            if (!data.date) add("bad", "Sem data válida — eventos sem data não aparecem na agenda.");
            else {
                var today = new Date(); today.setHours(0, 0, 0, 0);
                if (data.date < today) add("warn", "A data já passou: o evento não aparece em “Acontece em breve”.");
            }
            if (!data.location) add("warn", "Sem local informado.");
            if (!data.time) add("info", "Sem horário: o cartão mostra só o dia.");
            if (!data.image) add("info", "Sem foto: o detalhe do evento aparece sem imagem.");
            if (!data.description) add("warn", "Sem descrição para o visitante.");
        }
        if (!list.length) add("ok", "Tudo certo para publicar.");
        return list;
    }

    function renderChecks(items) {
        return '<ul class="pv-checks">' + items.map(function (item) {
            return '<li data-tone="' + esc(item.tone) + '">' + esc(item.text) + "</li>";
        }).join("") + "</ul>";
    }

    /* ---------------- Notícias ---------------- */
    function renderNews(data) {
        var cover = data.image || NEWS_FALLBACK_IMAGE;
        var dateText = longDate(data.date) || "Data a definir";
        var excerpt = data.summary || "";
        var card =
            '<article class="pv-post-card">' +
                '<div class="pv-post-image" style="background-image:url(&quot;' + esc(cover) + '&quot;)"></div>' +
                '<div class="pv-post-content">' +
                    '<span class="pv-post-category">' + esc(data.category) + "</span>" +
                    '<h3 class="pv-post-title">' + esc(data.title || "Título da notícia") + "</h3>" +
                    (excerpt ? '<p class="pv-post-excerpt">' + esc(excerpt) + "</p>" : '<p class="pv-post-excerpt pv-missing">Sem resumo.</p>') +
                    '<div class="pv-post-meta"><span>' + esc(dateText) + '</span><span class="pv-post-link">Ler notícia →</span></div>' +
                "</div>" +
            "</article>";
        var gallery = data.gallery.length
            ? '<div class="pv-article-gallery">' + data.gallery.slice(0, 6).map(function (url) {
                return '<img src="' + esc(url) + '" alt="" loading="lazy" onerror="this.remove()">';
            }).join("") + "</div>"
            : "";
        var page =
            '<article class="pv-article">' +
                '<span class="pv-back">← Voltar para Notícias</span>' +
                '<span class="pv-article-category">' + esc(data.category) + "</span>" +
                '<h1 class="pv-article-title">' + esc(data.title || "Título da notícia") + "</h1>" +
                '<div class="pv-article-meta"><span>' + esc(dateText) + "</span><span>Departamento de Turismo</span></div>" +
                '<img class="pv-article-image" src="' + esc(cover) + '" alt="" onerror="this.classList.add(\'is-broken\')">' +
                '<div class="pv-article-content">' +
                    (data.content ? paragraphs(data.content) : '<p class="pv-missing">Sem conteúdo.</p>') +
                    gallery +
                    (data.sourceUrl ? '<p><span class="pv-link">Fonte/origem da notícia</span></p>' : "") +
                "</div>" +
            "</article>";
        return frame([
            { id: "list", label: "Lista de notícias", html: '<div class="pv-news-list">' + card + "</div>" },
            { id: "page", label: "Página da notícia", html: page }
        ]);
    }

    /* ---------------- Eventos ---------------- */
    function renderEvent(data) {
        var d = data.date;
        var day = d ? d.getDate() : "--";
        var monthShort = d ? MONTHS_SHORT[d.getMonth()] : "---";
        var dow = d ? DAYS_SHORT[d.getDay()] : "";
        var dateLong = d ? d.getDate() + " · " + MONTHS[d.getMonth()] + " · " + d.getFullYear() + " (" + DAYS_SHORT[d.getDay()].toLowerCase() + ")" : "Data a definir";
        var categoryClass = esc(String(data.category || "").toLowerCase());
        var agenda =
            '<div class="pv-ev-card ' + categoryClass + (data.featured ? " destaque" : "") + '">' +
                '<div class="pv-ev-data"><div class="dia">' + esc(day) + '</div><div class="mes">' + esc(monthShort) + '</div><div class="dow">' + esc(dow) + "</div></div>" +
                '<div class="pv-ev-info"><h4>' + (data.featured ? "★ " : "") + esc(data.title || "Título do evento") +
                    (data.featured ? '<span class="pv-badge-dest">destaque</span>' : "") + "</h4>" +
                    '<div class="pv-ev-meta"><span>' + esc(data.time || "Horário a definir") + "</span><span>" + esc(data.location || "Local a definir") + "</span></div>" +
                "</div>" +
                '<span class="pv-btn-ver">Ver mais</span>' +
            "</div>";
        var home =
            '<article class="pv-home-event">' +
                '<div class="pv-home-event-date"><strong>' + esc(day) + "</strong><span>" + esc(monthShort) + "</span></div>" +
                '<div class="pv-home-event-body">' +
                    '<span class="pv-home-event-badge">' + esc(data.category || "Evento") + "</span>" +
                    "<h3>" + esc(data.title || "Título do evento") + "</h3>" +
                    "<p>" + esc(d ? DAYS[d.getDay()] : "Dia a definir") + (data.time ? " · " + esc(data.time) : "") + "</p>" +
                    (data.location ? '<p class="pv-home-event-place">' + esc(data.location) + "</p>" : "") +
                    '<span class="pv-home-event-link">Ver detalhes</span>' +
                "</div>" +
            "</article>";
        var detail =
            '<div class="pv-ev-modal">' +
                '<div class="pv-ev-modal-head"><h3>' + (data.featured ? "★ " : "") + esc(data.title || "Título do evento") + '</h3><span aria-hidden="true">×</span></div>' +
                '<div class="pv-ev-modal-body">' +
                    (data.image ? '<img src="' + esc(data.image) + '" alt="" onerror="this.classList.add(\'is-broken\')">' : '<p class="pv-missing pv-noimg">Sem foto: o detalhe aparece sem imagem.</p>') +
                    row("Data", dateLong) +
                    row("Horário", data.time || "—") +
                    row("Local", data.location || "—") +
                    (data.organizer ? row("Organizador", data.organizer) : "") +
                    (data.description ? '<div class="pv-ev-desc">' + paragraphs(data.description) + "</div>" : "") +
                "</div>" +
            "</div>";
        return frame([
            { id: "agenda", label: "Agenda de eventos", html: '<div class="pv-agenda">' + agenda + "</div>" },
            { id: "home", label: "Home · Acontece em breve", html: '<div class="pv-home-grid">' + home + "</div>" },
            { id: "detail", label: "Detalhe do evento", html: detail }
        ]);
    }

    function row(label, value) {
        return '<div class="pv-ev-row"><div class="pv-ev-label">' + esc(label) + "</div><div>" + esc(value) + "</div></div>";
    }

    var frameSeq = 0;
    function frame(views) {
        var uid = "pv" + (++frameSeq);
        return '<div class="pv-frame" data-pv-frame>' +
            '<div class="pv-toolbar">' +
                '<div class="pv-tabs" role="tablist" aria-label="Onde aparece">' + views.map(function (view, index) {
                    return '<button type="button" role="tab" id="' + uid + "-t" + index + '" aria-controls="' + uid + "-p" + index + '" aria-selected="' + (index === 0) + '" data-pv-tab="' + index + '">' + esc(view.label) + "</button>";
                }).join("") + "</div>" +
                '<div class="pv-device" role="group" aria-label="Tamanho da tela">' +
                    '<button type="button" data-pv-device="desktop" aria-pressed="true">Computador</button>' +
                    '<button type="button" data-pv-device="mobile" aria-pressed="false">Celular</button>' +
                "</div>" +
            "</div>" +
            '<div class="pv-stage">' + views.map(function (view, index) {
                return '<div class="pv-view" role="tabpanel" id="' + uid + "-p" + index + '" aria-labelledby="' + uid + "-t" + index + '"' + (index ? " hidden" : "") + ">" +
                    '<div class="pv-site">' + view.html + "</div></div>";
            }).join("") + "</div>" +
        "</div>";
    }

    // Interação das abas/dispositivo por delegação (funciona em qualquer modal).
    document.addEventListener("click", function (event) {
        var tab = event.target.closest && event.target.closest("[data-pv-tab]");
        var device = event.target.closest && event.target.closest("[data-pv-device]");
        var root = (tab || device) && (tab || device).closest("[data-pv-frame]");
        if (!root) return;
        if (tab) {
            var index = tab.getAttribute("data-pv-tab");
            Array.prototype.forEach.call(root.querySelectorAll("[data-pv-tab]"), function (btn) {
                btn.setAttribute("aria-selected", String(btn === tab));
            });
            Array.prototype.forEach.call(root.querySelectorAll(".pv-view"), function (view, i) {
                view.hidden = String(i) !== index;
            });
        }
        if (device) {
            var mode = device.getAttribute("data-pv-device");
            root.classList.toggle("is-mobile", mode === "mobile");
            Array.prototype.forEach.call(root.querySelectorAll("[data-pv-device]"), function (btn) {
                btn.setAttribute("aria-pressed", String(btn === device));
            });
        }
    });

    window.AdminContentPreview = {
        newsFromForm: newsFromForm,
        newsFromItem: newsFromItem,
        eventFromForm: eventFromForm,
        eventFromItem: eventFromItem,
        checks: checks,
        renderChecks: renderChecks,
        render: function (kind, data) { return kind === "news" ? renderNews(data) : renderEvent(data); }
    };
})();
