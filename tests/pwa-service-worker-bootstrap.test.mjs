import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const NAV_SOURCE = readFileSync(new URL('../js/nav-shared.js', import.meta.url), 'utf8');
const HOME_SOURCE = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const BOOTSTRAP_MATCH = NAV_SOURCE.match(/\/\* SW_BOOTSTRAP_START \*\/([\s\S]*?)\/\* SW_BOOTSTRAP_END \*\//);
assert.ok(BOOTSTRAP_MATCH, 'bootstrap de Service Worker precisa manter marcadores testáveis');
const BOOTSTRAP_SOURCE = BOOTSTRAP_MATCH[1];
const BOOTSTRAP_SCRIPT = new vm.Script(BOOTSTRAP_SOURCE, { filename: 'nav-shared-sw-bootstrap.js' });
const FULL_NAV_SCRIPT = new vm.Script(NAV_SOURCE, { filename: 'nav-shared.js' });

const flushTasks = () => new Promise(resolve => setImmediate(resolve));

function deferred() {
    let resolve;
    let reject;
    const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
    return { promise, resolve, reject };
}

function createHarness(options = {}) {
    const url = new URL(options.pathname || '/', 'https://turismo.test');
    const calls = {
        getRegistration: [], register: [], update: 0, guardAtLookup: [],
        loadListeners: [], loadEvents: 0, timeouts: [], warnings: [],
        reload: 0, replace: 0, unregister: 0, cache: 0, postMessage: 0,
        polling: 0, updateViaCacheWrites: 0, pageActions: 0, domInsertions: 0
    };
    const timers = [];
    const events = new EventTarget();
    events.addEventListener('load', () => { calls.loadEvents += 1; });
    events.addEventListener('page-action', () => { calls.pageActions += 1; });
    const location = {
        href: url.href, pathname: url.pathname, origin: url.origin,
        reload() { calls.reload += 1; },
        replace() { calls.replace += 1; }
    };
    const window = {
        location,
        addEventListener(type, listener, listenerOptions) {
            if (type === 'load') calls.loadListeners.push({ listener, options: listenerOptions });
            events.addEventListener(type, listener, listenerOptions);
        },
        setTimeout(callback, delay) {
            calls.timeouts.push(delay);
            timers.push(callback);
            return timers.length;
        },
        setInterval() { calls.polling += 1; },
        requestAnimationFrame() { return 1; },
        getComputedStyle() { return { display: 'block' }; }
    };
    const worker = {
        scriptURL: new URL('/sw.js', url).href, state: 'activated',
        postMessage() { calls.postMessage += 1; }
    };
    let updateViaCache = 'imports';
    const registration = {
        scope: new URL('/', url).href,
        active: options.emptyRegistration ? null : worker,
        installing: options.installing || null,
        waiting: options.waiting || null,
        get updateViaCache() { return updateViaCache; },
        set updateViaCache(value) { calls.updateViaCacheWrites += 1; updateViaCache = value; },
        unregister() { calls.unregister += 1; return Promise.resolve(true); },
        update() {
            calls.update += 1;
            if (options.updateRejects) return Promise.reject(new Error('update unavailable'));
            return Promise.resolve(registration);
        }
    };
    const serviceWorker = {
        register(...args) {
            calls.register.push(args);
            if (options.registerRejects) return Promise.reject(new Error('register unavailable'));
            return Promise.resolve(registration);
        }
    };
    if (!options.getRegistrationUnavailable) {
        serviceWorker.getRegistration = function(...args) {
            calls.getRegistration.push(args);
            calls.guardAtLookup.push(window.__smsServiceWorkerBootstrapPromise);
            if (options.lookup) return options.lookup.promise;
            if (options.getRegistrationRejects) return Promise.reject(new Error('lookup unavailable'));
            return Promise.resolve(options.existing === false ? undefined : registration);
        };
    }

    // DOM mínimo para avaliar o arquivo inteiro: registra a injeção real e seus IDs.
    // Scripts anexados e callbacks de DOMContentLoaded não são executados pelo mock.
    const ids = new Map();
    const scripts = [];
    const stylesheets = [];
    function element(tagName = 'div') {
        const attrs = {};
        return {
            tagName: tagName.toUpperCase(), style: { setProperty() {} },
            classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
            setAttribute(name, value) { attrs[name] = value; },
            getAttribute(name) { return attrs[name] ?? this[name] ?? null; },
            getBoundingClientRect() { return { height: 32 }; },
            addEventListener() {},
            appendChild(child) {
                if (child.id) ids.set(child.id, child);
                if (child.tagName === 'SCRIPT') scripts.push(child);
                if (child.tagName === 'LINK') stylesheets.push(child);
                return child;
            },
            insertAdjacentHTML(position, html) {
                calls.domInsertions += 1;
                for (const match of html.matchAll(/\bid=["']([^"']+)["']/g)) {
                    ids.set(match[1], element());
                }
            }
        };
    }
    const document = {
        readyState: options.readyState || 'loading', scripts,
        head: element('head'), body: element('body'), documentElement: element('html'),
        getElementById(id) { return ids.get(id) || null; },
        createElement: element,
        querySelector() { return null; },
        querySelectorAll(selector) { return selector === 'link[rel="stylesheet"]' ? stylesheets : []; },
        addEventListener() {}
    };
    const caches = {
        open() { calls.cache += 1; return Promise.resolve({}); },
        delete() { calls.cache += 1; return Promise.resolve(true); },
        keys() { calls.cache += 1; return Promise.resolve([]); }
    };
    const navigator = options.noServiceWorker ? {} : { serviceWorker };
    Object.assign(window, { document, navigator, caches, window });
    const context = vm.createContext({
        console: { warn(...args) { calls.warnings.push(args); } },
        document, navigator, Promise, URL, window, location, caches,
        setTimeout: window.setTimeout, setInterval: window.setInterval,
        localStorage: { getItem() { return null; }, setItem() {}, removeItem() {} }
    });
    return {
        calls, context, document, registration, window, timers,
        run() { return BOOTSTRAP_SCRIPT.runInContext(context); },
        runFull() { return FULL_NAV_SCRIPT.runInContext(context); },
        invoke() { return vm.runInContext('bootstrapServiceWorker()', context); },
        async fireLoad() {
            document.readyState = 'complete';
            events.dispatchEvent(new Event('load'));
            await flushTasks();
        },
        runNextTimer() {
            assert.ok(timers.length, 'deve existir uma task agendada');
            timers.shift()();
        },
        async waitForBootstrap() {
            await flushTasks();
            while (timers.length) this.runNextTimer();
            const value = await window.__smsServiceWorkerBootstrapPromise;
            await flushTasks();
            return value;
        },
        operatePage() { events.dispatchEvent(new Event('page-action')); },
        assertNoSideEffects() {
            for (const name of ['reload', 'replace', 'unregister', 'cache', 'postMessage', 'polling', 'updateViaCacheWrites']) {
                assert.equal(calls[name], 0, name);
            }
        }
    };
}

function harnessFor(t, options) {
    const harness = createHarness(options);
    t.after(() => harness.assertNoSideEffects());
    return harness;
}

test('browser sem Service Worker encerra sem erro', t => {
    const harness = harnessFor(t, { noServiceWorker: true });
    assert.doesNotThrow(() => harness.run());
    assert.equal(harness.window.__smsServiceWorkerBootstrapPromise, undefined);
});

for (const readyState of ['loading', 'interactive']) {
    test('registration existente em ' + readyState + ' atualiza somente depois de load', async t => {
        const harness = harnessFor(t, { readyState });
        harness.run();
        await flushTasks();
        assert.deepEqual(harness.calls.getRegistration, [['/']]);
        assert.equal(harness.calls.register.length, 0);
        assert.equal(harness.calls.update, 0);
        assert.equal(harness.calls.loadListeners.length, 1);
        assert.equal(harness.calls.loadListeners[0].options.once, true);
        await harness.fireLoad();
        assert.strictEqual(await harness.waitForBootstrap(), harness.registration);
        assert.equal(harness.calls.update, 1);
    });
}

test('documento complete mantém update zero até a próxima task controlada', async t => {
    const harness = harnessFor(t, { readyState: 'complete' });
    harness.run();
    assert.equal(harness.calls.update, 0);
    await flushTasks();
    assert.equal(harness.calls.update, 0, 'nem a resolução do lookup pode antecipar o timer');
    assert.deepEqual(harness.calls.timeouts, [0]);
    assert.equal(harness.calls.loadListeners.length, 0);
    harness.runNextTimer();
    await harness.waitForBootstrap();
    assert.equal(harness.calls.update, 1);
});

test('dois eventos load reais resultam em um único update', async t => {
    const harness = harnessFor(t);
    harness.run();
    await flushTasks();
    await harness.fireLoad();
    await harness.fireLoad();
    await harness.waitForBootstrap();
    assert.equal(harness.calls.loadEvents, 2);
    assert.equal(harness.calls.update, 1);
});

test('guard existe antes do lookup e duas chamadas na mesma stack retornam a mesma Promise', async t => {
    const lookup = deferred();
    const harness = harnessFor(t, { lookup });
    const first = harness.run();
    const second = harness.invoke();
    assert.ok(harness.window.__smsServiceWorkerBootstrapPromise);
    assert.strictEqual(first, second);
    assert.strictEqual(first, harness.window.__smsServiceWorkerBootstrapPromise);
    assert.equal(harness.calls.getRegistration.length, 0, 'lookup não pode começar na stack inicial');
    await flushTasks();
    assert.equal(harness.calls.getRegistration.length, 1);
    assert.strictEqual(harness.calls.guardAtLookup[0], first);
    lookup.resolve(harness.registration);
    await flushTasks();
    await harness.fireLoad();
    await first;
    assert.equal(harness.calls.update, 1);
});

test('arquivo nav-shared completo avaliado duas vezes com lookup pendente mantém uma chain', async t => {
    for (const existing of [true, false]) {
        const lookup = deferred();
        const harness = harnessFor(t, { lookup });
        harness.runFull();
        const first = harness.window.__smsServiceWorkerBootstrapPromise;
        assert.ok(first instanceof Promise);
        await flushTasks();
        assert.equal(harness.calls.getRegistration.length, 1);
        assert.strictEqual(harness.calls.guardAtLookup[0], first);
        const insertions = harness.calls.domInsertions;
        assert.ok(harness.document.getElementById('mainNav'));
        harness.runFull();
        assert.strictEqual(harness.window.__smsServiceWorkerBootstrapPromise, first);
        assert.equal(harness.calls.domInsertions, insertions);
        assert.equal(harness.calls.getRegistration.length, 1);
        assert.equal(harness.calls.register.length, 0);
        assert.equal(harness.calls.update, 0);
        lookup.resolve(existing ? harness.registration : undefined);
        await flushTasks();
        await harness.fireLoad();
        await harness.waitForBootstrap();
        assert.equal(harness.calls.register.length, existing ? 0 : 1);
        assert.equal(harness.calls.update, existing ? 1 : 0);
    }
});

test('primeira instalação usa lookup e script raiz nas rotas, sem update redundante ou opções', async t => {
    for (const pathname of ['/', '/sabores', '/mapa-turistico', '/eventos/', '/mes-polones']) {
        const harness = harnessFor(t, { existing: false, pathname });
        const first = harness.run();
        assert.strictEqual(harness.run(), first);
        assert.strictEqual(harness.invoke(), first);
        await harness.waitForBootstrap();
        assert.deepEqual(harness.calls.getRegistration, [['/']]);
        assert.deepEqual(harness.calls.register, [['/sw.js']]);
        assert.equal(new URL(harness.calls.getRegistration[0][0], harness.window.location.href).href, harness.registration.scope);
        assert.equal(new URL(harness.calls.register[0][0], harness.window.location.href).href, harness.registration.active.scriptURL);
        assert.equal(harness.registration.scope, 'https://turismo.test/');
        assert.equal(harness.registration.updateViaCache, 'imports');
        assert.equal(harness.calls.update, 0);
    }
});

test('browser sem getRegistration usa register raiz como fallback simples', async t => {
    const harness = harnessFor(t, { getRegistrationUnavailable: true });
    harness.run();
    await harness.waitForBootstrap();
    assert.deepEqual(harness.calls.register, [['/sw.js']]);
    assert.equal(harness.calls.update, 0);
});

for (const state of ['installing', 'waiting']) {
    test('registration em ' + state + ' não inicia update concorrente', async t => {
        const harness = harnessFor(t, { readyState: 'complete', [state]: { state } });
        harness.run();
        await harness.waitForBootstrap();
        assert.equal(harness.calls.update, 0);
        assert.equal(harness.calls.register.length, 0);
    });
}

test('registration sem active, installing ou waiting recebe um update sem novo registro', async t => {
    const harness = harnessFor(t, { emptyRegistration: true });
    harness.run();
    await flushTasks();
    assert.equal(harness.registration.active, null);
    assert.equal(harness.registration.installing, null);
    assert.equal(harness.registration.waiting, null);
    assert.equal(harness.calls.update, 0);
    await harness.fireLoad();
    assert.strictEqual(await harness.waitForBootstrap(), harness.registration);
    assert.equal(harness.calls.update, 1);
    assert.equal(harness.calls.register.length, 0);
});

for (const failure of ['register', 'update', 'lookup']) {
    test('rejeição de ' + failure + ' é capturada, mantém página operacional e não reinicia a chain', async t => {
        const harness = harnessFor(t, {
            readyState: 'complete',
            existing: failure !== 'register',
            registerRejects: failure === 'register',
            updateRejects: failure === 'update',
            getRegistrationRejects: failure === 'lookup'
        });
        let unhandled = 0;
        const onUnhandled = () => { unhandled += 1; };
        process.on('unhandledRejection', onUnhandled);
        try {
            const promise = harness.run();
            harness.operatePage();
            const value = await harness.waitForBootstrap();
            assert.strictEqual(value, failure === 'update' ? harness.registration : null);
            assert.strictEqual(harness.invoke(), promise);
            assert.strictEqual(harness.run(), promise);
            await harness.waitForBootstrap();
            harness.operatePage();
            assert.equal(harness.calls.pageActions, 2);
            assert.equal(harness.calls.getRegistration.length, 1);
            assert.equal(harness.calls.register.length, failure === 'register' ? 1 : 0);
            assert.equal(harness.calls.update, failure === 'update' ? 1 : 0);
            assert.equal(harness.calls.warnings.length, 1);
            assert.equal(unhandled, 0);
        } finally {
            process.off('unhandledRejection', onUnhandled);
        }
    });
}

test('bootstrap não contém reload, polling, URL dinâmica ou manipulação de lifecycle', () => {
    assert.doesNotMatch(BOOTSTRAP_SOURCE, /controllerchange|location\.(?:reload|replace)|setInterval|SKIP_WAITING|unregister|eval\s*\(|new Function/);
    assert.doesNotMatch(BOOTSTRAP_SOURCE, /updateViaCache\s*:/);
    assert.match(BOOTSTRAP_SOURCE, /register\('\/sw\.js'\)/);
    assert.doesNotMatch(BOOTSTRAP_SOURCE, /register\([^'"]|register\(['"]sw\.js/);
});

test('Home não mantém autoridade inline de registro', () => {
    assert.doesNotMatch(HOME_SOURCE, /navigator\.serviceWorker\.register/);
    assert.match(HOME_SOURCE, /<script src="js\/nav-shared\.js\?/);
});
