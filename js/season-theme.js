(function () {
    "use strict";

    if (window.__SMSSeasonThemeInitialized) return;
    window.__SMSSeasonThemeInitialized = true;

    var STORAGE_KEY = "sms-season-preference";
    var AUTO_MODE = "auto";
    var SEASON_META = {
        auto: { label: "Automático", icon: "↻" },
        summer: { label: "Verão", icon: "☀" },
        autumn: { label: "Outono", icon: "◌" },
        winter: { label: "Inverno", icon: "❄" },
        spring: { label: "Primavera", icon: "✿" }
    };

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

        updateControls(selectedMode, season);
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

    function createSlot(className, variant, isSurface) {
        var slot = document.createElement("div");
        slot.className = className;
        slot.appendChild(buildSwitcher(variant, isSurface));
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
        ensureSwitcher();
        applySeason(safeGetStoredMode());

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
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init, { once: true });
    } else {
        init();
    }
})();
