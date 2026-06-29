/**
 * public-banners.js — Bloco 4F · Exibição PÚBLICA de banners publicados
 * ---------------------------------------------------------------------
 * Lê documentos da collection `banners` com `status == 'published'` e renderiza
 * banners ativos no site público, dentro de um slot discreto (#public-banners-slot).
 *
 * Padrão de inicialização espelha js/cms.js: import() do SDK modular do Firebase
 * (10.7.1) + app nomeado próprio (`public-banners-app`) + App Check. NÃO depende do
 * SDK compat estar carregado na página, então funciona em qualquer página-alvo.
 *
 * Esta etapa (4F) RENDERIZA apenas `type == 'banner'`.
 *   - `type == 'popup'` é IGNORADO de propósito → fica para o Bloco 4G (pop-up público).
 *
 * Segurança / robustez:
 *   - falha SILENCIOSA (log discreto no console), nunca quebra a página;
 *   - sem banners válidos → slot fica oculto;
 *   - textos escapados antes de irem ao DOM (usa window.SMSecurity quando disponível,
 *     senão fallback interno equivalente);
 *   - URLs (imagem e CTA) validadas; CTA externo recebe rel="noopener noreferrer";
 *   - imagem quebrada não derruba o layout (onerror oculta o card).
 *
 * Leitura pública é garantida pelas Firestore Rules (Bloco 4B): a query usa
 * where('status','==','published') — obrigatório, pois a rule só libera `published`.
 *
 * IIFE, sem build step, sem import/export estático. Namespace: window.PublicBanners.
 */
