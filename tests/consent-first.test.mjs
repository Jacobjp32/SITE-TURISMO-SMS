import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import vm from 'node:vm';

const root = process.cwd();
const consentSource = readFileSync(join(root, 'js', 'cookies.js'), 'utf8');
const configSource = readFileSync(join(root, 'config.js'), 'utf8');
const storageKey = 'sms_cookie_consent';

class FakeClassList {
  constructor() { this.values = new Set(); }
  add(value) { this.values.add(value); }
  remove(value) { this.values.delete(value); }
}

class FakeElement {
  constructor(document, tagName = 'div') {
    this.document = document;
    this.tagName = tagName.toUpperCase();
    this.children = [];
    this.listeners = new Map();
    this.attributes = new Map();
    this.classList = new FakeClassList();
    this.parentNode = null;
    this.isConnected = false;
    this._id = '';
    this._innerHTML = '';
  }
  set id(value) { this._id = value; if (value) this.document.elements.set(value, this); }
  get id() { return this._id; }
  set innerHTML(value) {
    this._innerHTML = value;
    for (const match of value.matchAll(/<([a-z0-9-]+)[^>]*\sid="([^"]+)"/gi)) {
      const child = new FakeElement(this.document, match[1]);
      child.id = match[2];
      child.parentNode = this;
      child.setConnected(this.isConnected);
      this.children.push(child);
    }
  }
  get innerHTML() { return this._innerHTML; }
  setConnected(value) {
    this.isConnected = value;
    for (const child of this.children) child.setConnected(value);
  }
  contains(node) {
    return this === node || this.children.some((child) => child.contains(node));
  }
  appendChild(child) {
    child.parentNode = this;
    this.children.push(child);
    child.setConnected(this.isConnected);
    return child;
  }
  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  hasAttribute(name) { return this.attributes.has(name); }
  addEventListener(type, listener) {
    const listeners = this.listeners.get(type) || [];
    listeners.push(listener);
    this.listeners.set(type, listeners);
  }
  dispatchEvent(event) {
    event.target = this;
    for (const listener of this.listeners.get(event.type) || []) listener.call(this, event);
  }
  click() { this.dispatchEvent({ type: 'click' }); }
  focus() { if (this.isConnected) this.document.activeElement = this; }
  remove() {
    if (this.contains(this.document.activeElement)) this.document.activeElement = this.document.body;
    if (this.parentNode) this.parentNode.children = this.parentNode.children.filter((child) => child !== this);
    if (this.id) this.document.elements.delete(this.id);
    for (const child of this.children) if (child.id) this.document.elements.delete(child.id);
    this.parentNode = null;
    this.setConnected(false);
  }
}

function createEnvironment({ storedValue, analyticsEnabled = true, storageThrows = false, storageSetThrows = false } = {}) {
  const storage = new Map();
  const session = new Map();
  if (storedValue !== undefined) storage.set(storageKey, storedValue);

  const document = {
    elements: new Map(), readyState: 'complete', activeElement: null, cookie: '',
    createElement(tagName) { return new FakeElement(document, tagName); },
    getElementById(id) { return document.elements.get(id) || null; },
    addEventListener() {},
  };
  document.head = new FakeElement(document, 'head');
  document.body = new FakeElement(document, 'body');
  document.head.setConnected(true);
  document.body.setConnected(true);
  document.currentScript = { hasAttribute(name) { return analyticsEnabled && name === 'data-enable-analytics'; } };

  const windowListeners = new Map();
  const window = {
    document,
    location: { hostname: '127.0.0.1' },
    requestAnimationFrame(callback) { callback(); },
    setTimeout(callback) { callback(); },
    addEventListener(type, listener) { windowListeners.set(type, listener); },
  };
  window.window = window;

  const localStorage = {
    getItem(key) { if (storageThrows) throw new Error('storage unavailable'); return storage.get(key) ?? null; },
    setItem(key, value) { if (storageThrows || storageSetThrows) throw new Error('storage unavailable'); storage.set(key, value); },
    removeItem(key) { if (storageThrows) throw new Error('storage unavailable'); storage.delete(key); },
  };
  const sessionStorage = {
    getItem(key) { return session.get(key) ?? null; },
    setItem(key, value) { session.set(key, value); },
    removeItem(key) { session.delete(key); },
  };
  const context = vm.createContext({
    window, document, localStorage, sessionStorage,
    requestAnimationFrame: window.requestAnimationFrame,
    setTimeout: window.setTimeout,
    console, Date, JSON, Boolean, encodeURIComponent,
  });
  vm.runInContext(consentSource, context, { filename: 'js/cookies.js' });

  return {
    window, document, storage,
    dispatchStorage() { windowListeners.get('storage')?.({ key: storageKey }); },
    loaderCount() {
      return document.head.children.filter((element) =>
        element.tagName === 'SCRIPT' && element.src?.includes('googletagmanager.com/gtag/js')
      ).length;
    },
    commands() { return (window.dataLayer || []).map((entry) => Array.from(entry)); },
  };
}

