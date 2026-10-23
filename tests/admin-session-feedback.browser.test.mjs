// Local regression: real feedback component and real admin authentication-view
// functions in a fresh browser context. No network, Firebase or personal profile.
// PLAYWRIGHT_MODULE_PATH=<existing package> PLAYWRIGHT_CHROMIUM_PATH=<Chrome>
// node --test tests/admin-session-feedback.browser.test.mjs
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import { after, before, test } from 'node:test';

if (!process.env.PLAYWRIGHT_MODULE_PATH) throw new Error('Set PLAYWRIGHT_MODULE_PATH to an existing Playwright package.');
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE_PATH);
const html = await readFile(new URL('../admin-firebase.html', import.meta.url), 'utf8');
const feedback = await readFile(new URL('../js/admin/admin-feedback.js', import.meta.url), 'utf8');
function actualFunction(name) {
  const start = new RegExp('^        (?:async )?function ' + name + '\\(', 'm').exec(html);
  assert.ok(start, 'Production function exists: ' + name);
  const remainder = html.slice(start.index + start[0].length);
  const next = /^        (?:async )?function /m.exec(remainder);
  assert.ok(next, 'Next production function exists after ' + name);
  return html.slice(start.index, start.index + start[0].length + next.index);
}
let browser;
before(async () => { browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH }); });
after(async () => { await browser?.close(); });

async function fixture() {
  const context = await browser.newContext();
  await context.route('**/*', route => route.abort());
  const page = await context.newPage();
  await page.setContent('<main id="loginScreen" style="display:none"><div id="loginFeedback" hidden></div></main><main id="dashboard" class="active"></main>');
  await page.addScriptTag({ content: feedback });
  await page.addScriptTag({ content: `
    let adminLoginIntent = false, adminLoginInFlight = false, adminSessionLogoutInProgress = false;
    window.logoutCalls = 0;
    window.FirebaseSystem = { logout: async () => { window.logoutCalls++; window.currentUser = null; checkAdminAuth(); } };
    function stopAdminSessionMonitor() {}
    function clearAdminSessionStorage() {}
    ${['setLoginFeedback', 'clearLoginFeedback', 'showAdminLogin', 'forceAdminLogout', 'checkAdminAuth'].map(actualFunction).join('\n')}
  ` });
  await page.evaluate(() => AdminFeedback.toast('Cadastro já aprovado: o rascunho CMS existente foi confirmado.', 'success'));
  assert.equal(await page.locator('.adm-toast--success').count(), 1, 'Prior operation success is visible before session transition');
  return { context, page };
}

for (const user of [{ role: 'moderator', ativo: true }, { role: 'admin', ativo: false }]) {
  test(`Access denial clears previous success (${user.role}, active=${user.ativo})`, async () => {
    const { context, page } = await fixture();
    try {
      await page.evaluate(user => { window.currentUser = user; checkAdminAuth(); }, user);
      await page.waitForFunction(() => window.logoutCalls === 1 && !adminSessionLogoutInProgress);
      assert.equal(await page.locator('#loginScreen').isVisible(), true);
      assert.equal(await page.locator('#dashboard.active').count(), 0);
      assert.equal(await page.locator('.adm-toast').count(), 0, 'No previous operation notification belongs on the denied-login screen');
      assert.match(await page.locator('#loginFeedback').innerText(), /não possui permissão administrativa ativa/);
      if (process.env.ADMIN_SESSION_FEEDBACK_SCREENSHOT && user.role === 'moderator') {
        await page.screenshot({ path: process.env.ADMIN_SESSION_FEEDBACK_SCREENSHOT });
      }
    } finally { await context.close(); }
  });
}

test('An expired session clears old success and preserves its own warning', async () => {
  const { context, page } = await fixture();
  try {
    await page.evaluate(() => forceAdminLogout('Sua sessão administrativa expirou por segurança.', 'warning'));
    assert.equal(await page.locator('.adm-toast').count(), 0);
    assert.match(await page.locator('#loginFeedback.is-warning').innerText(), /sessão administrativa expirou/);
    assert.equal(await page.evaluate(() => window.logoutCalls), 1);
  } finally { await context.close(); }
});
