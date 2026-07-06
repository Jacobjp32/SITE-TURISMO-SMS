/**
 * ============================================================
 * MASCOTE INTERATIVO DE TURISMO — São Mateus do Sul
 * Bloco S12 — primeira versão leve
 * ------------------------------------------------------------
 * NÃO é um chatbot / NÃO usa IA / NÃO chama API externa.
 * Apenas atalhos, dicas e mensagens contextuais por página.
 *
 * Convive com o chatbot "Mathe" (canto inferior direito):
 * este mascote fica no canto inferior ESQUERDO.
 *
 * i18n: usa translations.js (data-lang-key*) quando presente;
 *       fallback PT-BR embutido caso a página não traduza.
 * Preferência: localStorage lembra se o visitante ocultou o mascote.
 * Acessibilidade: teclado, ESC, foco visível, prefers-reduced-motion.
 * Performance: 1 imagem webp leve, sem libs, init em idle (não afeta LCP).
 * Falha em silêncio se algo não carregar.
 * ============================================================ */
(function () {
    'use strict';

    // Evita dupla injeção (script incluído em duas páginas/duas vezes).
    if (window.__smsMascotLoaded || document.getElementById('sms-mascot')) return;
    window.__smsMascotLoaded = true;

    var STORAGE_HIDDEN = 'sms-mascot-hidden';   // visitante ocultou o mascote
    var STORAGE_TEASER = 'sms-mascot-teaser';   // balão de fala já foi mostrado
    var MASCOT_IMG = 'images/mascotes/MASCOTE_CAPIVARA_PINHAO.webp';
    var MASCOT_FALLBACK = '🌿'; // fallback visual simples se a imagem falhar

    // ── Textos (fallback PT-BR embutido). As chaves espelham translations.js. ──
    var STR = {
        pt: {
            title: 'Guia de Turismo',
            subtitle: 'São Mateus do Sul',
            open: 'Abrir o guia de turismo',
            reopen: 'Reabrir o guia de turismo',
            close: 'Fechar o guia de turismo',
            hide: 'Ocultar guia',
            shortcuts: 'Atalhos rápidos',
            linkMapa: 'Mapa Turístico',
            linkEventos: 'Eventos',
            linkSabores: 'Sabores locais',
            linkOndeFicar: 'Onde ficar',
            linkContato: 'Fale com Cultura e Turismo',
            msg: {
                home: 'Olá! Quer começar pelo mapa turístico?',
                mapa: 'Use os filtros para encontrar atrativos.',
                sabores: 'Explore gastronomia, feiras e restaurantes.',
                eventos: 'Confira a programação atualizada.',
                noticias: 'Veja as últimas novidades da cidade.',
                ondeficar: 'Encontre hotéis e pousadas para sua estadia.',
                oquefazer: 'Descubra rotas e experiências pela cidade.',
                local: 'Você pode traçar rota até este ponto.',
                'default': 'Posso ajudar você a explorar São Mateus do Sul.'
            },
            helpLabel: 'Ajuda rápida',
            helpNote: 'Não encontrou? Fale com o Depto. de Cultura e Turismo.',
            help: {
                mapa:    { q: 'Onde encontro o mapa turístico?', a: 'Veja todos os atrativos no mapa, com filtros por categoria e rotas.' },
                eventos: { q: 'Como vejo os eventos?', a: 'Confira a agenda cultural atualizada da cidade.' },
                comer:   { q: 'Onde comer?', a: 'Gastronomia polonesa, feiras e restaurantes locais.' },
                ficar:   { q: 'Onde ficar?', a: 'Hotéis no centro e pousadas rurais para a sua estadia.' },
                contato: { q: 'Como falar com Cultura e Turismo?', a: 'Ligue para o Departamento de Cultura e Turismo: (42) 3532-4163.' }
            }
        },
        en: {
            title: 'Tourism Guide',
            subtitle: 'São Mateus do Sul',
            open: 'Open the tourism guide',
            reopen: 'Reopen the tourism guide',
            close: 'Close the tourism guide',
            hide: 'Hide guide',
            shortcuts: 'Quick links',
            linkMapa: 'Tourist Map',
            linkEventos: 'Events',
            linkSabores: 'Local flavors',
            linkOndeFicar: 'Where to stay',
            linkContato: 'Contact Culture & Tourism',
            msg: {
                home: 'Hi! Want to start with the tourist map?',
                mapa: 'Use the filters to find attractions.',
                sabores: 'Explore food, markets and restaurants.',
                eventos: 'Check the updated schedule.',
                noticias: 'See the latest city news.',
                ondeficar: 'Find hotels and inns for your stay.',
                oquefazer: 'Discover routes and experiences in the city.',
                local: 'You can get directions to this spot.',
                'default': 'I can help you explore São Mateus do Sul.'
            },
            helpLabel: 'Quick help',
            helpNote: 'Didn’t find it? Contact the Culture & Tourism Dept.',
            help: {
                mapa:    { q: 'Where is the tourist map?', a: 'See all attractions on the map, with filters by category and routes.' },
                eventos: { q: 'How do I see events?', a: 'Check the city’s updated cultural calendar.' },
                comer:   { q: 'Where to eat?', a: 'Polish cuisine, markets and local restaurants.' },
                ficar:   { q: 'Where to stay?', a: 'Downtown hotels and rural inns for your stay.' },
                contato: { q: 'How to reach Culture & Tourism?', a: 'Call the Culture & Tourism Department: +55 (42) 3532-4163.' }
            }
        },
        es: {
            title: 'Guía de Turismo',
            subtitle: 'São Mateus do Sul',
            open: 'Abrir la guía de turismo',
            reopen: 'Reabrir la guía de turismo',
            close: 'Cerrar la guía de turismo',
            hide: 'Ocultar guía',
            shortcuts: 'Accesos rápidos',
            linkMapa: 'Mapa Turístico',
            linkEventos: 'Eventos',
            linkSabores: 'Sabores locales',
            linkOndeFicar: 'Dónde alojarse',
            linkContato: 'Contacta Cultura y Turismo',
            msg: {
                home: '¡Hola! ¿Quieres empezar por el mapa turístico?',
                mapa: 'Usa los filtros para encontrar atractivos.',
                sabores: 'Explora gastronomía, ferias y restaurantes.',
                eventos: 'Consulta la programación actualizada.',
                noticias: 'Mira las últimas novedades de la ciudad.',
                ondeficar: 'Encuentra hoteles y posadas para tu estadía.',
                oquefazer: 'Descubre rutas y experiencias por la ciudad.',
                local: 'Puedes trazar la ruta hasta este punto.',
                'default': 'Puedo ayudarte a explorar São Mateus do Sul.'
            },
            helpLabel: 'Ayuda rápida',
            helpNote: '¿No lo encontraste? Contacta al Depto. de Cultura y Turismo.',
            help: {
                mapa:    { q: '¿Dónde está el mapa turístico?', a: 'Mira todos los atractivos en el mapa, con filtros por categoría y rutas.' },
                eventos: { q: '¿Cómo veo los eventos?', a: 'Consulta la agenda cultural actualizada de la ciudad.' },
                comer:   { q: '¿Dónde comer?', a: 'Gastronomía polaca, ferias y restaurantes locales.' },
                ficar:   { q: '¿Dónde alojarse?', a: 'Hoteles en el centro y posadas rurales para tu estadía.' },
                contato: { q: '¿Cómo hablar con Cultura y Turismo?', a: 'Llama al Departamento de Cultura y Turismo: +55 (42) 3532-4163.' }
            }
        },
        pl: {
            title: 'Przewodnik Turystyczny',
            subtitle: 'São Mateus do Sul',
            open: 'Otwórz przewodnik turystyczny',
            reopen: 'Ponownie otwórz przewodnik',
            close: 'Zamknij przewodnik turystyczny',
            hide: 'Ukryj przewodnik',
            shortcuts: 'Szybkie linki',
            linkMapa: 'Mapa Turystyczna',
            linkEventos: 'Wydarzenia',
            linkSabores: 'Lokalne smaki',
            linkOndeFicar: 'Gdzie spać',
            linkContato: 'Kontakt: Kultura i Turystyka',
            msg: {
                home: 'Cześć! Chcesz zacząć od mapy turystycznej?',
                mapa: 'Użyj filtrów, aby znaleźć atrakcje.',
                sabores: 'Odkryj gastronomię, targi i restauracje.',
                eventos: 'Sprawdź aktualny program.',
                noticias: 'Zobacz najnowsze wiadomości z miasta.',
                ondeficar: 'Znajdź hotele i pensjonaty na pobyt.',
                oquefazer: 'Odkryj trasy i doświadczenia w mieście.',
                local: 'Możesz wyznaczyć trasę do tego miejsca.',
                'default': 'Mogę pomóc Ci zwiedzić São Mateus do Sul.'
            },
            helpLabel: 'Szybka pomoc',
            helpNote: 'Nie znalazłeś? Skontaktuj się z Departamentem Kultury i Turystyki.',
            help: {
                mapa:    { q: 'Gdzie jest mapa turystyczna?', a: 'Zobacz wszystkie atrakcje na mapie, z filtrami według kategorii i tras.' },
                eventos: { q: 'Jak zobaczyć wydarzenia?', a: 'Sprawdź aktualny kalendarz kulturalny miasta.' },
                comer:   { q: 'Gdzie zjeść?', a: 'Kuchnia polska, targi i lokalne restauracje.' },
                ficar:   { q: 'Gdzie się zatrzymać?', a: 'Hotele w centrum i wiejskie pensjonaty na Twój pobyt.' },
                contato: { q: 'Jak skontaktować się z Kulturą i Turystyką?', a: 'Zadzwoń do Departamentu Kultury i Turystyki: +55 (42) 3532-4163.' }
            }
        }
    };

    function getLang() {
        var lang = 'pt';
        try { lang = (localStorage.getItem('sms-lang') || 'pt').toLowerCase(); } catch (e) {}
        return STR[lang] ? lang : 'pt';
    }

    // Detecta a página atual para escolher a mensagem contextual.
    function getContextKey() {
        var p = (window.location.pathname || '').toLowerCase();
        if (p.indexOf('mapa-turistico') !== -1) return 'mapa';
        if (p.indexOf('sabores') !== -1) return 'sabores';
        if (p.indexOf('o-que-fazer') !== -1) return 'oquefazer';
        if (p.indexOf('onde-ficar') !== -1) return 'ondeficar';
        if (p.indexOf('eventos') !== -1) return 'eventos';
        if (p.indexOf('noticia') !== -1) return 'noticias';
        if (p.indexOf('local') !== -1) return 'local';
        if (p === '/' || p === '' || p.indexOf('index') !== -1) return 'home';
        return 'default';
    }

    var CTX = getContextKey();
    var MSG_KEY = 'mascot-msg-' + CTX;

    function readPref(key) {
        try { return localStorage.getItem(key); } catch (e) { return null; }
    }
    function writePref(key, val) {
        try { localStorage.setItem(key, val); } catch (e) {}
    }

    // ── Construção do DOM ──
    function buildMascot() {
        var lang = getLang();
        var t = STR[lang];
        var root = document.createElement('div');
        root.id = 'sms-mascot';

        // Estado oculto: apenas mini botão de reabrir.
        if (readPref(STORAGE_HIDDEN) === 'true') {
            root.innerHTML =
                '<button type="button" class="sms-mascot-reopen" ' +
                'data-lang-key-aria-label="mascot-aria-reopen" ' +
                'aria-label="' + t.reopen + '">🌿</button>';
            document.body.appendChild(root);
            root.querySelector('.sms-mascot-reopen').addEventListener('click', function () {
                writePref(STORAGE_HIDDEN, 'false');
                root.remove();
                var fresh = buildMascot();
                // Adia a abertura para o próximo tick: garante que o clique atual
                // termine de propagar antes de abrir (evita fechamento imediato).
                window.setTimeout(function () { openPanel(fresh, true); }, 0);
            });
            applyI18n(lang);
            return root;
        }

        var msg = t.msg[CTX] || t.msg['default'];

        root.innerHTML =
            '<div class="sms-mascot-bubble" role="status">' +
                '<button type="button" class="sms-bubble-close" data-lang-key-aria-label="mascot-close" aria-label="' + t.close + '">×</button>' +
                '<span data-lang-key="' + MSG_KEY + '">' + msg + '</span>' +
            '</div>' +
            '<button type="button" class="sms-mascot-launcher" id="sms-mascot-launcher" ' +
                'aria-haspopup="dialog" aria-expanded="false" aria-controls="sms-mascot-panel" ' +
                'data-lang-key-aria-label="mascot-aria-open" aria-label="' + t.open + '">' +
                '<img src="' + MASCOT_IMG + '" alt="" width="46" height="46" decoding="async" ' +
                    'onerror="this.style.display=\'none\';this.insertAdjacentHTML(\'afterend\',\'<span class=&quot;sms-mascot-fallback&quot; aria-hidden=&quot;true&quot;>' + MASCOT_FALLBACK + '</span>\');">' +
                '<span class="sms-mascot-dot" aria-hidden="true">!</span>' +
            '</button>' +
            '<div class="sms-mascot-panel" id="sms-mascot-panel" role="dialog" aria-modal="false" aria-labelledby="sms-mascot-title">' +
                '<div class="sms-mascot-panel-header">' +
                    '<img src="' + MASCOT_IMG + '" alt="" width="38" height="38" decoding="async" onerror="this.style.display=\'none\';">' +
                    '<span>' +
                        '<span class="sms-mascot-title" id="sms-mascot-title" data-lang-key="mascot-title">' + t.title + '</span>' +
                        '<span class="sms-mascot-subtitle" data-lang-key="mascot-subtitle">' + t.subtitle + '</span>' +
                    '</span>' +
                    '<button type="button" class="sms-mascot-close" id="sms-mascot-close" data-lang-key-aria-label="mascot-close" aria-label="' + t.close + '">×</button>' +
                '</div>' +
                '<p class="sms-mascot-message" data-lang-key="' + MSG_KEY + '">' + msg + '</p>' +
                '<span class="sms-mascot-shortcuts-label" data-lang-key="mascot-shortcuts">' + t.shortcuts + '</span>' +
                '<ul class="sms-mascot-links">' +
                    linkItem('/mapa-turistico.html', '🗺️', 'mascot-link-mapa', t.linkMapa) +
                    linkItem('/eventos/', '📅', 'mascot-link-eventos', t.linkEventos) +
                    linkItem('/sabores', '🍽️', 'mascot-link-sabores', t.linkSabores) +
                    linkItem('/onde-ficar', '🛏️', 'mascot-link-ondeficar', t.linkOndeFicar) +
                    linkItem('tel:+554235324163', '☎️', 'mascot-link-contato', t.linkContato) +
                '</ul>' +
                '<div class="sms-mascot-help">' +
                    '<span class="sms-mascot-help-label" data-lang-key="mascot-help-label">' + t.helpLabel + '</span>' +
                    '<ul class="sms-mascot-help-list">' +
                        helpItem('mapa', t, '/mapa-turistico.html', 'mascot-link-mapa', t.linkMapa) +
                        helpItem('eventos', t, '/eventos/', 'mascot-link-eventos', t.linkEventos) +
                        helpItem('comer', t, '/sabores', 'mascot-link-sabores', t.linkSabores) +
                        helpItem('ficar', t, '/onde-ficar', 'mascot-link-ondeficar', t.linkOndeFicar) +
                        helpItem('contato', t, 'tel:+554235324163', 'mascot-link-contato', t.linkContato) +
                    '</ul>' +
                    '<p class="sms-mascot-help-note" data-lang-key="mascot-help-note">' + t.helpNote + '</p>' +
                '</div>' +
                '<div class="sms-mascot-footer">' +
                    '<button type="button" class="sms-mascot-hide-btn" id="sms-mascot-hide" data-lang-key="mascot-hide">' + t.hide + '</button>' +
                '</div>' +
            '</div>';

        document.body.appendChild(root);
        bindEvents(root);
        applyI18n(lang);
        maybeShowTeaser(root);
        return root;
    }

    function linkItem(href, icon, key, label) {
        return '<li><a href="' + href + '">' +
            '<span class="sms-link-icon" aria-hidden="true">' + icon + '</span>' +
            '<span data-lang-key="' + key + '">' + label + '</span>' +
        '</a></li>';
    }

    // Item da "Ajuda rápida": pergunta (botão accordion) + resposta curta + link útil.
    // Sem chat livre / sem API: resposta estática, texto reaproveita o rótulo do link.
    function helpItem(id, t, href, linkKey, linkLabel) {
        var qa = (t.help && t.help[id]) || { q: '', a: '' };
        var answerId = 'sms-help-a-' + id;
        return '<li class="sms-help-item">' +
            '<button type="button" class="sms-help-q" aria-expanded="false" aria-controls="' + answerId + '">' +
                '<span class="sms-help-q-text" data-lang-key="mascot-help-q-' + id + '">' + qa.q + '</span>' +
                '<span class="sms-help-chevron" aria-hidden="true"></span>' +
            '</button>' +
            '<div class="sms-help-a" id="' + answerId + '" role="region" hidden>' +
                '<p data-lang-key="mascot-help-a-' + id + '">' + qa.a + '</p>' +
                '<a class="sms-help-link" href="' + href + '">' +
                    '<span data-lang-key="' + linkKey + '">' + linkLabel + '</span>' +
                    '<span aria-hidden="true"> →</span>' +
                '</a>' +
            '</div>' +
        '</li>';
    }

    // Aplica traduções do site (se disponíveis) sobre os elementos recém-injetados.
    function applyI18n(lang) {
        try {
            if (typeof window.applyTranslations === 'function') {
                window.applyTranslations(lang);
            }
        } catch (e) { /* falha em silêncio: fallback PT-BR permanece */ }
    }

    // ── Eventos ──
    function bindEvents(root) {
        var launcher = root.querySelector('#sms-mascot-launcher');
        var closeBtn = root.querySelector('#sms-mascot-close');
        var hideBtn = root.querySelector('#sms-mascot-hide');
        var bubble = root.querySelector('.sms-mascot-bubble');
        var bubbleClose = root.querySelector('.sms-bubble-close');

        if (launcher) {
            launcher.addEventListener('click', function () {
                hideTeaser(root);
                if (root.classList.contains('is-open')) closePanel(root, true);
                else openPanel(root, true);
            });
        }
        if (closeBtn) closeBtn.addEventListener('click', function () { closePanel(root, true); });
        if (hideBtn) hideBtn.addEventListener('click', function () { hideMascot(root); });
        if (bubbleClose) {
            bubbleClose.addEventListener('click', function (e) {
                e.stopPropagation();
                hideTeaser(root);
            });
        }
        // Clicar no balão abre o painel.
        if (bubble) {
            bubble.addEventListener('click', function (e) {
                if (e.target === bubbleClose) return;
                hideTeaser(root);
                openPanel(root, true);
            });
        }

        // "Ajuda rápida": accordion estático (sem chat/IA/API).
        var helpList = root.querySelector('.sms-mascot-help-list');
        if (helpList) {
            helpList.addEventListener('click', function (e) {
                var btn = e.target.closest ? e.target.closest('.sms-help-q') : null;
                if (!btn || !helpList.contains(btn)) return;
                toggleHelp(btn);
            });
        }
    }

    function toggleHelp(btn) {
        var expanded = btn.getAttribute('aria-expanded') === 'true';
        var list = btn.closest ? btn.closest('.sms-mascot-help-list') : null;
        // Abertura única: ao abrir uma pergunta, recolhe as demais (mantém o painel baixo).
        if (!expanded && list) {
            list.querySelectorAll('.sms-help-q[aria-expanded="true"]').forEach(function (other) {
                if (other === btn) return;
                other.setAttribute('aria-expanded', 'false');
                var otherAns = document.getElementById(other.getAttribute('aria-controls'));
                if (otherAns) otherAns.setAttribute('hidden', '');
            });
        }
        var answer = document.getElementById(btn.getAttribute('aria-controls'));
        btn.setAttribute('aria-expanded', expanded ? 'false' : 'true');
        if (answer) {
            if (expanded) answer.setAttribute('hidden', '');
            else answer.removeAttribute('hidden');
        }
    }

    // Listeners globais registrados UMA vez; operam sobre o root atual.
    // Assim evitamos acúmulo de listeners a cada ocultar/reabrir.
    function setupGlobalListeners() {
        if (window.__smsMascotGlobalBound) return;
        window.__smsMascotGlobalBound = true;

        // ESC fecha o painel (sem prender o foco).
        document.addEventListener('keydown', function (e) {
            if (e.key !== 'Escape') return;
            var root = document.getElementById('sms-mascot');
            if (root && root.classList.contains('is-open')) closePanel(root, true);
        });

        // Fechar ao clicar fora do mascote.
        // Ignora cliques em nós já removidos do DOM (ex.: botão de reabrir).
        document.addEventListener('click', function (e) {
            if (!document.contains(e.target)) return;
            var root = document.getElementById('sms-mascot');
            if (root && root.classList.contains('is-open') && !root.contains(e.target)) {
                closePanel(root, false);
            }
        });
    }

    function openPanel(root, focus) {
        root.classList.add('is-open', 'dot-seen');
        var launcher = root.querySelector('#sms-mascot-launcher');
        if (launcher) launcher.setAttribute('aria-expanded', 'true');
        if (focus) {
            var closeBtn = root.querySelector('#sms-mascot-close');
            if (closeBtn) { try { closeBtn.focus({ preventScroll: true }); } catch (e) { closeBtn.focus(); } }
        }
    }

    function closePanel(root, returnFocus) {
        root.classList.remove('is-open');
        var launcher = root.querySelector('#sms-mascot-launcher');
        if (launcher) {
            launcher.setAttribute('aria-expanded', 'false');
            if (returnFocus) { try { launcher.focus({ preventScroll: true }); } catch (e) { launcher.focus(); } }
        }
    }

    function hideMascot(root) {
        writePref(STORAGE_HIDDEN, 'true');
        root.remove();
        var fresh = buildMascot(); // renderiza o mini botão de reabrir
        var reopen = fresh.querySelector('.sms-mascot-reopen');
        if (reopen) { try { reopen.focus({ preventScroll: true }); } catch (e) {} }
    }

    // ── Balão de fala (teaser) — mostrado no máximo uma vez, sem ser invasivo ──
    function maybeShowTeaser(root) {
        if (readPref(STORAGE_TEASER) === 'true') return;
        var bubble = root.querySelector('.sms-mascot-bubble');
        if (!bubble) return;
        window.setTimeout(function () {
            if (!document.body.contains(root) || root.classList.contains('is-open')) return;
            bubble.classList.add('show');
            root.classList.add('dot-seen');
            writePref(STORAGE_TEASER, 'true');
            // Auto-esconde após alguns segundos.
            window.setTimeout(function () { hideTeaser(root); }, 9000);
        }, 3500);
    }

    function hideTeaser(root) {
        var bubble = root.querySelector('.sms-mascot-bubble');
        if (bubble) bubble.classList.remove('show');
    }

    // ── Init: em idle/after-load para não competir com o LCP ──
    function init() {
        try { setupGlobalListeners(); buildMascot(); } catch (e) { /* falha em silêncio */ }
    }

    function schedule() {
        if ('requestIdleCallback' in window) {
            window.requestIdleCallback(init, { timeout: 2500 });
        } else {
            window.setTimeout(init, 1200);
        }
    }

    if (document.readyState === 'complete') {
        schedule();
    } else {
        window.addEventListener('load', schedule, { once: true });
    }
})();
