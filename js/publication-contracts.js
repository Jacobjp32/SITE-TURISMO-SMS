/**
 * Canonical contracts for data copied from private submission queues into
 * anonymously readable collections and for URLs rendered by public pages.
 */
(function (root, factory) {
    'use strict';

    var api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    if (root) {
        Object.defineProperty(root, 'SMSPublicationContracts', {
            value: api,
            writable: false,
            configurable: false,
            enumerable: false
        });
    }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    var EVENT_PUBLIC_FIELDS = Object.freeze([
        'id', 'title', 'nome', 'description', 'descricao',
        'date', 'data', 'dataInicio', 'dataFim', 'time', 'hora', 'horaInicio', 'horaFim',
        'location', 'local', 'organizer', 'category', 'categoria',
        'entrada', 'value', 'valor', 'contato', 'phone', 'whatsapp', 'instagram',
        'website', 'site', 'mapUrl', 'mapaUrl',
        'images', 'mainImage', 'image', 'imageCount',
        'source', 'linkedEstablishmentId', 'linkedEstablishmentName',
        'recorrente', 'destaque', 'status', 'publicado'
    ]);

    var ESTABLISHMENT_PUBLIC_FIELDS = Object.freeze([
        'id', 'name', 'nome', 'description', 'descricao', 'category', 'categoria',
        'address', 'endereco', 'phone', 'telefone', 'whatsapp', 'instagram',
        'website', 'site', 'openingHours', 'horario',
        'images', 'mainImage', 'image', 'imageCount', 'source', 'status'
    ]);

    function clean(value) {
        return String(value == null ? '' : value).trim();
    }

    function contractError(message, field) {
        var error = new TypeError(message);
        error.code = 'publication/invalid-field';
        error.field = field || '';
        return error;
    }

    function bounded(value, maxLength, field) {
        var normalized = clean(value);
        if (normalized.length > maxLength) {
            throw contractError('Campo público excede o limite permitido: ' + field + '.', field);
        }
        return normalized;
    }

    function hasUnsafeUrlCharacters(value) {
        return /[\u0000-\u001F\u007F\\<>"']/.test(value);
    }

    function exposesPrivateSubmissionPath(value) {
        var raw = clean(value);
        if (!raw) return false;
        for (var pass = 0; pass < 4; pass += 1) {
            if (/(?:^|\/)submissions\/(?:events|establishments|establishment-updates)\//i.test(raw)) {
                return true;
            }
            try {
                var decoded = decodeURIComponent(raw);
                if (decoded === raw) break;
                raw = decoded;
            } catch (error) {
                return true;
            }
        }
        return /(?:^|\/)submissions\/(?:events|establishments|establishment-updates)\//i.test(raw);
    }

    function externalHttps(value, fallback) {
        var raw = clean(value);
        if (!raw || hasUnsafeUrlCharacters(raw) || /^\/\//.test(raw)) return fallback || '';

        try {
            var parsed = new URL(raw);
            if (parsed.protocol !== 'https:' || !parsed.hostname || parsed.username || parsed.password) {
                return fallback || '';
            }
            return raw;
        } catch (error) {
            return fallback || '';
        }
    }

    function internalPath(value, fallback) {
        var raw = clean(value);
        if (!/^\/(?!\/)/.test(raw) || hasUnsafeUrlCharacters(raw)) return fallback || '';

        try {
            var parsed = new URL(raw, 'https://public.invalid');
            return parsed.origin === 'https://public.invalid' ? raw : (fallback || '');
        } catch (error) {
            return fallback || '';
        }
    }

    function publicNavigation(value, fallback) {
        return externalHttps(value, '') || internalPath(value, '') || (fallback || '');
    }

    function publicAsset(value, fallback) {
        var raw = clean(value);
        if (exposesPrivateSubmissionPath(raw)) return fallback || '';
        var strict = externalHttps(raw, '') || internalPath(raw, '');
        if (strict) return strict;
        if (!raw || hasUnsafeUrlCharacters(raw) || /^\/\//.test(raw) || /^[a-z][a-z0-9+.-]*:/i.test(raw)) {
            return fallback || '';
        }

        try {
            var parsed = new URL(raw, 'https://public.invalid/base/');
            return parsed.origin === 'https://public.invalid' ? raw : (fallback || '');
        } catch (error) {
            return fallback || '';
        }
    }

    function mapUrl(value, fallback) {
        return externalHttps(value, fallback || '');
    }

    function utf8Length(value) {
        if (typeof TextEncoder === 'function') return new TextEncoder().encode(value).length;
        return unescape(encodeURIComponent(value)).length;
    }

    function validDocumentId(value) {
        if (typeof value !== 'string' || !value || value === '.' || value === '..') return false;
        if (value.indexOf('/') !== -1 || /[\u0000-\u001F\u007F]/.test(value) || /^__.*__$/.test(value)) return false;
        return utf8Length(value) <= 1500;
    }

    function publicDocumentId(value) {
        return validDocumentId(value) ? value : '';
    }

    function first(source, names) {
        for (var index = 0; index < names.length; index += 1) {
            var value = source && source[names[index]];
            if (value !== undefined && value !== null && clean(value)) return value;
        }
        return '';
    }

    function copyStringAliases(target, source, aliases, maxLength) {
        var value = bounded(first(source, aliases), maxLength || 4000, aliases[0]);
        if (!value) return;
        aliases.forEach(function (alias) { target[alias] = value; });
    }

    function copyOptionalString(target, source, field, maxLength) {
        var value = bounded(source && source[field], maxLength || 4000, field);
        if (value) target[field] = value;
    }

    function projectImages(value) {
        if (!Array.isArray(value)) return [];
        if (value.length > 20) throw contractError('A publicação aceita no máximo 20 imagens.', 'images');
        return value.reduce(function (result, item, index) {
            var raw = typeof item === 'string' ? { url: item } : (item || {});
            var rawUrl = clean(raw.url || raw.src || raw.downloadURL);
            if (!rawUrl) return result;
            var url = publicAsset(rawUrl, '');
            if (!url) throw contractError('Imagem contém URL pública inválida.', 'images[' + index + '].url');
            result.push({
                url: url,
                name: bounded(raw.name || raw.fileName, 160, 'images[' + index + '].name'),
                alt: bounded(raw.alt, 240, 'images[' + index + '].alt'),
                caption: bounded(raw.caption, 500, 'images[' + index + '].caption'),
                credit: bounded(raw.credit, 240, 'images[' + index + '].credit'),
                contentType: bounded(raw.contentType, 80, 'images[' + index + '].contentType'),
                size: Number.isFinite(Number(raw.size)) && Number(raw.size) >= 0 ? Number(raw.size) : 0,
                position: index + 1
            });
            return result;
        }, []);
    }

    function projectPublicEvent(source, documentId) {
        var raw = source || {};
        var id = publicDocumentId(documentId);
        if (!id) throw new TypeError('ID de evento inválido para publicação.');

        var result = { id: id };
        copyStringAliases(result, raw, ['title', 'nome'], 160);
        copyStringAliases(result, raw, ['description', 'descricao'], 4000);
        copyStringAliases(result, raw, ['date', 'data', 'dataInicio'], 10);
        copyOptionalString(result, raw, 'dataFim', 10);
        copyStringAliases(result, raw, ['time', 'hora', 'horaInicio'], 16);
        copyOptionalString(result, raw, 'horaFim', 16);
        copyStringAliases(result, raw, ['location', 'local'], 240);
        copyOptionalString(result, raw, 'organizer', 160);
        copyStringAliases(result, raw, ['category', 'categoria'], 120);
        copyOptionalString(result, raw, 'entrada', 160);
        copyStringAliases(result, raw, ['value', 'valor'], 160);
        copyOptionalString(result, raw, 'contato', 160);
        copyOptionalString(result, raw, 'phone', 120);
        copyOptionalString(result, raw, 'whatsapp', 120);
        copyOptionalString(result, raw, 'instagram', 160);
        copyOptionalString(result, raw, 'source', 60);
        copyOptionalString(result, raw, 'linkedEstablishmentId', 160);
        copyOptionalString(result, raw, 'linkedEstablishmentName', 160);

        var rawWebsite = clean(first(raw, ['website', 'site']));
        var website = externalHttps(rawWebsite, '');
        if (rawWebsite && !website) throw contractError('Evento contém URL externa inválida.', 'website');
        if (website) {
            result.website = website;
            result.site = website;
        }

        var rawMapUrl = clean(first(raw, ['mapUrl', 'mapaUrl']));
        var safeMapUrl = mapUrl(rawMapUrl, '');
        if (rawMapUrl && !safeMapUrl) throw contractError('Evento contém URL de mapa inválida.', 'mapUrl');
        if (safeMapUrl) {
            result.mapUrl = safeMapUrl;
            result.mapaUrl = safeMapUrl;
        }

        var images = projectImages(raw.images);
        var rawMainImage = clean(first(raw, ['mainImage', 'image']));
        var mainImage = publicAsset(rawMainImage, '') || (images[0] && images[0].url) || '';
        if (rawMainImage && !publicAsset(rawMainImage, '')) throw contractError('Evento contém URL de capa inválida.', 'mainImage');
        if (mainImage) {
            result.mainImage = mainImage;
            result.image = mainImage;
        }
        if (images.length) result.images = images;
        result.imageCount = images.length;

        if (raw.recorrente === true) result.recorrente = true;
        if (raw.destaque === true) result.destaque = true;
        result.status = 'aprovado';
        result.publicado = true;
        return result;
    }

    function projectPublicEstablishment(source, documentId) {
        var raw = source || {};
        var id = publicDocumentId(documentId);
        if (!id) throw new TypeError('ID de estabelecimento inválido para publicação.');

        var result = { id: id };
        copyStringAliases(result, raw, ['name', 'nome'], 160);
        copyStringAliases(result, raw, ['description', 'descricao'], 4000);
        copyStringAliases(result, raw, ['category', 'categoria'], 120);
        copyStringAliases(result, raw, ['address', 'endereco'], 240);
        copyStringAliases(result, raw, ['phone', 'telefone'], 120);
        copyOptionalString(result, raw, 'whatsapp', 120);
        copyOptionalString(result, raw, 'instagram', 160);
        copyStringAliases(result, raw, ['openingHours', 'horario'], 240);
        copyOptionalString(result, raw, 'source', 60);

        var rawWebsite = clean(first(raw, ['website', 'site']));
        var website = externalHttps(rawWebsite, '');
        if (rawWebsite && !website) throw contractError('Estabelecimento contém URL externa inválida.', 'website');
        if (website) {
            result.website = website;
            result.site = website;
        }

        var images = projectImages(raw.images);
        var rawMainImage = clean(first(raw, ['mainImage', 'image']));
        var mainImage = publicAsset(rawMainImage, '') || (images[0] && images[0].url) || '';
        if (rawMainImage && !publicAsset(rawMainImage, '')) throw contractError('Estabelecimento contém URL de capa inválida.', 'mainImage');
        if (mainImage) {
            result.mainImage = mainImage;
            result.image = mainImage;
        }
        if (images.length) result.images = images;
        result.imageCount = images.length;
        result.status = 'aprovado';
        return result;
    }

    return Object.freeze({
        EVENT_PUBLIC_FIELDS: EVENT_PUBLIC_FIELDS,
        ESTABLISHMENT_PUBLIC_FIELDS: ESTABLISHMENT_PUBLIC_FIELDS,
        url: Object.freeze({
            externalHttps: externalHttps,
            internalPath: internalPath,
            publicNavigation: publicNavigation,
            publicAsset: publicAsset,
            map: mapUrl
        }),
        validDocumentId: validDocumentId,
        publicDocumentId: publicDocumentId,
        projectPublicEvent: projectPublicEvent,
        projectPublicEstablishment: projectPublicEstablishment
    });
});
