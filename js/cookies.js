/**
 * cookies.js — Banner de Consentimento LGPD
 * Portal de Turismo de São Mateus do Sul
 * Conformidade com a Lei Geral de Proteção de Dados (Lei 13.709/2018)
 */

(function () {
  'use strict';

  var STORAGE_KEY = 'sms_cookie_consent';
  var SESSION_OVERRIDE_KEY = STORAGE_KEY + '_session_override';
  var CONSENT_VERSION = '1';
  var LEVEL_ALL = 'all';
  var LEVEL_ESSENTIAL = 'essential';
  var STATE_UNKNOWN = 'unknown';
  var DEFAULT_GA4_ID = 'G-YPRT7FFFV8';
  var ANALYTICS_SCRIPT_ID = 'sms-ga4-loader';
  var analyticsEnabledForPage = Boolean(
    document.currentScript && document.currentScript.hasAttribute('data-enable-analytics')
  );
  var currentState = readConsentLevel();
  var returnFocusTo = null;

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
  border: 2px solid rgba(255,255,255,0.62);
  background: rgba(255,255,255,0.08);
  color: #fff;
  transition: background 0.2s, border-color 0.2s, color 0.2s;
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
  background: rgba(255,255,255,0.08);
  color: #fff;
  border-color: rgba(255,255,255,0.62);
}
.sms-cookie-btn:focus-visible,
#sms-cookie-preferences:focus-visible {
  outline: 3px solid #fff;
  outline-offset: 3px;
}
#sms-cookie-preferences {
  position: fixed;
  right: 6rem;
  bottom: 1rem;
  z-index: 99998;
  padding: 0.55rem 0.9rem;
  border: 2px solid #d4a574;
  border-radius: 30px;
  background: #0a3d2e;
  color: #fff;
  font: 600 0.78rem/1.2 'Raleway', sans-serif;
  cursor: pointer;
  box-shadow: 0 3px 14px rgba(0,0,0,0.22);
}
#sms-cookie-preferences:hover {
  background: #145744;
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

  function getGa4Id() {
    var analyticsConfig = window.CONFIG && window.CONFIG.analytics;
    return analyticsConfig && analyticsConfig.ga4Id ? analyticsConfig.ga4Id : DEFAULT_GA4_ID;
  }

  function readConsentLevel() {
    try {
      var sessionOverride = sessionStorage.getItem(SESSION_OVERRIDE_KEY);
      if (sessionOverride === LEVEL_ESSENTIAL) return LEVEL_ESSENTIAL;
    } catch (error) {
      // Continua para a autoridade persistente; qualquer erro ainda falha fechado abaixo.
    }

    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return STATE_UNKNOWN;
      var stored = JSON.parse(raw);
      if (stored.version !== CONSENT_VERSION) return STATE_UNKNOWN;
      if (stored.level !== LEVEL_ALL && stored.level !== LEVEL_ESSENTIAL) return STATE_UNKNOWN;
      return stored.level;
    } catch (error) {
      return STATE_UNKNOWN;
    }
  }

  function persistConsent(level) {
    var sessionFallbackStored = false;
    if (level === LEVEL_ESSENTIAL) {
      try {
        sessionStorage.setItem(SESSION_OVERRIDE_KEY, LEVEL_ESSENTIAL);
        sessionFallbackStored = true;
      } catch (error) {
        // localStorage continua sendo tentado como autoridade principal.
      }
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        version: CONSENT_VERSION,
        level: level,
        date: new Date().toISOString()
      }));
      try { sessionStorage.removeItem(SESSION_OVERRIDE_KEY); } catch (error) { /* fail closed */ }
      return true;
    } catch (error) {
      if (level === LEVEL_ESSENTIAL) {
        try { localStorage.removeItem(STORAGE_KEY); } catch (removeError) { /* sessão ainda bloqueia */ }
        return sessionFallbackStored;
      }
      return false;
    }
  }

  function analyticsAllowed() {
    return currentState === LEVEL_ALL;
  }

  function pushAnalyticsCommand(args) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(args);
  }

  function installGtagGate() {
    if (window.gtag && window.gtag.__smsConsentGate) return;

    var gatedGtag = function () {
      if (!analyticsAllowed()) return false;
      pushAnalyticsCommand(arguments);
      return true;
    };
    gatedGtag.__smsConsentGate = true;
    window.gtag = gatedGtag;
  }

  function enableAnalytics() {
    if (!analyticsEnabledForPage) return false;
    if (!analyticsAllowed()) return false;
    if (window.CONFIG && window.CONFIG.analytics && window.CONFIG.analytics.enabled === false) return false;

    var ga4Id = getGa4Id();
    var wasDisabled = window['ga-disable-' + ga4Id] === true;
    window['ga-disable-' + ga4Id] = false;
    if (window.__SMS_GA_INITIALIZED) {
      if (wasDisabled && window.dataLayer) {
        (function () { window.dataLayer.push(arguments); })('consent', 'update', {
          analytics_storage: 'granted'
        });
      }
      return true;
    }

    installGtagGate();
    window.__SMS_GA_INITIALIZED = true;

    var script = document.getElementById(ANALYTICS_SCRIPT_ID);
    if (!script) {
      script = document.createElement('script');
      script.id = ANALYTICS_SCRIPT_ID;
      script.async = true;
      script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(ga4Id);
      document.head.appendChild(script);
    }

    window.gtag('js', new Date());
    window.gtag('config', ga4Id);
    return true;
  }

  function removeKnownGaCookies() {
    if (!document.cookie) return;

    var host = window.location && window.location.hostname ? window.location.hostname : '';
    var domains = [''];
    if (host) {
      domains.push(host);
      domains.push('.' + host);
      if (/(^|\.)saomateusdosul\.pr\.gov\.br$/.test(host)) {
        domains.push('.saomateusdosul.pr.gov.br');
      }
    }

    document.cookie.split(';').forEach(function (entry) {
      var name = entry.split('=')[0].trim();
      if (!/^_ga(?:_|$)/.test(name)) return;
      domains.forEach(function (domain) {
        var domainAttribute = domain ? '; Domain=' + domain : '';
        document.cookie = name + '=; Max-Age=0; Path=/' + domainAttribute + '; SameSite=Lax';
      });
    });
  }

  function disableAnalytics(options) {
    var ga4Id = getGa4Id();
    window['ga-disable-' + ga4Id] = true;

    if (options && options.revoke && window.dataLayer) {
      (function () { window.dataLayer.push(arguments); })('consent', 'update', {
        analytics_storage: 'denied'
      });
      removeKnownGaCookies();
    }
  }

  function ensureStyles() {
    if (document.getElementById('sms-cookie-styles')) return;
    var styleEl = document.createElement('style');
    styleEl.id = 'sms-cookie-styles';
    styleEl.textContent = css;
    document.head.appendChild(styleEl);
  }

  function ensurePreferencesButton() {
    var existing = document.getElementById('sms-cookie-preferences');
    if (existing) return existing;

    var button = document.createElement('button');
    button.id = 'sms-cookie-preferences';
    button.type = 'button';
    button.textContent = 'Gerenciar cookies';
    button.setAttribute('aria-haspopup', 'dialog');
    button.addEventListener('click', function () { showBanner(button); });
    document.body.appendChild(button);
    return button;
  }

  function hideBanner(banner, restoreFocus) {
    banner.classList.remove('visible');
    window.setTimeout(function () {
      banner.remove();
      var preferences = ensurePreferencesButton();
      if (restoreFocus) {
        var focusTarget = returnFocusTo && returnFocusTo.isConnected
          ? returnFocusTo
          : preferences;
        if (focusTarget && typeof focusTarget.focus === 'function') focusTarget.focus();
      }
      returnFocusTo = null;
    }, 450);
  }

  function chooseConsent(level, banner) {
    var previousState = currentState;
    if (!persistConsent(level)) {
      currentState = STATE_UNKNOWN;
      disableAnalytics();
      return false;
    }

    currentState = level;

    if (level === LEVEL_ALL) {
      enableAnalytics();
    } else {
      disableAnalytics({ revoke: previousState === LEVEL_ALL || window.__SMS_GA_INITIALIZED });
    }

    hideBanner(banner, true);
    return true;
  }

  function showBanner(opener) {
    var existing = document.getElementById('sms-cookie-banner');
    if (existing) return existing;

    ensureStyles();
    returnFocusTo = opener || null;

    var banner = document.createElement('div');
    banner.id = 'sms-cookie-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-modal', 'false');
    banner.setAttribute('aria-labelledby', 'sms-cookie-title');
    banner.setAttribute('aria-describedby', 'sms-cookie-description');

    banner.innerHTML = `
      <div class="sms-cookie-inner">
        <p class="sms-cookie-text" id="sms-cookie-description">
          <strong id="sms-cookie-title">🍪 Cookies e Privacidade</strong><br>
          Cookies essenciais mantêm o portal funcionando. O Google Analytics só será carregado se você escolher aceitar todos.
          Consulte a <a href="/privacidade">Política de Privacidade</a>.
        </p>
        <div class="sms-cookie-actions">
          <button type="button" class="sms-cookie-btn sms-cookie-btn--reject" id="smsCookieReject">
            Apenas essenciais
          </button>
          <button type="button" class="sms-cookie-btn sms-cookie-btn--accept" id="smsCookieAccept">
            Aceitar todos
          </button>
        </div>
      </div>`;

    document.body.appendChild(banner);

    var preferences = document.getElementById('sms-cookie-preferences');
    if (preferences) preferences.remove();

    document.getElementById('smsCookieAccept').addEventListener('click', function () {
      chooseConsent(LEVEL_ALL, banner);
    });
    document.getElementById('smsCookieReject').addEventListener('click', function () {
      chooseConsent(LEVEL_ESSENTIAL, banner);
    });
    banner.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        hideBanner(banner, true);
      }
    });

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        banner.classList.add('visible');
        if (opener) document.getElementById('smsCookieReject').focus();
      });
    });
    return banner;
  }

  function renderConsentUi() {
    if (currentState === STATE_UNKNOWN) {
      showBanner(null);
    } else {
      var existingBanner = document.getElementById('sms-cookie-banner');
      if (existingBanner) existingBanner.remove();
      returnFocusTo = null;
      ensureStyles();
      ensurePreferencesButton();
    }
  }

  function init() {
    disableAnalytics();
    if (currentState === LEVEL_ALL) enableAnalytics();

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', renderConsentUi, { once: true });
    } else {
      renderConsentUi();
    }
  }

  window.SMSConsent = {
    getState: function () { return currentState; },
    openPreferences: function () { return showBanner(ensurePreferencesButton()); },
    enableAnalytics: enableAnalytics,
    track: function () {
      if (!analyticsAllowed() || typeof window.gtag !== 'function') return false;
      return window.gtag.apply(window, arguments);
    }
  };

  window.addEventListener('storage', function (event) {
    if (event.key !== STORAGE_KEY) return;
    currentState = readConsentLevel();
    if (currentState === LEVEL_ALL) {
      enableAnalytics();
    } else {
      disableAnalytics({ revoke: window.__SMS_GA_INITIALIZED });
    }
    renderConsentUi();
  });

  init();
})();
