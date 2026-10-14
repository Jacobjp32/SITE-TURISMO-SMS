/**
 * admin-nav.js — navegação do painel (shell v2)
 * ---------------------------------------------
 * Camada fina sobre o `showSection` legado, sem substituir sua lógica:
 *  - breadcrumb e título da aba conforme a seção ativa;
 *  - links profundos (#eventos, #empreendimentos...) e botão Voltar do navegador;
 *  - gaveta de navegação no celular (abrir/fechar, Esc, overlay, foco);
 *  - contadores de pendências nos itens do menu (AdminNav.setBadge);
 *  - identificação do usuário e do ambiente (local/emulador) na barra superior.
 *
 * Não toca em login, sessão, permissões ou dados. IIFE, sem build step.
 */
(function () {
    "use strict";

    if (window.AdminNav) return;

    var SECTIONS = {
        "home": { group: "Visão geral", label: "Painel" },
        "aprovacoes": { group: "Moderação", label: "Aprovações" },
        "vinculos": { group: "Moderação", label: "Pedidos de vínculo" },
        "gerenciar-vinculos": { group: "Moderação", label: "Vínculos ativos" },
        "usuarios": { group: "Moderação", label: "Usuários" },
        "empreendimentos": { group: "Conteúdo", label: "Empreendimentos" },
        "eventos": { group: "Conteúdo", label: "Eventos" },
        "noticias": { group: "Conteúdo", label: "Notícias" },
        "rotas": { group: "Conteúdo", label: "Rotas" },
        "midia": { group: "Mídia", label: "Biblioteca de mídia" },
        "galeria": { group: "Mídia", label: "Galeria pública" },
        "banners": { group: "Portal", label: "Banners e pop-ups" },
        "sazonal": { group: "Portal", label: "Sazonal e clima" },
        "mascote": { group: "Portal", label: "Mascote" },
        "audit-logs": { group: "Sistema", label: "Registro de atividades" }
    };
    var MOBILE_QUERY = window.matchMedia ? window.matchMedia("(max-width: 960px)") : null;
    var BASE_TITLE = "Painel Admin | Turismo SMS";

    var currentSection = "home";
    var lastFocusBeforeDrawer = null;

    function $(id) { return document.getElementById(id); }

    function sectionFromHash() {
        var raw = (window.location.hash || "").replace(/^#/, "");
        try { raw = decodeURIComponent(raw); } catch (error) {}
        return Object.prototype.hasOwnProperty.call(SECTIONS, raw) ? raw : "";
    }

    function isDashboardVisible() {
        var dashboard = $("dashboard");
        return !!(dashboard && dashboard.classList.contains("active"));
    }

    function isMobile() {
        return !!(MOBILE_QUERY && MOBILE_QUERY.matches);
    }

    // ---------- Gaveta (celular) ----------
    function setDrawer(open) {
        var sidebar = $("adminSidebar");
        var toggle = $("adminNavToggle");
        var overlay = $("adminNavOverlay");
        if (!sidebar) return;
        var shouldOpen = !!open && isMobile();
        document.body.classList.toggle("admin-nav-open", shouldOpen);
        if (toggle) toggle.setAttribute("aria-expanded", shouldOpen ? "true" : "false");
        if (overlay) overlay.hidden = !shouldOpen;
        if (isMobile()) {
            if (shouldOpen) sidebar.removeAttribute("inert"); else sidebar.setAttribute("inert", "");
        } else {
            sidebar.removeAttribute("inert");
        }
        if (shouldOpen) {
            lastFocusBeforeDrawer = document.activeElement;
            var active = sidebar.querySelector(".sidebar-menu a.active") || sidebar.querySelector(".sidebar-menu a");
            if (active) active.focus({ preventScroll: true });
        } else if (lastFocusBeforeDrawer && typeof lastFocusBeforeDrawer.focus === "function") {
            try { lastFocusBeforeDrawer.focus({ preventScroll: true }); } catch (error) {}
            lastFocusBeforeDrawer = null;
        }
    }

    // ---------- Pós-navegação ----------
    function afterNavigate(section, options) {
        var meta = SECTIONS[section];
        if (!meta) return;
        var settings = options || {};
        currentSection = section;

        var group = $("adminCrumbGroup");
        var current = $("adminCrumbCurrent");
        if (group) group.textContent = meta.group;
        if (current) current.textContent = meta.label;
        document.title = meta.label + " · " + BASE_TITLE;

        if (!settings.fromHistory && ("#" + section) !== window.location.hash) {
            try { window.history.pushState({ adminSection: section }, "", "#" + section); } catch (error) {}
        }

        if (document.body.classList.contains("admin-nav-open")) setDrawer(false);

        try { window.scrollTo({ top: 0 }); } catch (error) { window.scrollTo(0, 0); }
        if (!settings.silentFocus) {
            var target = document.getElementById("section-" + section);
            var heading = target && target.querySelector("h1");
            if (heading) {
                if (!heading.hasAttribute("tabindex")) heading.setAttribute("tabindex", "-1");
                try { heading.focus({ preventScroll: true }); } catch (error) {}
            }
        }

        if (section === "home" && settings.reloadDashboard !== false &&
            window.AdminDashboardModule && typeof window.AdminDashboardModule.load === "function") {
            window.AdminDashboardModule.load(window.AdminContext || null);
        }
    }

    function wrapShowSection() {
        var original = window.showSection;
        if (typeof original !== "function" || original.__adminNavWrapped) return false;
        var wrapped = function (section) {
            var result = original.apply(this, arguments);
            afterNavigate(section, wrapped.__nextOptions || {});
            wrapped.__nextOptions = null;
            return result;
        };
        wrapped.__adminNavWrapped = true;
        wrapped.__original = original;
        window.showSection = wrapped;
        return true;
    }

    function navigate(section, options) {
        if (!SECTIONS[section] || typeof window.showSection !== "function") return;
        window.showSection.__nextOptions = options || null;
        window.showSection(section);
    }

    // ---------- Badges ----------
    function setBadge(section, count, title) {
        var nodes = document.querySelectorAll('[data-nav-badge="' + section + '"]');
        var value = Number(count);
        Array.prototype.forEach.call(nodes, function (node) {
            if (!Number.isFinite(value) || value <= 0) {
                node.hidden = true;
                node.textContent = "";
                node.removeAttribute("title");
                return;
            }
            node.hidden = false;
            node.textContent = value > 99 ? "99+" : String(value);
            if (title) node.setAttribute("title", title);
            var srText = title || (value + " pendente(s)");
            node.setAttribute("aria-label", srText);
        });
    }

    // ---------- Usuário / ambiente ----------
    function initials(name) {
        var parts = String(name || "").trim().split(/\s+/).filter(Boolean);
        if (!parts.length) return "?";
        return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
    }

    function renderUser() {
        var user = window.currentUser;
        var chip = $("adminUserChip");
        if (!chip) return;
        if (!user || user._profilePending) { chip.hidden = true; return; }
        var name = user.nome || user.displayName || user.email || "Administrador";
        $("adminUserName").textContent = String(name).split(/\s+/)[0];
        $("adminUserAvatar").textContent = initials(name);
        chip.title = (user.email || name) + " · " + (user.role === "admin" ? "Administrador" : user.role || "");
        chip.hidden = false;
    }

    // O rótulo segue o que o firebase-auth.js de fato conectou, nunca só o
    // parâmetro da URL: "?emulator=1" fora de localhost é ignorado pelo runtime
    // e o painel continua falando com o Firebase real.
    function renderEnvironment() {
        var tag = $("adminEnvTag");
        if (!tag) return;
        var host = window.location.hostname;
        var isLocal = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(host);
        var askedEmulator = new URLSearchParams(window.location.search).get("emulator") === "1";
        var emulator = window.__SMSFirebaseEmulatorsConnected === true;
        tag.classList.remove("is-emulator", "is-real");
        if (emulator) {
            tag.textContent = "Ambiente local · dados de teste";
            tag.title = "Conectado ao Firebase Emulator (projeto demo): nada do que você fizer aqui altera o portal real.";
            tag.classList.add("is-emulator");
        } else if (isLocal || askedEmulator) {
            tag.textContent = "Dados reais";
            tag.title = askedEmulator && !isLocal
                ? "O modo de teste só funciona em localhost. Este painel está conectado ao Firebase real."
                : "Servidor local conectado ao Firebase real: as alterações valem para o portal.";
            tag.classList.add("is-real");
        } else {
            tag.hidden = true;
            return;
        }
        tag.hidden = false;
    }

    // Atalhos do Painel podem chegar com filtro (data-filter-status, data-filter-geo).
    var FILTERABLE = { empreendimentos: function () { return window.AdminEstablishmentsModule; } };

    function presetFromLink(section, link) {
        var resolve = FILTERABLE[section];
        var module = resolve ? resolve() : null;
        if (!module || typeof module.presetFilters !== "function") return;
        var filters = {};
        ["status", "geo"].forEach(function (key) {
            var value = link.getAttribute("data-filter-" + key);
            if (value) filters[key] = value;
        });
        module.presetFilters(filters);
    }

    // ---------- Eventos ----------
    function onDocumentClick(event) {
        var link = event.target && typeof event.target.closest === "function"
            ? event.target.closest("a[data-section], [data-goto]")
            : null;
        if (!link) return;
        var section = link.getAttribute("data-section") || link.getAttribute("data-goto");
        if (!SECTIONS[section]) return;
        if (link.tagName === "A" && (event.ctrlKey || event.metaKey || event.shiftKey || event.button === 1)) return; // nova aba
        event.preventDefault();
        presetFromLink(section, link);
        // Itens do menu lateral já chamam showSection pelo listener legado.
        if (link.closest(".sidebar-menu")) return;
        navigate(section);
    }

    function onHistory() {
        if (!isDashboardVisible()) return;
        var section = sectionFromHash() || "home";
        if (section !== currentSection) navigate(section, { fromHistory: true });
    }

    function onKeydown(event) {
        if (event.key === "Escape" && document.body.classList.contains("admin-nav-open")) {
            setDrawer(false);
            var toggle = $("adminNavToggle");
            if (toggle) toggle.focus();
        }
    }

    function watchDashboard() {
        var dashboard = $("dashboard");
        if (!dashboard || typeof MutationObserver !== "function") return;
        var wasActive = dashboard.classList.contains("active");
        new MutationObserver(function () {
            var active = dashboard.classList.contains("active");
            if (active && !wasActive) {
                renderUser();
                var deepLink = sectionFromHash();
                if (deepLink && deepLink !== "home") {
                    navigate(deepLink, { fromHistory: true, silentFocus: true });
                } else {
                    afterNavigate("home", { fromHistory: true, silentFocus: true, reloadDashboard: false });
                }
            }
            wasActive = active;
        }).observe(dashboard, { attributes: true, attributeFilter: ["class"] });
    }

    /* ---------- Tabelas → cartões no celular ----------
       Cada célula ganha o rótulo da coluna (data-label) e o conteúdo é
       envolvido em .cell-body; o CSS decide a apresentação por largura.
       Nada muda nos dados nem nos handlers (delegação por closest()). */
    var ACTIONS_HEADER = /^(a[çc][õo]es|acoes)$/i;

    function enhanceTable(table) {
        if (!table || table.getAttribute("data-cards") === "ready") return;
        var head = table.tHead;
        if (!head || !head.rows.length) return;
        var labels = Array.prototype.map.call(head.rows[0].cells, function (cell) {
            return String(cell.textContent || "").replace(/\s+/g, " ").trim();
        });
        Array.prototype.forEach.call(table.tBodies, function (tbody) {
            Array.prototype.forEach.call(tbody.rows, function (row) {
                Array.prototype.forEach.call(row.cells, function (cell, index) {
                    if (cell.getAttribute("data-label") !== null) return;
                    var label = labels[index] || "";
                    cell.setAttribute("data-label", label);
                    if (index === 0) cell.classList.add("cell-primary");
                    if (ACTIONS_HEADER.test(label)) cell.classList.add("cell-actions");
                    var text = String(cell.textContent || "").replace(/\s+/g, "");
                    if ((!text || text === "—") && !cell.querySelector("img, button, select, input, textarea, a")) {
                        cell.classList.add("cell-empty");
                    }
                    if (!cell.classList.contains("cell-primary") && !cell.classList.contains("cell-actions") &&
                        !(cell.children.length === 1 && cell.firstElementChild.classList.contains("cell-body"))) {
                        var body = document.createElement("div");
                        body.className = "cell-body";
                        while (cell.firstChild) body.appendChild(cell.firstChild);
                        cell.appendChild(body);
                    }
                });
            });
        });
        table.classList.add("data-table--cards");
        table.setAttribute("data-cards", "ready");
    }

    function enhanceTables(root) {
        Array.prototype.forEach.call((root || document).querySelectorAll("table.data-table"), enhanceTable);
    }

    function watchTables() {
        var main = $("adminMain") || document.body;
        var pending = false;
        enhanceTables(main);
        if (typeof MutationObserver !== "function") return;
        new MutationObserver(function () {
            if (pending) return;
            pending = true;
            (window.requestAnimationFrame || setTimeout)(function () {
                pending = false;
                enhanceTables(main);
            });
        }).observe(main, { childList: true, subtree: true });
    }

    function init() {
        wrapShowSection();
        watchTables();
        renderEnvironment();
        document.addEventListener("click", onDocumentClick, true);
        document.addEventListener("keydown", onKeydown);
        window.addEventListener("popstate", onHistory);
        window.addEventListener("hashchange", onHistory);
        window.addEventListener("authStateChanged", renderUser);
        window.addEventListener("authStateChanged", renderEnvironment);

        var toggle = $("adminNavToggle");
        var close = $("adminNavClose");
        var overlay = $("adminNavOverlay");
        if (toggle) toggle.addEventListener("click", function () {
            setDrawer(!document.body.classList.contains("admin-nav-open"));
        });
        if (close) close.addEventListener("click", function () { setDrawer(false); });
        if (overlay) overlay.addEventListener("click", function () { setDrawer(false); });
        if (MOBILE_QUERY) {
            var sync = function () { setDrawer(false); };
            if (typeof MOBILE_QUERY.addEventListener === "function") MOBILE_QUERY.addEventListener("change", sync);
            else if (typeof MOBILE_QUERY.addListener === "function") MOBILE_QUERY.addListener(sync);
        }
        setDrawer(false);
        watchDashboard();
        renderUser();
    }

    window.AdminNav = {
        sections: SECTIONS,
        navigate: navigate,
        setBadge: setBadge,
        openDrawer: function () { setDrawer(true); },
        closeDrawer: function () { setDrawer(false); },
        getCurrentSection: function () { return currentSection; },
        enhanceTables: enhanceTables
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init, { once: true });
    } else {
        init();
    }
})();
