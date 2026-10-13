(function () {
  "use strict";

  var FALLBACK_FOUNDING_YEAR = 1908;
  var FALLBACK_STATS = {
    totalItems: 83,
    withCoordinates: 66,
    categoryCount: 7,
    routes: 6
  };

  function isFiniteNumber(value) {
    return typeof value === "number" && isFinite(value);
  }

  function sanitizeCount(value, fallbackValue) {
    return isFiniteNumber(value) && value >= 0 ? Math.round(value) : fallbackValue;
  }

  function getRuntimeStats() {
    if (window.TURISMO_DATA_HELPERS && typeof window.TURISMO_DATA_HELPERS.getStats === "function") {
      return window.TURISMO_DATA_HELPERS.getStats() || {};
    }

    if (window.TURISMO_DATA_META && window.TURISMO_DATA_META.stats) {
      return window.TURISMO_DATA_META.stats || {};
    }

    if (window.TURISMO_DATA_ADAPTER && typeof window.TURISMO_DATA_ADAPTER.summarizeSnapshot === "function" && window.TURISMO_DATA) {
      return window.TURISMO_DATA_ADAPTER.summarizeSnapshot(window.TURISMO_DATA) || {};
    }

    return {};
  }

  function getFoundingYear() {
    var configuredYear = Number(window.CONFIG && window.CONFIG.site && window.CONFIG.site.anoFundacao);
    if (isFiniteNumber(configuredYear) && configuredYear > 0) {
      return Math.floor(configuredYear);
    }

    return FALLBACK_FOUNDING_YEAR;
  }

  function buildStatsPayload() {
    var runtimeStats = getRuntimeStats();
    var foundingYear = getFoundingYear();
    var currentYear = new Date().getFullYear();

    return {
      totalItems: sanitizeCount(runtimeStats.totalItems, FALLBACK_STATS.totalItems),
      withCoordinates: sanitizeCount(runtimeStats.withCoordinates, FALLBACK_STATS.withCoordinates),
      categoryCount: sanitizeCount(runtimeStats.categoryCount, FALLBACK_STATS.categoryCount),
      routes: sanitizeCount(runtimeStats.routes, FALLBACK_STATS.routes),
      foundingYear: foundingYear,
      yearsSinceFoundation: Math.max(currentYear - foundingYear, 0)
    };
  }

  function getStatValue(statName, payload) {
    if (!payload || !Object.prototype.hasOwnProperty.call(payload, statName)) {
      return null;
    }
    return payload[statName];
  }

  function applyStatsToDocument(payload) {
    document.querySelectorAll("[data-site-stat]").forEach(function (element) {
      var statName = element.getAttribute("data-site-stat");
      var value = getStatValue(statName, payload);
      if (value === null || value === undefined) return;
      element.textContent = value;
    });
  }

  function refreshSiteStats() {
    var payload = buildStatsPayload();
    window.SITE_STATS_META = payload;
    applyStatsToDocument(payload);
    return payload;
  }

  window.SITE_STATS = {
    getStats: buildStatsPayload,
    refresh: refreshSiteStats
  };

  // Os contadores dependem da fonte resolvida (CMS ou fallback estático). Antes disso,
  // o HTML, o snapshot estático e o CMS mostravam três números diferentes em sequência.
  // Mantemos os números ocultos (classe no <html>) até TURISMO_DATA_READY assentar.
  var root = document.documentElement;
  var ready = window.TURISMO_DATA_READY;
  var settled = !(ready && typeof ready.then === "function");

  function settle() {
    settled = true;
    root.classList.remove("site-stats-pending");
    refreshSiteStats();
  }

  function refreshWhenSettled() {
    if (settled) refreshSiteStats();
  }

  if (!settled) {
    root.classList.add("site-stats-pending");
    ready.then(settle, settle);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", refreshWhenSettled);
  } else {
    refreshWhenSettled();
  }

  window.addEventListener("load", refreshWhenSettled);
  window.addEventListener("turismo:data-ready", refreshWhenSettled);
})();
