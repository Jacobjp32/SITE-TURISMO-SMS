// Regressão: o rótulo de /local?id=... vem do query string e nunca pode virar HTML.
// Executa js/breadcrumbs.js em um DOM mínimo e registra toda escrita em innerHTML/textContent.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import vm from 'node:vm';

const source = readFileSync(join(process.cwd(), 'js', 'breadcrumbs.js'), 'utf8');

function makeElement(tag, log) {
  const el = {
    tagName: String(tag).toUpperCase(),
    children: [],
    attributes: {},
    parentNode: null,
    _innerHTML: '',
    _textContent: '',
    _query: {},
    setAttribute(name, value) { this.attributes[name] = String(value); },
    appendChild(child) { child.parentNode = this; this.children.push(child); return child; },
    insertBefore(child) { child.parentNode = this; this.children.push(child); return child; },
    querySelector(selector) {
      if (!this._query[selector]) this._query[selector] = makeElement('span', log);
      return this._query[selector];
    },
    get innerHTML() { return this._innerHTML; },
    set innerHTML(value) { this._innerHTML = String(value); log.html.push(String(value)); },
    get textContent() { return this._textContent; },
    set textContent(value) { this._textContent = String(value); log.text.push(String(value)); },
  };
  return el;
}

function runBreadcrumbs({ search, label }) {
  const log = { html: [], text: [] };
  const body = makeElement('body', log);
  const head = makeElement('head', log);
  const header = makeElement('header', log);
  header.parentNode = body;
  header.nextSibling = null;
  const document = {
    readyState: 'complete',
    body,
    head,
    createElement: (tag) => makeElement(tag, log),
    getElementById: (id) => (id === 'sms-global-header' ? header : null),
    addEventListener() {},
  };
  const window = {
    location: { pathname: '/local', search },
    SMS_BREADCRUMB_LABEL: label,
  };
  const context = {
    window,
    document,
    localStorage: { getItem: () => 'pt' },
    URLSearchParams,
    JSON,
    String,
  };
  vm.runInNewContext(source, context);
  return log;
}

const PAYLOADS = [
  '<img src=x onerror=alert(1)>',
  '"><script>alert(document.cookie)</script>',
  '<svg/onload=alert(1)>',
];

for (const payload of PAYLOADS) {
  test(`breadcrumb trata id codificado como texto: ${payload}`, () => {
    const search = '?id=' + encodeURIComponent(payload);
    const log = runBreadcrumbs({ search });
    const allHtml = log.html.join('\n').toLowerCase();
    assert.ok(!allHtml.includes('<img'), 'payload não pode aparecer em innerHTML');
    assert.ok(!allHtml.includes('<script'), 'payload não pode aparecer em innerHTML');
    assert.ok(!allHtml.includes('<svg'), 'payload não pode aparecer em innerHTML');
    assert.ok(!/onerror|onload/i.test(allHtml), 'atributos de evento não podem ser injetados');
    assert.ok(log.text.some((value) => value.toLowerCase().includes(payload.slice(1, 6).toLowerCase())),
      'o conteúdo do id é exibido apenas como texto');
  });
}

test('rótulo oficial definido por local.html também é aplicado apenas como texto', () => {
  const label = '<b>Casa da Memória</b>';
  const log = runBreadcrumbs({ search: '?id=casa-da-memoria', label });
  assert.ok(!log.html.join('\n').includes('<b>'));
  assert.ok(log.text.includes(label));
});
