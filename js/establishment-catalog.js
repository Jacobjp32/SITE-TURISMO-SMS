(function(window) {
    'use strict';

    var CMS_SOURCE = 'cms_establishments';
    var AUTHORITATIVE_STATES = {
        SUCCESS: true,
        AUTHORITATIVE_EMPTY: true,
        AUTHORITATIVE_PARTIAL: true,
        AUTHORITATIVE_INVALID: true
    };
    var catalogCache = null;
    var claimableIdsCache = Object.create(null);
    var lastResult = null;
    var authoritativeReadSequence = 0;

    function ensureArray(value) {
        return Array.isArray(value) ? value : [];
    }

    function cleanLabel(value) {
        return String(value == null ? '' : value)
            .replace(/[\u0000-\u001F\u007F]+/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    function pickFirst(values) {
        for (var i = 0; i < values.length; i += 1) {
            var value = cleanLabel(values[i]);
            if (value) return value;
        }
        return '';
    }

    function publicImageUrls(item) {
        var urls = [];
        var mainImage = cleanLabel(item && item.media && item.media.mainImage && item.media.mainImage.url);

        if (mainImage) urls.push(mainImage);

        ensureArray(item && item.media && item.media.gallery).forEach(function(image) {
            var url = cleanLabel(image && image.url);
            if (url && urls.indexOf(url) === -1) urls.push(url);
        });

        return {
            images: urls,
            mainImage: mainImage || urls[0] || '',
            imageCount: urls.length
        };
    }

    function toCatalogEntry(item) {
        if (!item || item.status !== 'published') return null;

        var establishmentId = cleanLabel(item.id);
        var establishmentName = cleanLabel(item.name || item.nome);
        var category = cleanLabel(item.category && item.category.label || item.categoria);
        var slug = cleanLabel(item.slug || establishmentId);
        var images = publicImageUrls(item);

        if (!establishmentId || !establishmentName || !category) return null;

        return {
            establishmentId: establishmentId,
            establishmentName: establishmentName,
            category: category,
            source: CMS_SOURCE,
            originalId: establishmentId,
            slug: slug,
            currentSnapshot: {
                name: establishmentName,
                category: category,
                source: CMS_SOURCE,
                originalId: establishmentId,
                description: pickFirst([
                    item.content && item.content.description,
                    item.description,
                    item.descricao,
                    item.content && item.content.summary,
                    item.summary
                ]),
                phone: cleanLabel(item.contact && item.contact.phone),
                whatsapp: cleanLabel(item.contact && item.contact.whatsapp),
                instagram: cleanLabel(item.contact && item.contact.instagram),
                website: cleanLabel(item.contact && item.contact.website),
                address: pickFirst([
                    item.location && item.location.address,
                    item.address,
                    item.endereco,
                    item.localizacao
                ]),
                openingHours: pickFirst([
                    item.content && item.content.openingHours,
                    item.horario
                ]),
                images: images.images,
                mainImage: images.mainImage,
                imageCount: images.imageCount
            }
        };
    }

    function isAuthoritative(result) {
        return !!(result && result.source === 'firestore' && AUTHORITATIVE_STATES[result.state]);
    }

    function replaceCatalog(result) {
        var entries = [];
        var claimableIds = Object.create(null);
        var seenIds = Object.create(null);

        ensureArray(result && result.items).forEach(function(item) {
            var entry = toCatalogEntry(item);
            if (!entry || seenIds[entry.establishmentId]) return;

            seenIds[entry.establishmentId] = true;
            claimableIds[entry.establishmentId] = !(item.display && item.display.claimable === false);
            entries.push(entry);
        });

        entries.sort(function(a, b) {
            return a.establishmentName.localeCompare(b.establishmentName, 'pt-BR');
        });

        catalogCache = entries;
        claimableIdsCache = claimableIds;
    }

    function clearCatalog() {
        catalogCache = null;
        claimableIdsCache = Object.create(null);
    }

    function technicalFailure(code, message) {
        return {
            items: [],
            count: 0,
            authoritativeCount: null,
            source: 'unavailable',
            state: 'TECHNICAL_FAILURE',
            collection: CMS_SOURCE,
            queriedStatus: 'published',
            fallbackReason: cleanLabel(code) || 'catalog-unavailable',
            error: {
                code: cleanLabel(code) || 'catalog-unavailable',
                message: cleanLabel(message) || 'Catalogo CMS indisponivel.'
            }
        };
    }

    function list(options) {
        options = options || {};
        var items = catalogCache ? catalogCache.slice() : [];

        if (options.claimableOnly === true) {
            items = items.filter(function(item) {
                return claimableIdsCache[item.establishmentId] !== false;
            });
        }

        return items;
    }

    async function ready(options) {
        options = options || {};

        if (catalogCache && options.force !== true) {
            return list(options);
        }

        var readSequence = ++authoritativeReadSequence;
        var adapter = window.CMSPublicEstablishmentsAdapter;
        if (!adapter || typeof adapter.readPublished !== 'function') {
            clearCatalog();
            lastResult = technicalFailure(
                'adapter-unavailable',
                'CMSPublicEstablishmentsAdapter nao esta disponivel.'
            );
            return [];
        }

        var result;
        try {
            result = await adapter.readPublished({
                force: options.force === true,
                debug: options.debug === true,
                timeoutMs: options.timeoutMs
            });
        } catch (error) {
            result = technicalFailure(
                error && (error.code || error.name),
                error && error.message
            );
        }

        if (readSequence !== authoritativeReadSequence) {
            return list(options);
        }

        lastResult = result;
        if (!isAuthoritative(result)) {
            clearCatalog();
            return [];
        }

        replaceCatalog(result);
        return list(options);
    }

    function refresh(options) {
        return ready(Object.assign({}, options || {}, { force: true }));
    }

    function findById(establishmentId, options) {
        var normalizedId = cleanLabel(establishmentId);
        return list(options).find(function(item) {
            return item.establishmentId === normalizedId;
        }) || null;
    }

    window.EstablishmentCatalog = {
        ready: ready,
        refresh: refresh,
        list: list,
        findById: findById,
        getLastResult: function() {
            return lastResult;
        }
    };
})(window);
