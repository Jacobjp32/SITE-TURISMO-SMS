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
      <a href="/transparencia" title="Transparência e Governança">Transparência</a>
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
                <button class="dropdown-toggle" aria-expanded="false" aria-haspopup="true"><span data-lang-key="nav-explore">Explore</span> <span class="arrow">▼</span></button>
                <div class="dropdown-menu" role="menu">
                    <a href="/mapa-completo" data-lang-key="nav-mapa-turistico">Mapa Turístico</a>
                    <a href="/o-que-fazer" data-lang-key="nav-pontos-turisticos">Pontos Turísticos</a>
                    <a href="/rotas-completas" data-lang-key="nav-roteiros">Roteiros</a>
                    <a href="/galeria" data-lang-key="nav-galeria">Galeria</a>
                    <a href="/o-que-fazer" data-lang-key="nav-experiencias">Experiências</a>
                </div>
            </li>

            <li>
                <button class="dropdown-toggle" aria-expanded="false" aria-haspopup="true"><span data-lang-key="nav-sabores">Sabores</span> <span class="arrow">▼</span></button>
                <div class="dropdown-menu" role="menu">
                    <a href="/sabores#polonesa" data-lang-key="nav-gastronomia-polonesa">Gastronomia Polonesa</a>
                    <a href="/o-que-fazer#erva-mate" data-lang-key="nav-erva-mate-menu">Erva-mate</a>
                    <a href="/sabores#restaurantes" data-lang-key="nav-restaurantes-clean">Restaurantes</a>
                    <a href="/sabores#feiras" data-lang-key="nav-produtos-locais">Produtos Locais</a>
                </div>
            </li>

            <li>
                <button class="dropdown-toggle" aria-expanded="false" aria-haspopup="true"><span data-lang-key="nav-agenda">Agenda</span> <span class="arrow">▼</span></button>
                <div class="dropdown-menu" role="menu">
                    <a href="/eventos" data-lang-key="nav-eventos">Eventos</a>
                    <a href="/eventos" data-lang-key="nav-calendario">Calendário</a>
                    <a href="/noticias" data-lang-key="nav-noticias-clean">Notícias</a>
                    <a href="/eventos" data-lang-key="nav-festas-tradicionais">Festas Tradicionais</a>
                </div>
            </li>

            <li>
                <button class="dropdown-toggle" aria-expanded="false" aria-haspopup="true"><span data-lang-key="nav-planeje-visita">Planeje sua Visita</span> <span class="arrow">▼</span></button>
                <div class="dropdown-menu" role="menu">
                    <a href="/onde-ficar" data-lang-key="nav-onde-ficar">Onde Ficar</a>
                    <a href="/mapa-completo" data-lang-key="nav-como-chegar">Como Chegar</a>
                    <a href="/#visitor-guide-title" data-lang-key="nav-informacoes-essenciais">Informações Essenciais</a>
                    <a href="/#weather-title" data-lang-key="nav-previsao-tempo">Previsão do Tempo</a>
                    <a href="/#contato" data-lang-key="nav-contato">Contato</a>
                </div>
            </li>

            <li>
                <button class="dropdown-toggle" aria-expanded="false" aria-haspopup="true"><span data-lang-key="nav-sobre">Sobre</span> <span class="arrow">▼</span></button>
                <div class="dropdown-menu" role="menu">
                    <a href="/#sobre" data-lang-key="nav-sao-mateus">São Mateus do Sul</a>
                    <a href="/#sobre" data-lang-key="nav-historia">História</a>
                    <a href="/o-que-fazer#cultura-polonesa" data-lang-key="nav-capital-polonesa">Capital Polonesa do Paraná</a>
                    <a href="/o-que-fazer#erva-mate" data-lang-key="nav-terra-erva-mate">Terra da Erva-mate</a>
                    <a href="/#sobre" data-lang-key="nav-xisto">Xisto</a>
                    <a href="/transparencia" data-lang-key="nav-institucional">Institucional</a>
                </div>
            </li>

            <li class="nav-search-item">
                <button class="nav-search-btn" type="button" aria-label="Buscar no turismo" data-search-open data-lang-key-title="search-open">
                    <span class="nav-search-icon" aria-hidden="true">🔍</span>
                    <span class="nav-search-text" data-lang-key="search-open-short">Buscar</span>
                </button>
            </li>

            <li class="auth-nav-item">
                <a href="/portal-usuario" class="nav-login-btn auth-login-btn" data-lang-key="nav-area-restrita">👤 Área Restrita</a>
                <div class="auth-user-menu" style="display:none;">
                    <a href="/portal-usuario" class="nav-user-link">👤 <span class="auth-user-name">Usuário</span></a>
                    <button class="nav-logout-link" onclick="smsLogout()">Sair</button>
                </div>
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
<div class="mobile-menu-overlay" id="menuOverlay"></div>
<div class="search-modal" id="searchModal" aria-hidden="true">
    <div class="search-modal-dialog" id="searchDialog" role="dialog" aria-modal="true" aria-labelledby="searchModalTitle">
        <div class="search-modal-header">
            <div>
                <span class="search-modal-kicker" data-lang-key="search-results-label">Resultados da busca</span>
                <h2 id="searchModalTitle" data-lang-key="search-open">Buscar no turismo</h2>
            </div>
            <button class="search-close-btn" type="button" data-search-close aria-label="Fechar busca" data-lang-key-title="search-close">×</button>
        </div>
        <label class="sr-only" for="search" data-lang-key="search-open">Buscar no turismo</label>
        <input type="search" id="search" class="search-modal-input" autocomplete="off" placeholder="Buscar no turismo..." data-lang-key-placeholder="search-input-placeholder">
        <div class="search-modal-results" id="searchResults" role="list" aria-live="polite"></div>
    </div>
