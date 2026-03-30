/**
 * scroll-animations.js — Portal de Turismo São Mateus do Sul
 * Animações de scroll via IntersectionObserver — zero dependências
 *
 * Abordagem: aplica estilos diretamente via JS (estado inicial + transição)
 * para não ser bloqueado por CSS inline nos elementos ou especificidade de folhas.
 */

(function () {
    'use strict';

    // Respeitar prefers-reduced-motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // ── Configuração ─────────────────────────────────────────────────

    // Elementos que animam sozinhos (seletor → variante)
    var ALVO = [
        // index.html
        { sel: '.attraction-card',   v: 'up'   },
        { sel: '.blog-card',         v: 'up'   },
        { sel: '.hotel-card',        v: 'up'   },
        { sel: '.gallery-item',      v: 'zoom' },
        { sel: '.review-card',       v: 'up'   },
        // eventos / portal
        { sel: '.ev-card',           v: 'up'   },
        { sel: '.destaque-card',     v: 'zoom' },
        { sel: '.mes-secao',         v: 'up'   },
        { sel: '.feira-resumo',      v: 'up'   },
        { sel: '.filter-card',       v: 'up'   },
        // portal usuário
        { sel: '.dashboard-card',    v: 'up'   },
        { sel: '.section-panel',     v: 'up'   },
        { sel: '.welcome-banner',    v: 'up'   },
        // noticias / galeria
        { sel: '.post-card',         v: 'up'   },
        { sel: '.card',              v: 'up'   },
        // genéricos
        { sel: '.pilar-item',        v: 'up'   },
        { sel: '.contact-card',      v: 'up'   },
        { sel: '.featured-card',     v: 'zoom' },
    ];

    // Transformações iniciais por variante
    var TRANSFORM = {
        up:    'translateY(30px)',
        down:  'translateY(-24px)',
        left:  'translateX(-30px)',
        right: 'translateX(30px)',
        zoom:  'scale(0.93)',
    };

    // Delay escalonado: filhos diretos desses containers
    var GRIDS = [
        '.attractions-grid',
        '.hotels-grid',
        '.blog-grid',
        '.gallery-grid',
        '.gallery-section',
        '.reviews-grid',
        '.destaque-grid',
        '.featured-grid',
        '.dashboard-grid',
        '.contact-cards-grid',
    ];

    var DURACAO  = '0.55s';
    var EASING   = 'cubic-bezier(0.4, 0, 0.2, 1)';
    var DELAY_MS = 90;   // delay entre filhos de grid
    var MAX_DELAY= 5;    // máximo 5 × 90ms = 450ms

    // Elementos acima da dobra nunca devem ficar invisíveis
    var EXCLUIR = ['.hero', '.nav', 'header', '.map-overlay', '.loading'];

    // ── Estado invisível inicial ──────────────────────────────────────

    function estiloInicial(el, variante) {
        el._animVariante = variante || 'up';
        el.style.opacity    = '0';
        el.style.transform  = TRANSFORM[el._animVariante] || TRANSFORM.up;
        el.style.transition = 'none'; // sem transição no estado inicial
    }

    function estiloFinal(el) {
        // Força reflow antes de ativar transição (evita flash)
        el.style.transition =
            'opacity ' + DURACAO + ' ' + EASING + ', ' +
            'transform ' + DURACAO + ' ' + EASING;
        // Pequeno timeout para garantir que o browser registrou o estado inicial
        requestAnimationFrame(function () {
            requestAnimationFrame(function () {
                el.style.opacity   = '1';
                el.style.transform = 'none';
            });
        });
    }

    // ── Verificar se está acima da dobra ─────────────────────────────

    function acimaDaDobra(el) {
        var rect = el.getBoundingClientRect();
        return rect.top < window.innerHeight && rect.bottom > 0 &&
               rect.top >= 0; // visível na carga inicial
    }

    function dentroDosExcluidos(el) {
        return EXCLUIR.some(function (sel) {
            return el.closest(sel);
        });
    }

    // ── Preparar elementos ───────────────────────────────────────────

    var preparados = new WeakSet();

    function preparar(el, variante, delayExtra) {
        if (preparados.has(el)) return;
        if (dentroDosExcluidos(el)) return;
        preparados.add(el);

        estiloInicial(el, variante);

        if (delayExtra) {
            el._animDelay = delayExtra;
        }
    }

    // ── Observer ─────────────────────────────────────────────────────

    var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            var el = entry.target;

            var delay = el._animDelay || 0;
            if (delay > 0) {
                setTimeout(function () { estiloFinal(el); }, delay);
            } else {
                estiloFinal(el);
            }

            observer.unobserve(el);
        });
    }, {
        threshold: 0.06,
        rootMargin: '0px 0px -30px 0px',
    });

    // ── init ─────────────────────────────────────────────────────────

    function init() {

        // 1. Elementos individuais
        ALVO.forEach(function (item) {
            document.querySelectorAll(item.sel).forEach(function (el) {
                // Evitar duplicata se já está num grid escalonado
                preparar(el, item.v, 0);
            });
        });

        // 2. Grids — delay escalonado por filho
        GRIDS.forEach(function (gridSel) {
            document.querySelectorAll(gridSel).forEach(function (grid) {
                var filhos = Array.from(grid.children);
                filhos.forEach(function (filho, i) {
                    var delay = Math.min(i, MAX_DELAY) * DELAY_MS;
                    preparar(filho, 'up', delay);
                });
            });
        });

        // 3. Observar tudo que foi preparado
        //    Elementos já visíveis na carga: animar imediatamente sem observer
        document.querySelectorAll('*').forEach(function (el) {
            if (!preparados.has(el)) return;
            if (acimaDaDobra(el)) {
                // Já visível — animar com leve delay para não piscar
                setTimeout(function () { estiloFinal(el); }, 80);
            } else {
                observer.observe(el);
            }
        });
    }

    // ── Rodar ────────────────────────────────────────────────────────

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        // DOM já pronto (script carregado depois)
        setTimeout(init, 0);
    }

    // API pública para conteúdo injetado via JS
    window.animRefresh = function () {
        setTimeout(init, 60);
    };

})();
