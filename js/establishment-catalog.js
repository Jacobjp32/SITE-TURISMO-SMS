(function(window) {
    'use strict';

    var EXCLUDED_NAMES = {
        'morangos da mary': true
    };

    var PRIMARY_SOURCE_PRIORITY = {
        restaurantes: 3,
        hospedagens: 2,
        rotas_legado: 1
    };
    var routeItemsCache = null;
    var routeItemsPromise = null;
    var catalogCache = null;

    function ensureArray(value) {
        return Array.isArray(value) ? value : [];
    }

    function normalizeText(value) {
        return String(value || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, ' ')
            .trim();
    }

    function cleanLabel(value) {
        return String(value || '')
            .replace(/[\u0000-\u001F\u007F]+/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    function shouldExcludeByName(value) {
        return !!EXCLUDED_NAMES[normalizeText(value)];
    }

    function getPreferredLegacyName(item) {
        if (item && item.id === 'nova-esperanca') {
            return 'Nova Esperança Equoterapia';
        }
        return cleanLabel(item && (item.name || item.nome));
    }

    function classifyLegacyCategory(item) {
        var source = normalizeText([
            item && item.name,
            item && item.subtitle,
            item && item.desc,
            item && item.route
        ].join(' '));

        if (/hotel|hosped|pousada/.test(source)) return 'Hospedagem';
        if (/restaurante|gastronom|cafe|queijo|doces|almoco|jantar|parada/.test(source)) return 'Gastronomia';
        if (/marina|pesca|nautic|passeio|equoterapia|cavalo|viveiro|propriedade|trilha|lazer|sitio|agendamento|visita|degust/.test(source)) {
            return 'Experiência turística';
        }
        if ((item && item.route) === 'mate') return 'Experiência cultural';
        if ((item && item.route) === 'aguas') return 'Natureza e lazer';
        if ((item && item.route) === 'terra') return 'Turismo rural';
        if ((item && item.route) === 'fluviop') return 'Turismo regional';
        return 'Experiência turística';
    }

    function looksClaimableLegacy(item) {
        if (!item || !item.id) return false;

        var source = normalizeText([
            item.name,
            item.subtitle,
            item.desc
        ].join(' '));

        if (shouldExcludeByName(item.name)) return false;

        if (/prefeitura|paco municipal|paço municipal|praca|praça|ponte|igreja matriz|casa da memoria|casa da memória|arena cultural|ginasio|ginásio|parque de exposicoes|parque de exposições/.test(source)) {
            return false;
        }

        return !!(item.phone || item.social || item.site || item.hours || item.mapsUrl);
    }

    function normalizeWebsite(value) {
        var raw = cleanLabel(value);
        if (!raw) return '';
        if (raw.charAt(0) === '@') return '';
        if (/^https?:\/\//i.test(raw)) return raw;
        if (/^www\./i.test(raw)) return 'https://' + raw;
        return '';
    }

    function normalizeInstagram(value) {
        var raw = cleanLabel(value);
        if (!raw) return '';
        if (raw.charAt(0) === '@') return raw;
        return '';
    }

    function splitSocialFields(primary, secondary) {
        var values = [primary, secondary]
            .map(cleanLabel)
            .filter(Boolean);
        var instagram = '';
        var website = '';

        values.forEach(function(value) {
            if (!instagram) {
                instagram = normalizeInstagram(value);
            }
            if (!website) {
                website = normalizeWebsite(value);
            }
        });

        return {
            instagram: instagram,
            website: website
        };
    }

    function pickFirst(values) {
        for (var i = 0; i < values.length; i += 1) {
            var value = cleanLabel(values[i]);
            if (value) return value;
        }
        return '';
    }

    function buildImageList(item) {
        var images = ensureArray(item && item.galeria)
            .map(cleanLabel)
            .filter(Boolean);
        var mainImage = cleanLabel(item && item.imagem);

        if (mainImage && images.indexOf(mainImage) === -1) {
            images.unshift(mainImage);
        }

        if (!mainImage && images.length > 0) {
            mainImage = images[0];
        }

        return {
            images: images,
            mainImage: mainImage,
            imageCount: images.length
        };
    }

    function buildCurrentSnapshot(source, item, category, originalId) {
        var social = splitSocialFields(item && item.instagram, item && (item.site || item.social));
        var imageData = buildImageList(item);

        return {
            name: source === 'rotas_legado'
                ? getPreferredLegacyName(item)
                : cleanLabel(item && item.nome),
            category: cleanLabel(category),
            source: cleanLabel(source),
            originalId: cleanLabel(originalId),
            description: pickFirst([
                item && item.descricaoLonga,
                item && item.descricao,
                item && item.desc
            ]),
            phone: pickFirst([
                item && item.telefone,
                item && item.phone
            ]),
            whatsapp: pickFirst([
                item && item.whatsapp
            ]),
            instagram: social.instagram,
            website: social.website,
            address: pickFirst([
                item && item.localizacao,
                item && item.location
            ]),
            openingHours: pickFirst([
                item && item.horario,
                item && item.hours
            ]),
            images: imageData.images,
            mainImage: imageData.mainImage,
            imageCount: imageData.imageCount
        };
    }

    function mergeCurrentSnapshot(primary, secondary) {
        var merged = Object.assign({}, secondary || {}, primary || {});
        var imageSet = [];

        ensureArray(primary && primary.images).concat(ensureArray(secondary && secondary.images)).forEach(function(image) {
            var normalized = cleanLabel(image);
            if (normalized && imageSet.indexOf(normalized) === -1) {
                imageSet.push(normalized);
            }
        });

        [
            'name',
            'category',
            'source',
            'originalId',
            'description',
            'phone',
            'whatsapp',
            'instagram',
            'website',
            'address',
            'openingHours'
        ].forEach(function(field) {
            merged[field] = cleanLabel(primary && primary[field]) || cleanLabel(secondary && secondary[field]);
        });

        merged.images = imageSet;
        merged.mainImage = cleanLabel(primary && primary.mainImage) || cleanLabel(secondary && secondary.mainImage) || (imageSet[0] || '');
        merged.imageCount = imageSet.length;
        return merged;
    }

    function toEntry(source, item) {
        if (source === 'restaurantes' || source === 'hospedagens') {
            var primaryName = cleanLabel(item && item.nome);
            var category = cleanLabel(item && item.categoria || (source === 'restaurantes' ? 'Gastronomia' : 'Hospedagem'));
            var originalId = cleanLabel(item && item.id || '');

            if (!primaryName || shouldExcludeByName(primaryName)) return null;

            return {
                establishmentId: cleanLabel(item.id || primaryName),
                establishmentName: primaryName,
                category: category,
                source: source,
                originalId: originalId,
                slug: cleanLabel(item.id || ''),
                currentSnapshot: buildCurrentSnapshot(source, item, category, originalId)
            };
        }

        if (source === 'rotas_legado' && looksClaimableLegacy(item)) {
            var legacyName = getPreferredLegacyName(item);
            var legacyCategory = classifyLegacyCategory(item);
            var legacyOriginalId = cleanLabel(item && item.id || '');

            if (!legacyName) return null;

            return {
                establishmentId: cleanLabel(item.id || legacyName),
                establishmentName: legacyName,
                category: legacyCategory,
                source: source,
                originalId: legacyOriginalId,
                slug: cleanLabel(item.id || ''),
                currentSnapshot: buildCurrentSnapshot(source, item, legacyCategory, legacyOriginalId)
            };
        }

        return null;
    }

    function mergeEntry(map, entry) {
        if (!entry || !entry.establishmentName) return;

        var key = normalizeText(entry.establishmentName);
        var existing = map[key];

        if (!existing) {
            map[key] = entry;
            return;
        }

        if ((PRIMARY_SOURCE_PRIORITY[entry.source] || 0) > (PRIMARY_SOURCE_PRIORITY[existing.source] || 0)) {
            entry.currentSnapshot = mergeCurrentSnapshot(entry.currentSnapshot, existing.currentSnapshot);
            map[key] = entry;
            return;
        }

        existing.currentSnapshot = mergeCurrentSnapshot(existing.currentSnapshot, entry.currentSnapshot);
    }

    async function loadLegacyRouteEstablishments() {
        if (routeItemsCache) return routeItemsCache;
        if (routeItemsPromise) return routeItemsPromise;

        routeItemsPromise = fetch('js/rotas-data.js', { credentials: 'same-origin' })
            .then(function(response) {
                if (!response.ok) throw new Error('Falha ao carregar rotas-data.js');
                return response.text();
            })
            .then(function(source) {
                var sandboxWindow = {};
                var routeItems = Function(
                    'window',
                    source + '\nreturn typeof establishments !== "undefined" ? establishments : (window.ROTAS_LEGADO_ESTABLISHMENTS || []);'
                )(sandboxWindow);

                routeItemsCache = ensureArray(routeItems);
                catalogCache = null;
                return routeItemsCache;
            })
            .catch(function() {
                routeItemsCache = [];
                catalogCache = null;
                return routeItemsCache;
            });

        return routeItemsPromise;
    }

    function buildCatalog() {
        if (catalogCache) return catalogCache;

        var catalogMap = Object.create(null);

        ensureArray(window.TURISMO_RESTAURANTES).forEach(function(item) {
            mergeEntry(catalogMap, toEntry('restaurantes', item));
        });

        ensureArray(window.TURISMO_HOSPEDAGENS).forEach(function(item) {
            mergeEntry(catalogMap, toEntry('hospedagens', item));
        });

        ensureArray(routeItemsCache).forEach(function(item) {
            mergeEntry(catalogMap, toEntry('rotas_legado', item));
        });

        catalogCache = Object.keys(catalogMap).map(function(key) {
            return catalogMap[key];
        }).sort(function(a, b) {
            return a.establishmentName.localeCompare(b.establishmentName, 'pt-BR');
        });

        return catalogCache;
    }

    async function ready() {
        await loadLegacyRouteEstablishments();
        return buildCatalog();
    }

    function list() {
        return buildCatalog().slice();
    }

    function findById(establishmentId) {
        var normalizedId = cleanLabel(establishmentId);
        return list().find(function(item) {
            return item.establishmentId === normalizedId;
        }) || null;
    }

    window.EstablishmentCatalog = {
        ready: ready,
        list: list,
        findById: findById
    };
})(window);
