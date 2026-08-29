import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const SW_SOURCE = readFileSync(new URL('../sw.js', import.meta.url), 'utf8');
const ORIGIN = 'https://turismo.test';
const CACHE_NAME = 'turismo-sms-v22';

class MockResponse {
    constructor(body = '', init = {}) {
        this.body = body;
        this.bodyUsed = false;
        this.status = init.status ?? 200;
        this.type = init.type ?? 'basic';
        this.redirected = init.redirected ?? false;
        this.headers = init.headers ?? {};
        this.url = init.url ?? '';
    }

    clone() {
        if (this.bodyUsed) throw new TypeError('Body is unusable');
        return new MockResponse(this.body, {
            status: this.status,
            type: this.type,
            redirected: this.redirected,
            headers: this.headers,
            url: this.url
        });
    }

    async text() {
        if (this.bodyUsed) throw new TypeError('Body is unusable');
        this.bodyUsed = true;
        return this.body;
    }
}

function makeRequest(path, overrides = {}) {
    return {
        method: 'GET',
        mode: 'navigate',
        url: new URL(path, ORIGIN).href,
        ...overrides
    };
}

function cacheKey(input) {
    const value = typeof input === 'string' ? input : input.url;
    return new URL(value, `${ORIGIN}/`).href;
}

function createHarness(options = {}) {
    const listeners = new Map();
    const cacheObjects = new Map();
    const records = {
        add: [],
        addAll: [],
        cacheMatches: [],
        deletes: [],
        fetches: [],
        puts: []
    };
    let fetchImplementation = options.fetchImplementation
        ?? (request => Promise.resolve(new MockResponse('network', { url: request.url })));
    let skipWaitingCalls = 0;
    let claimCalls = 0;

    class MockCache {
        constructor(name) {
            this.name = name;
            this.entries = new Map();
        }

        async addAll(assets) {
            records.addAll.push({ cacheName: this.name, assets: [...assets] });
            if (options.mandatoryFailure && assets.includes(options.mandatoryFailure)) {
                throw new Error(`mandatory failure: ${options.mandatoryFailure}`);
            }

            for (const asset of assets) {
                const key = cacheKey(asset);
                const body = asset === 'offline.html'
                    ? '<h1>Você está offline</h1>'
                    : `cached:${asset}`;
                this.entries.set(key, new MockResponse(body, { url: key }));
            }
        }

        async add(asset) {
            records.add.push({ cacheName: this.name, asset });
            if (options.optionalFailures?.includes(asset)) {
                throw new Error(`optional failure: ${asset}`);
            }

            const key = cacheKey(asset);
            this.entries.set(key, new MockResponse(`cached:${asset}`, { url: key }));
        }

        async put(request, response) {
            records.puts.push({ cacheName: this.name, request, response });
            if (options.putFailure) throw new Error('cache put failure');

            const body = await response.text();
            const key = cacheKey(request);
            this.entries.set(key, new MockResponse(body, {
                status: response.status,
                type: response.type,
                redirected: response.redirected,
                headers: response.headers,
                url: key
            }));
        }

        async match(request, matchOptions = {}) {
            records.cacheMatches.push({
                cacheName: this.name,
                request,
                options: { ...matchOptions }
            });
            const requestedKey = cacheKey(request);

            if (!matchOptions.ignoreSearch) {
                return this.entries.get(requestedKey);
            }

            const requestedUrl = new URL(requestedKey);
            for (const [storedKey, response] of this.entries) {
                const storedUrl = new URL(storedKey);
                if (storedUrl.origin === requestedUrl.origin
                    && storedUrl.pathname === requestedUrl.pathname) {
                    return response;
                }
            }

            return undefined;
        }
    }

    function ensureCache(name) {
        if (!cacheObjects.has(name)) cacheObjects.set(name, new MockCache(name));
        return cacheObjects.get(name);
    }

    for (const name of options.initialCacheNames ?? []) ensureCache(name);

    const caches = {
        async delete(name) {
            records.deletes.push(name);
            return cacheObjects.delete(name);
        },
        async keys() {
            return [...cacheObjects.keys()];
        },
        async match(request, matchOptions) {
            for (const cache of cacheObjects.values()) {
                const response = await cache.match(request, matchOptions);
                if (response) return response;
            }
            return undefined;
        },
        async open(name) {
            if (options.openFailure) throw new Error('cache open failure');
            return ensureCache(name);
        }
    };

    const self = {
        addEventListener(type, listener) {
            if (!listeners.has(type)) listeners.set(type, []);
            listeners.get(type).push(listener);
        },
        clients: {
            async claim() {
                claimCalls += 1;
            }
        },
        location: { origin: ORIGIN },
        registration: {
            async showNotification() {}
        },
        async skipWaiting() {
            skipWaitingCalls += 1;
        }
    };

    const sandbox = {
        Response: MockResponse,
        URL,
        caches,
        clients: { async openWindow() {} },
        console: { error() {}, log() {}, warn() {} },
        fetch(request) {
            records.fetches.push(request);
            return fetchImplementation(request);
        },
        self
    };

    vm.runInNewContext(SW_SOURCE, sandbox, { filename: 'sw.js' });

    return {
        cache(name = CACHE_NAME) {
            return ensureCache(name);
        },
        get claimCalls() {
            return claimCalls;
        },
        dispatchFetch(request) {
            let dispatchActive = true;
            const event = {
                request,
                backgroundPromises: [],
                respondWithCalls: 0,
                respondWithSynchronous: false,
                responsePromise: null,
                respondWith(value) {
                    this.respondWithCalls += 1;
                    this.respondWithSynchronous = dispatchActive;
                    this.responsePromise = Promise.resolve(value);
                },
                waitUntil(value) {
                    this.backgroundPromises.push(Promise.resolve(value));
                },
                async waitForBackground() {
                    await Promise.all(this.backgroundPromises);
                }
            };
            assert.equal(listeners.get('fetch')?.length, 1);
            listeners.get('fetch')[0](event);
            dispatchActive = false;
            return event;
        },
        async dispatchLifecycle(type) {
            let lifecyclePromise;
            const event = {
                waitUntil(value) {
                    lifecyclePromise = Promise.resolve(value);
                }
            };
            assert.equal(listeners.get(type)?.length, 1);
            listeners.get(type)[0](event);
            assert.ok(lifecyclePromise, `${type} deve chamar waitUntil`);
            return lifecyclePromise;
        },
        listeners,
        records,
        setFetch(implementation) {
            fetchImplementation = implementation;
        },
        get skipWaitingCalls() {
            return skipWaitingCalls;
        },
        async cacheNames() {
            return caches.keys();
        }
    };
}

