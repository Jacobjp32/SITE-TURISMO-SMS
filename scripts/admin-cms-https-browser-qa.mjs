// Focused browser regression against the existing local homologation server.
// Creates only uniquely named synthetic records; never clears a collection.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash, randomUUID } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const projectId = 'demo-turismo-sms-admin-finalization';
for (const [key, expected] of Object.entries({ GCLOUD_PROJECT: projectId, FIRESTORE_EMULATOR_HOST: '127.0.0.1:8080', FIREBASE_AUTH_EMULATOR_HOST: '127.0.0.1:9099', FIREBASE_STORAGE_EMULATOR_HOST: '127.0.0.1:9199' })) {
  if (process.env[key] !== expected) throw new Error('Local emulator guard: ' + key);
}
if (!process.env.PLAYWRIGHT_MODULE_PATH || !process.env.PLAYWRIGHT_CHROMIUM_PATH) throw new Error('Existing Playwright and Chrome paths required');
const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.resolve(process.env.QA_OUTPUT_DIR || path.join(root, 'docs/admin-moderation-2026-10-23/contact-scope-fix/evidence/cms-browser'));
const origin = 'http://127.0.0.1:4174';
const homolog = await (await fetch(origin + '/__homologation/status')).json();
assert.equal(homolog.projectId, projectId); assert.equal(homolog.state, 'ready');
const require = createRequire(import.meta.url), functions = createRequire(new URL('../functions/package.json', import.meta.url));
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH);
const { initializeApp, deleteApp } = functions('firebase-admin/app');
const { getFirestore, Timestamp } = functions('firebase-admin/firestore');
const { getAuth } = functions('firebase-admin/auth');
const app = initializeApp({ projectId }, 'cms-https-' + randomUUID());
const db = getFirestore(app), auth = getAuth(app);
const run = Date.now() + '-' + randomUUID().slice(0, 6), uid = 'https-qa-' + run;
const email = uid + '@example.invalid', password = 'Synthetic-HTTPS-QA-2026!';
const results = [], pageErrors = [], blockedRequests = [], statuses = [], consoleMessages = [];
const check = name => { results.push({ name, pass: true }); console.log('PASS: ' + name); };
const hash = data => createHash('sha256').update(JSON.stringify(data)).digest('hex');
async function protectedFixtureHashes() {
  return Object.fromEntries(await Promise.all(homolog.fixtureIds.map(async id => [id, hash((await db.collection('estabelecimentos_pendentes').doc(id).get()).data())])));
}
const before = await protectedFixtureHashes();
let browser, unwatch;
await mkdir(output, { recursive: true });
try {
  await auth.createUser({ uid, email, password, emailVerified: true });
  await db.collection('usuarios').doc(uid).create({ nome: 'HTTPS QA sintético', email, role: 'admin', ativo: true });
  browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, serviceWorkers: 'block' });
  await context.route('**/*', route => {
    const u = new URL(route.request().url());
    if (u.hostname === '127.0.0.1' && ['4174', '8080', '9099', '9199'].includes(u.port)) return route.continue();
    if (u.hostname === 'www.gstatic.com' && u.pathname.startsWith('/firebasejs/10.7.1/')) return route.continue();
    if (u.hostname === 'cdnjs.cloudflare.com' && u.pathname.startsWith('/ajax/libs/leaflet/1.9.4/')) return route.continue();
    if (u.hostname.endsWith('.tile.openstreetmap.org')) return route.continue();
    blockedRequests.push(u.origin + u.pathname); return route.abort();
  });
  const page = await context.newPage(); page.setDefaultTimeout(20000);
  page.on('pageerror', error => pageErrors.push(error.message));
  page.on('console', message => { if (['error', 'warning'].includes(message.type())) consoleMessages.push(message.text()); });
  await page.goto(origin + '/admin-firebase.html?emulator=1#empreendimentos', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.FirebaseSystem && window.firebaseAuth);
  await page.locator('#loginEmail').fill(email); await page.locator('#loginPass').fill(password);
  await page.locator('.login-form button[type=submit]').click();
  await page.waitForFunction(() => window.AdminContext?.currentUser?.role === 'admin');
  await page.locator('[data-section=empreendimentos]').click();
  await page.waitForFunction(() => window.AdminEstablishmentsModule && document.querySelector('#establishments-admin-editor'));
  const ids = { existing: 'https-draft-' + run, legacy: 'https-legacy-' + run, migration: 'https-migration-' + run };
  for (const [kind, id] of Object.entries(ids)) {
    const fixture = await page.evaluate(({ id, uid, kind }) => {
      const d = AdminEstablishmentsModule._defaultDoc(id, uid);
      d.name = 'HTTPS Sintético ' + id; d.content.summary = 'Resumo sintético para regressão.';
      d.location.address = 'Rua Sintética ' + id + ', 31'; d.createdAt = null; d.updatedAt = null;
      d.status = kind !== 'existing' ? 'published' : 'draft'; d.revision = 3;
      d.validatedGroups = Object.fromEntries(AdminEstablishmentsModule._GROUP_ORDER.map(g => [g, 2]));
      d.contact.website = kind !== 'existing' ? 'http://legacy.example' : 'https://existing.example';
      if (kind === 'migration') delete d.validatedGroups.contact;
      if (kind !== 'existing') { d.publishing.publishedAt = null; d.publishing.publishedBy = uid; }
      return d;
    }, { id, uid, kind });
    fixture.createdAt = fixture.updatedAt = Timestamp.fromMillis(1700000000000);
    if (kind !== 'existing') fixture.publishing.publishedAt = Timestamp.fromMillis(1700000000000);
    await db.collection('cms_establishments').doc(id).create(fixture);
  }
  await page.evaluate(() => AdminEstablishmentsModule.load(AdminContext));
  await page.waitForFunction(ids => ids.every(id => AdminEstablishmentsModule._state.items.some(d => d.id === id)), Object.values(ids));
  await page.evaluate(() => { const d = firebase.firestore(), run = d.runTransaction.bind(d); window.qaTransactions = 0; d.runTransaction = (...args) => { window.qaTransactions++; return run(...args); }; });
  async function open(id) {
    // Saving closes the form before the list refresh finishes. Wait for the
    // current server revision before starting the next independent scenario.
    if (id) await page.evaluate(() => AdminEstablishmentsModule.load(AdminContext));
    await page.evaluate(id => AdminEstablishmentsModule.openForm(id), id);
    await page.locator('#est_website').waitFor();
  }
  async function invalid() {
    const count = await page.evaluate(() => qaTransactions);
    await page.locator('#establishmentForm button[type=submit]').click();
    assert.equal(await page.evaluate(() => qaTransactions), count, 'HTTP blocked before a transaction');
    assert.equal(await page.locator('#est_website').getAttribute('aria-invalid'), 'true');
    assert.match(await page.locator('#est_website_hint').innerText(), /HTTPS/);
  }
  await open('');
  await page.locator('#est_name').fill('Novo HTTPS ' + run); await page.locator('#est_summary').fill('Resumo de teste');
  await page.locator('#est_website').fill('http://new.example'); await invalid();
  check('Novo empreendimento HTTP: erro específico antes de qualquer transação');
  await open(ids.existing); await page.locator('#est_website').fill('http://existing.example'); await invalid();
  assert.equal((await db.collection('cms_establishments').doc(ids.existing).get()).data().contact.website, 'https://existing.example');
  check('Edição de contato HTTP: nenhuma gravação e website anterior preservado');
  await open(ids.migration); await page.locator('#est_description').fill('Descrição que exigiria migração do contato.'); await invalid();
  assert.equal((await db.collection('cms_establishments').doc(ids.migration).get()).data().revision, 3);
  assert.match(await page.locator('.adm-toast--error').last().innerText(), /atualiza|migra/i);
  check('Migração que exige gravar contato HTTP: mensagem específica e nenhuma transação');
  const legacyRef = db.collection('cms_establishments').doc(ids.legacy);
  unwatch = legacyRef.onSnapshot(snap => { if (snap.exists) statuses.push(snap.data().status); });
  await open(ids.legacy); await page.locator('#est_description').fill('Descrição atualizada sem alterar contato legado.');
  await page.locator('#establishmentForm button[type=submit]').click();
  await page.waitForFunction(() => !document.querySelector('#establishmentForm'));
  const descriptionOnly = (await legacyRef.get()).data();
  assert.equal(descriptionOnly.content.description, 'Descrição atualizada sem alterar contato legado.');
  assert.equal(descriptionOnly.contact.website, 'http://legacy.example');
  assert.equal(descriptionOnly.status, 'published');
  check('Legado HTTP com somente descrição: salva conteúdo e preserva contato e publicação');
  await open(ids.legacy); await page.locator('#est_phone').fill('(42) 98888-1234'); await invalid();
  await page.locator('#est_website').scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(output, '01-legacy-http-error.png') });
  assert.equal((await legacyRef.get()).data().contact.website, 'http://legacy.example');
  check('Legado HTTP com alteração de telefone: bloqueado sem corrigir silenciosamente');
  await page.locator('#est_website_https').click();
  assert.equal(await page.locator('#est_website').inputValue(), 'https://legacy.example');
  assert.equal(await page.locator('#est_website').getAttribute('aria-invalid'), 'false');
  assert.equal((await legacyRef.get()).data().contact.website, 'http://legacy.example', 'Suggestion does not save');
  check('Sugestão HTTPS só altera o formulário mediante clique explícito');
  await page.locator('#establishmentForm button[type=submit]').click();
  for (let i = 0; i < 100; i++) { const d = (await legacyRef.get()).data(); if (d.contact.website === 'https://legacy.example' && d.contact.phone === '(42) 98888-1234') break; await new Promise(r => setTimeout(r, 100)); }
  const corrected = (await legacyRef.get()).data();
  assert.equal(corrected.contact.website, 'https://legacy.example'); assert.equal(corrected.contact.phone, '(42) 98888-1234');
  assert.equal(corrected.status, 'published'); assert.equal(corrected.publishing.publishedAt.toMillis(), 1700000000000);
  assert.ok(statuses.length > 0 && statuses.every(s => s === 'published'));
  check('Salvar correção HTTPS e telefone mantém publicado em todas as observações');
  await page.waitForFunction(() => !document.querySelector('#establishmentForm'));
  await open(ids.legacy); await page.locator('#est_website').fill('');
  assert.equal(await page.locator('#est_website').getAttribute('aria-invalid'), 'false');
  await page.locator('#establishmentForm button[type=submit]').click();
  for (let i = 0; i < 100 && (await legacyRef.get()).data().contact.website !== ''; i++) await new Promise(r => setTimeout(r, 100));
  assert.equal((await legacyRef.get()).data().contact.website, ''); assert.equal((await legacyRef.get()).data().status, 'published');
  check('Website vazio salva por ação explícita e permanece publicado');
  assert.deepEqual(await protectedFixtureHashes(), before);
  check('Três solicitações da homologação humana preservadas byte a byte');
  assert.deepEqual(pageErrors, []);
} catch (error) { results.push({ pass: false, error: error.stack }); process.exitCode = 1; console.error(error); }
finally {
  if (unwatch) unwatch();
  await writeFile(path.join(output, 'results.json'), JSON.stringify({ projectId, run, results, pageErrors, consoleMessages, blockedRequests, observedStatuses: statuses, humanFixturesBefore: before, humanFixturesAfter: await protectedFixtureHashes(), productionWrites: 0 }, null, 2));
  await browser?.close(); await deleteApp(app);
}
