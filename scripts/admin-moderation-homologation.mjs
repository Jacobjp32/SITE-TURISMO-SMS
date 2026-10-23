// Persistent, synthetic-only local review. Never starts or stops emulators.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';

const args = new Set(process.argv.slice(2));
const allowedArgs = new Set(['--local-demo', '--seed-synthetic', '--headless', '--smoke']);
if ([...args].some(arg => !allowedArgs.has(arg)) || !args.has('--local-demo') || !args.has('--seed-synthetic')) {
  throw new Error('Required: --local-demo --seed-synthetic. Optional: --headless --smoke.');
}
const projectId = 'demo-turismo-sms-admin-finalization';
for (const [key, expected] of Object.entries({ GCLOUD_PROJECT: projectId, FIRESTORE_EMULATOR_HOST: '127.0.0.1:8080', FIREBASE_AUTH_EMULATOR_HOST: '127.0.0.1:9099', FIREBASE_STORAGE_EMULATOR_HOST: '127.0.0.1:9199' })) {
  if (process.env[key] !== expected) throw new Error(`Local isolation guard: ${key} must equal ${expected}`);
}
if (!process.env.PLAYWRIGHT_MODULE_PATH || !process.env.PLAYWRIGHT_CHROMIUM_PATH) throw new Error('Set existing PLAYWRIGHT_MODULE_PATH and PLAYWRIGHT_CHROMIUM_PATH.');
// Check all three local services before creating anything. No cloud fallback.
for (const port of [8080, 9099, 9199]) {
  await fetch(`http://127.0.0.1:${port}/`, { signal: AbortSignal.timeout(5000) });
}
const root = path.resolve(fileURLToPath(new URL('../', import.meta.url)));
const runId = new Date().toISOString().replace(/\D/g, '').slice(0, 14) + '-' + randomUUID().slice(0, 8);
const output = path.join(root, '.codex/homologation', runId);
const uid = 'homolog-admin-' + runId;
const owner = 'homolog-owner-' + runId;
const email = `homolog.${runId}@example.invalid`;
const password = 'Local-Only-Homolog-2026!';
const accounts = {
  admin: { uid, email, password, role: 'admin' },
  moderator: { uid: 'homolog-moderator-' + runId, email: `moderator.${runId}@example.invalid`, password, role: 'moderator' },
  owner: { uid: owner, email: `owner.${runId}@example.invalid`, password, role: 'user' }
};
const fixtureIds = ['hotel', 'correction', 'reject'].map(kind => `homolog-${kind}-${runId}`);
const baseUrl = 'http://127.0.0.1:4174';
const url = baseUrl + '/admin-firebase.html?emulator=1#aprovacoes';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH);
const requireFunctions = createRequire(new URL('../functions/package.json', import.meta.url));
const { initializeApp, deleteApp } = requireFunctions('firebase-admin/app');
const { getAuth } = requireFunctions('firebase-admin/auth');
const { getFirestore } = requireFunctions('firebase-admin/firestore');
const { getStorage } = requireFunctions('firebase-admin/storage');
let app, browser, server, closing = false;
const blockedRequests = [], pageErrors = [];
let status = { runId, projectId, pid: process.pid, state: 'starting', url, fixtureIds, accounts, productionWrites: 0, blockedRequests, pageErrors };
const saveStatus = async () => writeFile(path.join(output, 'status.json'), JSON.stringify(status, null, 2));
async function close(reason) {
  if (closing) return;
  closing = true;
  status.state = 'stopped'; status.stopReason = reason; status.stoppedAt = new Date().toISOString();
  await saveStatus().catch(() => {});
  await browser?.close().catch(() => {});
  if (server) await new Promise(resolve => server.close(resolve));
  if (app) await deleteApp(app);
}
await mkdir(output, { recursive: true });
try {
  const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json' };
  server = createServer(async (req, res) => {
    try {
      const requestPath = decodeURIComponent(new URL(req.url, baseUrl).pathname);
      if (requestPath === '/__homologation/status') {
        res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
        return res.end(JSON.stringify({ runId, projectId, state: status.state, fixtureIds, productionWrites: 0 }));
      }
      if (req.method !== 'GET' && req.method !== 'HEAD') throw new Error('Read only server');
      if (requestPath.split('/').some(part => part.startsWith('.') || /^(node_modules|functions)$/i.test(part))) throw new Error('Denied');
      const target = path.resolve(root, '.' + (requestPath === '/' ? '/admin-firebase.html' : requestPath));
      if (!target.startsWith(root + path.sep)) throw new Error('Outside root');
      let content = await readFile(target);
      if (path.extname(target) === '.html') content = Buffer.from(content.toString('utf8').replace("connect-src 'self'", "connect-src 'self' http://127.0.0.1:8080 http://127.0.0.1:9099 http://127.0.0.1:9199"));
      res.writeHead(200, { 'Content-Type': types[path.extname(target)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      res.end(req.method === 'HEAD' ? undefined : content);
    } catch { res.writeHead(404); res.end('Not found'); }
  });
  // Bind before seed; an occupied port fails without changing existing fixtures.
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(4174, '127.0.0.1', resolve); });
  app = initializeApp({ projectId, storageBucket: projectId + '.appspot.com' }, 'homolog-' + runId);
  const db = getFirestore(app), auth = getAuth(app), bucket = getStorage(app).bucket();
  for (const [kind, account] of Object.entries(accounts)) {
    await auth.createUser({ uid: account.uid, email: account.email, password: account.password, emailVerified: true });
    await db.collection('usuarios').doc(account.uid).create({ nome: 'Homologação Sintética: ' + kind, email: account.email, role: account.role, ativo: true });
  }
  const bytes = await readFile(path.join(root, 'images/FOTO_GERAL_SAO_MATEUS_DO_SUL.jpg'));
  const images = [];
  for (let i = 1; i <= 4; i++) {
    const storagePath = `submissions/establishments/${owner}/${fixtureIds[0]}/${i}.jpg`;
    await bucket.file(storagePath).save(bytes, { metadata: { contentType: 'image/jpeg', metadata: { firebaseStorageDownloadTokens: 'synthetic-homolog-' + runId } } });
    images.push({ path: storagePath, url: `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(storagePath)}?alt=media&token=synthetic-homolog-${runId}`, contentType: 'image/jpeg', size: bytes.length, name: `${i}.jpg`, caption: 'Foto sintética ' + i, credit: 'Acervo de teste', alt: 'Fotografia de teste ' + i });
  }
  const original = { nome: 'Hotel Homolog ' + runId, name: 'Hotel Homolog ' + runId, categoria: 'hospedagem', category: 'hospedagem', endereco: 'Rua Sintética, 911', address: 'Rua Sintética, 911', descricao: 'Solicitação sintética para homologação local.\nSegunda linha.', description: 'Solicitação sintética para homologação local.\nSegunda linha.', telefone: '(42) 99999-1234', phone: '(42) 99999-1234', website: 'hotel.example', site: 'hotel.example', instagram: '@hotel.homolog', images, imageCount: 4, mainImage: images[0].url, submittedBy: owner, submittedByName: 'Solicitante sintético', submittedByEmail: accounts.owner.email, submittedAt: new Date(), status: 'pendente' };
  await db.collection('estabelecimentos_pendentes').doc(fixtureIds[0]).create({ ...original, id: fixtureIds[0] });
  for (const [i, name] of [[1, 'Correção Homolog '], [2, 'Rejeição Homolog ']]) {
    await db.collection('estabelecimentos_pendentes').doc(fixtureIds[i]).create({ ...original, id: fixtureIds[i], nome: name + runId, name: name + runId, website: '', site: '', images: [], imageCount: 0, mainImage: '' });
  }
  browser = await chromium.launch({ headless: args.has('--headless') || args.has('--smoke'), executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, serviceWorkers: 'block' });
  await context.route('**/*', async route => {
    const requestUrl = new URL(route.request().url());
    if (requestUrl.hostname === '127.0.0.1' && ['4174', '8080', '9099', '9199'].includes(requestUrl.port)) return route.continue();
    if (requestUrl.hostname === 'www.gstatic.com' && requestUrl.pathname.startsWith('/firebasejs/10.7.1/')) return route.continue();
    if (requestUrl.hostname === 'cdnjs.cloudflare.com' && requestUrl.pathname.startsWith('/ajax/libs/leaflet/1.9.4/')) return route.continue();
    if (requestUrl.hostname.endsWith('.tile.openstreetmap.org')) return route.continue();
    if (requestUrl.hostname === 'firebasestorage.googleapis.com' && requestUrl.pathname.startsWith(`/v0/b/${projectId}.appspot.com/o/`)) {
      const response = await route.fetch({ url: 'http://127.0.0.1:9199' + requestUrl.pathname + requestUrl.search });
      return route.fulfill({ response, headers: { ...response.headers(), 'access-control-allow-origin': '*' } });
    }
    blockedRequests.push(requestUrl.origin + requestUrl.pathname);
    return route.abort('blockedbyclient');
  });
  // Reinstall on each navigation. Preserve HTTPS publication contracts while all
  // Storage bytes travel only to the local emulator; never change product code.
  await context.addInitScript(() => {
    const interval = setInterval(() => {
      if (!window.firebase?.storage || !window.firebase.apps?.length) return;
      const prototype = Object.getPrototypeOf(window.firebase.storage().ref('homolog-local'));
      if (prototype.__homologHttpsAdapter) return clearInterval(interval);
      const originalGetDownloadURL = prototype.getDownloadURL;
      prototype.getDownloadURL = async function () { const u = new URL(await originalGetDownloadURL.call(this)); return 'https://firebasestorage.googleapis.com' + u.pathname + u.search; };
      prototype.__homologHttpsAdapter = true;
      clearInterval(interval);
    }, 50);
  });
  const page = await context.newPage();
  page.on('pageerror', error => pageErrors.push(error.message));
  page.setDefaultTimeout(30000);
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.FirebaseSystem && window.firebaseAuth);
  await page.locator('#loginEmail').fill(email); await page.locator('#loginPass').fill(password);
  await page.locator('.login-form button[type=submit]').click();
  await page.waitForFunction(() => window.AdminContext?.currentUser?.role === 'admin');
  await page.locator('[data-section=aprovacoes]').click();
  await page.locator(`[data-admin-action=review-establishment][data-admin-target-id=${fixtureIds[0]}]`).click();
  await page.waitForFunction(() => document.querySelector('.submission-review')?.getAttribute('aria-busy') === 'false');
  await page.waitForFunction(() => document.querySelectorAll('.sr-media img').length === 4 && [...document.querySelectorAll('.sr-media img')].every(image => image.complete && image.naturalWidth > 0));
  assert.equal(await page.locator('.submission-review [name=website]').inputValue(), 'hotel.example');
  assert.match(await page.locator('#sr-error-website').innerText(), /HTTPS/);
  assert.equal(pageErrors.length, 0, pageErrors.join('\n'));
  status.state = 'ready'; status.startedAt = new Date().toISOString(); status.checks = ['Auth Emulator admin authenticated', 'three fresh synthetic requests', 'four local image previews', 'invalid website reproduced', 'local network guard active'];
  await saveStatus();
  console.log(JSON.stringify({ state: status.state, url, runId, pid: process.pid, statusFile: path.join(output, 'status.json'), fixtureIds, syntheticAccounts: accounts, stop: 'Ctrl+C in this process, or close this isolated browser. Emulators remain running.' }, null, 2));
  if (args.has('--smoke')) {
    await page.screenshot({ path: path.join(output, 'smoke.png') });
    await close('smoke completed');
  } else {
    await new Promise(resolve => {
      process.once('SIGINT', () => { void close('SIGINT').then(resolve); });
      process.once('SIGTERM', () => { void close('SIGTERM').then(resolve); });
      browser.once('disconnected', () => { void close('isolated browser closed').then(resolve); });
    });
  }
} catch (error) {
  status.error = error.stack;
  console.error(error);
  process.exitCode = 1;
  await close('failure');
}
