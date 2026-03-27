/**
 * scroll-animations.js — Animações de scroll para o Portal de Turismo SMS
 * Usa Intersection Observer nativo — zero dependências, zero impacto na performance
 *
 * Como funciona:
 *  1. Elementos com [data-anim] começam invisíveis (via CSS em shared.css)
 *  2. Quando entram na viewport, ganham a classe .anim-visivel → animam suavemente
 *  3. O script adiciona [data-anim] automaticamente nos elementos certos de cada página
 */

(function () {
    'use strict';

    // Seletores que recebem animação automática
    const AUTO_SELECTORS = [
        // Seções e cards genéricos
        '.attraction-card',
        '.hotel-card',
        '.dashboard-card',
        '.review-card',
        '.blog-card',
        '.event-card',
        '.ev-card',
        '.card',
        '.filter-card',
        // Seções de conteúdo
        '.pilar-item',
        '.section-panel',
        '.featured-card',
        '.destaque-card',
        '.festa-card',
        '.contact-card',
        '.gallery-item',
        // Banners e blocos grandes
        '.welcome-banner',
        '.diorama-section',
        // Textos de seção
        '.section-intro',
        '.section-header',
        '.about-hero-content',
        // Grids e painéis
        '.dashboard-grid',
        '.events-container',
        '.events-header',
        '.featured-section',
        // Itens de lista
        '.event-item',
        '.mes-secao',
        '.feira-resumo',
        // Sidebar e filtros
        '.sidebar',
        // Posts e artigos
        '.post-card',
        '.post-grid > article',
        // Galeria
        '.card',
    ];

    // Variantes de animação por seletor (opcional, senão usa o padrão fade-up)
    const VARIANTES = {
        '.pilar-item:nth-child(even)': 'fade-right',
        '.pilar-item:nth-child(odd)':  'fade-left',
        '.gallery-item':               'fade-zoom',
        '.destaque-card':              'fade-zoom',
        '.featured-card':              'fade-zoom',
    };

    // Delay escalonado para grids (filhos de container)
    const CONTAINERS_ESCALONADOS = [
        '.attractions-grid',
        '.dashboard-grid',
        '.hotels-grid',
        '.reviews-grid',
        '.blog-grid',
        '.featured-grid',
        '.destaque-grid',
        '.gallery-grid',
        '.events-grid',
        '.dashboard-grid',
        '.contact-cards-grid',
        '.category-grid',
        '.festas-grid',
        '.destaque-grid',
    ];

    function init() {
        // Adicionar data-anim nos elementos que ainda não têm
        AUTO_SELECTORS.forEach(function (sel) {
            document.querySelectorAll(sel).forEach(function (el) {
                if (!el.hasAttribute('data-anim')) {
                    el.setAttribute('data-anim', 'fade-up');
                }
            });
        });

        // Aplicar variantes específicas
        Object.entries(VARIANTES).forEach(function ([sel, variante]) {
            document.querySelectorAll(sel).forEach(function (el) {
                el.setAttribute('data-anim', variante);
            });
        });

        // Delay escalonado nos filhos de grids
        CONTAINERS_ESCALONADOS.forEach(function (containerSel) {
            document.querySelectorAll(containerSel).forEach(function (container) {
                Array.from(container.children).forEach(function (filho, i) {
                    if (!filho.hasAttribute('data-anim')) {
                        filho.setAttribute('data-anim', 'fade-up');
                    }
                    // Máx 6 delays distintos para não esperar demais
                    var delay = Math.min(i, 5) * 80;
                    filho.style.transitionDelay = delay + 'ms';
                });
            });
        });

        // Observer
        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('anim-visivel');
                    // Não observar mais (animação só uma vez)
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.08,       // 8% do elemento visível já dispara
            rootMargin: '0px 0px -40px 0px'  // 40px antes do fundo da viewport
        });

        // Observar todos os elementos com data-anim
        document.querySelectorAll('[data-anim]').forEach(function (el) {
            observer.observe(el);
        });
    }

    // Respeitar prefers-reduced-motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        // Sem animações — apenas tornar visível imediatamente
        document.querySelectorAll('[data-anim]').forEach(function (el) {
            el.classList.add('anim-visivel');
        });
        return;
    }

    // Rodar após DOM pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Re-rodar quando conteúdo dinâmico for injetado (eventos, galeria via JS)
    window.animRefresh = function () {
        init();
    };

})();
