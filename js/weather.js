(function () {
  "use strict";

  var CITY = {
    name: "São Mateus do Sul",
    state: "PR",
    latitude: -25.8677,
    longitude: -50.3840,
    timezone: "America/Sao_Paulo"
  };
  var CACHE_KEY = "sms-weather-cache-v1";
  var CACHE_TTL_MS = 60 * 60 * 1000;
  var FORECAST_DAYS = 3;

  var WMO_LABELS = {
    pt: {
      0: "Céu limpo",
      1: "Predomínio de sol",
      2: "Parcialmente nublado",
      3: "Nublado",
      45: "Neblina",
      48: "Neblina com geada",
      51: "Garoa fraca",
      53: "Garoa moderada",
      55: "Garoa intensa",
      61: "Chuva fraca",
      63: "Chuva moderada",
      65: "Chuva forte",
      80: "Pancadas de chuva",
      81: "Pancadas de chuva",
      82: "Pancadas fortes",
      95: "Trovoadas"
    },
    en: {
      0: "Clear sky",
      1: "Mostly sunny",
      2: "Partly cloudy",
      3: "Cloudy",
      45: "Fog",
      48: "Freezing fog",
      51: "Light drizzle",
      53: "Moderate drizzle",
      55: "Heavy drizzle",
      61: "Light rain",
      63: "Moderate rain",
      65: "Heavy rain",
      80: "Rain showers",
      81: "Rain showers",
      82: "Heavy showers",
      95: "Thunderstorm"
    },
    es: {
      0: "Cielo despejado",
      1: "Mayormente soleado",
      2: "Parcialmente nublado",
      3: "Nublado",
      45: "Niebla",
      48: "Niebla con escarcha",
      51: "Llovizna ligera",
      53: "Llovizna moderada",
      55: "Llovizna intensa",
      61: "Lluvia ligera",
      63: "Lluvia moderada",
      65: "Lluvia fuerte",
      80: "Chubascos",
      81: "Chubascos",
      82: "Chubascos fuertes",
      95: "Tormentas"
    },
    pl: {
      0: "Bezchmurnie",
      1: "Przewaga słońca",
      2: "Częściowe zachmurzenie",
      3: "Pochmurno",
      45: "Mgła",
      48: "Marznąca mgła",
      51: "Lekka mżawka",
      53: "Umiarkowana mżawka",
      55: "Silna mżawka",
      61: "Lekki deszcz",
      63: "Umiarkowany deszcz",
      65: "Silny deszcz",
      80: "Przelotny deszcz",
      81: "Przelotny deszcz",
      82: "Silne opady",
      95: "Burze"
    }
  };

  function getLang() {
    var lang = document.documentElement.getAttribute("lang") || "pt";
    try {
      lang = localStorage.getItem("sms-lang") || lang;
    } catch (_) {}
    lang = String(lang).toLowerCase().split("-")[0];
    return WMO_LABELS[lang] ? lang : "pt";
  }

  function t(key, fallback) {
    var lang = getLang();
    var dict = window.translations && (window.translations[lang] || window.translations.pt);
    return dict && dict[key] ? dict[key] : fallback;
  }

  function buildUrl() {
    if (window.SMS_WEATHER_API_OVERRIDE) return window.SMS_WEATHER_API_OVERRIDE;
    return "https://api.open-meteo.com/v1/forecast"
      + "?latitude=" + encodeURIComponent(CITY.latitude)
      + "&longitude=" + encodeURIComponent(CITY.longitude)
      + "&current=temperature_2m,weather_code"
      + "&daily=weather_code,temperature_2m_max,temperature_2m_min"
      + "&timezone=" + encodeURIComponent(CITY.timezone)
      + "&forecast_days=" + FORECAST_DAYS;
  }

  function roundTemp(value) {
    var number = Number(value);
    if (!Number.isFinite(number)) return "--";
    return String(Math.round(number));
  }

  function getCondition(code) {
    var labels = WMO_LABELS[getLang()] || WMO_LABELS.pt;
    return labels[code] || t("weather-data-unavailable", "Dados indisponíveis");
  }

  function formatRange(min, max) {
    var minText = roundTemp(min);
    var maxText = roundTemp(max);
    if (minText === "--" && maxText === "--") return "--°C";
    if (minText === "--") return maxText + "°C";
    if (maxText === "--") return minText + "°C";
    return minText + "-" + maxText + "°C";
  }

  function formatDateTime(value) {
    var date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    try {
      return new Intl.DateTimeFormat(document.documentElement.lang || "pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      }).format(date);
    } catch (_) {
      return date.toLocaleString();
    }
  }

  function readCache(allowExpired) {
    try {
      var raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      var cached = JSON.parse(raw);
      if (!cached || !cached.fetchedAt || !cached.payload) return null;
      if (!allowExpired && Date.now() - new Date(cached.fetchedAt).getTime() > CACHE_TTL_MS) {
        return null;
      }
      return cached;
    } catch (_) {
      return null;
    }
  }

  function writeCache(payload) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        fetchedAt: new Date().toISOString(),
        payload: payload
      }));
    } catch (_) {}
  }

  function normalizePayload(data) {
    var daily = data && data.daily ? data.daily : {};
    var current = data && data.current ? data.current : {};
    return {
      current: {
        temp: current.temperature_2m,
        code: current.weather_code,
        time: current.time
      },
      daily: (daily.time || []).slice(0, FORECAST_DAYS).map(function (date, index) {
        return {
          date: date,
          code: daily.weather_code && daily.weather_code[index],
          max: daily.temperature_2m_max && daily.temperature_2m_max[index],
          min: daily.temperature_2m_min && daily.temperature_2m_min[index]
        };
      })
    };
  }

  function setStatus(root, message) {
    var status = root.querySelector("[data-weather-status]");
    if (!status) return;
    status.textContent = message || "";
    status.hidden = !message;
  }

  function renderCard(root, key, dayLabel, temp, condition) {
    var card = root.querySelector('[data-weather-card="' + key + '"]');
    if (!card) return;
    var day = card.querySelector("[data-weather-day]");
    var tempEl = card.querySelector("[data-weather-temp]");
    var conditionEl = card.querySelector("[data-weather-condition]");
    if (day) day.textContent = dayLabel;
    if (tempEl) tempEl.textContent = temp;
    if (conditionEl) conditionEl.textContent = condition;
    card.classList.toggle("is-unavailable", temp.indexOf("--") !== -1);
  }

  function renderUnavailable(root) {
    if (!root) return;
    renderCard(root, "today", t("weather-today", "Hoje"), "--°C", t("weather-data-unavailable", "Dados indisponíveis"));
    renderCard(root, "tomorrow", t("weather-tomorrow", "Amanhã"), "--°C", t("weather-data-unavailable", "Dados indisponíveis"));
    renderCard(root, "next", t("weather-next", "Próximos dias"), "--°C", t("weather-data-unavailable", "Dados indisponíveis"));
    setStatus(root, t("weather-unavailable", "Dados climáticos temporariamente indisponíveis"));
  }

  function announceWeather(payload, fetchedAt, statusMessage) {
    var current = payload && payload.current ? payload.current : {};
    document.dispatchEvent(new CustomEvent("sms:weatherchange", {
      detail: {
        available: Number.isFinite(Number(current.temp)),
        temp: current.temp,
        code: current.code,
        condition: getCondition(current.code),
        fetchedAt: fetchedAt || "",
        status: statusMessage || ""
      }
    }));
  }

  function announceUnavailable(statusMessage) {
    document.dispatchEvent(new CustomEvent("sms:weatherchange", {
      detail: {
        available: false,
        condition: t("weather-data-unavailable", "Dados indisponíveis"),
        status: statusMessage || t("weather-unavailable", "Dados climáticos temporariamente indisponíveis")
      }
    }));
  }

  function renderWeather(root, payload, fetchedAt, statusMessage) {
    var daily = payload.daily || [];
    if (root) {
      renderCard(root, "today", t("weather-today", "Hoje"), roundTemp(payload.current.temp) + "°C", getCondition(payload.current.code));
      renderCard(root, "tomorrow", t("weather-tomorrow", "Amanhã"), formatRange(daily[1] && daily[1].min, daily[1] && daily[1].max), getCondition(daily[1] && daily[1].code));
      renderCard(root, "next", t("weather-next", "Próximos dias"), formatRange(daily[2] && daily[2].min, daily[2] && daily[2].max), getCondition(daily[2] && daily[2].code));

      var updated = root.querySelector("[data-weather-updated]");
      if (updated) {
        var formatted = formatDateTime(fetchedAt || new Date().toISOString());
        updated.textContent = formatted ? t("weather-updated-at", "Atualizado em") + ": " + formatted : "";
      }
      setStatus(root, statusMessage || "");
    }
    announceWeather(payload, fetchedAt, statusMessage);
  }

  function fetchWeather() {
    return fetch(buildUrl(), { cache: "no-store" })
      .then(function (response) {
        if (!response.ok) throw new Error("weather-http-" + response.status);
        return response.json();
      })
      .then(normalizePayload);
  }

  function initWeather() {
    var root = document.querySelector("[data-weather-root]");

    if (root) {
      document.addEventListener("translationsApplied", function () {
        var cached = readCache(true);
        if (cached) {
          renderWeather(root, cached.payload, cached.fetchedAt);
        } else if (root.getAttribute("data-weather-unavailable") === "true") {
          renderUnavailable(root);
          announceUnavailable();
        }
      });
    }

    var validCache = readCache(false);
    if (validCache) {
      renderWeather(root, validCache.payload, validCache.fetchedAt);
      return;
    }

    fetchWeather().then(function (payload) {
      writeCache(payload);
      renderWeather(root, payload, new Date().toISOString());
    }).catch(function () {
      var staleCache = readCache(true);
      if (staleCache) {
        renderWeather(root, staleCache.payload, staleCache.fetchedAt, t("weather-stale-cache", "Dados climáticos temporariamente indisponíveis. Exibindo última previsão salva."));
        return;
      }
      if (root) root.setAttribute("data-weather-unavailable", "true");
      renderUnavailable(root);
      announceUnavailable();
    });
  }

  window.SMS_WEATHER = {
    city: CITY,
    cacheKey: CACHE_KEY,
    cacheTtlMs: CACHE_TTL_MS
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initWeather);
  } else {
    initWeather();
  }
})();