</div>`;

    const NAV_CSS = `
<style id="nav-shared-styles">
.nav {
    position: fixed; top: 48px; left: 0; right: 0; z-index: 9999;
    /* nav starts right below accessibility bar (top:4px + height:44px = 48px) */
    padding: 0.9rem 2rem;
    background: linear-gradient(180deg, rgba(10,61,46,0.97) 0%, rgba(10,61,46,0.85) 100%);
    backdrop-filter: blur(16px);
}
.nav-container {
    max-width: 1800px; margin: 0 auto;
    display: flex; justify-content: space-between; align-items: center;
    gap: 1.25rem;
}
.nav-logo img { height: 56px; width: auto; }
.nav-links { display: flex; gap: 0.35rem; list-style: none; align-items: center; }
.nav-links > li { position: relative; }
.nav-links a, .nav-links .dropdown-toggle, .nav-search-btn {
    color: #fff; text-decoration: none; font-weight: 500;
    text-transform: uppercase; font-size: 0.78rem;
    min-height: 42px; padding: 0.65rem 0.95rem; border-radius: 999px;
    transition: all 0.2s; cursor: pointer;
    display: flex; align-items: center; gap: 0.25rem;
    background: none; border: none; font-family: inherit;
}
.nav-links a:hover, .nav-links .dropdown-toggle:hover, .nav-search-btn:hover {
    background: rgba(212,165,116,0.2);
}
.nav-login-btn {
    background: rgba(255,255,255,0.08) !important;
    color: #fff !important; font-weight: 600 !important;
    border: 1px solid rgba(255,255,255,0.22) !important;
    border-radius: 999px !important; padding: 0.65rem 1rem !important;
}
.nav-login-btn:hover { background: rgba(212,165,116,0.18) !important; border-color: rgba(212,165,116,0.5) !important; }
.dropdown-toggle .arrow { font-size: 0.55rem; transition: transform 0.3s; }
.nav-links li:hover .dropdown-toggle .arrow, .nav-links li.dropdown-open .dropdown-toggle .arrow, .nav-links li:focus-within .dropdown-toggle .arrow { transform: rotate(180deg); }
.dropdown-menu {
    position: absolute; top: calc(100% + 4px); left: 0;
    background: white; min-width: 240px; border-radius: 12px;
    border: 1px solid rgba(10,61,46,0.08); box-shadow: 0 18px 48px rgba(10,61,46,0.16);
    opacity: 0; visibility: hidden; transform: translateY(8px);
    transition: all 0.25s; z-index: 1000; padding: 0.4rem 0;
}
.nav-links li:hover .dropdown-menu, .nav-links li.dropdown-open .dropdown-menu, .nav-links li:focus-within .dropdown-menu { opacity:1; visibility:visible; transform:translateY(0); }
.dropdown-menu a {
    display: flex; align-items: center; min-height: 42px; color: #0a3d2e !important; padding: 0.65rem 1.2rem;
    font-size: 0.83rem; text-transform: none; border-radius: 0;
}
.dropdown-menu a:hover { background: #f8f6f0 !important; color: #d4a574 !important; }
.dropdown-menu .divider { height: 1px; background: #eee; margin: 0.35rem 0; }
.nav-search-btn { border: 1px solid rgba(255,255,255,0.2); background: rgba(255,255,255,0.08); }
.nav-search-text { display: none; }
.nav-search-icon { font-size: 1rem; line-height: 1; }
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
.search-modal { position: fixed; inset: 0; display: none; align-items: center; justify-content: center; padding: 1.5rem; background: rgba(6,33,24,0.62); backdrop-filter: blur(10px); z-index: 10030; }
.search-modal.active { display: flex; }
.search-modal-dialog { width: min(760px, 100%); max-height: min(80vh, 760px); overflow: auto; padding: 1.5rem; border-radius: 24px; background: linear-gradient(180deg,#fffdf8 0%,#f6efe4 100%); border: 1px solid rgba(212,165,116,0.35); box-shadow: 0 28px 80px rgba(0,0,0,0.28); }
.search-modal-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; margin-bottom: 1rem; }
.search-modal-kicker { display: inline-block; margin-bottom: 0.4rem; color: #8b6a47; font-size: 0.75rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }
.search-modal-header h2 { font-family: 'Cormorant Garamond', serif; font-size: clamp(1.8rem, 4vw, 2.7rem); color: #0a3d2e; }
.search-close-btn { width: 42px; height: 42px; border: 1px solid rgba(10,61,46,0.14); border-radius: 50%; background: rgba(255,255,255,0.72); color: #0a3d2e; font-size: 1.6rem; line-height: 1; cursor: pointer; }
.search-modal-input { width: 100%; min-height: 56px; padding: 0 1rem; border-radius: 16px; border: 1px solid rgba(10,61,46,0.14); background: rgba(255,255,255,0.88); color: #0a3d2e; font-size: 1rem; }
.search-modal-results { display: grid; gap: 0.85rem; margin-top: 1rem; }
.search-result-card, .search-empty-state { display: block; padding: 1rem 1.05rem; border-radius: 16px; background: rgba(255,255,255,0.92); border: 1px solid rgba(10,61,46,0.08); box-shadow: 0 12px 30px rgba(10,61,46,0.08); }
.search-result-card { text-decoration: none; transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease; }
.search-result-card:hover, .search-result-card:focus { transform: translateY(-2px); border-color: rgba(212,165,116,0.5); box-shadow: 0 16px 36px rgba(10,61,46,0.12); outline: none; }
.search-result-category { display: inline-flex; margin-bottom: 0.45rem; color: #8b6a47; font-size: 0.72rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }
.search-result-title { display: block; color: #0a3d2e; font-size: 1.08rem; margin-bottom: 0.35rem; }
.search-result-description, .search-empty-state p { color: #5f625d; line-height: 1.55; font-size: 0.94rem; }
.search-empty-state strong { display: block; color: #0a3d2e; margin-bottom: 0.35rem; }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
/* Body offset para nav fixo + barra de acessibilidade fixa */
body { padding-top: 136px; }
/* Barra de progresso de leitura (scroll) */
#sms-scroll-track{position:fixed!important;top:0;left:0;right:0;height:4px;background:rgba(255,255,255,0.55);z-index:10001;pointer-events:none;}
#sms-scroll-progress{position:fixed!important;top:0;left:0;height:4px;width:0%;background:#d4a574;z-index:10002;transition:width .1s linear;pointer-events:none;}
/* Acessibilidade eMAG */
.accessibility-bar{background:#1a1a1a!important;color:#fff!important;padding:0 1rem;height:44px;font-size:.8rem;position:fixed!important;top:4px!important;left:0!important;right:0!important;z-index:10001!important;overflow:hidden;}
.accessibility-bar .container{max-width:1800px;margin:0 auto;display:flex;justify-content:space-between;align-items:center;flex-wrap:nowrap;gap:.5rem;height:100%;}
.accessibility-bar .shortcuts{display:flex;gap:.75rem;flex-wrap:wrap;}
.accessibility-bar a,.accessibility-bar button{color:#fff;text-decoration:none;background:transparent;border:1px solid rgba(255,255,255,.3);padding:.25rem .6rem;border-radius:4px;font-size:.75rem;cursor:pointer;transition:all .2s;font-family:inherit;}
.accessibility-bar a:hover,.accessibility-bar a:focus,.accessibility-bar button:hover,.accessibility-bar button:focus{background:#d4a574;color:#1a1a1a;border-color:#d4a574;outline:2px solid #fff;outline-offset:2px;}
.accessibility-bar .controls{display:flex;gap:.5rem;align-items:center;}
.accessibility-bar .font-controls{display:flex;gap:.25rem;}
.accessibility-bar .font-controls button{width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-weight:bold;}
.accessibility-bar .contrast-btn{display:flex;align-items:center;gap:.3rem;}
.skip-links{position:fixed;top:0;left:0;z-index:10010;}
.skip-links a{position:absolute;top:-9999px;left:0;background:#d4a574;color:#1a1a1a;padding:.75rem 1.25rem;font-weight:bold;text-decoration:none;white-space:nowrap;border-radius:0 0 6px 0;}
.skip-links a:focus{top:0;outline:3px solid #1a1a1a;outline-offset:2px;}
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
@media(max-width:500px){.back-to-top{bottom:160px!important;right:1rem!important;width:45px!important;height:45px!important;}}
/* Auth nav state */
.auth-user-menu { display: flex; align-items: center; gap: 0.4rem; }
.nav-user-link { background: linear-gradient(135deg,#d4a574,#c4956a) !important; color: #0a3d2e !important; font-weight: 600 !important; border-radius: 25px !important; padding: 0.5rem 1.1rem !important; text-decoration: none; white-space: nowrap; }
.nav-user-link:hover { background: linear-gradient(135deg,#c4956a,#b38559) !important; }
.nav-logout-link { background: none; border: 1px solid rgba(255,255,255,0.35); color: rgba(255,255,255,0.8); border-radius: 20px; padding: 0.35rem 0.7rem; cursor: pointer; font-size: 0.72rem; font-family: inherit; transition: all 0.2s; white-space: nowrap; }
.nav-logout-link:hover { background: rgba(220,20,60,0.25); border-color: rgba(220,20,60,0.6); color: #fff; }
@media(max-width:968px){
  .auth-user-menu { flex-direction: column; align-items: flex-start; padding: 0.5rem 1.5rem; gap: 0.3rem; }
  .nav-user-link { padding: 0.5rem 0 !important; background: none !important; color: #d4a574 !important; font-size: 0.9rem !important; border-radius: 0 !important; }
  .nav-logout-link { font-size: 0.85rem; }
}
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
    .nav-links a, .nav-links .dropdown-toggle, .nav-search-btn { width:100% !important; justify-content:flex-start !important; padding:0.9rem 1.5rem !important; font-size:0.9rem !important; border-radius:0 !important; }
    .dropdown-menu { position:static !important; opacity:1 !important; visibility:visible !important; transform:none !important; box-shadow:none !important; background:rgba(0,0,0,0.2) !important; border-radius:0 !important; display:none; }
    .dropdown-menu.open { display:block !important; }
    .dropdown-menu a { color:#d4a574 !important; padding:0.6rem 2rem !important; }
    .nav-logo img { height:48px; }
    .nav-search-text { display: inline; }
    .search-modal { padding: 1rem; align-items: flex-start; }
    .search-modal-dialog { width: 100%; margin-top: 5rem; padding: 1rem; border-radius: 20px; }
}
</style>`;

    // Guardar contra double-injection (ex: script carregado duas vezes)
    if (document.getElementById('mainNav')) return;

    // Injetar CSS no <head>
    document.head.insertAdjacentHTML('beforeend', NAV_CSS);

    // Injetar barra de progresso + nav + barra acessibilidade no início do <body>
    document.body.insertAdjacentHTML('afterbegin',
        '<div id="sms-scroll-track" aria-hidden="true"></div><div id="sms-scroll-progress" aria-hidden="true"></div>' + NAV_HTML
    );

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

    [
        'js/data/pontos-turisticos.js',
        'js/data/rotas.js',
        'js/data/hospedagens.js',
        'js/data/restaurantes.js',
        'js/data/eventos.js',
        'js/data/informacoes-essenciais.js',
        'js/data/turismo-data.js',
        'js/search-index.js',
        'js/search.js'
    ].forEach(function(src) {
        if (!document.querySelector('script[src="' + src + '"]')) {
            var script = document.createElement('script');
            script.src = src;
            script.async = false;
            document.body.appendChild(script);
        }
    });

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

        function closeAllDropdowns() {
            document.querySelectorAll('.nav-links li.dropdown-open').forEach(function(li) {
                li.classList.remove('dropdown-open');
                var button = li.querySelector('.dropdown-toggle');
                if (button) button.setAttribute('aria-expanded', 'false');
                var menu = li.querySelector('.dropdown-menu');
                if (menu) menu.classList.remove('open');
            });
        }

        // Dropdowns acessíveis
        document.querySelectorAll('.nav-links .dropdown-toggle').forEach(function(btn) {
            btn.addEventListener('click', function (event) {
                event.preventDefault();
                event.stopPropagation();
                var parent = this.parentElement;
                var menu = parent.querySelector('.dropdown-menu');
                var wasOpen = parent.classList.contains('dropdown-open');
                closeAllDropdowns();
                if (!wasOpen) {
                    parent.classList.add('dropdown-open');
                    this.setAttribute('aria-expanded', 'true');
                    if (menu) menu.classList.add('open');
                }
            });
            btn.addEventListener('keydown', function(event) {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    this.click();
                }
                if (event.key === 'Escape') {
                    closeAllDropdowns();
                    this.focus();
                }
            });
        });

        document.addEventListener('click', function(event) {
            if (!event.target.closest('.nav-links li')) {
                closeAllDropdowns();
            }
        });

        document.addEventListener('keydown', function(event) {
            if (event.key === 'Escape') {
                closeAllDropdowns();
            }
        });

        // Search triggers close the mobile drawer first
        document.querySelectorAll('[data-search-open]').forEach(function(btn) {
            btn.addEventListener('click', function() {
                toggle && toggle.classList.remove('active');
                links && links.classList.remove('active');
                overlay && overlay.classList.remove('active');
                document.body.style.overflow = '';
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
                    localStorage.setItem('sms-lang', lang);
                });
            });
            // Restaurar idioma salvo
            var saved = localStorage.getItem('sms-lang');
            if (saved && saved !== 'pt') {
                var opt = langDrop.querySelector('[data-lang="' + saved + '"]');
                if (opt) opt.click();
            }
        }

        // Mascotes: scroll-reveal (ativa .mascote-peek em qualquer página que os use)
        (function() {
            var peeks = document.querySelectorAll('.mascote-peek');
            if (!peeks.length) return;
            if (!('IntersectionObserver' in window)) {
                peeks.forEach(function(el) { el.style.opacity = '1'; el.style.transform = 'none'; });
                return;
            }
            function revealMascote(el) {
                el.style.transition = 'opacity 0.55s ease, transform 0.65s cubic-bezier(0.34,1.4,0.64,1)';
                el.classList.add('mascote-visible');
                setTimeout(function() {
                    el.style.opacity = '1';
                    el.style.transform = 'none';
                }, 20);
            }
            var mobs = new IntersectionObserver(function(entries) {
                entries.forEach(function(entry) {
                    if (entry.isIntersecting) {
                        var el = entry.target;
                        mobs.unobserve(el);
                        setTimeout(function() { revealMascote(el); }, 450);
                    }
                });
            }, { threshold: 0.15 });
            peeks.forEach(function(el) { mobs.observe(el); });
        })();

        // Auth state: ler localStorage e atualizar nav
        (function() {
            var session = null;
            try { session = JSON.parse(localStorage.getItem('smsUserSession')); } catch(e) {}
            function applyAuthState(user) {
                document.querySelectorAll('.auth-login-btn').forEach(function(el) {
                    el.style.display = user ? 'none' : '';
                });
                document.querySelectorAll('.auth-user-menu').forEach(function(el) {
                    el.style.display = user ? 'flex' : 'none';
                });
                document.querySelectorAll('.auth-user-name').forEach(function(el) {
                    if (user) el.textContent = user.nome ? user.nome.split(' ')[0] : 'Usuário';
                });
            }
            if (session) applyAuthState(session);
            // Atualizar quando firebase-auth.js disparar (portal-usuario.html)
            window.addEventListener('authStateChanged', function(e) {
                applyAuthState(e.detail && e.detail.user);
            });
        })();

        // Botão voltar ao topo + Barra de progresso (listener único com rAF throttle)
        var topBtn = document.getElementById('backToTop');
        var progressBar = document.getElementById('sms-scroll-progress');
        if (topBtn) {
            topBtn.addEventListener('click', function() {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        }
        if (topBtn || progressBar) {
            var scrollTicking = false;
            window.addEventListener('scroll', function() {
                if (!scrollTicking) {
                    scrollTicking = true;
                    requestAnimationFrame(function() {
                        var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                        if (topBtn) {
                            if (scrollTop > 300) topBtn.classList.add('visible');
                            else topBtn.classList.remove('visible');
                        }
                        if (progressBar) {
                            var docHeight = document.documentElement.scrollHeight - window.innerHeight;
                            var pct = docHeight > 0 ? Math.round((scrollTop / docHeight) * 100) : 0;
                            progressBar.style.width = pct + '%';
                        }
                        scrollTicking = false;
                    });
                }
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

    // Logout global (funciona com ou sem Firebase carregado)
    if (!window.smsLogout) {
        window.smsLogout = function() {
            try { localStorage.removeItem('smsUserSession'); } catch(e) {}
            if (window.FirebaseSystem) {
                FirebaseSystem.logout().then(function() { window.location.href = '/'; });
            } else {
                window.location.href = '/portal-usuario';
            }
        };
    }

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
