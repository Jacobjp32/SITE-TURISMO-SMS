/**
 * Adia o video da hero ate depois do carregamento inicial da home.
 * O timeout do idle evita espera permanente em paginas ocupadas; sem suporte
 * a requestIdleCallback, 100 ms preservam uma pequena janela pos-load.
 */
(function () {
    'use strict';

    var IDLE_TIMEOUT_MS = 2000;
    var FALLBACK_DELAY_MS = 100;
    var scheduled = false;

    function hasReducedMotionPreference() {
        return window.matchMedia
            && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    function initDeferredHeroVideo() {
        var video = document.querySelector('video.hero-video');

        if (!video || video.dataset.deferredHeroInitialized === 'true') return;
        if (hasReducedMotionPreference()) return;

        var source = video.querySelector('source[data-src]');
        if (!source) return;

        var deferredSource = source.getAttribute('data-src');
        if (!deferredSource) return;

        video.dataset.deferredHeroInitialized = 'true';
        source.setAttribute('src', deferredSource);
        source.removeAttribute('data-src');

        try {
            video.load();
            var playAttempt = video.play();
            if (playAttempt && typeof playAttempt.catch === 'function') {
                playAttempt.catch(function () {
                    // O poster permanece como fallback quando autoplay e bloqueado.
                });
            }
        } catch (erro) {
            // Falha silenciosa: o poster e o conteudo da hero continuam disponiveis.
        }
    }

    function scheduleDeferredHeroVideo() {
        if (scheduled) return;
        scheduled = true;

        if (typeof window.requestIdleCallback === 'function') {
            window.requestIdleCallback(initDeferredHeroVideo, { timeout: IDLE_TIMEOUT_MS });
            return;
        }

        window.setTimeout(initDeferredHeroVideo, FALLBACK_DELAY_MS);
    }

    if (document.readyState === 'complete') {
        scheduleDeferredHeroVideo();
    } else {
        window.addEventListener('load', scheduleDeferredHeroVideo, { once: true });
    }
})();
