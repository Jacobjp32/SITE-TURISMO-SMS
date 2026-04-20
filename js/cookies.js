/**
 * cookies.js — Banner de Consentimento LGPD
 * Portal de Turismo de São Mateus do Sul
 * Conformidade com a Lei Geral de Proteção de Dados (Lei 13.709/2018)
 */

(function () {
  'use strict';

  var STORAGE_KEY = 'sms_cookie_consent';
  var CONSENT_VERSION = '1';

  // ── Estilos ────────────────────────────────────────────────────────────────
  var css = `
#sms-cookie-banner {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 99999;
  background: #0a3d2e;
  color: #fff;
  box-shadow: 0 -4px 24px rgba(0,0,0,0.25);
  font-family: 'Raleway', sans-serif;
  transform: translateY(100%);
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
#sms-cookie-banner.visible {
  transform: translateY(0);
}
.sms-cookie-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.25rem 1.5rem;
  display: flex;
  align-items: center;
  gap: 1.5rem;
  flex-wrap: wrap;
}
.sms-cookie-text {
  flex: 1;
  min-width: 240px;
  font-size: 0.88rem;
  line-height: 1.55;
  color: rgba(255,255,255,0.92);
}
.sms-cookie-text strong {
  color: #d4a574;
  font-weight: 600;
}
.sms-cookie-text a {
  color: #d4a574;
  text-decoration: underline;
  text-underline-offset: 2px;
}
.sms-cookie-text a:hover {
  color: #fff;
}
.sms-cookie-actions {
  display: flex;
  gap: 0.75rem;
  flex-shrink: 0;
  flex-wrap: wrap;
}
.sms-cookie-btn {
  padding: 0.6rem 1.4rem;
  border-radius: 30px;
  font-family: 'Raleway', sans-serif;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s;
  white-space: nowrap;
}
.sms-cookie-btn--accept {
  background: #d4a574;
  color: #0a3d2e;
  border-color: #d4a574;
}
.sms-cookie-btn--accept:hover {
  background: #e8c9a0;
  border-color: #e8c9a0;
}
.sms-cookie-btn--reject {
  background: transparent;
  color: rgba(255,255,255,0.75);
  border-color: rgba(255,255,255,0.3);
}
.sms-cookie-btn--reject:hover {
  color: #fff;
  border-color: rgba(255,255,255,0.7);
}
@media (max-width: 600px) {
  .sms-cookie-inner {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  .sms-cookie-actions {
    width: 100%;
  }
  .sms-cookie-btn {
    flex: 1;
    text-align: center;
  }
}
`;

  // ── HTML ───────────────────────────────────────────────────────────────────
  function buildBanner() {
    var styleEl = document.createElement('style');
    styleEl.textContent = css;
    document.head.appendChild(styleEl);

    var banner = document.createElement('div');
    banner.id = 'sms-cookie-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Aviso de cookies e privacidade');
    banner.setAttribute('aria-live', 'polite');

    banner.innerHTML = `
      <div class="sms-cookie-inner">
        <p class="sms-cookie-text">
          <strong>🍪 Cookies e Privacidade</strong><br>
          Utilizamos cookies para melhorar sua experiência, analisar o tráfego e personalizar o conteúdo.
          Ao continuar navegando você concorda com nossa
          <a href="/privacidade">Política de Privacidade</a>
          em conformidade com a <strong>LGPD (Lei 13.709/2018)</strong>.
        </p>
        <div class="sms-cookie-actions">
          <button class="sms-cookie-btn sms-cookie-btn--reject" id="smsCookieReject">
            Apenas essenciais
          </button>
          <button class="sms-cookie-btn sms-cookie-btn--accept" id="smsCookieAccept">
            Aceitar todos
          </button>
        </div>
      </div>`;

    document.body.appendChild(banner);

    // Anima entrada após render
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        banner.classList.add('visible');
      });
    });

    document.getElementById('smsCookieAccept').addEventListener('click', function () {
      saveConsent('all');
      hideBanner(banner);
      // Mantém analytics ativo
    });

    document.getElementById('smsCookieReject').addEventListener('click', function () {
      saveConsent('essential');
      hideBanner(banner);
      // Desativa Google Analytics
      disableAnalytics();
    });
  }

  function hideBanner(banner) {
    banner.classList.remove('visible');
    setTimeout(function () { banner.remove(); }, 450);
  }

  function saveConsent(level) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        version: CONSENT_VERSION,
        level: level,
        date: new Date().toISOString()
      }));
    } catch (e) { /* localStorage indisponível */ }
  }

  function getConsent() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var obj = JSON.parse(raw);
      if (obj.version !== CONSENT_VERSION) return null;
      return obj;
    } catch (e) { return null; }
  }

  function disableAnalytics() {
    // Desativa coleta do GA4 se o usuário recusou cookies analíticos
    window['ga-disable-G-YPRT7FFFV8'] = true;
  }

  // ── Inicialização ──────────────────────────────────────────────────────────
  function init() {
    var consent = getConsent();
    if (consent) {
      // Consentimento já registrado
      if (consent.level === 'essential') {
        disableAnalytics();
      }
      return;
    }

    // Aguarda DOM estar pronto
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', buildBanner);
    } else {
      buildBanner();
    }
  }

  init();
})();
