(function () {
    "use strict";

    if (window.__SMSSeasonThemeInitialized) return;
    window.__SMSSeasonThemeInitialized = true;

    var STORAGE_KEY = "sms-season-preference";
    var AUTO_MODE = "auto";
    var ASSET_BASE = "images/seasonal/";
    var WEATHER_STATE = null;
    var WEATHER_FALLBACK = "Clima local";
    var SEASON_META = {
        auto: { label: "Automático", icon: "↻", context: "São Mateus do Sul" },
        summer: { label: "Verão", icon: "☀", context: "Luz quente" },
        autumn: { label: "Outono", icon: "◌", context: "Tons da erva-mate" },
        winter: { label: "Inverno", icon: "♨", context: "Mate quente" },
        spring: { label: "Primavera", icon: "✿", context: "Verde vivo" }
    };
    var SEASON_ASSETS = {
        summer: {
            folder: "summer",
            mascot: null,
            headerBadge: null,
            heroAccent: null,
            sticker: null,
            weatherIcon: null,
            effects: ["sunGlow"]
        },
        autumn: {
            folder: "autumn",
            mascot: null,
            headerBadge: null,
            heroAccent: null,
            sticker: null,
            weatherIcon: null,
            effects: ["leafDrift"]
        },
        winter: {
            folder: "winter",
            mascot: null,
            headerBadge: null,
            heroAccent: null,
            sticker: null,
            weatherIcon: null,
            effects: ["mateSteam"]
        },
        spring: {
            folder: "spring",
            mascot: null,
            headerBadge: null,
            heroAccent: null,
            sticker: null,
            weatherIcon: null,
            effects: ["sproutBloom"]
        }
    };
    var ASSET_CACHE = {};

    function isKnownMode(mode) {
        return Object.prototype.hasOwnProperty.call(SEASON_META, mode);
    }

    function safeGetStoredMode() {
        try {
            var storedMode = window.localStorage.getItem(STORAGE_KEY);
            return isKnownMode(storedMode) ? storedMode : AUTO_MODE;
        } catch (error) {
            return AUTO_MODE;
        }
    }

    function safeSetStoredMode(mode) {
        try {
            if (mode === AUTO_MODE) {
                window.localStorage.removeItem(STORAGE_KEY);
                return;
            }
            window.localStorage.setItem(STORAGE_KEY, mode);
        } catch (error) {
            return;
        }
    }

    function getBrazilDateParts() {
        var formatter = new Intl.DateTimeFormat("en-CA", {
            timeZone: "America/Sao_Paulo",
            month: "numeric",
            day: "numeric"
        });
        var values = { month: 1, day: 1 };

        formatter.formatToParts(new Date()).forEach(function (part) {
            if (part.type === "month" || part.type === "day") {
                values[part.type] = Number(part.value);
            }
        });

        return values;
    }

    function getAutomaticSeason() {
        var date = getBrazilDateParts();
        var month = date.month;
        var day = date.day;

        if ((month === 12 && day >= 21) || month === 1 || month === 2 || (month === 3 && day <= 20)) {
            return "summer";
        }
        if ((month === 3 && day >= 21) || month === 4 || month === 5 || (month === 6 && day <= 20)) {
            return "autumn";
        }
        if ((month === 6 && day >= 21) || month === 7 || month === 8 || (month === 9 && day <= 22)) {
            return "winter";
        }
        return "spring";
    }

    function getResolvedSeason(mode) {
        if (mode === AUTO_MODE) return getAutomaticSeason();
        return isKnownMode(mode) ? mode : AUTO_MODE;
    }

    function getSeasonAssetManifest(season) {
        var selectedSeason = season === AUTO_MODE ? getAutomaticSeason() : season;
        var defaults = SEASON_ASSETS[selectedSeason] || SEASON_ASSETS[getAutomaticSeason()];
        var overrides = window.SMS_SEASON_ASSETS && window.SMS_SEASON_ASSETS[selectedSeason];

        if (!overrides) return defaults;

        var merged = {};
        Object.keys(defaults).forEach(function (key) {
            merged[key] = defaults[key];
        });
        Object.keys(overrides).forEach(function (key) {
            merged[key] = overrides[key];
        });
        return merged;
    }

    function getAssetUrl(src) {
        if (!src) return "";
        if (/^(?:https?:)?\/\//.test(src) || src.charAt(0) === "/" || src.indexOf("data:") === 0) {
            return src;
        }
        return ASSET_BASE + src.replace(/^\/+/, "");
    }

    function getAssetRoleSource(manifest, role, fallbackRole) {
        if (!manifest) return "";
        return manifest[role] || (fallbackRole && manifest[fallbackRole]) || "";
    }

    function loadAsset(url, callback) {
        if (!url) {
            callback(false);
            return;
        }

        if (ASSET_CACHE[url]) {
            callback(ASSET_CACHE[url] === "loaded");
            return;
        }

        var image = new Image();
        image.onload = function () {
            ASSET_CACHE[url] = "loaded";
            callback(true);
        };
        image.onerror = function () {
            ASSET_CACHE[url] = "missing";
            callback(false);
        };
        image.src = url;
    }

    function setAssetElement(element, url) {
        element.classList.remove("season-asset-loaded");
        element.classList.add("season-asset-fallback");
        element.style.removeProperty("background-image");
        element.dataset.seasonAssetSrc = url || "";

        if (!url) return;

        loadAsset(url, function (isLoaded) {
            if (element.dataset.seasonAssetSrc !== url) return;
            element.classList.toggle("season-asset-loaded", isLoaded);
            element.classList.toggle("season-asset-fallback", !isLoaded);
            if (isLoaded) {
                element.style.backgroundImage = 'url("' + url.replace(/"/g, "%22") + '")';
            } else {
                element.style.removeProperty("background-image");
            }
        });
    }

    function updateSeasonAssets(season) {
        var manifest = getSeasonAssetManifest(season);
        var effects = manifest.effects || [];
        var root = document.documentElement;

        root.dataset.seasonEffects = effects.join(" ");

        document.querySelectorAll("[data-season-asset-role]").forEach(function (element) {
            var role = element.dataset.seasonAssetRole;
            var fallbackRole = element.dataset.seasonAssetFallbackRole;
            var src = getAssetRoleSource(manifest, role, fallbackRole);
            setAssetElement(element, getAssetUrl(src));
        });
    }

    function getBrazilHour() {
        var formatter = new Intl.DateTimeFormat("en-CA", {
            timeZone: "America/Sao_Paulo",
            hour: "numeric",
            hour12: false
        });
        var hour = Number(formatter.format(new Date()));
        return Number.isFinite(hour) ? hour : new Date().getHours();
    }

    function getDayPeriod() {
        var hour = getBrazilHour();
        if (hour < 6) return "night";
        if (hour < 10) return "morning";
        if (hour < 18) return "day";
        if (hour < 20) return "evening";
        return "night";
    }

    function getModeOptions() {
        return [
            { value: AUTO_MODE, label: SEASON_META.auto.label },
            { value: "summer", label: SEASON_META.summer.label },
            { value: "autumn", label: SEASON_META.autumn.label },
            { value: "winter", label: SEASON_META.winter.label },
            { value: "spring", label: SEASON_META.spring.label }
        ];
    }

    function updateControls(mode, season) {
        var resolvedMode = isKnownMode(mode) ? mode : AUTO_MODE;
        var resolvedSeason = isKnownMode(season) && season !== AUTO_MODE ? season : getAutomaticSeason();
        var currentLabel = SEASON_META[resolvedSeason].label;
        var currentIcon = SEASON_META[resolvedSeason].icon;
        var modeLabel = resolvedMode === AUTO_MODE ? "Auto" : "Manual";

        document.querySelectorAll("[data-season-option]").forEach(function (button) {
            var isActive = button.dataset.seasonOption === resolvedMode;
            button.classList.toggle("is-active", isActive);
            button.setAttribute("aria-checked", isActive ? "true" : "false");
        });

        document.querySelectorAll("[data-season-current]").forEach(function (label) {
            label.textContent = currentLabel;
        });

        document.querySelectorAll("[data-season-icon]").forEach(function (icon) {
            icon.textContent = currentIcon;
        });

        document.querySelectorAll("[data-season-mode-label]").forEach(function (label) {
            label.textContent = modeLabel;
        });

        document.querySelectorAll(".season-switcher").forEach(function (switcher) {
            switcher.dataset.currentSeason = resolvedSeason;
            switcher.dataset.currentMode = resolvedMode;
        });

        document.querySelectorAll("[data-season-mascot]").forEach(function (mascot) {
            mascot.dataset.season = resolvedSeason;
            mascot.setAttribute("aria-label", "Elemento visual sazonal: " + currentLabel);
        });

        document.querySelectorAll("[data-season-context]").forEach(function (context) {
            context.textContent = SEASON_META[resolvedSeason].context;
        });

        document.querySelectorAll(".season-switcher__trigger").forEach(function (trigger) {
            var title = resolvedMode === AUTO_MODE
                ? "Estação automática: " + currentLabel
                : "Estação manual: " + currentLabel;
            trigger.setAttribute("title", title);
            trigger.setAttribute("aria-label", "Selecionar estação visual do site. Atual: " + currentLabel + ".");
        });
    }

    function applySeason(mode) {
        var selectedMode = isKnownMode(mode) ? mode : AUTO_MODE;
        var season = getResolvedSeason(selectedMode);
        var root = document.documentElement;

        root.dataset.season = season;
        root.dataset.seasonMode = selectedMode;
        root.dataset.dayPeriod = getDayPeriod();

        updateControls(selectedMode, season);
        updateSeasonAssets(season);
        safeSetStoredMode(selectedMode);

        document.dispatchEvent(new CustomEvent("sms:seasonchange", {
            detail: { mode: selectedMode, season: season }
        }));
    }

    function closeAllPopovers(except) {
        document.querySelectorAll(".season-switcher.is-open").forEach(function (switcher) {
            if (switcher === except) return;
            switcher.classList.remove("is-open");
            var trigger = switcher.querySelector(".season-switcher__trigger");
            if (trigger) trigger.setAttribute("aria-expanded", "false");
        });
    }

    function formatWeatherTemp(value) {
        var number = Number(value);
        if (!Number.isFinite(number)) return "--°C";
        return Math.round(number) + "°C";
    }

    function renderWeatherBadges() {
        document.querySelectorAll("[data-season-weather]").forEach(function (badge) {
            var temp = badge.querySelector("[data-season-weather-temp]");
            var condition = badge.querySelector("[data-season-weather-condition]");
            var place = badge.querySelector("[data-season-weather-place]");
            var hasWeather = WEATHER_STATE && WEATHER_STATE.available;

            if (place) place.textContent = "São Mateus do Sul";
            if (temp) temp.textContent = hasWeather ? formatWeatherTemp(WEATHER_STATE.temp) : "--°C";
            if (condition) {
                condition.textContent = hasWeather && WEATHER_STATE.condition
                    ? WEATHER_STATE.condition
                    : WEATHER_FALLBACK;
            }
            badge.classList.toggle("is-unavailable", !hasWeather);
        });
    }

    function buildSwitcher(variant, isSurface) {
        var wrapper = document.createElement("div");
        wrapper.className = "season-switcher" + (isSurface ? " season-switcher--surface" : "");
        wrapper.dataset.variant = variant || "nav";

        var trigger = document.createElement("button");
        trigger.type = "button";
        trigger.className = "season-switcher__trigger";
        trigger.setAttribute("aria-haspopup", "menu");
        trigger.setAttribute("aria-expanded", "false");
        trigger.setAttribute("aria-label", "Selecionar estação visual do site");

        var icon = document.createElement("span");
        icon.className = "season-switcher__icon";
        icon.setAttribute("data-season-icon", "");
        icon.setAttribute("aria-hidden", "true");
        icon.textContent = SEASON_META.autumn.icon;

        var current = document.createElement("span");
        current.className = "season-switcher__current";
        current.setAttribute("data-season-current", "");
        current.textContent = SEASON_META.autumn.label;

        var meta = document.createElement("span");
        meta.className = "season-switcher__meta";
        meta.setAttribute("data-season-mode-label", "");
        meta.textContent = "Auto";

        trigger.appendChild(icon);
        trigger.appendChild(current);
        trigger.appendChild(meta);

        var menu = document.createElement("div");
        menu.className = "season-switcher__popover";
        menu.setAttribute("role", "menu");

        getModeOptions().forEach(function (optionData) {
            var option = document.createElement("button");
            option.type = "button";
            option.className = "season-switcher__option";
            option.setAttribute("role", "menuitemradio");
            option.setAttribute("data-season-option", optionData.value);
            option.setAttribute("aria-checked", "false");
            option.textContent = optionData.label;
            option.addEventListener("click", function () {
                applySeason(optionData.value);
                closeAllPopovers();
            });
            menu.appendChild(option);
        });

        trigger.addEventListener("click", function (event) {
            event.stopPropagation();
            var shouldOpen = !wrapper.classList.contains("is-open");
            closeAllPopovers(wrapper);
            wrapper.classList.toggle("is-open", shouldOpen);
            trigger.setAttribute("aria-expanded", shouldOpen ? "true" : "false");
        });

        wrapper.appendChild(trigger);
        wrapper.appendChild(menu);

        return wrapper;
    }

    function buildWeatherBadge() {
        var badge = document.createElement("div");
        badge.className = "season-weather";
        badge.setAttribute("data-season-weather", "");
        badge.setAttribute("aria-live", "polite");
        badge.innerHTML = [
            '<span class="season-weather__mark" data-season-asset-role="weatherIcon" aria-hidden="true"></span>',
            '<span class="season-weather__place" data-season-weather-place>São Mateus do Sul</span>',
            '<strong class="season-weather__temp" data-season-weather-temp>--°C</strong>',
            '<span class="season-weather__condition" data-season-weather-condition>' + WEATHER_FALLBACK + '</span>'
        ].join("");
        return badge;
    }

    function ensureAmbientLayer() {
        if (document.querySelector(".season-ambient")) return;

        var ambient = document.createElement("div");
        ambient.className = "season-ambient";
        ambient.setAttribute("aria-hidden", "true");
        ambient.innerHTML = [
            '<span class="season-ambient__sun" data-season-effect="sunGlow"></span>',
            '<span class="season-ambient__leaf season-ambient__leaf--one" data-season-effect="leafDrift"></span>',
            '<span class="season-ambient__leaf season-ambient__leaf--two" data-season-effect="leafDrift"></span>',
            '<span class="season-ambient__mate" data-season-effect="mateSteam"></span>',
            '<span class="season-ambient__sprout" data-season-effect="sproutBloom"></span>'
        ].join("");
        document.body.appendChild(ambient);
    }

    function buildMascotSlot(variant) {
        var slot = document.createElement("div");
        slot.className = "season-mascot" + (variant ? " season-mascot--" + variant : "");
        slot.setAttribute("data-season-mascot", "");
        slot.setAttribute("role", "img");
        var primaryRole = variant === "nav" ? "headerBadge" : "heroAccent";
        slot.innerHTML = [
            '<span class="season-mascot__asset" data-season-asset-role="' + primaryRole + '" data-season-asset-fallback-role="mascot" aria-hidden="true"></span>',
            '<span class="season-mascot__context" data-season-context></span>',
            '<span class="season-mascot__sticker" data-season-asset-role="sticker" aria-hidden="true"></span>'
        ].join("");
        return slot;
    }

    function mountMascotSlot() {
        if (document.querySelector("[data-season-mascot]")) return false;

        var heroContent = document.querySelector(".hero-content");
        if (heroContent) {
            heroContent.appendChild(buildMascotSlot("hero"));
            return true;
        }

        var mapHero = document.querySelector("#map-hero");
        if (mapHero) {
            mapHero.appendChild(buildMascotSlot("map"));
            return true;
        }

        var navContainer = document.querySelector(".nav-container");
        if (navContainer) {
            navContainer.appendChild(buildMascotSlot("nav"));
            return true;
        }

        return false;
    }

    function createSlot(className, variant, isSurface) {
        var slot = document.createElement("div");
        slot.className = className;
        slot.appendChild(buildSwitcher(variant, isSurface));
        if (variant === "aux") {
            slot.appendChild(buildWeatherBadge());
        }
        return slot;
    }

    function mountIntoUtilityBar() {
        var controls = document.querySelector(".accessibility-bar .controls");
        if (!controls || controls.querySelector(".season-inline-slot")) return false;

        controls.appendChild(createSlot("season-inline-slot season-inline-slot--aux", "aux", false));
        return true;
    }

    function mountIntoHeaderFallback() {
        var languageSelector = document.querySelector(".language-selector");
        if (languageSelector && languageSelector.parentElement && !languageSelector.parentElement.querySelector(".season-inline-slot")) {
            languageSelector.parentElement.insertBefore(
                createSlot("season-inline-slot season-inline-slot--nav", "nav", false),
                languageSelector
            );
            return true;
        }

        var headerNav = document.querySelector(".header-nav");
        if (!headerNav || headerNav.querySelector(".season-inline-slot")) return false;

        headerNav.appendChild(createSlot("season-inline-slot season-inline-slot--nav", "nav", false));
        return true;
    }

    function mountIntoFooter() {
        var footer = document.querySelector(".footer");
        if (!footer || footer.querySelector(".season-inline-slot")) return false;

        var slot = createSlot("season-inline-slot season-inline-slot--footer", "footer", true);
        slot.style.marginTop = "1rem";
        footer.appendChild(slot);
        return true;
    }

    function ensureSwitcher() {
        return mountIntoUtilityBar() || mountIntoHeaderFallback() || mountIntoFooter();
    }

    function onWeatherChange(event) {
        var detail = event && event.detail ? event.detail : {};
        WEATHER_STATE = {
            available: !!detail.available,
            temp: detail.temp,
            condition: detail.condition || "",
            fetchedAt: detail.fetchedAt || ""
        };
        renderWeatherBadges();
        updateControls(document.documentElement.dataset.seasonMode || AUTO_MODE, document.documentElement.dataset.season || getAutomaticSeason());
    }

    function syncReducedMotion() {
        if (!window.matchMedia) return;

        var mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
        var applyMotionPreference = function () {
            document.documentElement.classList.toggle("season-reduced-motion", mediaQuery.matches);
        };

        applyMotionPreference();

        if (typeof mediaQuery.addEventListener === "function") {
            mediaQuery.addEventListener("change", applyMotionPreference);
            return;
        }

        if (typeof mediaQuery.addListener === "function") {
            mediaQuery.addListener(applyMotionPreference);
        }
    }

    function init() {
        syncReducedMotion();
        ensureAmbientLayer();
        ensureSwitcher();
        mountMascotSlot();
        applySeason(safeGetStoredMode());
        renderWeatherBadges();

        document.addEventListener("click", function (event) {
            if (!event.target.closest(".season-switcher")) {
                closeAllPopovers();
            }
        });

        document.addEventListener("keydown", function (event) {
            if (event.key === "Escape") {
                closeAllPopovers();
            }
        });

        document.addEventListener("sms:weatherchange", onWeatherChange);
    }

    window.SMSSeasonTheme = {
        applySeason: applySeason,
        getAutomaticSeason: getAutomaticSeason,
        getSeasonAssets: getSeasonAssetManifest,
        refreshAssets: function () {
            updateSeasonAssets(document.documentElement.dataset.season || getAutomaticSeason());
        }
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init, { once: true });
    } else {
        init();
    }
})();
