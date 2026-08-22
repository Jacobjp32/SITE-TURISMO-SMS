/* Funcoes puras compartilhadas pelo CRUD Rotas e pelos testes node:test. */
(function (root) {
    "use strict";
    if (root.AdminRoutesHelpers) return;

    var LIMITS = { id: 80, slug: 80, name: 160, category: 120, description: 4000, icon: 32, alt: 300, tags: 30 };
    var STATUSES = ["draft", "published", "archived"];

    function clean(value) { return String(value == null ? "" : value).trim(); }
    function slugify(value) {
        return clean(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
            .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, LIMITS.slug);
    }
    function unique(values) {
        var seen = {}; return (Array.isArray(values) ? values : []).filter(function (value) {
            value = clean(value); if (!value || seen[value]) return false; seen[value] = true; return true;
        });
    }
    function parseTags(value) { return unique(Array.isArray(value) ? value : clean(value).split(",")); }
    function isValidId(value) { return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(clean(value)) && clean(value).length <= LIMITS.id; }
    function isValidSlug(value) { return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(clean(value)) && clean(value).length <= LIMITS.slug; }
    function normalizeCover(value) {
        value = value && typeof value === "object" ? value : {};
        return { mediaId: clean(value.mediaId), url: clean(value.url), path: clean(value.path), alt: clean(value.alt) };
    }
    function serializeForm(raw, existing) {
        raw = raw || {}; existing = existing || {};
        return {
            id: clean(existing.id || raw.id), slug: clean(raw.slug), name: clean(raw.name), category: clean(raw.category),
            description: clean(raw.description), color: clean(raw.color), icon: clean(raw.icon),
            status: clean(existing.status || "draft"), displayOrder: Number(raw.displayOrder),
            cover: normalizeCover({ mediaId: raw.coverMediaId, url: raw.coverUrl, path: raw.coverPath, alt: raw.coverAlt }),
            tags: parseTags(raw.tags), createdAt: existing.createdAt || null, createdBy: clean(existing.createdBy),
            updatedAt: existing.updatedAt || null, updatedBy: clean(existing.updatedBy),
            publishedAt: existing.publishedAt || null, publishedBy: clean(existing.publishedBy),
            archivedAt: existing.archivedAt || null, archivedBy: clean(existing.archivedBy)
        };
    }
    function validateRoute(route, options) {
        options = options || {}; var errors = {};
        if (!isValidId(route.id)) errors.id = "Use letras minúsculas, números e hífens no ID técnico.";
        if (!isValidSlug(route.slug)) errors.slug = "Slug inválido. Use letras minúsculas, números e hífens.";
        ["name", "category", "description", "icon"].forEach(function (key) {
            if (!clean(route[key])) errors[key] = "Campo obrigatório.";
            else if (clean(route[key]).length > LIMITS[key]) errors[key] = "Limite de caracteres excedido.";
        });
        if (!/^#[0-9a-fA-F]{6}$/.test(clean(route.color))) errors.color = "Informe uma cor hexadecimal no formato #123abc.";
        if (!Number.isInteger(route.displayOrder) || route.displayOrder < 0 || route.displayOrder > 100000) errors.displayOrder = "Informe uma ordem inteira entre 0 e 100000.";
        if (!STATUSES.includes(route.status)) errors.status = "Status inválido.";
        if (route.tags.length > LIMITS.tags || route.tags.some(function (tag) { return tag.length > 120; })) errors.tags = "Use até 30 tags de até 120 caracteres.";
        if (route.cover.mediaId.length > 200 || route.cover.url.length > 2048 || route.cover.path.length > 1024 || route.cover.alt.length > LIMITS.alt) errors.cover = "Dados da capa inválidos.";
        if (route.status === "published" && (!route.cover.alt || (!route.cover.url && !route.cover.mediaId))) errors.cover = "Uma rota publicada precisa de capa e texto alternativo.";
        if (options.slugLocked && route.slug !== clean(options.originalSlug)) errors.slug = "O slug é permanente após a primeira publicação.";
        return { valid: Object.keys(errors).length === 0, errors: errors };
    }
    function associationDiff(original, next) {
        var before = unique(original), after = unique(next);
        return { originalSelectedIds: before, newSelectedIds: after,
            addedEstablishmentIds: after.filter(function (id) { return !before.includes(id); }),
            removedEstablishmentIds: before.filter(function (id) { return !after.includes(id); }),
            unchangedEstablishmentIds: after.filter(function (id) { return before.includes(id); }) };
    }
    function mergeRouteId(existing, routeId, selected) {
        var values = Array.isArray(existing) ? existing.slice() : [];
        return unique(selected ? values.concat([routeId]) : values.filter(function (id) { return id !== routeId; }));
    }
    function mediaMatchesCover(media, cover) {
        media = media || {}; cover = normalizeCover(cover);
        return !!((cover.mediaId && clean(media.id) === cover.mediaId) || (cover.path && clean(media.storagePath || media.path) === cover.path) || (cover.url && clean(media.url) === cover.url));
    }
    function actionSet(route) {
        var status = clean(route && route.status) || "draft";
        return status === "published" ? ["edit", "preview", "unpublish", "archive"] : status === "archived" ? ["preview"] : ["edit", "preview", "publish", "archive"];
    }
    function sortAndFilter(items, status, query) {
        query = clean(query).toLowerCase();
        return (items || []).filter(function (item) {
            return (status === "all" || item.status === status) && (!query || (clean(item.name) + " " + clean(item.slug)).toLowerCase().includes(query));
        }).slice().sort(function (a, b) { return Number(a.displayOrder) - Number(b.displayOrder) || clean(a.name).localeCompare(clean(b.name), "pt-BR") || clean(a.id).localeCompare(clean(b.id)); });
    }
    root.AdminRoutesHelpers = { LIMITS: LIMITS, STATUSES: STATUSES, clean: clean, slugify: slugify, unique: unique, parseTags: parseTags, isValidId: isValidId, isValidSlug: isValidSlug, normalizeCover: normalizeCover, serializeForm: serializeForm, validateRoute: validateRoute, associationDiff: associationDiff, mergeRouteId: mergeRouteId, mediaMatchesCover: mediaMatchesCover, actionSet: actionSet, sortAndFilter: sortAndFilter };
})(typeof window !== "undefined" ? window : globalThis);
