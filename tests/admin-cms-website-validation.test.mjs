import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../js/admin/modules/empreendimentos.js', import.meta.url), 'utf8');
const moderation = await readFile(new URL('../js/establishment-moderation.js', import.meta.url), 'utf8');
function load(shared = false, elements = {}, overrides = {}) {
  const messages = [];
  const sandbox = { URL, console, document: { getElementById: id => elements[id] || null }, window: {
    AdminUI: { showToast: (message, type) => messages.push({ message, type }) },
    AdminContext: { db: {}, storage: {}, currentUser: { uid: 'synthetic-admin' } },
  } };
  Object.assign(sandbox.window, overrides);
  if (shared) { vm.runInNewContext(moderation, sandbox); sandbox.window.EstablishmentModeration = sandbox.EstablishmentModeration; }
  vm.runInNewContext(source, sandbox);
  return { module: sandbox.window.AdminEstablishmentsModule, messages };
}
function fixture(module, website = '', status = 'draft') {
  const doc = module._defaultDoc('website-synthetic');
  Object.assign(doc, { id: 'website-synthetic', slug: 'website-synthetic', name: 'Hotel Sintético', categoryId: 'hospedagem', categoryLabel: 'Hospedagem', status });
  doc.content.summary = 'Resumo sintético';
  doc.contact.website = website;
  doc.contact.phone = '(42) 3000-1234';
  doc.location.address = 'Rua Sintética, 1';
  return doc;
}
function validatedFixture(module, website = 'http://hotel.example') {
  const doc = fixture(module, website, 'published');
  doc.validatedGroups = Object.fromEntries(Array.from(module._GROUP_ORDER, group => [group, 2]));
  return doc;
}
for (const shared of [false, true]) {
  const suffix = shared ? 'validador compartilhado' : 'módulo autônomo';
  test(`novo empreendimento HTTP bloqueado antes da escrita (${suffix})`, () => {
    const { module } = load(shared);
    assert.match(module._validateDocForSave(fixture(module, 'http://hotel.example')), /Site.*HTTPS/);
  });
  test(`legado HTTP com alteração de telefone exige correção ou remoção explícita (${suffix})`, () => {
    const { module } = load(shared);
    const doc = fixture(module, 'http://hotel.example', 'published');
    doc.contact.phone = '(42) 3000-9999';
    assert.match(module._validateDocForSave(doc), /Site.*HTTPS/);
    assert.equal(doc.contact.website, 'http://hotel.example');
    assert.equal(doc.status, 'published');
    doc.contact.website = 'https://hotel.example';
    assert.equal(module._validateDocForSave(doc), '');
    assert.equal(doc.status, 'published');
    doc.contact.website = '';
    assert.equal(module._validateDocForSave(doc), '');
  });
  test(`contato existente aceita HTTPS e website vazio (${suffix})`, () => {
    const { module } = load(shared);
    for (const website of ['https://hotel.example/contato?q=1', '']) {
      assert.equal(module._validateDocForSave(fixture(module, website)), '');
    }
  });
  test(`sintaxe incompatível com Rules é bloqueada (${suffix})`, () => {
    const { module } = load(shared);
    for (const website of ['ftp://hotel.example', 'https://hotel.example:65536', 'https://user:password@hotel.example', 'https://hotel.example/<script>', 'https://hotel.example/' + 'x'.repeat(240)]) {
      assert.match(module._validateDocForSave(fixture(module, website)), /Site.*HTTPS/);
    }
  });
  test(`descrição permite HTTP legado absolutamente inalterado sem escrever contato (${suffix})`, () => {
    const { module } = load(shared);
    const base = validatedFixture(module), desired = structuredClone(base);
    desired.content.description = 'Descrição atualizada';
    assert.deepEqual(Array.from(module._groupsToWrite(base, desired)), ['content']);
    assert.equal(module._validateDocForSave(desired, base), '');
    assert.equal(desired.contact.website, 'http://hotel.example');
    assert.equal(desired.status, 'published');
  });
  test(`telefone modificado inclui contato e bloqueia HTTP até corrigir ou limpar (${suffix})`, () => {
    const { module } = load(shared);
    const base = validatedFixture(module), desired = structuredClone(base);
    desired.contact.phone = '(42) 3000-9999';
    assert.ok(module._groupsToWrite(base, desired).includes('contact'));
    assert.match(module._validateDocForSave(desired, base), /Site.*HTTPS/);
    desired.contact.website = 'https://hotel.example';
    assert.equal(module._validateDocForSave(desired, base), '');
    desired.contact.website = '';
    assert.equal(module._validateDocForSave(desired, base), '');
  });
  test(`migração que inclui contato exige correção com mensagem específica (${suffix})`, () => {
    const { module } = load(shared);
    const base = validatedFixture(module);
    delete base.validatedGroups.contact;
    const desired = structuredClone(base);
    desired.content.description = 'Descrição atualizada';
    assert.ok(module._groupsToWrite(base, desired).includes('contact'));
    assert.match(module._validateDocForSave(desired, base), /migra.*contato.*HTTPS/i);
  });
}
test('sugestão HTTPS depende de clique explícito e não grava nem troca a situação', () => {
  const input = { value: 'http://hotel.example/contato', setAttribute() {}, focus() {} };
  const hint = { textContent: '' }, button = { hidden: true, textContent: '' };
  const { module, messages } = load(false, { est_website: input, est_website_hint: hint, est_website_https: button });
  module.onWebsiteChange();
  assert.equal(input.value, 'http://hotel.example/contato');
  assert.match(hint.textContent, /HTTPS/);
  assert.equal(button.hidden, false);
  assert.equal(module.applyWebsiteHttps(), false);
  assert.equal(input.value, 'https://hotel.example/contato');
  assert.equal(button.hidden, true);
  assert.match(messages.at(-1).message, /salv/);
});

