/**
 * home-acessibilidade.js
 * Recursos de acessibilidade eMAG da home:
 * fonte, contraste, preferências, reduced motion e atalhos.
 * Extraído no R4A sem alteração de comportamento.
 */
(function () {
    // Controle de tamanho de fonte
    var currentFontSize = 0; // 0 = normal, 1 = grande, -1 = menor

    window.changeFontSize = function (direction) {
        var body = document.body;

        // Remover classes anteriores
        body.classList.remove('font-large', 'font-larger');

        if (direction === 0) {
            currentFontSize = 0;
        } else {
            currentFontSize += direction;
            currentFontSize = Math.max(-1, Math.min(2, currentFontSize));
        }

        if (currentFontSize === 1) {
            body.classList.add('font-large');
        } else if (currentFontSize >= 2) {
            body.classList.add('font-larger');
        }

        // Salvar preferência
        localStorage.setItem('sms-font-size', currentFontSize);
    };

    // Controle de alto contraste
    window.toggleContrast = function () {
        var body = document.body;
        body.classList.toggle('high-contrast');

        // Salvar preferência
        var isHighContrast = body.classList.contains('high-contrast');
        localStorage.setItem('sms-high-contrast', isHighContrast);
    };

    // Restaurar preferências salvas
    document.addEventListener('DOMContentLoaded', function() {
        // Restaurar tamanho de fonte
        var savedFontSize = localStorage.getItem('sms-font-size');
        if (savedFontSize) {
            currentFontSize = parseInt(savedFontSize);
            if (currentFontSize === 1) {
                document.body.classList.add('font-large');
            } else if (currentFontSize >= 2) {
                document.body.classList.add('font-larger');
            }
        }

        // Restaurar alto contraste
        var savedContrast = localStorage.getItem('sms-high-contrast');
        if (savedContrast === 'true') {
            document.body.classList.add('high-contrast');
        }

        if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            document.querySelectorAll('.hero-video').forEach(function(video) {
                try {
                    video.pause();
                    video.removeAttribute('autoplay');
                } catch (erro) {}
            });
        }
    });

    // Atalhos de teclado (Alt + número)
    document.addEventListener('keydown', function(e) {
        if (e.altKey) {
            switch(e.key) {
                case '1':
                    e.preventDefault();
                    var mainContent = document.getElementById('main-content') || document.getElementById('map-hero');
                    if (mainContent) mainContent.focus();
                    break;
                case '2':
                    e.preventDefault();
                    var navLinks = document.getElementById('navLinks');
                    if (navLinks) navLinks.focus();
                    break;
                case '3':
                    e.preventDefault();
                    var search = document.getElementById('search');
                    if (search) search.focus();
                    break;
                case '4':
                    e.preventDefault();
                    var footer = document.getElementById('footer');
                    if (footer) footer.scrollIntoView({ behavior: 'smooth' });
                    break;
            }
        }
    });
})();
