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

    function updateControls(mode) {
        document.querySelectorAll("[data-season-option]").forEach(function (button) {
            button.classList.toggle("is-active", button.dataset.seasonOption === mode);
            button.setAttribute("aria-pressed", button.dataset.seasonOption === mode ? "true" : "false");
        });

        document.querySelectorAll("[data-season-current]").forEach(function (label) {
            label.textContent = SEASON_LABELS[mode] || SEASON_LABELS[AUTO_MODE];
        });
    }

    function applySeason(mode) {
        var selectedMode = mode && SEASON_LABELS[mode] ? mode : AUTO_MODE;
        var season = selectedMode === AUTO_MODE ? getAutomaticSeason() : selectedMode;
        var root = document.documentElement;

        root.dataset.season = season;
        root.dataset.seasonMode = selectedMode;

        updateControls(selectedMode);
        safeSetStoredMode(selectedMode);
    }

    function closeAllPopovers(except) {
        document.querySelectorAll(".season-switcher.is-open").forEach(function (switcher) {
            if (switcher === except) return;
            switcher.classList.remove("is-open");
            var trigger = switcher.querySelector(".season-switcher__trigger");
            if (trigger) trigger.setAttribute("aria-expanded", "false");
        });
    }

    function buildSwitcher(isSurface) {
        var wrapper = document.createElement("div");
        wrapper.className = "season-switcher" + (isSurface ? " season-switcher--surface" : "");

        var trigger = document.createElement("button");
        trigger.type = "button";
        trigger.className = "season-switcher__trigger";
        trigger.setAttribute("aria-haspopup", "true");
        trigger.setAttribute("aria-expanded", "false");
        trigger.setAttribute("aria-label", "Selecionar estação visual do site");

        var icon = document.createElement("span");
        icon.className = "season-switcher__icon";
        icon.setAttribute("aria-hidden", "true");
        icon.textContent = "◌";

        var current = document.createElement("span");
        current.className = "season-switcher__current";
        current.setAttribute("data-season-current", "");
        current.textContent = SEASON_LABELS[AUTO_MODE];

        trigger.appendChild(icon);
        trigger.appendChild(current);

        var menu = document.createElement("div");
        menu.className = "season-switcher__popover";
        menu.setAttribute("role", "menu");

        getModeOptions().forEach(function (optionData) {
            var option = document.createElement("button");
            option.type = "button";
            option.className = "season-switcher__option";
            option.setAttribute("role", "menuitemradio");
            option.setAttribute("data-season-option", optionData.value);
            option.setAttribute("aria-pressed", "false");
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

    function mountIntoHeader() {
        var languageSelector = document.querySelector(".language-selector");
        if (languageSelector && !languageSelector.parentElement.querySelector(".season-inline-slot")) {
            var slot = document.createElement("div");
            slot.className = "season-inline-slot";
            slot.appendChild(buildSwitcher(false));
            languageSelector.parentElement.insertBefore(slot, languageSelector);
            return true;
        }

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
        return mountIntoHeader() || mountIntoFooter();
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