function formElements(doc, editing = true) {
  const values = { est_form_editingId: editing ? doc.id : '', est_slug: doc.slug, est_name: doc.name, est_categoryId: doc.categoryId };
  for (const [group, fields] of Object.entries({ content: ['summary', 'description', 'longDescription', 'accessibility', 'openingHours', 'notesInternal'], contact: ['phone', 'whatsapp', 'email', 'website', 'instagram', 'facebook'] })) {
    for (const field of fields) values['est_' + field] = doc[group][field];
  }
  values.est_tags = doc.content.tags.join(',');
  values.est_address = doc.location.address;
  return Object.fromEntries(Object.entries(values).map(([id, value]) => [id, { value }]));
}

for (const mode of ['new', 'phone', 'migration', 'server-migration']) {
  test(`formulário ${mode}: bloqueio preventivo sem reserva, upload ou transação parcial`, async () => {
    const initial = load().module;
    const base = validatedFixture(initial);
    if (mode === 'migration') delete base.validatedGroups.contact;
    const desired = structuredClone(base);
    desired.content.description = 'Descrição nova';
    if (mode === 'phone') desired.contact.phone = '(42) 3000-9999';
    const server = structuredClone(base);
    if (mode === 'server-migration') delete server.validatedGroups.contact;
    const effects = { transactions: 0, uploads: 0, reservations: 0, reads: 0 };
    const { module, messages } = load(false, formElements(desired, mode !== 'new'), {
      AdminContext: {
        db: {
          collection(name) {
            if (name !== 'cms_establishments') effects.reservations++;
            return {
              get: async () => ({ docs: [] }),
              doc: id => ({ id, get: async () => { effects.reads++; return { exists: true, id, data: () => server }; } }),
            };
          },
          runTransaction: async () => { effects.transactions++; throw Error('transação não esperada'); },
        },
        storage: { ref() { effects.uploads++; throw Error('upload não esperado'); } },
        currentUser: { uid: 'synthetic-admin' },
      },
      EstablishmentSubmissionBridge: { makeCanonicalSlug: value => value, classifyDuplicate: () => ({ kind: 'NO_MATCH' }) },
    });
    if (mode !== 'new') {
      module._state.items = [base];
      module._state.editingBase = base;
    }
    module.submitForm({ preventDefault() {} });
    await new Promise(resolve => setImmediate(resolve));
    assert.match(messages.at(-1)?.message || '', mode.includes('migration') ? /migra.*contato.*HTTPS/i : /Site.*HTTPS/);
    assert.equal(effects.transactions, 0);
    assert.equal(effects.uploads, 0);
    assert.equal(effects.reservations, 0);
    assert.equal(effects.reads, mode === 'server-migration' ? 1 : 0);
    assert.equal(base.contact.website, 'http://hotel.example');
    assert.equal(base.status, 'published');
  });
}
