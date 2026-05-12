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

  function createSnapshot() {
    return {
      pontos: ensureArray(window.TURISMO_PONTOS),
      rotas: ensureArray(window.TURISMO_ROTAS),
      hospedagens: ensureArray(window.TURISMO_HOSPEDAGENS),
      restaurantes: ensureArray(window.TURISMO_RESTAURANTES),
      eventos: ensureArray(window.TURISMO_EVENTOS),
      informacoesEssenciais: ensureArray(window.TURISMO_INFORMACOES_ESSENCIAIS)
    };
  }

  function getCollection(name) {
    var data = window.TURISMO_DATA || createSnapshot();
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
    var data = window.TURISMO_DATA || createSnapshot();
    return []
      .concat(ensureArray(data.pontos))
      .concat(ensureArray(data.rotas))
      .concat(ensureArray(data.hospedagens))
      .concat(ensureArray(data.restaurantes))
      .concat(ensureArray(data.eventos))
      .concat(ensureArray(data.informacoesEssenciais));
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

  window.TURISMO_DATA = createSnapshot();
  window.TURISMO_DATA_META = {
    version: "1.0.0",
    primarySources: [
      "js/data/pontos-turisticos.js",
      "js/data/rotas.js",
      "js/data/hospedagens.js",
      "js/data/restaurantes.js",
      "js/data/eventos.js",
      "js/data/informacoes-essenciais.js"
    ],
    legacySources: [
      "js/locais-data.js",
      "js/rotas-data.js",
      "js/roteiro-ia.js",
      "js/chatbot.js",
      "js/mapa3d.js"
    ]
  };
  window.TURISMO_DATA_HELPERS = {
    refresh: function () {
      window.TURISMO_DATA = createSnapshot();
      return window.TURISMO_DATA;
    },
    getCollection: getCollection,
    getPontoById: getPontoById,
    getPontosByCategoria: getPontosByCategoria,
    getRotasByCategoria: getRotasByCategoria,
    getAllItems: getAllItems,
    searchAll: searchAll
  };
})();
