/**
 * breadcrumbs.js — Breadcrumbs automáticos por URL
 * Portal de Turismo de São Mateus do Sul
 * Injeta trilha de navegação e Schema.org BreadcrumbList em subpáginas
 */

(function () {
  'use strict';

  // Mapa de path → rótulo (PT padrão; tradução via data-lang-key)
  var PAGE_LABELS = {
    '/':                 { pt: 'Início',              en: 'Home',           es: 'Inicio',         pl: 'Strona główna' },
    '/o-que-fazer':      { pt: 'O Que Fazer',         en: 'Things to Do',   es: 'Qué Hacer',      pl: 'Co Robić' },
    '/sabores':          { pt: 'Sabores',              en: 'Flavours',       es: 'Sabores',        pl: 'Smaki' },
    '/eventos':          { pt: 'Eventos',              en: 'Events',         es: 'Eventos',        pl: 'Wydarzenia' },
    '/galeria':          { pt: 'Galeria',              en: 'Gallery',        es: 'Galería',        pl: 'Galeria' },
    '/noticias':         { pt: 'Notícias',             en: 'News',           es: 'Noticias',       pl: 'Wiadomości' },
    '/noticia':          { pt: 'Notícia',              en: 'Article',        es: 'Artículo',       pl: 'Artykuł' },
    '/onde-ficar':       { pt: 'Onde Ficar',           en: 'Where to Stay',  es: 'Dónde Quedarse', pl: 'Noclegi' },
    '/rotas-completas':  { pt: 'Roteiros',             en: 'Itineraries',    es: 'Itinerarios',    pl: 'Trasy' },
    '/roteiro-ia':       { pt: 'Roteiro com IA',       en: 'AI Itinerary',   es: 'Itinerario IA',  pl: 'Trasa AI' },
    '/mapa-completo':    { pt: 'Mapa Completo',        en: 'Full Map',       es: 'Mapa Completo',  pl: 'Pełna Mapa' },
    '/mapa-3d':          { pt: 'Mapa 3D',              en: '3D Map',         es: 'Mapa 3D',        pl: 'Mapa 3D' },
    '/local':            { pt: 'Local',                en: 'Place',          es: 'Lugar',          pl: 'Miejsce' },
    '/reservas':         { pt: 'Reservas',             en: 'Reservations',   es: 'Reservas',       pl: 'Rezerwacje' },
    '/para-o-trade':     { pt: 'Para o Trade',         en: 'For Trade',      es: 'Para el Sector', pl: 'Dla Branży' },
    '/transparencia':    { pt: 'Transparência',        en: 'Transparency',   es: 'Transparencia',  pl: 'Przejrzystość' },
    '/portal-usuario':   { pt: 'Portal do Usuário',   en: 'User Portal',    es: 'Portal Usuario', pl: 'Portal Użytkownika' },
    '/privacidade':      { pt: 'Política de Privacidade', en: 'Privacy Policy', es: 'Política de Privacidad', pl: 'Polityka Prywatności' },
  };

  var CSS = `
.sms-breadcrumb {
  background: rgba(10,61,46,0.04);
  border-bottom: 1px solid rgba(10,61,46,0.08);
  padding: 0.6rem 2rem;
  font-family: 'Raleway', sans-serif;
  font-size: 0.82rem;
}
.sms-breadcrumb nav {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: wrap;
}
.sms-breadcrumb a {
  color: #0a3d2e;
  text-decoration: none;
  opacity: 0.7;
  transition: opacity 0.15s;
}
.sms-breadcrumb a:hover { opacity: 1; text-decoration: underline; }
.sms-breadcrumb .bc-sep {
  color: #999;
  user-select: none;
  font-size: 0.75rem;
}
.sms-breadcrumb .bc-current {
  color: #555;
  font-weight: 500;
}
@media (max-width: 600px) {
  .sms-breadcrumb { padding: 0.5rem 1rem; }
}
`;

  function getLang() {
    try { return localStorage.getItem('sms-lang') || 'pt'; } catch (e) { return 'pt'; }
  }

  function getLabel(path, lang) {
    var entry = PAGE_LABELS[path];
    if (!entry) return null;
    return entry[lang] || entry['pt'];
  }

  function buildCrumbs() {
    var path = window.location.pathname.replace(/\.html$/, '').replace(/\/$/, '') || '/';
    // Só insere em subpáginas (não na home)
    if (path === '' || path === '/') return;

    var lang = getLang();
    var homeLabel = getLabel('/', lang) || 'Início';
    var currentLabel = getLabel(path, lang);

    // Para /local, tenta pegar o nome do query string
    if (path === '/local') {
      var params = new URLSearchParams(window.location.search);
      var id = params.get('id');
      if (id) {
        currentLabel = id.replace(/-/g, ' ').replace(/\b\w/g, function(c) { return c.toUpperCase(); });
      }
    }

    if (!currentLabel) return;

    // Cria elemento
    var styleEl = document.createElement('style');
    styleEl.textContent = CSS;
    document.head.appendChild(styleEl);

    var wrapper = document.createElement('div');
    wrapper.className = 'sms-breadcrumb';
    wrapper.setAttribute('aria-label', 'Trilha de navegação');

    var sep = '<span class="bc-sep" aria-hidden="true">›</span>';
    wrapper.innerHTML = '<nav aria-label="breadcrumb">' +
      '<a href="/">' + homeLabel + '</a>' +
      sep +
      '<span class="bc-current" aria-current="page">' + currentLabel + '</span>' +
      '</nav>';

    // Insere após o primeiro elemento filho do body (após nav ou header)
    var body = document.body;
    var nav = body.querySelector('nav, header, .header');
    if (nav && nav.parentNode === body) {
      body.insertBefore(wrapper, nav.nextSibling);
    } else {
      body.insertBefore(wrapper, body.firstChild);
    }

    // Atualiza Schema.org BreadcrumbList no head
    injectSchema(path, currentLabel, lang);
  }

  function injectSchema(path, currentLabel, lang) {
    var base = 'https://turismo.saomateusdosul.pr.gov.br';
    var schema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: getLabel('/', lang) || 'Início', item: base + '/' },
        { '@type': 'ListItem', position: 2, name: currentLabel, item: base + path }
      ]
    };
    var script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildCrumbs);
  } else {
    buildCrumbs();
  }
})();
