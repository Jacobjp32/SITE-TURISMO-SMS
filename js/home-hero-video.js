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

    // Hero v2: o vídeo (com títulos e colagens editoriais) não é fundo automático;
    // só carrega quando o visitante pede, pelo botão [data-hero-video-play].
    function initOnDemandHeroVideo(video) {
        var trigger = document.querySelector('[data-hero-video-play]');
        var wrapper = video.closest('.hv2-video');
        if (!trigger || !wrapper) return;
        trigger.setAttribute('aria-expanded', 'false');
        var closeButton = document.createElement('button');
        closeButton.type = 'button';
        closeButton.className = 'hv2-video-close';
        closeButton.setAttribute('aria-label', 'Fechar vídeo');
        closeButton.textContent = '×';
        wrapper.insertBefore(closeButton, wrapper.firstChild);

        function closeVideo() {
            video.pause();
            wrapper.setAttribute('hidden', '');
            trigger.setAttribute('aria-expanded', 'false');
            try { trigger.focus({ preventScroll: true }); } catch (erro) {}
        }
        closeButton.addEventListener('click', closeVideo);
        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape' && !wrapper.hasAttribute('hidden')) closeVideo();
        });

        trigger.addEventListener('click', function () {
            var opening = wrapper.hasAttribute('hidden');
            if (!opening) {
                closeVideo();
                return;
            }
            var source = video.querySelector('source[data-src]');
            if (source) {
                source.setAttribute('src', source.getAttribute('data-src'));
                source.removeAttribute('data-src');
                video.load();
            }
            video.muted = false;
            wrapper.removeAttribute('hidden');
            trigger.setAttribute('aria-expanded', 'true');
            try {
                var attempt = video.play();
                if (attempt && typeof attempt.catch === 'function') attempt.catch(function () {});
            } catch (erro) {}
            try { video.focus({ preventScroll: true }); } catch (erro) {}
        });
    }

    function initDeferredHeroVideo() {
        var video = document.querySelector('video.hero-video');

        if (video && video.hasAttribute('data-on-demand')) {
            if (video.dataset.deferredHeroInitialized !== 'true') {
                video.dataset.deferredHeroInitialized = 'true';
                initOnDemandHeroVideo(video);
            }
            return;
        }

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
