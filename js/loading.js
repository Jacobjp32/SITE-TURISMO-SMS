/**
 * ============================================================
 * LOADING SCREEN GLOBAL — Turismo SMS
 * ============================================================
 * Adicione <script src="js/loading.js"></script> em qualquer
 * página para ter o loading screen automático.
 * 
 * O overlay aparece ao carregar e some quando o DOM estiver
 * pronto + 300ms extra para suavidade.
 */
(function() {
    'use strict';

    // ── Criar o overlay de loading ──
    var overlay = document.createElement('div');
    overlay.id = 'sms-loading';
    overlay.innerHTML =
        '<div class="sms-loading-inner">' +
            '<img src="/images/logo_pin_turismo_3d.png" alt="Carregando..." class="sms-loading-logo">' +
            '<div class="sms-loading-spinner"></div>' +
            '<p class="sms-loading-text">Carregando...</p>' +
        '</div>';

    var style = document.createElement('style');
    style.textContent =
        '#sms-loading{' +
            'position:fixed;inset:0;z-index:999999;' +
            'background:linear-gradient(135deg,#0a3d2e 0%,#062118 100%);' +
            'display:flex;align-items:center;justify-content:center;' +
            'transition:opacity .5s ease,visibility .5s ease;' +
            'opacity:1;visibility:visible;' +
        '}' +
        '#sms-loading.sms-loading-hide{opacity:0;visibility:hidden}' +
        '.sms-loading-inner{text-align:center;display:flex;flex-direction:column;align-items:center;gap:1.5rem}' +
        '.sms-loading-logo{width:72px;height:72px;object-fit:contain;animation:sms-pulse 1.5s ease-in-out infinite}' +
        '.sms-loading-spinner{' +
            'width:44px;height:44px;' +
            'border:3px solid rgba(212,165,116,.25);' +
            'border-top-color:#d4a574;' +
            'border-radius:50%;' +
            'animation:sms-spin .9s linear infinite;' +
        '}' +
        '.sms-loading-text{' +
            'color:rgba(255,255,255,.75);' +
            'font-family:Raleway,sans-serif;' +
            'font-size:.9rem;letter-spacing:.08em;' +
        '}' +
        '@keyframes sms-spin{to{transform:rotate(360deg)}}' +
        '@keyframes sms-pulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.06);opacity:.85}}';

    // Injetar antes de qualquer outro conteúdo
    document.head.appendChild(style);
    document.documentElement.appendChild(overlay);

    // ── Esconder quando a página estiver pronta ──
    function hideLoading() {
        // Pequeno delay para suavidade visual
        setTimeout(function() {
            var el = document.getElementById('sms-loading');
            if (el) {
                el.classList.add('sms-loading-hide');
                setTimeout(function() { if (el.parentNode) el.parentNode.removeChild(el); }, 550);
            }
        }, 280);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', hideLoading);
    } else {
        hideLoading();
    }

    // Fallback: nunca deixar o loading preso por mais de 5s
    setTimeout(hideLoading, 5000);

    // Expor para uso manual (ex: após fetch de dados)
    window.smsHideLoading = hideLoading;

})();
