(function () {
    "use strict";

    var STORAGE_KEY = "sms-season-preference";
    var AUTO_MODE = "auto";
    var SEASON_LABELS = {
        auto: "Automático",
        summer: "Verão",
        autumn: "Outono",
        winter: "Inverno",
        spring: "Primavera"
    };

    function safeGetStoredMode() {
        try {
            return window.localStorage.getItem(STORAGE_KEY) || AUTO_MODE;
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

        if ((month === 12 && day >= 21) || month === 1 || month === 2 || (month === 3 && day < 20)) {
            return "summer";
        }
        if ((month === 3 && day >= 20) || month === 4 || month === 5 || (month === 6 && day < 21)) {
            return "autumn";
        }
        if ((month === 6 && day >= 21) || month === 7 || month === 8 || (month === 9 && day < 22)) {
            return "winter";
        }
        return "spring";
    }

    function getModeOptions() {
        return [
            { value: AUTO_MODE, label: "Automático" },
            { value: "summer", label: "Verão" },
            { value: "autumn", label: "Outono" },
            { value: "winter", label: "Inverno" },
            { value: "spring", label: "Primavera" }
        ];
    }

    function updateSelects(mode) {
        document.querySelectorAll("[data-season-select]").forEach(function (select) {
            if (select.value !== mode) {
                select.value = mode;
            }
        });
    }

    function applySeason(mode) {
        var selectedMode = mode && SEASON_LABELS[mode] ? mode : AUTO_MODE;
        var season = selectedMode === AUTO_MODE ? getAutomaticSeason() : selectedMode;
        var root = document.documentElement;

        root.dataset.season = season;
        root.dataset.seasonMode = selectedMode;

        updateSelects(selectedMode);
        safeSetStoredMode(selectedMode);
    }

    function bindSelect(select) {
        if (!select || select.dataset.seasonBound === "true") return;

        select.dataset.seasonBound = "true";
        select.addEventListener("change", function (event) {
            applySeason(event.target.value);
        });
    }

    function buildSwitcher(isSurface) {
        var wrapper = document.createElement("label");
        wrapper.className = "season-switcher" + (isSurface ? " season-switcher--surface" : "");
        wrapper.setAttribute("aria-label", "Selecionar estação do site");

        var title = document.createElement("span");
        title.className = "season-switcher__label";
        title.textContent = "Estação";

        var select = document.createElement("select");
        select.className = "season-switcher__select";
        select.setAttribute("data-season-select", "");
        select.setAttribute("aria-label", "Selecionar estação");

        getModeOptions().forEach(function (optionData) {
            var option = document.createElement("option");
            option.value = optionData.value;
            option.textContent = optionData.label;
            select.appendChild(option);
        });

        wrapper.appendChild(title);
        wrapper.appendChild(select);
        bindSelect(select);

        return wrapper;
    }

    function mountIntoNav() {
        var navLinks = document.querySelector(".nav-links");
        if (!navLinks || navLinks.querySelector(".season-nav-item")) return false;

        var item = document.createElement("li");
        item.className = "season-nav-item";
        item.appendChild(buildSwitcher(false));

        var languageItem = navLinks.querySelector(".language-selector");
        if (languageItem && languageItem.closest("li")) {
            navLinks.insertBefore(item, languageItem.closest("li"));
            return true;
        }

        navLinks.appendChild(item);
        return true;
    }

    function mountIntoHeader() {
        var headerNav = document.querySelector(".header-nav");
        if (!headerNav || headerNav.querySelector(".season-inline-slot")) return false;

        var slot = document.createElement("div");
        slot.className = "season-inline-slot";
        slot.appendChild(buildSwitcher(false));
        headerNav.appendChild(slot);
        return true;
    }

    function mountIntoFooter() {
        var footer = document.querySelector(".footer");
        if (!footer || footer.querySelector(".season-inline-slot")) return false;

        var slot = document.createElement("div");
        slot.className = "season-inline-slot";
        slot.style.marginTop = "1rem";
        slot.appendChild(buildSwitcher(true));
        footer.appendChild(slot);
        return true;
    }

    function ensureSwitcher() {
        return mountIntoNav() || mountIntoHeader() || mountIntoFooter();
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
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init, { once: true });
    } else {
        init();
    }
})();
