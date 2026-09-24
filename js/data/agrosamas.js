(function (root) {
    'use strict';

    const CONTENT_STATUS = Object.freeze({
        CONFIRMED: 'CONFIRMED',
        NOT_YET_ANNOUNCED: 'NOT_YET_ANNOUNCED',
        LEGACY: 'LEGACY',
        REJECTED: 'REJECTED'
    });
    const PROGRAMMING_AVAILABILITY = Object.freeze({
        UNAVAILABLE: 'UNAVAILABLE',
        PARTIAL: 'PARTIAL',
        COMPLETE: 'COMPLETE'
    });
    const TEMPORAL_STATE = Object.freeze({
        PRE_EVENT: 'PRE_EVENT',
        EVENT_LIVE: 'EVENT_LIVE',
        POST_EVENT: 'POST_EVENT',
        POSTPONED: 'POSTPONED',
        UNKNOWN: 'UNKNOWN'
    });
    const LOCALE_BY_LANGUAGE = Object.freeze({
        pt: 'pt-BR',
        en: 'en-US',
        es: 'es-ES',
        pl: 'pl-PL'
    });

    const OFFICIAL_SOURCES = Object.freeze({
        event: 'https://www.agrosamas.com.br/',
        municipality: 'https://www.saomateusdosul.pr.gov.br/portal/noticias/0/3/3565/prefeitura-de-sao-mateus-do-sul-abre-inscricoes-para-chamamento-publico-para-comercializacao-de-chopp-no-5-agrosamas',
        miss: 'https://www.saomateusdosul.pr.gov.br/portal/noticias/0/3/3591/inscricoes-abertas-para-o-miss-sao-mateus-do-sul-2026/',
        contentOwner: 'user-provided:agro-05-content-owner-2026-09-10',
        tourismPortal: 'https://turismo.saomateusdosul.pr.gov.br/'
    });

    const contract = {
        schemaVersion: 2,
        sourceHierarchy: Object.freeze([
            'CONTENT_OWNER_USER_PROVIDED',
            'MUNICIPALITY_OFFICIAL',
            'EVENT_OFFICIAL',
            'TOURISM_PORTAL'
        ]),
        activeEditionId: 'agrosamas-2026',
        series: {
            id: 'agrosamas',
            name: 'AgroSamas',
            route: '/agrosamas',
            canonicalUrl: 'https://turismo.saomateusdosul.pr.gov.br/agrosamas',
            role: 'PERMANENT_HUB'
        },
        edition: {
            id: 'agrosamas-2026',
            seriesId: 'agrosamas',
            edition: 5,
            name: '5º AgroSamas',
            year: 2026,
            status: 'POSTPONED',
            newDate: null,
            postponement: {
                reason: 'O evento foi adiado preventivamente por recomendação da Defesa Civil, considerando as orientações da Defesa Civil do Paraná e do Simepar.',
                update: 'A nova data ainda não foi definida e será divulgada posteriormente pelos canais oficiais.'
            },
            route: '/agrosamas-2026',
            canonicalUrl: 'https://turismo.saomateusdosul.pr.gov.br/agrosamas-2026',
            role: 'EDITION_ARCHIVE',
            officialUrl: OFFICIAL_SOURCES.event,
            brand: {
                status: 'USER_PROVIDED_APPROVED',
                assetId: 'agrosamas-2026-official-logo',
                publicPath: '/images/agrosamas/2026/logo-5-agrosamas.png',
                mimeType: 'image/png',
                width: 1287,
                height: 1222,
                sha256: '5ceb3d4ffba413d88f2e157d8202916f206c049c04bdb505ee5629043990b839'
            },
            startDate: null,
            endDate: null,
            durationDays: null,
            originalSchedule: {
                startDate: '2026-09-18',
                endDate: '2026-09-21',
                durationDays: 4,
                liveStartAt: '2026-09-18T00:00:00-03:00',
                liveEndExclusiveAt: '2026-09-22T00:00:00-03:00'
            },
            location: {
                id: 'rua-do-mathe',
                name: 'Rua do Mathe',
                scope: 'Rua do Mathe e entorno',
                city: 'São Mateus do Sul',
                state: 'PR',
                country: 'BR',
                route: '/local?id=rua-do-mathe'
            },
            temporal: {
                timezone: 'America/Sao_Paulo',
                liveStartAt: null,
                liveEndExclusiveAt: null,
                states: {
                    PRE_EVENT: {
                        heroMode: 'COUNTDOWN',
                        primaryAction: 'PLAN_VISIT',
                        programmingMode: 'CONFIRMED_OR_FALLBACK',
                        practicalInfoMode: 'PLANNING',
                        newsMode: 'ANNOUNCEMENTS',
                        galleryMode: 'LEGACY_LABELED',
                        tourismMode: 'PLANNING'
                    },
                    EVENT_LIVE: {
                        heroMode: 'TODAY_STATUS',
                        primaryAction: 'TODAY_PROGRAMMING',
                        programmingMode: 'TODAY_FIRST',
                        practicalInfoMode: 'OPERATIONAL',
                        newsMode: 'OPERATIONAL_UPDATES',
                        galleryMode: 'CONFIRMED_ONLY',
                        tourismMode: 'QUICK_LINKS'
                    },
                    POST_EVENT: {
                        heroMode: 'EDITION_ARCHIVE',
                        primaryAction: 'RETROSPECTIVE',
                        programmingMode: 'ARCHIVE',
                        practicalInfoMode: 'HISTORICAL_ONLY',
                        newsMode: 'RESULTS',
                        galleryMode: 'EDITION_ARCHIVE',
                        tourismMode: 'DISCOVERY'
                    }
                }
            },
            facts: {
                identity: {
                    status: 'CONFIRMED',
                    value: '5º AgroSamas',
                    sources: [OFFICIAL_SOURCES.event, OFFICIAL_SOURCES.municipality]
                },
                dates: {
                    status: 'LEGACY',
                    value: ['2026-09-18', '2026-09-21'],
                    publicForEdition: false,
                    sources: [OFFICIAL_SOURCES.event, OFFICIAL_SOURCES.municipality]
                },
                location: {
                    status: 'CONFIRMED',
                    value: 'Rua do Mathe e entorno, São Mateus do Sul/PR',
                    sources: [OFFICIAL_SOURCES.event]
                },
                missDate: {
                    status: 'LEGACY',
                    value: '2026-09-18',
                    publicForEdition: false,
                    sources: [OFFICIAL_SOURCES.miss]
                },
                anniversaryIntegration: {
                    status: 'CONFIRMED',
                    value: {
                        years: 118,
                        context: 'Integra as comemorações do aniversário de São Mateus do Sul'
                    },
                    sources: [OFFICIAL_SOURCES.municipality]
                },
                programming: {
                    status: 'NOT_YET_ANNOUNCED',
                    value: null,
                    sources: [OFFICIAL_SOURCES.contentOwner]
                },
                admission: {
                    status: 'NOT_YET_ANNOUNCED',
                    value: null,
                    sources: []
                },
                remainingAttractions: {
                    status: 'NOT_YET_ANNOUNCED',
                    value: null,
                    sources: []
                },
                exhibitors2026: {
                    status: 'NOT_YET_ANNOUNCED',
                    value: null,
                    sources: []
                },
                operationalInformation: {
                    status: 'NOT_YET_ANNOUNCED',
                    value: null,
                    sources: []
                },
                legacy2025Attractions: {
                    status: 'LEGACY',
                    value: null,
                    publicForEdition: false,
                    sources: []
                },
                rejectedDateRange: {
                    status: 'REJECTED',
                    value: '2026-09-17/2026-09-21',
                    publicForEdition: false,
                    sources: []
                }
            },
            programming: {
                availability: 'UNAVAILABLE',
                fallbackKey: 'agrosamas-programming-fallback',
                source: OFFICIAL_SOURCES.contentOwner,
                verifiedAt: '2026-09-10',
                items: [{
                    id: 'roupa-nova-2026-09-20',
                    seriesId: 'agrosamas',
                    editionId: 'agrosamas-2026',
                    date: '2026-09-20',
                    title: 'Roupa Nova',
                    category: 'Música',
                    featured: true,
                    source: OFFICIAL_SOURCES.contentOwner,
                    contentStatus: 'LEGACY'
                }]
            },
            fallbacks: {
                programmingKey: 'agrosamas-programming-fallback',
                practicalInfo: 'SHOW_CONFIRMED_FIELDS_ONLY',
                news: 'SHOW_CONFIRMED_OFFICIAL_UPDATES_ONLY',
                gallery: 'HIDE_WHEN_NO_CONFIRMED_EDITION_MEDIA',
                tourism: 'SHOW_STABLE_DESTINATION_LINKS_ONLY'
            }
        },
        routing: {
            nextEditionPathTemplate: '/agrosamas-{year}',
            archivePolicy: 'KEEP_EDITION_ROUTE_PERMANENT',
            discoveryActivation: 'ONLY_AFTER_ROUTE_EXISTS_AND_PASSES_QA'
        }
    };

    function deepFreeze(value) {
        if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
        Object.getOwnPropertyNames(value).forEach(function (key) { deepFreeze(value[key]); });
        return Object.freeze(value);
    }

    function asTime(value) {
        if (value instanceof Date) return value.getTime();
        if (typeof value === 'string') return Date.parse(value);
        if (typeof value === 'number') return value;
        return NaN;
    }

    function resolveTemporalState(now) {
        const current = asTime(now);
        if (!Number.isFinite(current)) return TEMPORAL_STATE.UNKNOWN;
        if (contract.edition.status === 'POSTPONED') return TEMPORAL_STATE.POSTPONED;
        const start = Date.parse(contract.edition.temporal.liveStartAt);
        const end = Date.parse(contract.edition.temporal.liveEndExclusiveAt);
        if (!Number.isFinite(current) || !Number.isFinite(start) || !Number.isFinite(end) || start >= end) {
            return TEMPORAL_STATE.UNKNOWN;
        }
        if (current < start) return TEMPORAL_STATE.PRE_EVENT;
        if (current < end) return TEMPORAL_STATE.EVENT_LIVE;
        return TEMPORAL_STATE.POST_EVENT;
    }

    function normalizeLanguage(language) {
        const prefix = String(language || 'pt').toLowerCase().split('-')[0];
        return ['pt', 'en', 'es', 'pl'].includes(prefix) ? prefix : 'pt';
    }

    function formatDateRange(language, options) {
        if (contract.edition.status === 'POSTPONED') {
            return {
                pt: 'Nova data a definir',
                en: 'New date to be announced',
                es: 'Nueva fecha por definir',
                pl: 'Nowy termin zostanie podany'
            }[normalizeLanguage(language)];
        }
        const locale = LOCALE_BY_LANGUAGE[normalizeLanguage(language)];
        const short = Boolean(options && options.short);
        const formatter = new Intl.DateTimeFormat(locale, {
            day: 'numeric',
            month: short ? 'short' : 'long',
            year: short ? undefined : 'numeric',
            timeZone: 'UTC'
        });
        const start = new Date(contract.edition.startDate + 'T12:00:00Z');
        const end = new Date(contract.edition.endDate + 'T12:00:00Z');
        return typeof formatter.formatRange === 'function'
            ? formatter.formatRange(start, end)
            : formatter.format(start) + ' – ' + formatter.format(end);
    }

    function formatStartMonth(language) {
        if (contract.edition.status === 'POSTPONED') {
            return {
                pt: 'ADIADO',
                en: 'POSTPONED',
                es: 'APLAZADO',
                pl: 'PRZEŁOŻONE'
            }[normalizeLanguage(language)];
        }
        const locale = LOCALE_BY_LANGUAGE[normalizeLanguage(language)];
        const start = new Date(contract.edition.startDate + 'T12:00:00Z');
        return new Intl.DateTimeFormat(locale, {
            month: 'long',
            timeZone: 'UTC'
        }).format(start).toLocaleUpperCase(locale);
    }

    function isEditionDate(value) {
        return contract.edition.status !== 'POSTPONED' &&
            typeof value === 'string' &&
            value >= contract.edition.startDate && value <= contract.edition.endDate;
    }

    function isSupersededOccurrence(raw) {
        if (contract.edition.status !== 'POSTPONED' || !raw || typeof raw !== 'object') return false;
        const value = raw.date || raw.data || raw.dataInicio;
        const date = typeof value === 'string' ? value.slice(0, 10) : '';
        const original = contract.edition.originalSchedule;
        if (date < original.startDate || date > original.endDate) return false;
        const identity = [raw.title, raw.titulo, raw.nome, raw.description, raw.descricao]
            .filter(hasText).join(' ');
        return raw.seriesId === contract.series.id ||
            raw.editionId === contract.edition.id ||
            /agro[\s-]*samas/i.test(identity);
    }

    function hasText(value) {
        return typeof value === 'string' && value.trim().length > 0;
    }

    function getPublicProgramming(programming) {
        const source = programming || contract.edition.programming;
        const availabilityValues = Object.values(PROGRAMMING_AVAILABILITY);
        const availability = contract.edition.status === 'POSTPONED'
            ? PROGRAMMING_AVAILABILITY.UNAVAILABLE
            : source && availabilityValues.includes(source.availability)
            ? source.availability
            : PROGRAMMING_AVAILABILITY.UNAVAILABLE;
        const items = availability !== PROGRAMMING_AVAILABILITY.UNAVAILABLE && source && Array.isArray(source.items)
            ? source.items.filter(function (item) {
                return item &&
                    item.seriesId === contract.series.id &&
                    item.editionId === contract.edition.id &&
                    item.contentStatus === CONTENT_STATUS.CONFIRMED &&
                    isEditionDate(item.date) &&
                    hasText(item.id) &&
                    hasText(item.title) &&
                    hasText(item.category) &&
                    typeof item.featured === 'boolean' &&
                    hasText(item.source);
            }).map(function (item) { return deepFreeze(Object.assign({}, item)); })
            : [];
        return Object.freeze({
            availability,
            fallbackKey: source && source.fallbackKey || contract.edition.programming.fallbackKey,
            items: Object.freeze(items.slice())
        });
    }

    deepFreeze(contract);

    const api = Object.freeze({
        CONTENT_STATUS,
        PROGRAMMING_AVAILABILITY,
        TEMPORAL_STATE,
        OFFICIAL_SOURCES,
        contract,
        resolveTemporalState,
        formatDateRange,
        formatStartMonth,
        isSupersededOccurrence,
        getPublicProgramming
    });

    if ('AgroSamasContract' in root) {
        throw new Error('[AgroSamasContract] global namespace already registered');
    }
    Object.defineProperty(root, 'AgroSamasContract', {
        value: api,
        writable: false,
        configurable: false,
        enumerable: false
    });
})(typeof globalThis !== 'undefined' ? globalThis : this);
