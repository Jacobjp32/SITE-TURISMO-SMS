/**
 * home-experiencias.js
 * Carrossel "Experiências em destaque" da home.
 * Extraído no R2 sem alteração de comportamento.
 */
(function () {
    function initFeaturedExperiencesCarousel() {
        const carousel = document.querySelector('[data-featured-carousel]');
        if (!carousel) return;

        const track = carousel.querySelector('[data-featured-track]');
        const prev = carousel.querySelector('[data-featured-prev]');
        const next = carousel.querySelector('[data-featured-next]');
        if (!track || !prev || !next) return;

        const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        function getStep() {
            const card = track.querySelector('.featured-experience-card');
            if (!card) return Math.min(track.clientWidth, 320);
            const styles = window.getComputedStyle(track);
            const gap = parseFloat(styles.columnGap || styles.gap || '0') || 0;
            return card.getBoundingClientRect().width + gap;
        }

        function move(direction) {
            track.scrollBy({
                left: getStep() * direction,
                behavior: prefersReducedMotion ? 'auto' : 'smooth'
            });
        }

        function updateControls() {
            const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth - 2);
            prev.disabled = track.scrollLeft <= 2;
            next.disabled = track.scrollLeft >= maxScroll;
        }

        prev.addEventListener('click', function() {
            move(-1);
        });

        next.addEventListener('click', function() {
            move(1);
        });

        track.addEventListener('keydown', function(event) {
            if (event.key === 'ArrowLeft') {
                event.preventDefault();
                move(-1);
            } else if (event.key === 'ArrowRight') {
                event.preventDefault();
                move(1);
            }
        });

        track.addEventListener('scroll', updateControls, { passive: true });
        window.addEventListener('resize', updateControls);
        updateControls();
    }

    document.addEventListener('DOMContentLoaded', initFeaturedExperiencesCarousel);
})();
