/**
 * home-i18n.js
 * Runtime de idiomas da home.
 * Extraído no R5B sem alteração de comportamento.
 *
 * ATENÇÃO:
 * Este arquivo é carregado sem defer para preservar a ordem
 * histórica de inicialização com translations.js.
 */
(function() {
    'use strict';

    // Usar traduções do arquivo externo se disponível, senão usar inline
    var translations = window.translations || {};

    var flags = { pt: '🇧🇷', en: '🇺🇸', es: '🇪🇸', pl: '🇵🇱' };

    function ready(fn) {
        if (document.readyState !== 'loading') fn();
        else document.addEventListener('DOMContentLoaded', fn);
    }

    ready(function() {
        console.log('🌍 Iniciando seletor de idiomas...');

        var langSelector = document.querySelector('.language-selector');
        var currentLangBtn = document.getElementById('currentLang');
        var langDropdown = document.getElementById('langDropdown');
        var langOptions = document.querySelectorAll('.lang-option');

        if (!langSelector || !currentLangBtn || !langDropdown) {
            console.log('Seletor de idiomas: elementos não encontrados');
            return;
        }

        var currentLang = localStorage.getItem('sms-lang') || 'pt';
        var dropdownOpen = false;

        function atualizarBotao(lang) {
            var flagEl = currentLangBtn.querySelector('.flag');
            var codeEl = currentLangBtn.querySelector('.lang-code');
            if (flagEl) flagEl.textContent = flags[lang] || '🇧🇷';
            if (codeEl) codeEl.textContent = lang.toUpperCase();
            var activeOption = document.querySelector('.lang-option[data-lang="' + lang + '"]');
            var labelText = activeOption && activeOption.textContent ? activeOption.textContent.trim() : lang.toUpperCase();
            var dict = window.translations && (window.translations[lang] || window.translations.pt);
            var ariaTemplate = dict && dict['lang-select-current'] ? dict['lang-select-current'] : 'Selecionar idioma {language}';
            var titleTemplate = dict && dict['lang-current-title'] ? dict['lang-current-title'] : 'Idioma atual: {language}';
            currentLangBtn.setAttribute('aria-label', ariaTemplate.replace('{language}', labelText));
            currentLangBtn.setAttribute('title', titleTemplate.replace('{language}', labelText));
        }

        function aplicarTraducoes(lang) {
            if (window.applyTranslations) {
                window.applyTranslations(lang);
                console.log('✅ Traduções aplicadas via translations.js:', lang);
                return;
            }

            var trans = translations[lang];
            if (!trans) return;

            var elementos = document.querySelectorAll('[data-lang-key]');
            for (var i = 0; i < elementos.length; i++) {
                var el = elementos[i];
                var key = el.getAttribute('data-lang-key');
                if (trans[key]) {
                    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                        el.placeholder = trans[key];
                    } else {
                        el.innerHTML = trans[key];
                    }
                }
            }

            // Atualizar lang do HTML
            document.documentElement.lang = lang === 'pt' ? 'pt-BR' : lang;
            document.dispatchEvent(new CustomEvent('translationsApplied', { detail: { lang: lang } }));
            console.log('✅ Traduções aplicadas:', lang, '(' + elementos.length + ' elementos)');
        }

        function abrirDropdown() {
            dropdownOpen = true;
            langSelector.classList.add('active');
            langDropdown.classList.add('active');
        }

        function fecharDropdown() {
            dropdownOpen = false;
            langSelector.classList.remove('active');
            langDropdown.classList.remove('active');
        }

        function setIdioma(lang) {
            currentLang = lang;
            localStorage.setItem('sms-lang', lang);
            atualizarBotao(lang);
            aplicarTraducoes(lang);

            // Atualizar opção ativa
            for (var i = 0; i < langOptions.length; i++) {
                var opt = langOptions[i];
                if (opt.getAttribute('data-lang') === lang) {
                    opt.classList.add('active');
                } else {
                    opt.classList.remove('active');
                }
            }

            fecharDropdown();
            var navLinksEl = document.getElementById('navLinks');
            if (navLinksEl && navLinksEl.classList.contains('active')) {
                var navToggleEl = document.getElementById('navToggle');
                var mobileOverlayEl = document.getElementById('mobileOverlay');
                if (navToggleEl && navToggleEl.classList.contains('active')) {
                    navToggleEl.click();
                } else {
                    navLinksEl.classList.remove('active');
                    if (navToggleEl) navToggleEl.setAttribute('aria-expanded', 'false');
                    if (mobileOverlayEl) mobileOverlayEl.classList.remove('active');
                    document.body.classList.remove('nav-menu-open');
                }
            }
            console.log('🌍 Idioma alterado para:', lang);
        }

        // Toggle dropdown
        currentLangBtn.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            if (dropdownOpen) {
                fecharDropdown();
            } else {
                abrirDropdown();
            }
        };

        // Opções de idioma
        for (var i = 0; i < langOptions.length; i++) {
            langOptions[i].onclick = function(e) {
                e.preventDefault();
                e.stopPropagation();
                var lang = this.getAttribute('data-lang');
                if (lang) setIdioma(lang);
            };
        }

        // Fechar ao clicar fora
        document.addEventListener('click', function(e) {
            if (!langSelector.contains(e.target)) {
                fecharDropdown();
            }
        });

        // Aplicar idioma inicial
        atualizarBotao(currentLang);
        aplicarTraducoes(currentLang);

        for (var i = 0; i < langOptions.length; i++) {
            var opt = langOptions[i];
            if (opt.getAttribute('data-lang') === currentLang) {
                opt.classList.add('active');
            }
        }

        console.log('✅ Seletor de idiomas pronto! Idioma:', currentLang);
    });
})();