test('registra um único handler de fetch', () => {
    const harness = createHarness();
    assert.equal(harness.listeners.get('fetch').length, 1);
});

test('install grava o núcleo offline obrigatório e os assets opcionais', async () => {
    const harness = createHarness();
    await harness.dispatchLifecycle('install');

    assert.deepEqual(harness.records.addAll[0].assets, [
        'offline.html',
        'css/variables.css',
        'css/offline.css'
    ]);
    assert.ok(harness.records.add.length > 0);
    assert.equal(harness.skipWaitingCalls, 1);
});

test('falha isolada em asset opcional não impede o núcleo nem o install', async () => {
    const harness = createHarness({ optionalFailures: ['translations.js'] });
    await harness.dispatchLifecycle('install');

    assert.equal(harness.skipWaitingCalls, 1);
    assert.ok(await harness.cache().match('offline.html'));
    assert.ok(await harness.cache().match('css/variables.css'));
    assert.ok(await harness.cache().match('css/offline.css'));
});

test('falha em asset obrigatório rejeita o install de forma fechada', async () => {
    const harness = createHarness({ mandatoryFailure: 'css/offline.css' });

    await assert.rejects(harness.dispatchLifecycle('install'), /mandatory failure/);
    assert.equal(harness.skipWaitingCalls, 0);
});

test('navegação pública GET same-origin é interceptada uma única vez', async () => {
    const harness = createHarness();
    const event = harness.dispatchFetch(makeRequest('/eventos.html'));

    assert.equal(event.respondWithCalls, 1);
    assert.equal(event.respondWithSynchronous, true);
    await event.responsePromise;
    await event.waitForBackground();
});

test('URLs públicas reais e bridges limpas passam pelo handler de navegação', async () => {
    const harness = createHarness();

    for (const path of ['/', '/eventos', '/eventos/', '/sabores', '/sabores/', '/mapa-turistico.html']) {
        const event = await harness.dispatchFetch(makeRequest(path));
        assert.equal(event.respondWithCalls, 1, path);
        await event.responsePromise;
    }
});

test('navegação pública clona o body para cache e mantém a resposta original utilizável', async () => {
    const networkResponse = new Response('online-body', { status: 200 });
    const harness = createHarness({
        fetchImplementation: () => Promise.resolve(networkResponse)
    });
    const event = harness.dispatchFetch(makeRequest('/eventos.html'));
    const response = await event.responsePromise;
    assert.equal(event.backgroundPromises.length, 1);
    await event.waitForBackground();

    assert.equal(response, networkResponse);
    assert.equal(await response.text(), 'online-body');
    assert.equal(harness.records.puts.length, 1);
    assert.equal(cacheKey(harness.records.puts[0].request), `${ORIGIN}/eventos.html`);
    assert.equal(await (await harness.cache().match(makeRequest('/eventos.html'))).text(), 'online-body');
});

