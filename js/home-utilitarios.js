/**
 * home-utilitarios.js
 * Utilitários visuais da home:
 * barra de progresso de rolagem e botão voltar ao topo.
 * Extraído no R4B sem alteração de comportamento.
 */
(function () {
    const backToTopBtn = document.getElementById('backToTop');

    // Barra de progresso de scroll
    const scrollProgressBar = document.getElementById('sms-scroll-progress');
    if (scrollProgressBar) {
        window.addEventListener('scroll', () => {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const pct = docHeight > 0 ? Math.round((scrollTop / docHeight) * 100) : 0;
            scrollProgressBar.style.width = pct + '%';
        }, { passive: true });
    }

    if (backToTopBtn) {
        // Mostrar/esconder botão ao rolar
        window.addEventListener('scroll', () => {
            if (window.pageYOffset > 300) {
                backToTopBtn.classList.add('visible');
            } else {
                backToTopBtn.classList.remove('visible');
            }
        });

        // Voltar ao topo ao clicar
        backToTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
})();