function storedConsent(level) {
  return JSON.stringify({ version: '1', level, date: '2026-09-13T00:00:00.000Z' });
}

test('FIRST_VISIT_UNKNOWN keeps GA absent and exposes both consent choices', () => {
  const env = createEnvironment();
  assert.equal(env.window.SMSConsent.getState(), 'unknown');
  assert.equal(env.loaderCount(), 0);
  assert.equal(env.commands().length, 0);
  assert.ok(env.document.getElementById('sms-cookie-banner'));
  assert.ok(env.document.getElementById('smsCookieAccept'));
  assert.ok(env.document.getElementById('smsCookieReject'));
});

test('ACCEPT_ALL persists consent and initializes one loader and one config', () => {
  const env = createEnvironment();
  env.document.getElementById('smsCookieAccept').click();
  assert.equal(JSON.parse(env.storage.get(storageKey)).level, 'all');
  assert.equal(env.loaderCount(), 1);
  assert.equal(env.commands().filter(([name]) => name === 'js').length, 1);
  assert.equal(env.commands().filter(([name]) => name === 'config').length, 1);
  assert.equal(env.commands().find(([name]) => name === 'config')[1], 'G-YPRT7FFFV8');
});

test('ESSENTIALS_ONLY persists consent without creating GA state or loader', () => {
  const env = createEnvironment();
  env.document.getElementById('smsCookieReject').click();
  assert.equal(JSON.parse(env.storage.get(storageKey)).level, 'essential');
  assert.equal(env.loaderCount(), 0);
  assert.equal(env.commands().length, 0);
  assert.equal(env.window['ga-disable-G-YPRT7FFFV8'], true);
});

test('RELOAD_AFTER_ALL loads once while RELOAD_AFTER_REJECT stays at zero', () => {
  const accepted = createEnvironment({ storedValue: storedConsent('all') });
  const rejected = createEnvironment({ storedValue: storedConsent('essential') });
  assert.equal(accepted.loaderCount(), 1);
  assert.equal(accepted.commands().filter(([name]) => name === 'config').length, 1);
  assert.equal(rejected.loaderCount(), 0);
  assert.equal(rejected.commands().length, 0);
});

test('INVALID_STORED_STATE and unavailable storage fail closed', () => {
  for (const storedValue of ['not-json', storedConsent('bogus'), JSON.stringify({ version: '2', level: 'all' })]) {
    const env = createEnvironment({ storedValue });
    assert.equal(env.window.SMSConsent.getState(), 'unknown');
    assert.equal(env.loaderCount(), 0);
    assert.ok(env.document.getElementById('sms-cookie-banner'));
  }
  const unavailable = createEnvironment({ storageThrows: true });
  unavailable.document.getElementById('smsCookieAccept').click();
  assert.equal(unavailable.window.SMSConsent.getState(), 'unknown');
  assert.equal(unavailable.loaderCount(), 0);
});

