/**
 * nav-shared.js
 * Injeta o nav padrão do portal em páginas secundárias.
 * Inclui: barra de acessibilidade eMAG, nav, chatbot, botão voltar ao topo, SW.
 */
(function () {
    const NAV_HTML = `
<div class="skip-links">
  <a href="#main-content" accesskey="1">Ir para conteúdo principal [Alt+1]</a>
  <a href="#navLinks" accesskey="2">Ir para navegação [Alt+2]</a>
  <a href="#footer" accesskey="4">Ir para rodapé [Alt+4]</a>
</div>
<div class="accessibility-bar" role="navigation" aria-label="Acessibilidade">
  <div class="container">
    <div class="shortcuts">
      <a href="#main-content" title="Atalho: Alt+1">Conteúdo [1]</a>
      <a href="#navLinks" title="Atalho: Alt+2">Menu [2]</a>
      <a href="#footer" title="Atalho: Alt+4">Rodapé [4]</a>
      <a href="transparencia.html" title="Transparência e Governança">Transparência</a>
    </div>
    <div class="controls">
      <div class="font-controls">
        <button onclick="smsChangeFontSize(-1)" title="Diminuir fonte" aria-label="Diminuir tamanho da fonte">A-</button>
        <button onclick="smsChangeFontSize(0)"  title="Fonte normal"   aria-label="Tamanho de fonte normal">A</button>
        <button onclick="smsChangeFontSize(1)"  title="Aumentar fonte" aria-label="Aumentar tamanho da fonte">A+</button>
      </div>
      <button class="contrast-btn" onclick="smsToggleContrast()" title="Alto contraste" aria-label="Alternar alto contraste">
        <span>◐</span> Contraste
      </button>
    </div>
  </div>
</div>
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
    position: fixed; top: 42px; left: 0; right: 0; z-index: 9999;
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
/* Body offset para nav fixo + barra de acessibilidade fixa */
body { padding-top: 110px; }
/* Barra de progresso de leitura (scroll) */
#sms-scroll-progress{position:fixed;top:0;left:0;height:4px;width:0%;background:#d4a574;z-index:10002;transition:width .1s linear;pointer-events:none;}
/* Acessibilidade eMAG */
.accessibility-bar{background:#1a1a1a;color:#fff;padding:.5rem 1rem;font-size:.8rem;position:fixed;top:4px;left:0;right:0;z-index:10001;}
.accessibility-bar .container{max-width:1800px;margin:0 auto;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:.5rem;}
.accessibility-bar .shortcuts{display:flex;gap:.75rem;flex-wrap:wrap;}
.accessibility-bar a,.accessibility-bar button{color:#fff;text-decoration:none;background:transparent;border:1px solid rgba(255,255,255,.3);padding:.25rem .6rem;border-radius:4px;font-size:.75rem;cursor:pointer;transition:all .2s;font-family:inherit;}
.accessibility-bar a:hover,.accessibility-bar a:focus,.accessibility-bar button:hover,.accessibility-bar button:focus{background:#d4a574;color:#1a1a1a;border-color:#d4a574;outline:2px solid #fff;outline-offset:2px;}
.accessibility-bar .controls{display:flex;gap:.5rem;align-items:center;}
.accessibility-bar .font-controls{display:flex;gap:.25rem;}
.accessibility-bar .font-controls button{width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-weight:bold;}
.accessibility-bar .contrast-btn{display:flex;align-items:center;gap:.3rem;}
.skip-links{position:absolute;top:-100px;left:0;z-index:10002;}
.skip-links a{position:absolute;background:#d4a574;color:#1a1a1a;padding:1rem;font-weight:bold;text-decoration:none;}
.skip-links a:focus{top:100px;outline:3px solid #1a1a1a;}
body.high-contrast{background:#000!important;color:#ff0!important;}
body.high-contrast *{background-color:#000!important;color:#ff0!important;border-color:#ff0!important;}
body.high-contrast img{filter:grayscale(100%) contrast(120%);}
body.high-contrast a{color:#0ff!important;text-decoration:underline!important;}
body.high-contrast .nav,body.high-contrast .accessibility-bar{background:#000!important;border-bottom:2px solid #ff0!important;}
body.font-large{font-size:120%!important;}
body.font-larger{font-size:140%!important;}
/* Botão voltar ao topo */
.back-to-top{position:fixed;bottom:6rem;right:2rem;width:50px;height:50px;background:#d4a574;color:#0a3d2e;border:none;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 20px rgba(0,0,0,.3);transition:all .3s;opacity:0;visibility:hidden;z-index:9998;}
.back-to-top.visible{opacity:1;visibility:visible;}
.back-to-top:hover{background:#e8c9a0;transform:translateY(-5px);box-shadow:0 6px 25px rgba(0,0,0,.4);}
@media(max-width:768px){.accessibility-bar .shortcuts{display:none;}.accessibility-bar .controls{width:100%;justify-content:center;}}
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

    // Injetar barra de progresso de scroll
    if (!document.getElementById('sms-scroll-progress')) {
        document.body.insertAdjacentHTML('afterbegin', '<div id="sms-scroll-progress" aria-hidden="true"></div>');
    }

    // Injetar nav (+ barra de acessibilidade) no início do <body>
    document.body.insertAdjacentHTML('afterbegin', NAV_HTML);

    // Injetar botão voltar ao topo (se ainda não existe)
    if (!document.getElementById('backToTop')) {
        document.body.insertAdjacentHTML('beforeend',
            '<button id="backToTop" class="back-to-top" title="Voltar ao topo" aria-label="Voltar ao topo">' +
            '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
            '<polyline points="18 15 12 9 6 15"></polyline></svg></button>');
    }

    // Carregar chatbot (se ainda não carregado)
    if (!document.getElementById('chatbot-script')) {
        var cbScript = document.createElement('script');
        cbScript.id  = 'chatbot-script';
        cbScript.src = 'js/chatbot.js';
        cbScript.onload = function() {
            if (typeof Chatbot !== 'undefined') Chatbot.init();
        };
        document.body.appendChild(cbScript);
    }

    // Registrar Service Worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js').catch(function(){});
    }

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

        // Botão voltar ao topo — comportamento
        var topBtn = document.getElementById('backToTop');
        if (topBtn) {
            window.addEventListener('scroll', function() {
                if (window.pageYOffset > 300) topBtn.classList.add('visible');
                else topBtn.classList.remove('visible');
            });
            topBtn.addEventListener('click', function() {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        }

        // Barra de progresso de scroll
        var progressBar = document.getElementById('sms-scroll-progress');
        if (progressBar) {
            window.addEventListener('scroll', function() {
                var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                var docHeight = document.documentElement.scrollHeight - window.innerHeight;
                var pct = docHeight > 0 ? Math.round((scrollTop / docHeight) * 100) : 0;
                progressBar.style.width = pct + '%';
            }, { passive: true });
        }

        // Restaurar preferências de acessibilidade
        var savedFs = localStorage.getItem('sms-font-size');
        if (savedFs) {
            var fs = parseInt(savedFs);
            if (fs === 1) document.body.classList.add('font-large');
            else if (fs >= 2) document.body.classList.add('font-larger');
        }
        if (localStorage.getItem('sms-high-contrast') === 'true') {
            document.body.classList.add('high-contrast');
        }
    });

    // Funções de acessibilidade globais (evitar redeclaração se já existirem)
    if (!window.smsChangeFontSize) {
        var _smsFontSize = 0;
        window.smsChangeFontSize = function(dir) {
            document.body.classList.remove('font-large', 'font-larger');
            if (dir === 0) { _smsFontSize = 0; }
            else { _smsFontSize = Math.max(-1, Math.min(2, _smsFontSize + dir)); }
            if (_smsFontSize === 1) document.body.classList.add('font-large');
            else if (_smsFontSize >= 2) document.body.classList.add('font-larger');
            localStorage.setItem('sms-font-size', _smsFontSize);
        };
    }
    if (!window.smsToggleContrast) {
        window.smsToggleContrast = function() {
            document.body.classList.toggle('high-contrast');
            localStorage.setItem('sms-high-contrast', document.body.classList.contains('high-contrast'));
        };
    }
})();
