(function () {
  "use strict";

  function ensureArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function normalizeText(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  function createStaticSnapshot() {
    var snapshot = {
      pontos: ensureArray(window.TURISMO_PONTOS),
      rotas: ensureArray(window.TURISMO_ROTAS),
      hospedagens: ensureArray(window.TURISMO_HOSPEDAGENS),
      restaurantes: ensureArray(window.TURISMO_RESTAURANTES),
      eventos: ensureArray(window.TURISMO_EVENTOS),
      informacoesEssenciais: ensureArray(window.TURISMO_INFORMACOES_ESSENCIAIS)
    };

    if (window.TURISMO_DATA_ADAPTER && typeof window.TURISMO_DATA_ADAPTER.mergeSnapshot === "function") {
      snapshot = window.TURISMO_DATA_ADAPTER.mergeSnapshot(snapshot);
    }

    return snapshot;
  }

  function getCollection(name) {
    var data = window.TURISMO_DATA || createStaticSnapshot();
    return ensureArray(data[name]);
  }

  function getPontoById(id) {
    var normalizedId = normalizeText(id);
    return getCollection("pontos").find(function (item) {
      return normalizeText(item && item.id) === normalizedId;
    }) || null;
  }

  function getPontosByCategoria(categoria) {
    var normalizedCategory = normalizeText(categoria);
    return getCollection("pontos").filter(function (item) {
      return normalizeText(item && item.categoria).indexOf(normalizedCategory) !== -1;
    });
  }

  function getRotasByCategoria(categoria) {
    var normalizedCategory = normalizeText(categoria);
    return getCollection("rotas").filter(function (item) {
      return normalizeText(item && item.categoria).indexOf(normalizedCategory) !== -1;
    });
  }

  function getAllItems() {
    var data = window.TURISMO_DATA || createStaticSnapshot();
    return []
      .concat(ensureArray(data.pontos))
      .concat(ensureArray(data.rotas))
      .concat(ensureArray(data.hospedagens))
      .concat(ensureArray(data.restaurantes))
      .concat(ensureArray(data.eventos))
      .concat(ensureArray(data.informacoesEssenciais));
  }

  function getStats() {
    var data = window.TURISMO_DATA || createStaticSnapshot();

    if (window.TURISMO_DATA_ADAPTER && typeof window.TURISMO_DATA_ADAPTER.summarizeSnapshot === "function") {
      return window.TURISMO_DATA_ADAPTER.summarizeSnapshot(data);
    }

    return {
      totalItems: getAllItems().length,
      withCoordinates: getAllItems().filter(function (item) {
        return item && item.coordenadas
          && typeof item.coordenadas.lat === "number"
          && isFinite(item.coordenadas.lat)
          && typeof item.coordenadas.lng === "number"
          && isFinite(item.coordenadas.lng);
      }).length
    };
  }

  function searchAll(query) {
    var normalizedQuery = normalizeText(query);
    if (!normalizedQuery) return [];

    return getAllItems().filter(function (item) {
      var haystack = normalizeText([
        item.id,
        item.nome,
        item.categoria,
        item.descricao,
        item.local,
        item.localizacao,
        item.periodo,
        item.url,
        Array.isArray(item.tags) ? item.tags.join(" ") : item.tags
      ].join(" "));
      return haystack.indexOf(normalizedQuery) !== -1;
    });
  }

  function routeUrl(route) {
    var slug = String(route && (route.slug || route.id) || "").trim();
    return "/mapa-turistico?grupo=roteiros&rota=" + encodeURIComponent(slug);
  }

  function resolveRouteCanonical(routes, requested) {
    var normalized = normalizeText(requested);
    if (!normalized) return null;
    var route = ensureArray(routes).find(function (item) {
      return normalizeText(item && item.id) === normalized || normalizeText(item && item.slug) === normalized;
    });
    return route ? String(route.id || route.slug) : null;
  }

  function itemMatchesRoute(item, canonicalRouteId) {
    if (!item || !canonicalRouteId) return false;
    return ensureArray(item.routeIds || (item.relationships && item.relationships.routeIds)).some(function (routeId) {
      return String(routeId) === String(canonicalRouteId);
    });
  }

  function cloneSnapshot(snapshot) {
    return {
      pontos: ensureArray(snapshot.pontos).slice(),
      rotas: ensureArray(snapshot.rotas).slice(),
      hospedagens: ensureArray(snapshot.hospedagens).slice(),
      restaurantes: ensureArray(snapshot.restaurantes).slice(),
      eventos: ensureArray(snapshot.eventos).slice(),
      informacoesEssenciais: ensureArray(snapshot.informacoesEssenciais).slice(),
      legacyMeta: snapshot.legacyMeta
    };
  }

  function establishmentCollection(item) {
    var category = normalizeText(item && item.categoria);
    if (/hosped|hotel|pousada/.test(category)) return "hospedagens";
    if (/gastronom|restaurante|cafe|cafeteria|aliment/.test(category)) return "restaurantes";
    return "pontos";
  }

  function applyPublicResults(routesResult, establishmentsResult) {
    var staticSnapshot = createStaticSnapshot();
    var snapshot = cloneSnapshot(staticSnapshot);
    var routesState = routesResult && routesResult.state || "TECHNICAL_FAILURE";
    var establishmentsState = establishmentsResult && establishmentsResult.state || "TECHNICAL_FAILURE";
    var publicCutoverAllowed = routesState === "SUCCESS"
      && Number(routesResult.authoritativeCount) > 0
      && establishmentsState === "SUCCESS";

    if (routesState === "SUCCESS") {
      snapshot.rotas = ensureArray(routesResult.items);
    } else if (routesState === "TECHNICAL_FAILURE") {
      snapshot.rotas = ensureArray(routesResult.items).length ? routesResult.items : snapshot.rotas;
    }

    if (publicCutoverAllowed && establishmentsState !== "TECHNICAL_FAILURE") {
      snapshot.pontos = [];
      snapshot.hospedagens = [];
      snapshot.restaurantes = [];
      ensureArray(establishmentsResult.items).forEach(function (item) {
        snapshot[establishmentCollection(item)].push(item);
      });
    }

    window.TURISMO_DATA = snapshot;
    var routesSource = routesState === "AUTHORITATIVE_EMPTY" ? "static-precutover" : (routesResult && routesResult.source || "static-fallback");
    var establishmentsSource = publicCutoverAllowed
      ? (establishmentsResult && establishmentsResult.source || "static-fallback")
      : "static-precutover";
    window.TURISMO_DATA_SOURCE_META = {
      routesSource: routesSource,
      establishmentsSource: establishmentsSource,
      routesState: routesState,
      establishmentsState: establishmentsState,
      routesCount: routesResult && routesResult.authoritativeCount != null ? routesResult.authoritativeCount : ensureArray(snapshot.rotas).length,
      establishmentsCount: establishmentsResult && establishmentsResult.count != null ? establishmentsResult.count : 0,
      activeRoutesCount: ensureArray(snapshot.rotas).length,
      fallbackReason: routesResult && routesResult.fallbackReason || establishmentsResult && establishmentsResult.fallbackReason || null,
      publicCutoverAllowed: publicCutoverAllowed
    };
    window.PUBLIC_CUTOVER_ALLOWED = publicCutoverAllowed;
    window.TURISMO_DATA_META.stats = getStats();
    window.TURISMO_DATA_META.source = window.TURISMO_DATA_SOURCE_META;
    window.TURISMO_DATA_META.legacyIntegration = snapshot.legacyMeta || window.TURISMO_DATA_META.legacyIntegration;
    if (typeof window.dispatchEvent === "function" && typeof window.CustomEvent === "function") {
      window.dispatchEvent(new window.CustomEvent("turismo:data-ready", {
        detail: window.TURISMO_DATA_SOURCE_META
      }));
    }
    return snapshot;
  }

  function loadPublicData(options) {
    options = options || {};
    if (!window.CMSPublicRoutesAdapter || !window.CMSPublicEstablishmentsAdapter) {
      return Promise.resolve(window.TURISMO_DATA);
    }
    return Promise.all([
      window.CMSPublicRoutesAdapter.readPublished(options.routes),
      window.CMSPublicEstablishmentsAdapter.readPublished(options.establishments)
    ]).then(function (results) {
      return applyPublicResults(results[0], results[1]);
    });
  }

  window.TURISMO_DATA = createStaticSnapshot();
  window.TURISMO_DATA_META = {
    version: "1.0.0",
    primarySources: [
      "js/data/pontos-turisticos.js",
      "js/data/rotas.js",
      "js/data/hospedagens.js",
      "js/data/restaurantes.js",
      "js/data/eventos.js",
      "js/data/informacoes-essenciais.js",
      "js/data/turismo-data-adapter.js"
    ],
    legacySources: [
      "js/locais-data.js",
      "js/rotas-data.js",
      "js/roteiro-ia.js",
      "js/chatbot.js",
      "js/mapa3d.js"
    ],
    stats: getStats(),
    source: {
      routesSource: "static-precutover",
      establishmentsSource: "static-precutover",
      routesState: "PENDING",
      establishmentsState: "PENDING",
      routesCount: ensureArray(window.TURISMO_DATA.rotas).length,
      establishmentsCount: 0,
      fallbackReason: null,
      publicCutoverAllowed: false
    },
    legacyIntegration: window.TURISMO_DATA.legacyMeta || {
      locaisData: { total: 0, withCoordinates: 0 },
      rotasData: { total: 0, withCoordinates: 0 }
    }
  };
  window.TURISMO_DATA_HELPERS = {
    refresh: function () {
      window.TURISMO_DATA = createStaticSnapshot();
      window.TURISMO_DATA_META.stats = getStats();
      window.TURISMO_DATA_META.legacyIntegration = window.TURISMO_DATA.legacyMeta || window.TURISMO_DATA_META.legacyIntegration;
      window.TURISMO_DATA_READY = loadPublicData();
      return window.TURISMO_DATA;
    },
    getCollection: getCollection,
    getPontoById: getPontoById,
    getPontosByCategoria: getPontosByCategoria,
    getRotasByCategoria: getRotasByCategoria,
    getAllItems: getAllItems,
    searchAll: searchAll,
    getStats: getStats,
    loadPublicData: loadPublicData,
    applyPublicResults: applyPublicResults
  };
  window.TURISMO_PUBLIC_DATA_UTILS = {
    routeUrl: routeUrl,
    resolveRouteCanonical: resolveRouteCanonical,
    itemMatchesRoute: itemMatchesRoute
  };
  window.TURISMO_DATA_SOURCE_META = window.TURISMO_DATA_META.source;
  window.PUBLIC_CUTOVER_ALLOWED = false;
  window.TURISMO_DATA_READY = loadPublicData();
})();