test('REVOKE_ALL persists essential, blocks new events and keeps next load GA-free', () => {
  const env = createEnvironment({ storedValue: storedConsent('all') });
  env.window.SMSConsent.openPreferences();
  env.document.getElementById('smsCookieReject').click();
  const commandCountAfterRevoke = env.commands().length;
  assert.equal(JSON.parse(env.storage.get(storageKey)).level, 'essential');
  assert.equal(env.window['ga-disable-G-YPRT7FFFV8'], true);
  assert.equal(env.window.SMSConsent.track('event', 'after_revoke'), false);
  assert.equal(env.commands().length, commandCountAfterRevoke);
  const nextPage = createEnvironment({ storedValue: env.storage.get(storageKey) });
  assert.equal(nextPage.loaderCount(), 0);
  assert.equal(nextPage.commands().length, 0);
});

test('REACCEPT_AFTER_REVOKE_SAME_PAGE restores consent without a second bootstrap', () => {
  const env = createEnvironment({ storedValue: storedConsent('all') });
  assert.equal(env.loaderCount(), 1);
  assert.equal(env.commands().filter(([name]) => name === 'js').length, 1);
  assert.equal(env.commands().filter(([name]) => name === 'config').length, 1);

  env.window.SMSConsent.openPreferences();
  env.document.getElementById('smsCookieReject').click();
  assert.equal(env.window.SMSConsent.getState(), 'essential');
  assert.equal(env.window['ga-disable-G-YPRT7FFFV8'], true);
  assert.equal(env.window.SMSConsent.track('event', 'after_revoke'), false);

  env.window.SMSConsent.openPreferences();
  env.document.getElementById('smsCookieAccept').click();
  assert.equal(env.window.SMSConsent.getState(), 'all');
  assert.equal(env.window['ga-disable-G-YPRT7FFFV8'], false);
  assert.equal(env.loaderCount(), 1);
  assert.equal(env.commands().filter(([name]) => name === 'js').length, 1);
  assert.equal(env.commands().filter(([name]) => name === 'config').length, 1);

  const consentUpdates = env.commands().filter(([name, action]) => name === 'consent' && action === 'update');
  assert.equal(consentUpdates.map(([, , state]) => state.analytics_storage).join(','), 'denied,granted');
  assert.equal(env.window.SMSConsent.track('event', 'after_reaccept'), true);
  assert.equal(env.commands().filter(([name, eventName]) => name === 'event' && eventName === 'after_reaccept').length, 1);
});

test('FOCUS_RETURNS_TO_LIVE_PREFERENCES_CONTROL after revoke, reaccept and Escape', () => {
  const env = createEnvironment({ storedValue: storedConsent('all') });
  const originalOpener = env.document.getElementById('sms-cookie-preferences');
  assert.equal(originalOpener.isConnected, true);

  env.window.SMSConsent.openPreferences();
  assert.equal(originalOpener.isConnected, false);
  assert.ok(env.document.getElementById('sms-cookie-banner'));
  env.document.getElementById('smsCookieReject').click();

  const afterRevoke = env.document.getElementById('sms-cookie-preferences');
  assert.notEqual(afterRevoke, originalOpener);
  assert.equal(afterRevoke.isConnected, true);
  assert.equal(env.document.activeElement, afterRevoke);
  assert.notEqual(env.document.activeElement, originalOpener);
  assert.notEqual(env.document.activeElement, env.document.body);

  env.window.SMSConsent.openPreferences();
  assert.equal(afterRevoke.isConnected, false);
  env.document.getElementById('smsCookieAccept').click();

  const afterReaccept = env.document.getElementById('sms-cookie-preferences');
  assert.notEqual(afterReaccept, afterRevoke);
  assert.equal(afterReaccept.isConnected, true);
  assert.equal(env.document.activeElement, afterReaccept);
  assert.equal(env.window.SMSConsent.getState(), 'all');
  assert.equal(env.window['ga-disable-G-YPRT7FFFV8'], false);
  assert.equal(env.loaderCount(), 1);
  assert.equal(env.commands().filter(([name]) => name === 'config').length, 1);
  assert.equal(env.commands().filter(([name, action, state]) =>
    name === 'consent' && action === 'update' && state.analytics_storage === 'granted'
  ).length, 1);

  env.window.SMSConsent.openPreferences();
  const banner = env.document.getElementById('sms-cookie-banner');
  banner.dispatchEvent({ type: 'keydown', key: 'Escape', preventDefault() {} });

  const afterEscape = env.document.getElementById('sms-cookie-preferences');
  assert.notEqual(afterEscape, afterReaccept);
  assert.equal(afterEscape.isConnected, true);
  assert.equal(env.document.activeElement, afterEscape);
  assert.equal(env.window.SMSConsent.getState(), 'all');
});