test('offline retorna a página pública visitada anteriormente', async () => {
    const harness = createHarness({
        fetchImplementation: () => Promise.reject(new Error('offline'))
    });
    const visited = new MockResponse('visited-page', { url: `${ORIGIN}/eventos.html` });
    await harness.cache().put(makeRequest('/eventos.html'), visited);
    harness.records.puts.length = 0;

    const event = await harness.dispatchFetch(makeRequest('/eventos.html'));
    assert.equal((await event.responsePromise).body, 'visited-page');
});

test('offline em página pública nunca visitada retorna offline.html', async () => {
    const harness = createHarness({
        fetchImplementation: () => Promise.reject(new Error('offline'))
    });
    await harness.dispatchLifecycle('install');

    const event = await harness.dispatchFetch(makeRequest('/privacidade.html'));
    const response = await event.responsePromise;
    assert.match(await response.text(), /Você está offline/);
    assert.equal(response.url, `${ORIGIN}/offline.html`);
});

test('cache aberto sem documento visitado nem offline.html retorna 503 controlado', async () => {
    const harness = createHarness({
        fetchImplementation: () => Promise.reject(new Error('offline'))
    });

    const event = harness.dispatchFetch(makeRequest('/pagina-sem-fallback.html'));
    const response = await event.responsePromise;
    await event.waitForBackground();

    assert.ok(response instanceof MockResponse);
    assert.equal(response.status, 503);
    assert.match(await response.text(), /Você está offline/);
});

test('fallback de consulta reutiliza página visitada com ignoreSearch', async () => {
    const harness = createHarness({
        fetchImplementation: () => Promise.reject(new Error('offline'))
    });
    await harness.cache().put(
        makeRequest('/eventos.html?origem=online'),
        new MockResponse('visited-query', { url: `${ORIGIN}/eventos.html?origem=online` })
    );

    const event = await harness.dispatchFetch(makeRequest('/eventos.html?origem=offline'));
    assert.equal((await event.responsePromise).body, 'visited-query');
    assert.ok(harness.records.cacheMatches.some(call => call.options.ignoreSearch === true));
});

test('variantes privadas de Admin e Portal ficam fora do handler público', async () => {
    const harness = createHarness();
    const privatePaths = [
        '/admin-firebase.html',
        '/admin-firebase',
        '/admin-firebase/',
        '/portal-usuario.html',
        '/portal-usuario',
        '/portal-usuario/'
    ];

    for (const path of privatePaths) {
        const event = await harness.dispatchFetch(makeRequest(path));
        assert.equal(event.respondWithCalls, 0, path);
    }

    assert.equal(harness.records.fetches.length, 0);
    assert.equal(harness.records.puts.length, 0);
});

test('endpoints Firebase/API permanecem network-only e fora do cache público', async () => {
    const harness = createHarness();
    const requests = [
        makeRequest('https://firestore.googleapis.com/v1/projects/demo/databases'),
        makeRequest('https://firebasestorage.googleapis.com/v0/b/demo/o'),
        makeRequest('https://storage.googleapis.com/demo/object', { mode: 'cors' }),
        makeRequest('https://bucket-exemplo.firebasestorage.app/object', { mode: 'cors' }),
        makeRequest('/config.js', { mode: 'no-cors' })
    ];

    for (const request of requests) {
        const event = await harness.dispatchFetch(request);
        assert.equal(event.respondWithCalls, 0, request.url);
    }

    assert.equal(harness.records.puts.length, 0);
});

test('handler não-navigation existente continua servindo e preenchendo cache', async () => {
    const networkResponse = new MockResponse('asset', { status: 200, type: 'basic' });
    const harness = createHarness({
        fetchImplementation: () => Promise.resolve(networkResponse)
    });
    const request = makeRequest('/css/index.css', { mode: 'no-cors' });
    const event = harness.dispatchFetch(request);

    assert.equal(event.respondWithCalls, 1);
    assert.equal(await event.responsePromise, networkResponse);
    await event.waitForBackground();
    assert.equal(harness.records.puts.length, 1);
});

test('controle positivo same-origin continua cacheável após exclusões Storage', async () => {
    const harness = createHarness();
    const event = harness.dispatchFetch(makeRequest('/css/index.css', { mode: 'same-origin' }));

    assert.equal(event.respondWithCalls, 1);
    await event.responsePromise;
    await event.waitForBackground();
    assert.equal(harness.records.puts.length, 1);
});

