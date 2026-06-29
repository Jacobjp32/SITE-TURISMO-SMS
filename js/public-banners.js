/**
 * public-banners.js — Bloco 4F (banners) + Bloco 4G (pop-ups)
 * ---------------------------------------------------------------------
 * Lê documentos da collection `banners` com `status == 'published'` e renderiza
 * no site público:
 *   - `type == 'banner'` → faixa discreta no slot #public-banners-slot (Bloco 4F);
 *   - `type == 'popup'`  → modal central discreto (Bloco 4G), 1 por carregamento.
 *
 * Padrão de inicialização espelha js/cms.js: import() do SDK modular do Firebase
 * (10.7.1) + app nomeado próprio (`public-banners-app`) + App Check. NÃO depende do
 * SDK compat estar carregado na página, então funciona em qualquer página-alvo.
 *
 * Uma única query (`where('status','==','published')`) alimenta banners E pop-ups:
 * o filtro por `type` é feito no client, reaproveitando página/período/placement.
 *
 * Segurança / robustez:
 *   - falha SILENCIOSA (log discreto no console), nunca quebra a página;
 *   - sem itens válidos → slot oculto e nenhum modal;
 *   - textos escapados antes de irem ao DOM (usa window.SMSecurity quando disponível,
 *     senão fallback interno equivalente);
 *   - URLs (imagem e CTA) validadas; CTA externo recebe rel="noopener noreferrer";
 *   - imagem quebrada não derruba o layout / modal (onerror oculta a imagem).
 *
 * Pop-up (4G) — comportamento não invasivo:
 *   - no máximo 1 modal por página/carregamento;
 *   - respeita `frequency` (always / oncePerSession / oncePerDay / oncePerCampaign)
 *     via sessionStorage/localStorage, com fallback seguro se storage indisponível;
 *   - respeita `showDelayMs` (limitado a um teto razoável);
 *   - respeita `dismissible`: se false, ainda há botão de fechar acessível (nunca trava);
 *   - acessível: role="dialog", aria-modal, aria-labelledby, ESC (quando dismissible),
 *     foco inicial no fechar/CTA, trap de Tab básico, restaura o foco anterior ao fechar.
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
    var MAX_POPUPS = 1;            // no máximo 1 pop-up por carregamento (não invasivo)
    var COLLECTION = "banners";
    var APP_NAME = "public-banners-app";
    var CSS_HREF = "css/public-banners.css?v=public-banners-4h-20260629";

    // Limites de segurança do pop-up.
    var MAX_DELAY_MS = 60000;      // teto do showDelayMs (igual ao SHOW_DELAY_MAX do admin)
    var POPUP_MAXWIDTH_MIN = 240;  // px (igual ao MAXWIDTH_MIN do admin)
    var POPUP_MAXWIDTH_MAX = 960;  // px (igual ao MAXWIDTH_MAX do admin)
    var POPUP_MAXWIDTH_DEFAULT = 520;
    var STORAGE_PREFIX = "sms_popup_";

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

    // Garante que só 1 pop-up apareça por carregamento, mesmo com chamadas repetidas.
    var popupShownThisLoad = false;

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

    // targetPages casa quando algum item bate com o arquivo atual OU com o nome
    // amigável (chave de placement) da página. Aceitar os dois formatos mantém
    // retrocompatibilidade: o admin grava nomes de arquivo (ex.: "noticias.html"),
    // mas nomes amigáveis (ex.: "noticias") também são reconhecidos.
    function targetMatches(targetPages, file, placementKey) {
        if (!Array.isArray(targetPages) || !targetPages.length) return false;
        var fileLc = String(file || "").toLowerCase();
        var keyLc = String(placementKey || "").toLowerCase();
        for (var i = 0; i < targetPages.length; i++) {
            var t = clean(targetPages[i]).toLowerCase();
            if (!t) continue;
            if (t === fileLc) return true;                  // nome de arquivo (padrão do admin)
            if (keyLc && t === keyLc) return true;          // nome amigável (home/eventos/…)
        }
        return false;
    }

    // Um item casa com a página quando:
    //  - placement == 'all'; ou
    //  - placement == 'custom' e targetPages aponta para a página atual; ou
    //  - placement nomeado == chave da página atual; ou
    //  - targetPages aponta para a página atual (compatibilidade extra).
    function pageMatches(item, file) {
        var placement = clean(item.placement);
        var placementKey = FILE_TO_PLACEMENT[file] || "";
        var inTarget = targetMatches(item.targetPages, file, placementKey);

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
    // Seleção compartilhada (filtro comum + ordenação)
    // ======================================================================

    // Filtro/ordenação comuns a banner e pop-up, parametrizado pelo `type`.
    function selectByType(docs, type, fileOverride) {
        var file = fileOverride || currentFile();
        var now = Date.now();

        var list = (docs || []).filter(function (item) {
            if (!item) return false;
            if (clean(item.status) !== "published") return false; // rule já filtra; reforço client
            if (clean(item.type) !== type) return false;
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

        return list;
    }

    function selectBanners(docs, fileOverride) {
        return selectByType(docs, "banner", fileOverride).slice(0, MAX_BANNERS);
    }

    function selectPopups(docs, fileOverride) {
        return selectByType(docs, "popup", fileOverride);
    }

    // ======================================================================
    // Render — banners (Bloco 4F)
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
    // Pop-up (Bloco 4G) — frequência / storage
    // ======================================================================

    // Acesso a storage com fallback seguro (modo privado, cookies bloqueados etc.).
    function safeStorage(kind) {
        try {
            var store = kind === "session" ? window.sessionStorage : window.localStorage;
            if (!store) return null;
            // Teste de escrita: alguns navegadores expõem o objeto mas lançam ao gravar.
            var k = "__sms_test__";
            store.setItem(k, "1");
            store.removeItem(k);
            return store;
        } catch (e) {
            return null;
        }
    }

    function popupKey(item) {
        var id = item && (item.__id || item.id) ? (item.__id || item.id) : "anon";
        return STORAGE_PREFIX + id;
    }

    // Normaliza o valor de frequency aceitando o schema do admin e apelidos curtos.
    function normalizeFrequency(value) {
        var f = clean(value).toLowerCase();
        if (f === "always") return "always";
        if (f === "session" || f === "oncepersession") return "session";
        if (f === "day" || f === "onceperday") return "day";
        if (f === "once" || f === "oncepercampaign" || f === "campaign") return "once";
        return "session"; // padrão conservador / não invasivo
    }

    function todayStamp() {
        var d = new Date();
        return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
    }

    // Retorna true se o pop-up PODE ser exibido conforme a frequência.
    function frequencyAllows(item) {
        var mode = normalizeFrequency(item && item.frequency);
        if (mode === "always") return true;

        var key = popupKey(item);

        if (mode === "session") {
            var ss = safeStorage("session");
            if (!ss) return true;                       // fallback: permite (será gravado em memória)
            return ss.getItem(key) !== "1";
        }
        // 'day' e 'once' usam localStorage.
        var ls = safeStorage("local");
        if (!ls) return true;                           // fallback seguro: permite
        var stored = ls.getItem(key);
        if (mode === "day") {
            return stored !== todayStamp();
        }
        return stored !== "1";                          // 'once'
    }

    // Marca o pop-up como exibido conforme a frequência (best-effort).
    function markShown(item) {
        var mode = normalizeFrequency(item && item.frequency);
        if (mode === "always") return;
        var key = popupKey(item);
        try {
            if (mode === "session") {
                var ss = safeStorage("session");
                if (ss) ss.setItem(key, "1");
                return;
            }
            var ls = safeStorage("local");
            if (!ls) return;
            ls.setItem(key, mode === "day" ? todayStamp() : "1");
        } catch (e) {
            // fallback silencioso: storage pode falhar; não quebra a exibição.
        }
    }

    function clampMaxWidth(value) {
        var n = Number(value);
        if (!isFinite(n) || n <= 0) return POPUP_MAXWIDTH_DEFAULT;
        if (n < POPUP_MAXWIDTH_MIN) n = POPUP_MAXWIDTH_MIN;
        if (n > POPUP_MAXWIDTH_MAX) n = POPUP_MAXWIDTH_MAX;
        return Math.round(n);
    }

    function clampDelay(value) {
        var n = Number(value);
        if (!isFinite(n) || n < 0) return 0;
        if (n > MAX_DELAY_MS) return MAX_DELAY_MS;
        return Math.round(n);
    }

    // ======================================================================
    // Pop-up (Bloco 4G) — markup do card (string segura, sem efeito no DOM)
    // ======================================================================

    var popupSeq = 0;

    // Monta o HTML interno do modal. `dismissible` controla apenas o rótulo do botão;
    // o botão de fechar SEMPRE existe (acessibilidade — nunca prende o usuário).
    function buildPopupMarkup(item, idSuffix) {
        var imageUrl = safeUrl(item.imageUrl, "");
        var title = clean(item.title);
        var desc = clean(item.description);
        var ctaUrl = safeUrl(item.ctaUrl, "");
        var ctaLabel = clean(item.ctaLabel);
        var target = clean(item.ctaTarget) === "_blank" ? "_blank" : "_self";
        var relAttr = target === "_blank" ? ' rel="noopener noreferrer"' : "";
        var labelId = "public-popup-title-" + idSuffix;
        var maxWidth = clampMaxWidth(item.maxWidth);

        var html = '<div class="public-popup__card" role="dialog" aria-modal="true" ' +
            'aria-labelledby="' + labelId + '" ' +
            'style="max-width:' + maxWidth + 'px;">';

        html += '<button type="button" class="public-popup__close" ' +
            'aria-label="Fechar" data-popup-close="1">&times;</button>';

        if (imageUrl) {
            var alt = escAttr(item.imageAlt || title || "");
            html += '<div class="public-popup__media">' +
                '<img class="public-popup__img" src="' + escAttr(imageUrl) + '" alt="' + alt + '" ' +
                'decoding="async" ' +
                'onerror="this.style.display=&quot;none&quot;;">' +
                '</div>';
        }

        html += '<div class="public-popup__body">';
        // Título sempre presente como rótulo do dialog (fallback acessível se vazio).
        html += '<h2 class="public-popup__title" id="' + labelId + '">' +
            esc(title, "Destaque") + '</h2>';
        if (desc) html += '<p class="public-popup__desc">' + esc(desc) + '</p>';
        if (ctaUrl && ctaLabel) {
            html += '<a class="public-popup__cta" href="' + escAttr(ctaUrl) + '" ' +
                'target="' + target + '"' + relAttr + ' data-popup-cta="1">' + esc(ctaLabel) + '</a>';
        }
        html += '</div>';

        html += '</div>';
        return html;
    }

    // ======================================================================
    // Pop-up (Bloco 4G) — exibição (efeitos no DOM)
    // ======================================================================

    function showPopup(item) {
        if (popupShownThisLoad) return false;
        if (!document.body) return false;

        var dismissible = item.dismissible !== false;
        popupShownThisLoad = true;
        markShown(item);

        var previouslyFocused = document.activeElement || null;

        var overlay = document.createElement("div");
        overlay.className = "public-popup__overlay";
        overlay.setAttribute("data-public-popup", "1");
        overlay.innerHTML = buildPopupMarkup(item, String(++popupSeq));

        var closed = false;
        function close() {
            if (closed) return;
            closed = true;
            try { document.removeEventListener("keydown", onKeydown, true); } catch (e) {}
            if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
            // Restaura o foco anterior, sem quebrar a navegação.
            if (previouslyFocused && typeof previouslyFocused.focus === "function") {
                try { previouslyFocused.focus(); } catch (e2) {}
            }
        }

        function focusables() {
            if (!overlay.querySelectorAll) return [];
            return overlay.querySelectorAll('a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])');
        }

        function onKeydown(ev) {
            var key = ev.key || ev.keyCode;
            if ((key === "Escape" || key === "Esc" || key === 27) && dismissible) {
                ev.preventDefault();
                close();
                return;
            }
            // Trap de Tab básico para não escapar o foco do modal.
            if (key === "Tab" || key === 9) {
                var nodes = focusables();
                if (!nodes || !nodes.length) return;
                var first = nodes[0];
                var last = nodes[nodes.length - 1];
                var active = document.activeElement;
                if (ev.shiftKey && active === first) {
                    ev.preventDefault();
                    if (last.focus) last.focus();
                } else if (!ev.shiftKey && active === last) {
                    ev.preventDefault();
                    if (first.focus) first.focus();
                }
            }
        }

        // Clique no overlay (fora do card) fecha quando dismissible.
        overlay.addEventListener("click", function (ev) {
            if (ev.target === overlay && dismissible) close();
        });

        // Botão de fechar SEMPRE funciona (mesmo se dismissible === false).
        var closeBtn = overlay.querySelector ? overlay.querySelector('[data-popup-close="1"]') : null;
        if (closeBtn && closeBtn.addEventListener) {
            closeBtn.addEventListener("click", function (ev) {
                if (ev && ev.preventDefault) ev.preventDefault();
                close();
            });
        }
        // CTA fecha o modal ao navegar (não atrapalha a navegação do link).
        var ctaEl = overlay.querySelector ? overlay.querySelector('[data-popup-cta="1"]') : null;
        if (ctaEl && ctaEl.addEventListener) {
            ctaEl.addEventListener("click", function () { close(); });
        }

        document.body.appendChild(overlay);
        document.addEventListener("keydown", onKeydown, true);

        // Foco inicial: botão de fechar (preferência) ou CTA.
        var toFocus = closeBtn || ctaEl;
        if (toFocus && typeof toFocus.focus === "function") {
            try { toFocus.focus(); } catch (e3) {}
        }

        // Exposto para testes / fechamento programático.
        overlay.__close = close;
        return overlay;
    }

    // Escolhe e exibe no máximo 1 pop-up apto (respeitando frequência).
    function maybeShowPopup(popups) {
        if (popupShownThisLoad) return false;
        var list = (popups || []).slice(0, Math.max(MAX_POPUPS, 1) * 10); // janela pequena de candidatos
        for (var i = 0; i < list.length; i++) {
            var p = list[i];
            if (!p) continue;
            if (!safeUrl(p.imageUrl, "")) continue;     // imagem inválida → pula
            if (!frequencyAllows(p)) continue;          // já visto conforme frequência
            schedulePopup(p);
            return true;
        }
        return false;
    }

    function schedulePopup(item) {
        var delay = clampDelay(item.showDelayMs);
        if (delay > 0 && typeof window.setTimeout === "function") {
            window.setTimeout(function () { showPopup(item); }, delay);
        } else {
            showPopup(item);
        }
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
                // Banners (4F) e pop-up (4G) saem da MESMA leitura.
                renderInto(mount, selectBanners(docs));
                maybeShowPopup(selectPopups(docs));
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
        _selectPopups: selectPopups,
        _pageMatches: pageMatches,
        _targetMatches: targetMatches,
        _withinWindow: withinWindow,
        _renderBanner: renderBanner,
        _renderInto: renderInto,
        _buildPopupMarkup: buildPopupMarkup,
        _showPopup: showPopup,
        _maybeShowPopup: maybeShowPopup,
        _frequencyAllows: frequencyAllows,
        _markShown: markShown,
        _normalizeFrequency: normalizeFrequency,
        _clampMaxWidth: clampMaxWidth,
        _clampDelay: clampDelay,
        _safeUrl: safeUrl,
        _currentFile: currentFile,
        _resetPopupLoadFlag: function () { popupShownThisLoad = false; },
        _MAX_BANNERS: MAX_BANNERS,
        _MAX_POPUPS: MAX_POPUPS
    };
})();