test('failed durable write during revocation cannot resurrect a stale ALL decision', () => {
  const env = createEnvironment({ storedValue: storedConsent('all'), storageSetThrows: true });
  env.window.SMSConsent.openPreferences();
  env.document.getElementById('smsCookieReject').click();

  assert.equal(env.window.SMSConsent.getState(), 'essential');
  assert.equal(env.storage.has(storageKey), false);
  assert.equal(env.window['ga-disable-G-YPRT7FFFV8'], true);

  const nextPage = createEnvironment();
  assert.equal(nextPage.window.SMSConsent.getState(), 'unknown');
  assert.equal(nextPage.loaderCount(), 0);
});

test('cross-tab decisions reconcile an already open consent UI', () => {
  const env = createEnvironment();
  assert.ok(env.document.getElementById('sms-cookie-banner'));

  env.storage.set(storageKey, storedConsent('all'));
  env.dispatchStorage();
  assert.equal(env.window.SMSConsent.getState(), 'all');
  assert.equal(env.document.getElementById('sms-cookie-banner'), null);
  assert.ok(env.document.getElementById('sms-cookie-preferences'));
  assert.equal(env.loaderCount(), 1);
});

test('MULTIPLE_INITIALIZATION remains idempotent', () => {
  const env = createEnvironment({ storedValue: storedConsent('all') });
  env.window.SMSConsent.enableAnalytics();
  env.window.SMSConsent.enableAnalytics();
  assert.equal(env.loaderCount(), 1);
  assert.equal(env.commands().filter(([name]) => name === 'js').length, 1);
  assert.equal(env.commands().filter(([name]) => name === 'config').length, 1);
});

test('pages without explicit analytics opt-in never gain telemetry', () => {
  const env = createEnvironment({ storedValue: storedConsent('all'), analyticsEnabled: false });
  assert.equal(env.loaderCount(), 0);
  assert.equal(env.commands().length, 0);
});

test('HOME_USES_SHARED_CONSENT and required public pages share the same authority', () => {
  const requiredPages = [
    'index.html', 'mapa-turistico.html', 'sabores.html', 'onde-ficar.html',
    'eventos.html', 'noticias.html', 'local.html', 'privacidade.html',
  ];
  for (const page of requiredPages) {
    const html = readFileSync(join(root, page), 'utf8');
    assert.match(html, /<script src="js\/cookies\.js\?v=consent-first-20260913" data-enable-analytics><\/script>/, `${page} lacks shared consent`);
    assert.doesNotMatch(html, /googletagmanager\.com\/gtag\/js|gtag\s*\(\s*['"]config['"]/, `${page} has a pre-consent GA path`);
  }
});

test('the shared authority is the only runtime source allowed to load or configure GA', () => {
  assert.doesNotMatch(configSource, /googletagmanager\.com\/gtag\/js|gtag\s*\(\s*['"]config['"]/);
  assert.match(consentSource, /DEFAULT_GA4_ID = 'G-YPRT7FFFV8'/);
  const formerInlinePages = [
    'eventos.html', 'galeria.html', 'index.html', 'local.html', 'mapa-3d.html',
    'noticia.html', 'noticias.html', 'onde-ficar.html', 'para-o-trade.html',
    'privacidade.html', 'reservas.html', 'roteiro-ia.html', 'sabores.html', 'transparencia.html',
  ];
  for (const page of formerInlinePages) {
    const html = readFileSync(join(root, page), 'utf8');
    assert.doesNotMatch(html, /googletagmanager\.com\/gtag\/js|gtag\s*\(\s*['"]config['"]/, `${page} retains a direct GA sink`);
  }
});