test('revalidação SWR em background fica anexada ao FetchEvent e trata rejeição', async () => {
    const harness = createHarness({
        fetchImplementation: () => Promise.reject(new Error('background offline'))
    });
    await harness.cache().put(
        makeRequest('/css/index.css', { mode: 'same-origin' }),
        new MockResponse('cached-asset')
    );
    harness.records.puts.length = 0;

    const event = harness.dispatchFetch(makeRequest('/css/index.css', { mode: 'same-origin' }));
    assert.equal((await event.responsePromise).body, 'cached-asset');
    assert.equal(event.backgroundPromises.length, 1);
    await event.waitForBackground();
    assert.equal(harness.records.puts.length, 0);
});

test('HTML/JSON não-navigation continuam fora do cache', async () => {
    const harness = createHarness();

    for (const path of ['/fragment.html', '/eventos.json']) {
        const event = await harness.dispatchFetch(makeRequest(path, { mode: 'no-cors' }));
        assert.equal(event.respondWithCalls, 0, path);
    }
});

test('retorno da rede substitui o fallback na navegação seguinte', async () => {
    const harness = createHarness({
        fetchImplementation: () => Promise.reject(new Error('offline'))
    });
    await harness.dispatchLifecycle('install');
    const offlineEvent = await harness.dispatchFetch(makeRequest('/eventos.html'));
    assert.match((await offlineEvent.responsePromise).body, /Você está offline/);

    harness.setFetch(request => Promise.resolve(
        new MockResponse('network-restored', { status: 200, url: request.url })
    ));
    const onlineEvent = await harness.dispatchFetch(makeRequest('/eventos.html'));
    assert.equal((await onlineEvent.responsePromise).body, 'network-restored');
});

test('activate mantém v22 e remove caches turismo-sms antigos', async () => {
    const harness = createHarness({
        initialCacheNames: ['turismo-sms-v20', 'turismo-sms-v21', CACHE_NAME, 'third-party-cache']
    });
    await harness.dispatchLifecycle('activate');

    assert.deepEqual(harness.records.deletes.sort(), ['turismo-sms-v20', 'turismo-sms-v21']);
    assert.deepEqual((await harness.cacheNames()).sort(), ['third-party-cache', CACHE_NAME]);
    assert.equal(harness.claimCalls, 1);
});

test('client assumido após upgrade continua sem interceptar Storage Firebase', async () => {
    const harness = createHarness({
        initialCacheNames: ['turismo-sms-v21', CACHE_NAME]
    });
    await harness.dispatchLifecycle('activate');

    const event = harness.dispatchFetch(
        makeRequest('https://bucket-exemplo.firebasestorage.app/object', { mode: 'cors' })
    );

    assert.equal(harness.claimCalls, 1);
    assert.deepEqual(harness.records.deletes, ['turismo-sms-v21']);
    assert.equal(event.respondWithCalls, 0);
    assert.equal(harness.records.puts.length, 0);
});

test('redirect, resposta opaca e erro HTTP não são gravados como navegação pública', async () => {
    const cases = [
        new MockResponse('redirected', { status: 200, redirected: true }),
        new MockResponse('opaque', { status: 200, type: 'opaque' }),
        new MockResponse('server-error', { status: 503 })
    ];

    for (const networkResponse of cases) {
        const harness = createHarness({
            fetchImplementation: () => Promise.resolve(networkResponse)
        });
        const event = await harness.dispatchFetch(makeRequest('/eventos.html'));
        assert.equal(await event.responsePromise, networkResponse);
        assert.equal(harness.records.puts.length, 0);
    }
});

test('navegação cross-origin não é capturada pelo cache público', async () => {
    const harness = createHarness();
    const event = await harness.dispatchFetch(makeRequest('https://example.org/publica'));

    assert.equal(event.respondWithCalls, 0);
    assert.equal(harness.records.puts.length, 0);
});

test('falha inesperada do CacheStorage ainda produz Response offline controlada', async () => {
    const harness = createHarness({
        fetchImplementation: () => Promise.reject(new Error('offline')),
        openFailure: true
    });
    const event = await harness.dispatchFetch(makeRequest('/pagina-nova.html'));
    const response = await event.responsePromise;

    assert.equal(response.status, 503);
    assert.match(await response.text(), /Você está offline/);
    assert.equal(response.headers['Cache-Control'], 'no-store');
    await event.waitForBackground();
});

test('falha de cache.put não impede a resposta válida da rede', async () => {
    const networkResponse = new MockResponse('online-with-cache-error', {
        status: 200,
        url: `${ORIGIN}/eventos.html`
    });
    const harness = createHarness({
        fetchImplementation: () => Promise.resolve(networkResponse),
        putFailure: true
    });
    const event = await harness.dispatchFetch(makeRequest('/eventos.html'));

    assert.equal(await event.responsePromise, networkResponse);
    assert.equal(event.backgroundPromises.length, 1);
    await event.waitForBackground();
});
