/**
 * recortes.js — comportamento mínimo da direção visual "Recortes" (V2.2, local).
 * Só age em <body class="recortes">.
 *
 * Cabeçalho compacto no celular: a faixa de acessibilidade some e os mesmos
 * controles (A−, A, A+, Contraste e estação) passam para um painel aberto pelo
 * botão "Aa", sempre visível ao lado do menu. Os nós são MOVIDOS, não copiados:
 * os onclick originais (smsChangeFontSize / smsToggleContrast) continuam valendo.
 */
(function () {
    'use strict';
    var body = document.body;
    if (!body || !body.classList.contains('recortes')) return;

    var MOBILE = window.matchMedia('(max-width: 1100px)');
    var LABELS = {
        pt: { toggle: 'Acessibilidade: tamanho do texto e contraste', title: 'Leitura' },
        en: { toggle: 'Accessibility: text size and contrast', title: 'Reading' },
        es: { toggle: 'Accesibilidad: tamaño del texto y contraste', title: 'Lectura' },
        pl: { toggle: 'Dostępność: rozmiar tekstu i kontrast', title: 'Czytanie' }
    };

    function lang() {
        var l = '';
        try { l = localStorage.getItem('sms-lang') || ''; } catch (e) {}
        l = (l || document.documentElement.lang || 'pt').slice(0, 2).toLowerCase();
        return LABELS[l] ? l : 'pt';
    }

    function setup() {
        var navContainer = document.querySelector('#mainNav .nav-container');
        var navToggle = document.getElementById('navToggle');
        var controls = document.querySelector('.accessibility-bar .controls');
        if (!navContainer || !navToggle || !controls || document.getElementById('rcA11yToggle')) return;

        var home = controls.parentNode;
        var wrap = document.createElement('div');
        wrap.className = 'rc-a11y';
        wrap.innerHTML =
            '<button type="button" class="rc-a11y-toggle" id="rcA11yToggle" aria-expanded="false" aria-controls="rcA11yPanel">' +
            '<span aria-hidden="true">Aa</span></button>' +
            '<div class="rc-a11y-panel" id="rcA11yPanel" role="group" hidden>' +
            '<p class="rc-a11y-title"></p></div>';
        navContainer.insertBefore(wrap, navToggle);

        var toggle = wrap.querySelector('.rc-a11y-toggle');
        var panel = wrap.querySelector('.rc-a11y-panel');
        var title = wrap.querySelector('.rc-a11y-title');

        function label() {
            var t = LABELS[lang()];
            toggle.setAttribute('aria-label', t.toggle);
            toggle.setAttribute('title', t.toggle);
            panel.setAttribute('aria-label', t.toggle);
            title.textContent = t.title;
        }

        function close() {
            panel.hidden = true;
            toggle.setAttribute('aria-expanded', 'false');
        }

        function place() {
            if (MOBILE.matches) {
                if (controls.parentNode !== panel) panel.appendChild(controls);
            } else {
                close();
                if (controls.parentNode !== home) home.appendChild(controls);
            }
        }

        toggle.addEventListener('click', function () {
            var open = panel.hidden;
            panel.hidden = !open;
            toggle.setAttribute('aria-expanded', String(open));
            if (open) {
                // O balão da capivara divide o mesmo canto do cabeçalho: sai de cena.
                var bubbleClose = document.querySelector('#sms-mascot .sms-mascot-bubble.show .sms-bubble-close');
                if (bubbleClose) bubbleClose.click();
                var first = panel.querySelector('button');
                if (first) first.focus();
            }
        });
        // Captura: o Esc fecha só o painel e devolve o foco ao "Aa" (sem acionar o menu).
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && !panel.hidden) { e.stopImmediatePropagation(); close(); toggle.focus(); }
        }, true);
        document.addEventListener('click', function (e) {
            if (!panel.hidden && !wrap.contains(e.target)) close();
        });
        if (MOBILE.addEventListener) MOBILE.addEventListener('change', place);
        else if (MOBILE.addListener) MOBILE.addListener(place);
        document.addEventListener('translationsApplied', label);

        label();
        place();
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup);
    else setup();
})();
