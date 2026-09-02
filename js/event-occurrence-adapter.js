(function (root) {
    'use strict';

    const RUNTIME_SOURCES = Object.freeze({
        ANNUAL_STATIC: 'ANNUAL_STATIC',
        FIRESTORE_APPROVED: 'FIRESTORE_APPROVED'
    });
    const APPROVED_STATUSES = new Set(['aprovado', 'approved']);
    const BLOCKED_STATUSES = new Set([
        'pendente', 'pending',
        'rejeitado', 'rejected',
        'rascunho', 'draft',
        'despublicado', 'unpublished'
    ]);
    const LOCATION_TYPES = new Set([
        'CANONICAL_REFERENCE',
        'CITY_WIDE',
        'MULTIPLE_LOCATIONS',
        'TEXT_ONLY',
        'TO_BE_CONFIRMED',
        'NONE'
    ]);
    const LOCATION_REFERENCE_ALIASES = [
        ['localId', 'LOCAL_PAGE'],
        ['establishmentId', 'ESTABLISHMENT'],
        ['linkedEstablishmentId', 'ESTABLISHMENT'],
        ['estabelecimentoId', 'ESTABLISHMENT'],
        ['empreendimentoId', 'ESTABLISHMENT'],
        ['establishmentSlug', 'ESTABLISHMENT'],
        ['mapaId', 'LEGACY_OR_UNKNOWN'],
        ['placeId', 'LEGACY_OR_UNKNOWN'],
        ['businessId', 'LEGACY_OR_UNKNOWN']
    ];

    function cleanString(value) {
        if (value === undefined || value === null) return '';
        return String(value).trim();
    }

    function normalizeText(value) {
        return cleanString(value).toLowerCase();
    }

    function firstValue(rawEvent, aliases) {
        for (const alias of aliases) {
            const value = rawEvent && rawEvent[alias];
            if (cleanString(value)) return { alias, value };
        }
        return { alias: null, value: '' };
    }

    function normalizeDate(value) {
        if (!value) return '';
        if (typeof value === 'object' && typeof value.toDate === 'function') {
            return value.toDate().toISOString().slice(0, 10);
        }
        if (typeof value === 'object' && typeof value.seconds === 'number') {
            return new Date(value.seconds * 1000).toISOString().slice(0, 10);
        }
        return String(value).slice(0, 10);
    }

    function normalizePublication(rawEvent, runtimeSource) {
        if (runtimeSource === RUNTIME_SOURCES.ANNUAL_STATIC) return true;
        if (runtimeSource !== RUNTIME_SOURCES.FIRESTORE_APPROVED || !rawEvent) return false;
        if (rawEvent.publicado === false) return false;

        const status = normalizeText(rawEvent.status);
        if (BLOCKED_STATUSES.has(status)) return false;
        if (APPROVED_STATUSES.has(status)) return true;
        return !status && rawEvent.publicado === true;
    }

    function buildRuntimeIdentity(runtimeSource, sourceId) {
        const normalizedSourceId = cleanString(sourceId);
        if (!normalizedSourceId) return '';
        if (runtimeSource === RUNTIME_SOURCES.ANNUAL_STATIC) {
            return 'annual:' + normalizedSourceId;
        }
        if (runtimeSource === RUNTIME_SOURCES.FIRESTORE_APPROVED) {
            return 'firestore:' + normalizedSourceId;
        }
        return '';
    }

    function buildEventSignature(fields) {
        return [fields.title, fields.date, fields.time, fields.location]
            .map(value => normalizeText(value).replace(/\s+/g, ' '))
            .join('\u001f');
    }

    function getLegacyReferenceCandidate(rawEvent) {
        for (const [alias, refType] of LOCATION_REFERENCE_ALIASES) {
            const id = cleanString(rawEvent && rawEvent[alias]);
            if (id) return { alias, refType, id };
        }
        return null;
    }

    function resolverAccepts(resolvers, refType, id) {
        return Boolean(
            resolvers &&
            typeof resolvers[refType] === 'function' &&
            resolvers[refType](id) === true
        );
    }

    function cleanExplicitBinding(binding, fallbackText, resolvers) {
        if (!binding || !LOCATION_TYPES.has(binding.type)) return null;
        const text = cleanString(binding.text) || fallbackText;

        if (binding.type === 'CANONICAL_REFERENCE') {
            const id = cleanString(binding.id);
            const refType = cleanString(binding.refType);
            if (!id || !refType || !resolverAccepts(resolvers, refType, id)) return null;
            return Object.assign({ type: binding.type, refType, id }, text ? { text } : {});
        }

        if (binding.type === 'MULTIPLE_LOCATIONS') {
            const ids = Array.isArray(binding.ids) ? binding.ids.map(cleanString).filter(Boolean) : [];
            return Object.assign({ type: binding.type }, ids.length ? { ids } : {}, text ? { text } : {});
        }

        return Object.assign({ type: binding.type }, text ? { text } : {});
    }

    function normalizeLocationBinding(rawEvent, options) {
        const locationValue = firstValue(rawEvent, [
            'location',
            'local',
            'localNome',
            'venue',
            'establishmentName',
            'linkedEstablishmentName',
            'organizer',
            'organizador',
            'ownerName'
        ]);
        const text = cleanString(locationValue.value);
        const resolvers = options && options.resolvers;
        const explicitBinding = cleanExplicitBinding(rawEvent && rawEvent.locationBinding, text, resolvers);
        const legacyReferenceCandidate = getLegacyReferenceCandidate(rawEvent);

        if (explicitBinding) {
            return { binding: explicitBinding, locationAlias: locationValue.alias, legacyReferenceCandidate };
        }

        if (
            legacyReferenceCandidate &&
            resolverAccepts(resolvers, legacyReferenceCandidate.refType, legacyReferenceCandidate.id)
        ) {
            return {
                binding: Object.assign({
                    type: 'CANONICAL_REFERENCE',
                    refType: legacyReferenceCandidate.refType,
                    id: legacyReferenceCandidate.id
                }, text ? { text } : {}),
                locationAlias: locationValue.alias,
                legacyReferenceCandidate
            };
        }

        if (/^(a confirmar|local a confirmar|to be confirmed)$/i.test(text)) {
            return {
                binding: { type: 'TO_BE_CONFIRMED', text },
                locationAlias: locationValue.alias,
                legacyReferenceCandidate
            };
        }

        if (text) {
            return {
                binding: { type: 'TEXT_ONLY', text },
                locationAlias: locationValue.alias,
                legacyReferenceCandidate
            };
        }

        return {
            binding: { type: 'NONE' },
            locationAlias: locationValue.alias,
            legacyReferenceCandidate
        };
    }

    function normalizeEventOccurrence(rawEvent, options) {
        if (!rawEvent || !options) return null;
        const runtimeSource = options.runtimeSource;
        const sourceId = cleanString(options.sourceId);
        const runtimeId = buildRuntimeIdentity(runtimeSource, sourceId);
        if (!runtimeId) return null;

        const titleValue = firstValue(rawEvent, ['title', 'nome', 'titulo']);
        const dateValue = firstValue(rawEvent, ['date', 'data', 'dataInicio', 'startDate', 'inicio']);
        const timeValue = firstValue(rawEvent, ['time', 'hora', 'horario', 'horaInicio']);
        const location = normalizeLocationBinding(rawEvent, options);
        const title = cleanString(titleValue.value);
        const date = normalizeDate(dateValue.value);
        const time = cleanString(timeValue.value);
        const rawLocationText = cleanString(location.binding.text);
        const seriesId = cleanString(rawEvent.seriesId) || null;
        const editorialSource = cleanString(rawEvent.source);
        const category = cleanString(rawEvent.category || rawEvent.categoria);
        const recurrence = rawEvent.recorrente === true || rawEvent.recurrence === true;
        const exactSignature = buildEventSignature({ title, date, time, location: rawLocationText });
        const matchedAliases = {
            title: titleValue.alias,
            date: dateValue.alias,
            time: timeValue.alias,
            location: location.locationAlias
        };

        return Object.assign({
            runtimeId,
            runtimeSource,
            sourceId,
            seriesId,
            title,
            date,
            publication: normalizePublication(rawEvent, runtimeSource),
            recurrence,
            locationBinding: location.binding,
            metadata: Object.assign({
                exactSignature,
                matchedAliases,
                dedupIdentity: runtimeId
            }, location.legacyReferenceCandidate ? {
                legacyReferenceCandidate: location.legacyReferenceCandidate
            } : {})
        }, editorialSource ? { source: editorialSource } : {},
        runtimeSource === RUNTIME_SOURCES.ANNUAL_STATIC ? { occurrenceId: sourceId } : {},
        time ? { time } : {},
        category ? { category } : {},
        rawLocationText ? { rawLocationText } : {});
    }

    const adapterApi = Object.freeze({
        RUNTIME_SOURCES,
        normalizeEventOccurrence,
        normalizePublication,
        buildRuntimeIdentity,
        buildEventSignature,
        normalizeLocationBinding
    });

    if ('EventOccurrenceAdapter' in root) {
        throw new Error('[EventOccurrenceAdapter] global namespace already registered');
    }

    Object.defineProperty(root, 'EventOccurrenceAdapter', {
        value: adapterApi,
        writable: false,
        configurable: false,
        enumerable: false
    });
})(typeof globalThis !== 'undefined' ? globalThis : this);
