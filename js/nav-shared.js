/**
 * nav-shared.js
 * Injeta o nav padrão do portal em páginas secundárias.
 * Inclui: logo, links, dropdowns, seletor de idioma, botão login, hamburger mobile.
 */
(function () {
    const NAV_HTML = `
<nav class="nav" id="mainNav">
    <div class="nav-container">
        <a href="/" class="nav-logo">
            <img src="images/logo_header_branca.png" alt="São Mateus do Sul — Capital Polonesa do Paraná">
        </a>

        <button class="nav-toggle" id="navToggle" aria-label="Menu">
            <span></span><span></span><span></span>
        </button>

        <ul class="nav-links" id="navLinks">
            <li><a href="/" data-lang-key="nav-inicio">Início</a></li>

            <li>
                <button class="dropdown-toggle"><span data-lang-key="nav-oquefazer">O Que Fazer</span> <span class="arrow">▼</span></button>
                <div class="dropdown-menu">
                    <a href="/o-que-fazer" data-lang-key="nav-todas-atracoes">🌿 Todas as Atrações</a>
                    <div class="divider"></div>
                    <a href="/o-que-fazer#erva-mate" data-lang-key="nav-erva-mate">🧉 Rota da Erva-Mate</a>
                    <a href="/o-que-fazer#cultura-polonesa" data-lang-key="nav-cultura-polonesa">🇵🇱 Cultura Polonesa</a>
                    <a href="/o-que-fazer#turismo-fe" data-lang-key="nav-turismo-fe">⛪ Turismo de Fé</a>
                    <a href="/o-que-fazer#natureza" data-lang-key="nav-natureza">🌊 Náutica e Natureza</a>
                </div>
            </li>

            <li>
                <button class="dropdown-toggle"><span data-lang-key="nav-sabores">Sabores</span> <span class="arrow">▼</span></button>
                <div class="dropdown-menu">
                    <a href="/sabores" data-lang-key="nav-gastronomia">🍽️ Gastronomia</a>
                    <div class="divider"></div>
                    <a href="/sabores#polonesa" data-lang-key="nav-culinaria-polonesa">🥟 Culinária Polonesa</a>
                    <a href="/sabores#feiras" data-lang-key="nav-feiras">🛒 Feiras e Produtores</a>
                    <a href="/sabores#restaurantes" data-lang-key="nav-restaurantes">🍴 Restaurantes</a>
                </div>
            </li>

            <li><a href="/eventos" data-lang-key="nav-eventos">Eventos</a></li>
            <li><a href="/noticias" data-lang-key="nav-noticias">📰 Notícias</a></li>
            <li><a href="/galeria" data-lang-key="nav-galeria">Galeria</a></li>
            <li><a href="/onde-ficar" data-lang-key="nav-onde-ficar">Onde Ficar</a></li>
            <li><a href="/rotas-completas" data-lang-key="nav-roteiros">Roteiros</a></li>

            <li>
                <button class="dropdown-toggle"><span data-lang-key="nav-sobre">Sobre</span> <span class="arrow">▼</span></button>
                <div class="dropdown-menu">
                    <a href="/#sobre" data-lang-key="nav-cidade">🏛️ A Cidade</a>
                    <a href="/transparencia" data-lang-key="nav-transparencia">📋 Transparência</a>
                    <a href="/para-o-trade" data-lang-key="nav-trade">💼 Para o Trade</a>
                </div>
            </li>

            <li><a href="/#contato" data-lang-key="nav-contato">Contato</a></li>

            <li>
                <a href="/portal-usuario" class="nav-login-btn" data-lang-key="nav-login">👤 Entrar</a>
            </li>

            <li>
                <div class="language-selector">
                    <button class="current-language" id="currentLang">
                        <span class="flag">🇧🇷</span>
                        <span class="lang-code">PT</span>
                        <span class="dropdown-arrow">▼</span>
                    </button>
                    <div class="language-dropdown" id="langDropdown">
                        <button class="lang-option active" data-lang="pt" data-flag="🇧🇷"><span class="flag">🇧🇷</span><span>Português</span></button>
                        <button class="lang-option" data-lang="en" data-flag="🇺🇸"><span class="flag">🇺🇸</span><span>English</span></button>
                        <button class="lang-option" data-lang="es" data-flag="🇪🇸"><span class="flag">🇪🇸</span><span>Español</span></button>
                        <button class="lang-option" data-lang="pl" data-flag="🇵🇱"><span class="flag">🇵🇱</span><span>Polski</span></button>
                    </div>
                </div>
            </li>
        </ul>
    </div>
</nav>
<div class="mobile-menu-overlay" id="menuOverlay"></div>`;

    const NAV_CSS = `
<style id="nav-shared-styles">
.nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 9999;
    padding: 0.9rem 2rem;
    background: linear-gradient(180deg, rgba(10,61,46,0.97) 0%, rgba(10,61,46,0.85) 100%);
    backdrop-filter: blur(16px);
}
.nav-container {
    max-width: 1800px; margin: 0 auto;
    display: flex; justify-content: space-between; align-items: center;
}
.nav-logo img { height: 56px; width: auto; }
.nav-links { display: flex; gap: 0.5rem; list-style: none; align-items: center; }
.nav-links > li { position: relative; }
.nav-links a, .nav-links .dropdown-toggle {
    color: #fff; text-decoration: none; font-weight: 500;
    text-transform: uppercase; font-size: 0.78rem;
    padding: 0.45rem 0.7rem; border-radius: 5px;
    transition: all 0.2s; cursor: pointer;
    display: flex; align-items: center; gap: 0.25rem;
    background: none; border: none; font-family: inherit;
}
.nav-links a:hover, .nav-links .dropdown-toggle:hover {
    background: rgba(212,165,116,0.2);
}
.nav-login-btn {
    background: linear-gradient(135deg, #d4a574, #c4956a) !important;
    color: #0a3d2e !important; font-weight: 600 !important;
    border-radius: 25px !important; padding: 0.5rem 1.1rem !important;
}
.nav-login-btn:hover { background: linear-gradient(135deg,#c4956a,#b38559) !important; }
.dropdown-toggle .arrow { font-size: 0.55rem; transition: transform 0.3s; }
.nav-links li:hover .dropdown-toggle .arrow { transform: rotate(180deg); }
.dropdown-menu {
    position: absolute; top: calc(100% + 4px); left: 0;
    background: white; min-width: 210px; border-radius: 10px;
    box-shadow: 0 10px 40px rgba(0,0,0,0.15);
    opacity: 0; visibility: hidden; transform: translateY(8px);
    transition: all 0.25s; z-index: 1000; padding: 0.4rem 0;
}
.nav-links li:hover .dropdown-menu { opacity:1; visibility:visible; transform:translateY(0); }
.dropdown-menu a {
    display: block; color: #0a3d2e !important; padding: 0.65rem 1.2rem;
    font-size: 0.83rem; text-transform: none; border-radius: 0;
}
.dropdown-menu a:hover { background: #f8f6f0 !important; color: #d4a574 !important; }
.dropdown-menu .divider { height: 1px; background: #eee; margin: 0.35rem 0; }
/* Language selector */
.language-selector { position: relative; }
.current-language {
    background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.3);
    color: white; border-radius: 20px; padding: 0.4rem 0.8rem;
    cursor: pointer; display: flex; align-items: center; gap: 0.4rem;
    font-size: 0.78rem; font-family: inherit;
}
.language-dropdown {
    position: absolute; top: calc(100% + 6px); right: 0;
    background: white; border-radius: 10px; min-width: 140px;
    box-shadow: 0 8px 30px rgba(0,0,0,0.15);
    opacity: 0; visibility: hidden; transform: translateY(6px);
    transition: all 0.25s; z-index: 1000; overflow: hidden;
}
.language-selector:hover .language-dropdown,
.language-dropdown.open { opacity:1; visibility:visible; transform:translateY(0); }
.lang-option {
    width:100%; padding:0.6rem 1rem; text-align:left;
    border:none; background:none; cursor:pointer;
    font-size:0.85rem; display:flex; align-items:center; gap:0.5rem;
    transition: background 0.2s;
}
.lang-option:hover { background: #f8f6f0; }
/* Hamburger */
.nav-toggle {
    display: none; flex-direction: column; justify-content: center; align-items: center;
    width: 44px; height: 44px;
    background: rgba(255,255,255,0.15); border: 2px solid rgba(255,255,255,0.35);
    border-radius: 10px; cursor: pointer; transition: all 0.3s;
}
.nav-toggle span { display:block; width:22px; height:3px; background:white; margin:3px 0; border-radius:3px; transition:all 0.3s; }
.nav-toggle.active span:nth-child(1) { transform: rotate(45deg) translate(5px,5px); }
.nav-toggle.active span:nth-child(2) { opacity:0; }
.nav-toggle.active span:nth-child(3) { transform: rotate(-45deg) translate(5px,-5px); }
.mobile-menu-overlay {
    position:fixed; top:0; left:0; right:0; bottom:0;
    background:rgba(0,0,0,0.55); z-index:9997;
    opacity:0; visibility:hidden; transition:all 0.3s;
}
.mobile-menu-overlay.active { opacity:1; visibility:visible; }
/* Body offset para o nav fixo */
body { padding-top: 72px; }
@media (max-width: 968px) {
    .nav-toggle { display: flex !important; }
    .nav-links {
        position:fixed !important; top:0 !important; right:-100% !important;
        width:82% !important; max-width:300px !important; height:100vh !important;
        background: linear-gradient(180deg,#0a3d2e 0%,#062118 100%) !important;
        flex-direction:column !important; padding:80px 0 2rem !important;
        gap:0 !important; transition:right 0.35s ease !important;
        z-index:9998 !important; overflow-y:auto !important;
        box-shadow:-8px 0 40px rgba(0,0,0,0.4) !important;
    }
    .nav-links.active { right:0 !important; }
    .nav-links li { width:100% !important; border-bottom:1px solid rgba(255,255,255,0.1) !important; }
    .nav-links a, .nav-links .dropdown-toggle { padding:0.9rem 1.5rem !important; font-size:0.9rem !important; }
    .dropdown-menu { position:static !important; opacity:1 !important; visibility:visible !important; transform:none !important; box-shadow:none !important; background:rgba(0,0,0,0.2) !important; border-radius:0 !important; display:none; }
    .dropdown-menu.open { display:block !important; }
    .dropdown-menu a { color:#d4a574 !important; padding:0.6rem 2rem !important; }
    .nav-logo img { height:48px; }
}
</style>`;

    // Injetar CSS no <head>
    document.head.insertAdjacentHTML('beforeend', NAV_CSS);

    // Injetar nav no início do <body>
    document.body.insertAdjacentHTML('afterbegin', NAV_HTML);

    // Carregar animações de scroll (uma vez por página)
    if (!document.getElementById('scroll-anim-script')) {
        var animScript = document.createElement('script');
        animScript.id  = 'scroll-anim-script';
        animScript.src = 'js/scroll-animations.js';
        animScript.defer = true;
        document.body.appendChild(animScript);
    }

    // Hamburger toggle
    document.addEventListener('DOMContentLoaded', function () {
        var toggle = document.getElementById('navToggle');
        var links  = document.getElementById('navLinks');
        var overlay= document.getElementById('menuOverlay');

        if (toggle && links) {
            toggle.addEventListener('click', function () {
                toggle.classList.toggle('active');
                links.classList.toggle('active');
                if (overlay) overlay.classList.toggle('active');
            });
        }
        if (overlay) {
            overlay.addEventListener('click', function () {
                toggle && toggle.classList.remove('active');
                links  && links.classList.remove('active');
                overlay.classList.remove('active');
            });
        }

        // Dropdowns mobile — abre ao clicar
        document.querySelectorAll('.nav-links .dropdown-toggle').forEach(function(btn) {
            btn.addEventListener('click', function () {
                var menu = this.parentElement.querySelector('.dropdown-menu');
                if (menu) menu.classList.toggle('open');
            });
        });

        // Language selector
        var langBtn  = document.getElementById('currentLang');
        var langDrop = document.getElementById('langDropdown');
        if (langBtn && langDrop) {
            langBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                langDrop.classList.toggle('open');
            });
            document.addEventListener('click', function() {
                langDrop.classList.remove('open');
            });
            langDrop.querySelectorAll('.lang-option').forEach(function(opt) {
                opt.addEventListener('click', function() {
                    var lang = this.dataset.lang;
                    var flag = this.dataset.flag;
                    document.querySelector('#currentLang .flag').textContent = flag;
                    document.querySelector('#currentLang .lang-code').textContent = lang.toUpperCase();
                    langDrop.classList.remove('open');
                    // Disparar troca de idioma se translations.js estiver carregado
                    if (window.applyTranslations) window.applyTranslations(lang);
                    else if (window.translations) {
                        var t = window.translations[lang] || {};
                        document.querySelectorAll('[data-lang-key]').forEach(function(el) {
                            if (t[el.dataset.langKey]) el.innerHTML = t[el.dataset.langKey];
                        });
                    }
                    localStorage.setItem('smsLang', lang);
                });
            });
            // Restaurar idioma salvo
            var saved = localStorage.getItem('smsLang');
            if (saved && saved !== 'pt') {
                var opt = langDrop.querySelector('[data-lang="' + saved + '"]');
                if (opt) opt.click();
            }
        }
    });
})();
