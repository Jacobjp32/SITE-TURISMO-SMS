// Real browser + Firebase emulators. No production accounts or personal profiles.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const root = path.resolve(fileURLToPath(new URL('../', import.meta.url)));
const projectId = process.env.GCLOUD_PROJECT;
if (projectId !== 'demo-turismo-sms-admin-finalization' ||
    process.env.FIRESTORE_EMULATOR_HOST !== '127.0.0.1:8080' ||
    process.env.FIREBASE_AUTH_EMULATOR_HOST !== '127.0.0.1:9099' ||
    !process.env.FIREBASE_STORAGE_EMULATOR_HOST) throw new Error('Local demo emulators required.');
if (!process.env.PLAYWRIGHT_MODULE_PATH) throw new Error('Set PLAYWRIGHT_MODULE_PATH to an existing playwright package.');
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH);
const requireFunctions = createRequire(new URL('../functions/package.json', import.meta.url));
const { initializeApp, deleteApp } = requireFunctions('firebase-admin/app');
const { getAuth } = requireFunctions('firebase-admin/auth');
const { getFirestore } = requireFunctions('firebase-admin/firestore');
const { getStorage } = requireFunctions('firebase-admin/storage');
const app = initializeApp({ projectId, storageBucket: projectId + '.appspot.com' }, 'moderation-browser-qa');
const db = getFirestore(app), auth = getAuth(app), bucket = getStorage(app).bucket();
const uid = 'moderation-browser-admin', owner = 'moderation-browser-owner';
const email = 'moderation.qa@example.invalid', password = 'Local-Only-QA-2026!';
const accessDeniedOnly = process.argv.includes('--access-denied-only');
const output = process.env.QA_OUTPUT_DIR ? path.resolve(process.env.QA_OUTPUT_DIR) : path.join(root, 'docs/admin-moderation-2026-10-23/evidence');
await mkdir(output, { recursive: true });
const results = [], consoleMessages = [], blockedRequests = [], httpErrors = [];
let browser, server;
let rejectFirestoreCommits = false, rejectedCommitRequests = 0;
const sha = (buffer) => createHash('sha256').update(buffer).digest('hex');
const check = (name, detail = {}) => { results.push({ name, pass: true, ...detail }); console.log('PASS: ' + name); };
try {
  try { await auth.createUser({ uid, email, password, emailVerified: true }); }
  catch (e) { if (e.code !== 'auth/uid-already-exists') throw e; await auth.updateUser(uid, { email, password }); }
  await db.collection('usuarios').doc(uid).set({ nome: 'Administrador QA Local', email, role: 'admin', ativo: true });
  let original, bytes, images;
  if (!accessDeniedOnly) {
  bytes = await readFile(path.join(root, 'images/FOTO_GERAL_SAO_MATEUS_DO_SUL.jpg'));
  images = [];
  for (let i = 1; i <= 4; i++) {
    const storagePath = `submissions/establishments/${owner}/moderation-browser-hotel/${i}.jpg`;
    await bucket.file(storagePath).save(bytes, { metadata: { contentType: 'image/jpeg', metadata: { firebaseStorageDownloadTokens: 'synthetic-local-qa' } } });
    images.push({ path: storagePath, url: `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(storagePath)}?alt=media&token=synthetic-local-qa`, contentType: 'image/jpeg', size: bytes.length, name: i + '.jpg', caption: 'Foto sintética ' + i, credit: 'Acervo de teste', alt: 'Fotografia de teste ' + i });
  }
  original = { id: 'moderation-browser-hotel', nome: 'Hotel QA Sintético', name: 'Hotel QA Sintético', categoria: 'hospedagem', category: 'hospedagem', endereco: 'Rua de Teste, 911', address: 'Rua de Teste, 911', descricao: 'Descrição de teste com acentos.\nSegunda linha.', description: 'Descrição de teste com acentos.\nSegunda linha.', telefone: '(42) 99999-1234', phone: '(42) 99999-1234', website: 'hotel.example', site: 'hotel.example', instagram: '@hotel.qa', images, imageCount: 4, mainImage: images[0].url, submittedBy: owner, submittedByName: 'Solicitante sintético', submittedByEmail: 'owner@example.invalid', submittedAt: new Date(), status: 'pendente' };
  await db.collection('estabelecimentos_pendentes').doc(original.id).set(original);
  for (const [id, name] of [['moderation-browser-correction', 'Correção QA'], ['moderation-browser-reject', 'Rejeição QA']]) {
    await db.collection('estabelecimentos_pendentes').doc(id).set({ ...original, id, name, nome: name, address: 'Rua ' + name + ', 123', endereco: 'Rua ' + name + ', 123', phone: '(42) 97777-1111', telefone: '(42) 97777-1111', images: [], imageCount: 0, mainImage: '', website: '', site: '' });
  }
  }
  const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json' };
  server = createServer(async (req, res) => {
    try {
      const requestPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
      if (requestPath.split('/').some(p => p.startsWith('.') || /^(node_modules|functions)$/i.test(p))) throw new Error('Denied');
      const target = path.resolve(root, '.' + (requestPath === '/' ? '/index.html' : requestPath));
      if (!target.startsWith(root + path.sep)) throw new Error('Outside root');
      let content = await readFile(target);
      if (path.extname(target) === '.html') content = Buffer.from(content.toString('utf8').replace("connect-src 'self'", "connect-src 'self' http://127.0.0.1:8080 http://127.0.0.1:9099 http://127.0.0.1:9199"));
      res.writeHead(200, { 'Content-Type': types[path.extname(target)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); res.end(content);
    } catch (_) { res.writeHead(404); res.end('Not found'); }
  });
  await new Promise(resolve => server.listen(4173, '127.0.0.1', resolve));
  browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHROMIUM_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } : {}) });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, serviceWorkers: 'block' });
  // Keep production-shaped HTTPS Storage URLs while routing all object bytes to
  // the local emulator. This is a transport adapter, not a moderation/API mock.
  await context.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (['127.0.0.1', 'localhost'].includes(url.hostname)) {
      if (rejectFirestoreCommits && url.port === '8080' && /\/documents:commit$/.test(url.pathname)) { rejectedCommitRequests++; return route.abort('failed'); }
      return route.continue();
    }
    if (url.hostname === 'www.gstatic.com' && url.pathname.startsWith('/firebasejs/10.7.1/')) return route.continue();
    if (url.hostname === 'cdnjs.cloudflare.com' && url.pathname.startsWith('/ajax/libs/leaflet/1.9.4/')) return route.continue();
    if (url.hostname.endsWith('.tile.openstreetmap.org')) return route.continue();
    if (url.hostname === 'firebasestorage.googleapis.com') {
      const response = await route.fetch({ url: 'http://127.0.0.1:9199' + url.pathname + url.search });
      return route.fulfill({ response, headers: { ...response.headers(), 'access-control-allow-origin': '*' } });
    }
    blockedRequests.push(url.origin + url.pathname); return route.abort('blockedbyclient');
  });
  const page = await context.newPage();
  page.setDefaultTimeout(20000);
  page.on('pageerror', error => consoleMessages.push({ type: 'pageerror', message: error.message }));
  page.on('response', response => { if (response.status() >= 400) { const url = new URL(response.url()); httpErrors.push({ status: response.status(), origin: url.origin, path: url.pathname }); } });
  page.on('console', msg => { if (['error', 'warning'].includes(msg.type())) consoleMessages.push({ type: msg.type(), message: msg.text() }); });
  page.on('dialog', async dialog => { await dialog.accept(); });
  console.log('Opening local admin in isolated browser');
  await page.goto('http://127.0.0.1:4173/admin-firebase.html?emulator=1#aprovacoes', { waitUntil: 'domcontentloaded', timeout: 30000 });
  console.log('Local admin DOM loaded');
  await page.waitForFunction(() => window.FirebaseSystem && window.firebaseAuth, null, { timeout: 30000 });
  await page.locator('#loginEmail').fill(email);
  await page.locator('#loginPass').fill(password);
  await page.locator('.login-form button[type=submit]').click();
  await page.waitForFunction(() => window.AdminContext?.currentUser?.role === 'admin', null, { timeout: 30000 });
  await page.evaluate(() => {
    const prototype = Object.getPrototypeOf(firebase.storage().ref('qa'));
    const originalGetDownloadURL = prototype.getDownloadURL;
    prototype.getDownloadURL = async function () {
      const url = new URL(await originalGetDownloadURL.call(this));
      return 'https://firebasestorage.googleapis.com' + url.pathname + url.search;
    };
  });
  check('Login real com Auth Emulator e perfil admin no Firestore');
  if (!accessDeniedOnly) {
  await page.locator('[data-section=aprovacoes]').click();
  await page.locator('[data-admin-action=review-establishment][data-admin-target-id=moderation-browser-hotel]').click();
  await page.waitForFunction(() => document.querySelector('.submission-review')?.getAttribute('aria-busy') === 'false');
  const dialog = page.locator('.submission-review');
  assert.equal(await dialog.locator('[name=website]').inputValue(), 'hotel.example');
  await page.waitForFunction(() => document.querySelectorAll('.sr-media img').length === 4 && [...document.querySelectorAll('.sr-media img')].every(i => i.complete && i.naturalWidth > 0));
  assert.match(await dialog.locator('#sr-error-website').innerText(), /HTTPS/);
  await dialog.screenshot({ path: path.join(output, '01-invalid-website-desktop.png') });
  check('Ficha real apresenta erro por campo e quatro fotografias');
  await dialog.locator('[data-suggestion=website] button').click();
  await dialog.locator('[name=phone]').fill('(42) 98888-1234');
  await dialog.locator('[name=reviewNotes]').fill('URL e telefone conferidos no fixture sintético.');
  rejectFirestoreCommits = true;
  await dialog.locator('button[type=submit]').click();
  await page.waitForFunction(() => document.querySelector('.sr-status')?.classList.contains('sr-error'));
  assert.equal(await dialog.locator('[name=website]').inputValue(), 'https://hotel.example');
  assert.equal((await db.collection('estabelecimentos_pendentes').doc(original.id).get()).data().moderation, undefined);
  assert.ok(rejectedCommitRequests > 0);
  rejectFirestoreCommits = false;
  check('Falha de conexão ao salvar preserva os campos e não confirma escrita inexistente');
  await dialog.locator('button[type=submit]').click();
  await page.waitForFunction(() => document.querySelector('.sr-status')?.textContent.includes('Correções salvas'));
  let saved = (await db.collection('estabelecimentos_pendentes').doc(original.id).get()).data();
  assert.equal(saved.website, 'hotel.example'); assert.equal(saved.moderation.corrections.website, 'https://hotel.example'); assert.equal(saved.status, 'pendente');
  assert.deepEqual(saved.images, images);
  check('Salvar correções preserva original, imagens e estado pendente');
  await dialog.locator('[data-close]').click();
  await page.reload();
  await page.waitForFunction(() => window.AdminContext?.currentUser?.role === 'admin');
  // Restore the Storage transport adapter after reload.
  await page.evaluate(() => { const p = Object.getPrototypeOf(firebase.storage().ref('qa')); const f = p.getDownloadURL; p.getDownloadURL = async function () { const u = new URL(await f.call(this)); return 'https://firebasestorage.googleapis.com' + u.pathname + u.search; }; });
  await page.locator('[data-section=aprovacoes]').click();
  await page.locator('[data-admin-target-id=moderation-browser-hotel][data-admin-action=review-establishment]').click();
  await page.waitForFunction(() => document.querySelector('.submission-review')?.getAttribute('aria-busy') === 'false');
  assert.equal(await dialog.locator('[name=website]').inputValue(), 'https://hotel.example');
  check('Recarregar página preserva correção confirmada e sessão local');
  await dialog.locator('[data-action=preview]').click();
  assert.match(await dialog.locator('.sr-preview').innerText(), /https:\/\/hotel.example/);
  await page.setViewportSize({ width: 390, height: 844 });
  await dialog.screenshot({ path: path.join(output, '02-preview-mobile.png') });
  assert.ok(await dialog.evaluate(el => el.scrollWidth <= el.clientWidth + 2));
  check('Prévia e formulário móvel sem transbordamento horizontal');
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.evaluate(() => {
    const prototype = Object.getPrototypeOf(firebase.storage().ref('qa'));
    const originalPut = prototype.put;
    let copies = 0;
    prototype.put = function (...args) {
      if (this.fullPath.startsWith('approved-media/cms-establishments/hotel-qa-sintetico/') && ++copies === 2) {
        prototype.put = originalPut;
        const error = new Error('Falha de upload injetada exclusivamente no QA local.');
        error.code = 'storage/retry-limit-exceeded'; return Promise.reject(error);
      }
      return originalPut.apply(this, args);
    };
  });
  await dialog.locator('[data-action=approve]').click();
  await page.waitForFunction(() => document.querySelector('.sr-status')?.classList.contains('sr-error') && document.querySelector('.submission-review')?.getAttribute('aria-busy') === 'false');
  saved = (await db.collection('estabelecimentos_pendentes').doc(original.id).get()).data();
  assert.equal(saved.status, 'pendente'); assert.equal(saved.cmsImportState, 'media_preparing');
  assert.equal(await dialog.locator('[name=website]').getAttribute('readonly'), '');
  assert.equal(await dialog.locator('button[type=submit]').isDisabled(), true);
  assert.match(await dialog.locator('[data-action=approve]').innerText(), /Retomar/);
  await dialog.screenshot({ path: path.join(output, '03-interrupted-import.png') });
  check('Falha no segundo upload mantém rascunho privado e oferece retomada com edição bloqueada', { faultInjection: 'Storage.put rejected once; remaining pipeline and Rules real' });
  await dialog.locator('[data-close]').click();
  await page.locator('[data-admin-target-id=moderation-browser-hotel][data-admin-action=review-establishment]').click();
  await page.waitForFunction(() => document.querySelector('.submission-review')?.getAttribute('aria-busy') === 'false');
  assert.match(await dialog.locator('[data-action=approve]').innerText(), /Retomar/);
  await dialog.locator('[data-action=approve]').click();
  await page.waitForFunction(() => !document.querySelector('.submission-review') || document.querySelector('.sr-status.sr-error'), null, { timeout: 60000 });
  if (await dialog.count()) throw new Error(await dialog.locator('.sr-status').textContent());
  await page.waitForFunction(() => document.querySelector('#section-empreendimentos')?.classList.contains('active'));
  await page.waitForFunction(() => document.querySelector('[data-nav-badge=aprovacoes]')?.textContent === '2');
  const cms = (await db.collection('cms_establishments').doc('hotel-qa-sintetico').get()).data();
  assert.ok(cms); assert.equal(cms.status, 'draft'); assert.equal(cms.media.gallery.length, 4);
  assert.equal(cms.contact.website, 'https://hotel.example'); assert.equal(cms.contact.phone, '(42) 98888-1234');
  assert.deepEqual(cms.media.gallery.map(i => i.caption), images.map(i => i.caption));
  for (const image of images) assert.equal(sha((await bucket.file(image.path).download())[0]), sha(bytes));
  await page.screenshot({ path: path.join(output, '03-private-draft.png'), fullPage: false });
  check('Aprovar pela interface abre rascunho privado com quatro imagens em ordem; originais íntegros');
  const repeat = await page.evaluate(() => FirebaseSystem.approveEstablishment('moderation-browser-hotel'));
  assert.equal(repeat.success, true); assert.equal(repeat.cmsEstablishmentId, 'hotel-qa-sintetico');
  assert.equal((await db.collection('cms_establishments').get()).size, 1);
  check('Repetição confirma mesmo rascunho sem duplicar empreendimento');
  assert.equal((await db.collection('estabelecimentos_pendentes').doc(original.id).collection('history').get()).size, 2);
  const anonymousRead = await fetch(`http://127.0.0.1:8080/v1/projects/${projectId}/databases/(default)/documents/cms_establishments/hotel-qa-sintetico`);
  assert.equal(anonymousRead.status, 403);
  check('Rules negam leitura anônima do rascunho');
  for (const [id, action, expected] of [['moderation-browser-correction', 'correcao_solicitada', 'correcao_solicitada'], ['moderation-browser-reject', 'rejeitado', 'rejeitado']]) {
    await page.locator('[data-section=aprovacoes]').click();
    await page.locator(`[data-admin-target-id=${id}][data-admin-action=review-establishment]`).click();
    await page.waitForFunction(() => document.querySelector('.submission-review')?.getAttribute('aria-busy') === 'false');
    await dialog.locator('[name=reviewNotes]').fill('Solicitação registrada pela equipe de QA local.');
    await dialog.locator(`[data-action=${action}]`).click();
    await page.waitForFunction(() => document.querySelector('.sr-status')?.textContent.includes('Situação atualizada'));
    assert.equal((await db.collection('estabelecimentos_pendentes').doc(id).get()).data().status, expected);
    assert.equal((await db.collection('estabelecimentos_pendentes').doc(id).collection('history').get()).size, 1);
    await dialog.locator('[data-close]').click();
    check('Decisão pela interface: ' + expected + ' com justificativa e histórico');
  }
  const queue = await page.evaluate(async () => ({ pending: await FirebaseSystem.getPendingEstablishmentsReport(), history: await FirebaseSystem.getPendingEstablishmentsReport(true) }));
  assert.equal(queue.pending.items.length, 0); assert.equal(queue.history.items.length, 3);
  await db.collection('establishment_update_requests').doc('qa-waiting-owner').set({ status: 'changes_requested' });
  await page.evaluate(() => AdminDashboardModule.load(AdminContext));
  assert.equal(await page.locator('[data-nav-badge=aprovacoes]').first().isVisible(), false);
  check('Painel distingue fila ativa de histórico e correções aguardando solicitante');
  for (const section of ['home', 'aprovacoes', 'vinculos', 'gerenciar-vinculos', 'usuarios', 'empreendimentos', 'eventos', 'noticias', 'rotas', 'midia', 'galeria', 'banners', 'sazonal', 'mascote', 'audit-logs']) {
    await page.locator(`[data-section="${section}"]`).click();
    await page.locator('#section-' + section + '.active').waitFor();
    check('Navegação real do módulo ' + section, { evidence: 'abertura local; CRUD completo não inferido' });
  }
  await page.screenshot({ path: path.join(output, '04-modules-desktop.png') });
  }
  const moderatorUid = 'moderation-browser-moderator', moderatorEmail = 'moderator.qa@example.invalid';
  try { await auth.createUser({ uid: moderatorUid, email: moderatorEmail, password, emailVerified: true }); }
  catch (e) { if (e.code !== 'auth/uid-already-exists') throw e; await auth.updateUser(moderatorUid, { email: moderatorEmail, password }); }
  await db.collection('usuarios').doc(moderatorUid).set({ nome: 'Moderador QA Local', email: moderatorEmail, role: 'moderator', ativo: true });
  const moderatorRequestId = 'moderation-browser-moderator-rejection';
  if (!accessDeniedOnly) await db.collection('estabelecimentos_pendentes').doc(moderatorRequestId).set({ ...original, id: moderatorRequestId, name: 'Moderador QA', nome: 'Moderador QA', images: [], imageCount: 0, mainImage: '' });
  const notificationCounts = await page.evaluate(() => {
    const before = document.querySelectorAll('.adm-toast--success').length;
    FirebaseSystem.showNotification('Cadastro já aprovado: o rascunho CMS existente foi confirmado.', 'success');
    return { before, after: document.querySelectorAll('.adm-toast--success').length };
  });
  assert.equal(notificationCounts.after, notificationCounts.before + 1);
  await page.evaluate(() => firebase.auth().signOut());
  await page.waitForFunction(() => !window.currentUser && document.querySelector('#loginScreen')?.style.display === 'flex');
  assert.equal(await page.locator('.adm-toast').count(), 0);
  check('Saída da sessão remove o aviso de sucesso da operação anterior');
  await page.locator('#loginEmail').fill(moderatorEmail); await page.locator('#loginPass').fill(password);
  await page.locator('.login-form button[type=submit]').click();
  await page.waitForFunction(() => document.querySelector('#loginFeedback')?.textContent.includes('não possui permissão administrativa ativa'));
  if (!accessDeniedOnly) assert.equal((await db.collection('estabelecimentos_pendentes').doc(moderatorRequestId).get()).data().status, 'pendente');
  assert.equal(await page.locator('.adm-toast--success').count(), 0);
  assert.equal(await page.locator('#dashboard.active').count(), 0);
  await page.screenshot({ path: path.join(output, '05-moderator-admin-denied.png') });
  check('Painel principal continua restrito a admin ativo; login de moderador é negado sem mutação');
  check('Acesso negado mantém somente o erro da autenticação, sem sucesso residual');
  assert.equal(consoleMessages.filter(m => m.type === 'pageerror').length, 0, JSON.stringify(consoleMessages));
  assert.equal(blockedRequests.filter(u => /firestore.googleapis.com|identitytoolkit.googleapis.com|securetoken.googleapis.com/.test(u)).length, 0);
} catch (error) {
  results.push({ name: 'Browser flow', pass: false, error: error.stack });
  if (browser) { const pages = browser.contexts().flatMap(c => c.pages()); if (pages[0]) { await pages[0].screenshot({ path: path.join(output, 'failure.png') }).catch(() => {}); console.error('UI state:', await pages[0].locator('.sr-status').textContent().catch(() => 'Unavailable')); } }
  process.exitCode = 1; console.error(error);
} finally {
  await writeFile(path.join(output, 'browser-results.json'), JSON.stringify({ projectId, mode: accessDeniedOnly ? 'access-denied-only' : 'full', productionWrites: 0, results, consoleMessages, httpErrors, blockedRequests, rejectedCommitRequests, faultInjection: accessDeniedOnly ? [] : ['Firestore commit requests aborted during one save attempt', 'Storage.put rejected once for interrupted import'], localCspAdapter: 'Only test server adds 127.0.0.1 emulator ports to connect-src; repository CSP unchanged', storageTransportAdapter: 'HTTPS Firebase URLs routed to local emulator; moderation, Auth, Firestore, Rules and normal Storage operations real' }, null, 2));
  if (browser) await browser.close();
  if (server) await new Promise(resolve => server.close(resolve));
  await deleteApp(app);
}