(function () {
    "use strict";

    var MOUNT_ID = "public-banners-slot";
    var MAX_BANNERS = 3;            // limite por área para não poluir o layout
    var COLLECTION = "banners";
    var APP_NAME = "public-banners-app";
    var CSS_HREF = "css/public-banners.css?v=public-banners-4f-20260629";

    var FIREBASE_APP_URL = "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
    var FIREBASE_FS_URL = "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
    var APP_CHECK_MODULE = "./firebase-app-check.js";

    // Mapeia o arquivo da página atual para a chave de `placement`.
    var FILE_TO_PLACEMENT = {
        "": "home",
        "index.html": "home",
        "eventos.html": "eventos",
        "mapa-turistico.html": "mapa",
        "sabores.html": "sabores",
        "noticias.html": "noticias"
    };

    // ======================================================================
    // Sanitização (defesa em profundidade — SMSecurity quando presente)
    // ======================================================================

    var HTML_MAP = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

    function esc(value, fallback) {
        if (window.SMSecurity && typeof window.SMSecurity.html === "function") {
            return window.SMSecurity.html(value, fallback || "");
        }
        var s = value == null || String(value).trim() === "" ? (fallback || "") : String(value);
        return s.replace(/[&<>"']/g, function (c) { return HTML_MAP[c]; });
    }

    function escAttr(value, fallback) {
        if (window.SMSecurity && typeof window.SMSecurity.attr === "function") {
            return window.SMSecurity.attr(value, fallback || "");
        }
        return esc(value, fallback).replace(/`/g, "&#96;");
    }

    // Retorna URL segura ou string vazia (http/https absolutos ou caminhos internos).
    function safeUrl(value, fallback) {
        if (window.SMSecurity && typeof window.SMSecurity.url === "function") {
            return window.SMSecurity.url(value, fallback || "");
        }
        var raw = value == null ? "" : String(value).trim();
        if (!raw) return fallback || "";
        if (/['"()\\<>]/.test(raw)) return fallback || "";
        if (/^https?:\/\//i.test(raw)) return raw;
        if (/^(images|videos|docs|css|js)\//i.test(raw) || raw.charAt(0) === "/") return raw;
        if (/\.html(\?|#|$)/i.test(raw) && !/^[a-z]+:/i.test(raw)) return raw;
        return fallback || "";
    }

    function clean(value) { return String(value == null ? "" : value).trim(); }

    // ======================================================================
    // Página atual / correspondência de página
    // ======================================================================

    function currentFile() {
        var path = (window.location && window.location.pathname) || "";
        var file = path.split("/").pop() || "";
        // Normaliza diretório raiz para index.html.
        if (!file || file === "/") return "index.html";
        return file;
    }

    // Um banner casa com a página quando:
    //  - placement == 'all'; ou
    //  - placement == 'custom' e targetPages contém o arquivo atual; ou
    //  - placement nomeado == chave da página atual; ou
    //  - targetPages contém o arquivo atual (compatibilidade extra).
    function pageMatches(item, file) {
        var placement = clean(item.placement);
        var placementKey = FILE_TO_PLACEMENT[file] || "";
        var inTarget = Array.isArray(item.targetPages) && item.targetPages.indexOf(file) !== -1;

        if (placement === "all") return true;
        if (placement === "custom") return inTarget;
        if (placement && placementKey && placement === placementKey) return true;
        return inTarget;
    }

    // ======================================================================
    // Período (startAt / endAt)
    // ======================================================================

    function toMillis(value) {
        if (!value) return 0;
        if (typeof value.toMillis === "function") return value.toMillis();
        if (typeof value.seconds === "number") return value.seconds * 1000;
        if (typeof value._seconds === "number") return value._seconds * 1000;
        var parsed = Date.parse(value);
        return isFinite(parsed) ? parsed : 0;
    }

    function withinWindow(item, now) {
        var start = toMillis(item.startAt);
        var end = toMillis(item.endAt);
        if (start && now < start) return false;
        if (end && now > end) return false;
        return true;
    }

    // ======================================================================
    // Seleção (filtro + ordenação + limite)
    // ======================================================================

    function selectBanners(docs, fileOverride) {
        var file = fileOverride || currentFile();
        var now = Date.now();

        var list = (docs || []).filter(function (item) {
            if (!item) return false;
            if (clean(item.status) !== "published") return false; // rule já filtra; reforço client
            if (clean(item.type) !== "banner") return false;       // ignora popup (Bloco 4G)
            if (!clean(item.imageUrl)) return false;                // sem imagem não exibe
            if (!withinWindow(item, now)) return false;
            if (!pageMatches(item, file)) return false;
            return true;
        });

        list.sort(function (a, b) {
            var pa = Number(a.priority); var pb = Number(b.priority);
            pa = isFinite(pa) ? pa : 0;
            pb = isFinite(pb) ? pb : 0;
            if (pb !== pa) return pb - pa;                          // prioridade desc
            return toMillis(b.updatedAt) - toMillis(a.updatedAt);   // depois, mais recente
        });

        return list.slice(0, MAX_BANNERS);
    }

    // ======================================================================
    // Render
    // ======================================================================

    function renderBanner(item) {
        var imageUrl = safeUrl(item.imageUrl, "");
        if (!imageUrl) return "";                                   // imagem inválida → pula card

        var alt = escAttr(item.imageAlt || item.title || "Banner");
        var title = clean(item.title);
        var desc = clean(item.description);
        var ctaUrl = safeUrl(item.ctaUrl, "");
        var ctaLabel = clean(item.ctaLabel);
        var target = clean(item.ctaTarget) === "_blank" ? "_blank" : "_self";
        var relAttr = target === "_blank" ? ' rel="noopener noreferrer"' : "";

        var html = '<article class="public-banner">';
        html += '<div class="public-banner__media">';
        html += '<img class="public-banner__img" src="' + escAttr(imageUrl) + '" alt="' + alt + '" ' +
            'loading="lazy" decoding="async" ' +
            'onerror="var c=this.closest(&quot;.public-banner&quot;);if(c)c.style.display=&quot;none&quot;;">';
        html += '</div>';

        if (title || desc || (ctaUrl && ctaLabel)) {
            html += '<div class="public-banner__body">';
            if (title) html += '<h3 class="public-banner__title">' + esc(title) + '</h3>';
            if (desc) html += '<p class="public-banner__desc">' + esc(desc) + '</p>';
            if (ctaUrl && ctaLabel) {
                html += '<a class="public-banner__cta" href="' + escAttr(ctaUrl) + '" ' +
                    'target="' + target + '"' + relAttr + '>' + esc(ctaLabel) + '</a>';
            }
            html += '</div>';
        }

        html += '</article>';
        return html;
    }

    function renderInto(mount, banners) {
        var inner = (banners || []).map(renderBanner).join("");
        if (!inner) {
            mount.innerHTML = "";
            mount.hidden = true;
            return false;
        }
        mount.innerHTML = '<div class="public-banners" role="complementary" aria-label="Destaques">' + inner + '</div>';
        mount.hidden = false;
        return true;
    }

    // ======================================================================
    // CSS (injeta o link uma única vez; evita editar o <head> de cada página)
    // ======================================================================

    function ensureCss() {
        if (!document.head) return;
        if (document.querySelector('link[data-public-banners-css]')) return;
        var link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = CSS_HREF;
        link.setAttribute("data-public-banners-css", "1");
        document.head.appendChild(link);
    }

    // ======================================================================
    // Carregamento (Firestore) — padrão cms.js
    // ======================================================================

    function loadBanners() {
        var mount = document.getElementById(MOUNT_ID);
        if (!mount) return;                                         // página sem slot → nada a fazer
        mount.hidden = true;                                        // começa oculto

        if (typeof window.CONFIG === "undefined" || !window.CONFIG.firebase) {
            return;                                                 // sem config → silêncio
        }

        ensureCss();

        Promise.all([
            import(FIREBASE_APP_URL),
            import(FIREBASE_FS_URL),
            import(APP_CHECK_MODULE).catch(function () { return null; })
        ]).then(function (mods) {
            var appMod = mods[0];
            var fsMod = mods[1];
            var appCheckMod = mods[2];

            var existing = appMod.getApps().find(function (a) { return a.name === APP_NAME; });
            var app = existing || appMod.initializeApp(window.CONFIG.firebase, APP_NAME);

            var ready = appCheckMod && typeof appCheckMod.initModularAppCheck === "function"
                ? appCheckMod.initModularAppCheck(app).catch(function () { return false; })
                : Promise.resolve(false);

            return ready.then(function () {
                var db = fsMod.getFirestore(app);
                var q = fsMod.query(
                    fsMod.collection(db, COLLECTION),
                    fsMod.where("status", "==", "published")
                );
                return fsMod.getDocs(q);
            }).then(function (snap) {
                var docs = [];
                snap.forEach(function (d) {
                    var data = d.data() || {};
                    data.__id = d.id;
                    docs.push(data);
                });
                renderInto(mount, selectBanners(docs));
            });
        }).catch(function (err) {
            // Falha silenciosa: visitante não vê erro; apenas log discreto.
            if (window.console && typeof console.warn === "function") {
                console.warn("[public-banners] indisponível:", err && err.message ? err.message : err);
            }
            mount.innerHTML = "";
            mount.hidden = true;
        });
    }

    // ======================================================================
    // Bootstrap + introspecção (smoke test)
    // ======================================================================

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", loadBanners);
    } else {
        loadBanners();
    }

    window.PublicBanners = {
        load: loadBanners,
        // Introspecção para smoke tests (não usados no navegador).
        _selectBanners: selectBanners,
        _pageMatches: pageMatches,
        _withinWindow: withinWindow,
        _renderBanner: renderBanner,
        _renderInto: renderInto,
        _safeUrl: safeUrl,
        _currentFile: currentFile,
        _MAX_BANNERS: MAX_BANNERS
    };
})();
