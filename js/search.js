(function () {
    "use strict";

    function normalizeText(value) {
        return String(value || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .trim();
    }

    function buildHaystack(item) {
        return normalizeText([
            item.title,
            item.category,
            item.description,
            item.url,
            Array.isArray(item.keywords) ? item.keywords.join(" ") : item.keywords
        ].join(" "));
    }

    function scoreItem(item, query, terms) {
        var score = 0;
        var title = normalizeText(item.title);
        var category = normalizeText(item.category);
        var description = normalizeText(item.description);
        var keywords = normalizeText(Array.isArray(item.keywords) ? item.keywords.join(" ") : item.keywords);
        var haystack = buildHaystack(item);

        if (title.indexOf(query) !== -1) score += 12;
        if (category.indexOf(query) !== -1) score += 7;
        if (keywords.indexOf(query) !== -1) score += 6;
        if (description.indexOf(query) !== -1) score += 4;

        for (var i = 0; i < terms.length; i += 1) {
            var term = terms[i];
            if (!term) continue;
            if (title.indexOf(term) !== -1) score += 5;
            if (category.indexOf(term) !== -1) score += 3;
            if (keywords.indexOf(term) !== -1) score += 3;
            if (haystack.indexOf(term) !== -1) score += 1;
        }

        return score;
    }

    function getTranslation(key, fallback) {
        var lang = localStorage.getItem("sms-lang") || "pt";
        var dict = (window.translations && window.translations[lang]) || {};
        return dict[key] || fallback;
    }

    function escapeHtml(value) {
        return String(value || "").replace(/[&<>"']/g, function (ch) {
            return ({
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;"
            })[ch];
        });
    }

    function safeUrl(value) {
        var raw = String(value || "");
        if (!raw || /['"()\\<>]/.test(raw)) return "/";
        try {
            var url = new URL(raw, window.location.origin);
            if (url.origin === window.location.origin || url.protocol === "http:" || url.protocol === "https:") {
                return escapeHtml(raw);
            }
        } catch (error) {
            return "/";
        }
        return "/";
    }

    function closeOpenMenus() {
        var navLinks = document.getElementById("navLinks");
        var navToggle = document.getElementById("navToggle");
        var overlays = [document.getElementById("mobileOverlay"), document.getElementById("menuOverlay")];

        if (navLinks) navLinks.classList.remove("active");
        if (navToggle) navToggle.classList.remove("active");
        overlays.forEach(function (overlay) {
            if (overlay) overlay.classList.remove("active");
        });
        document.body.style.overflow = "";
    }

    function initSearch() {
        var modal = document.getElementById("searchModal");
        var dialog = document.getElementById("searchDialog");
        var input = document.getElementById("search");
        var results = document.getElementById("searchResults");
        var triggers = document.querySelectorAll("[data-search-open]");
        var closeButtons = document.querySelectorAll("[data-search-close]");
        var index = Array.isArray(window.TURISMO_SEARCH_INDEX) ? window.TURISMO_SEARCH_INDEX : [];
        var previousFocus = null;

        if (!modal || !dialog || !input || !results || !index.length) {
            return;
        }

        function renderEmpty() {
            results.innerHTML =
                '<div class="search-empty-state">' +
                '<strong>' + getTranslation("search-no-results", "Nenhum resultado encontrado") + "</strong>" +
                "<p>" + getTranslation("search-no-results-help", "Tente buscar por atrações, roteiros, eventos ou hospedagens.") + "</p>" +
                "</div>";
        }

        function renderIdle() {
            results.innerHTML =
                '<div class="search-empty-state">' +
                '<strong>' + getTranslation("search-results-label", "Resultados da busca") + "</strong>" +
                "<p>" + getTranslation("search-results-help", "Busque por pontos turísticos, eventos, roteiros, sabores e serviços.") + "</p>" +
                "</div>";
        }

        function renderResults(items) {
            results.innerHTML = items.map(function (item) {
                return (
                    '<a class="search-result-card" href="' + safeUrl(item.url) + '">' +
                    '<span class="search-result-category">' + escapeHtml(item.category) + "</span>" +
                    '<strong class="search-result-title">' + escapeHtml(item.title) + "</strong>" +
                    '<p class="search-result-description">' + escapeHtml(item.description) + "</p>" +
                    "</a>"
                );
            }).join("");
        }

        function runSearch(query) {
            var normalized = normalizeText(query);
            if (normalized.length < 2) {
                renderIdle();
                return;
            }

            var terms = normalized.split(/\s+/).filter(Boolean);
            var matches = index
                .map(function (item) {
                    return { item: item, score: scoreItem(item, normalized, terms) };
                })
                .filter(function (entry) {
                    return entry.score > 0;
                })
                .sort(function (a, b) {
                    return b.score - a.score || a.item.title.localeCompare(b.item.title);
                })
                .slice(0, 8)
                .map(function (entry) {
                    return entry.item;
                });

            if (matches.length) {
                renderResults(matches);
            } else {
                renderEmpty();
            }
        }

        function openSearch(trigger) {
            previousFocus = trigger || document.activeElement;
            closeOpenMenus();
            modal.classList.add("active");
            modal.setAttribute("aria-hidden", "false");
            document.body.classList.add("search-open");
            document.body.style.overflow = "hidden";
            input.value = "";
            renderIdle();
            window.setTimeout(function () {
                input.focus();
            }, 30);
        }

        function closeSearch() {
            modal.classList.remove("active");
            modal.setAttribute("aria-hidden", "true");
            document.body.classList.remove("search-open");
            document.body.style.overflow = "";
            if (previousFocus && typeof previousFocus.focus === "function") {
                previousFocus.focus();
            }
        }

        triggers.forEach(function (trigger) {
            trigger.addEventListener("click", function (event) {
                event.preventDefault();
                openSearch(trigger);
            });
        });

        closeButtons.forEach(function (button) {
            button.addEventListener("click", function (event) {
                event.preventDefault();
                closeSearch();
            });
        });

        modal.addEventListener("click", function (event) {
            if (event.target === modal) {
                closeSearch();
            }
        });

        input.addEventListener("input", function (event) {
            runSearch(event.target.value);
        });

        input.addEventListener("keydown", function (event) {
            if (event.key === "Escape") {
                closeSearch();
            }
        });

        document.addEventListener("keydown", function (event) {
            if (event.key === "Escape" && modal.classList.contains("active")) {
                closeSearch();
            }
        });

        document.addEventListener("translationsApplied", function () {
            if (!modal.classList.contains("active")) {
                return;
            }
            runSearch(input.value);
        });

        renderIdle();
        window.TurismoSearch = {
            open: openSearch,
            close: closeSearch,
            search: runSearch
        };
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initSearch);
    } else {
        initSearch();
    }
})();
