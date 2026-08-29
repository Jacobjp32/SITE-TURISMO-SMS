/**
 * ============================================================
 * SERVICE WORKER - PWA TURISMO SMS
 * ============================================================
 * 
 * Permite que o site funcione offline como um app mobile.
 */

// Incrementar versão sempre que houver mudanças de conteúdo
const CACHE_NAME = 'turismo-sms-v22';
const OFFLINE_URL = 'offline.html';

const OFFLINE_CORE_ASSETS = [
    OFFLINE_URL,
    'css/variables.css',
    'css/offline.css'
];

// Arquivos para cache inicial
// Apenas assets estáticos que raramente mudam
// HTMLs e JSONs são excluídos intencionalmente (sempre buscados da rede)
const OPTIONAL_PRECACHE_ASSETS = [
    'translations.js',
    'js/tourism-mascot.js',
    'css/tourism-mascot.css',
    'js/reservas.js',
    'images/logo_pin_turismo_3d.png',
    'images/FOTO_GERAL_SAO_MATEUS_DO_SUL.jpg',
    'images/PRACA_DO_RIO_IGUACU.jpg',
    'images/PARRERAL__1_.jpg',
    'images/WEBP/RUA-DO-MATHE-_1_.webp',
    'images/WEBP/PRACA-DO-IGUACU_1.webp',
    'images/mascotes/MASCOTE_CAPIVARA_PINHAO.png',
    'images/mascotes/MASCOTE_CAPIVARA_PINHAO.webp',
    'images/mascotes/MASCOTE_MENINO_POLONES_1.png',
    'images/mascotes/MASCOTE_PERY.png'
];

// URLs que nunca devem ser cacheadas
const NEVER_CACHE = [
    'firestore.googleapis.com',
    'identitytoolkit.googleapis.com',
    'securetoken.googleapis.com',
    'firebaseinstallations.googleapis.com',
    'content-firebaseappcheck.googleapis.com',
    'firebaseappcheck.googleapis.com',
    'www.gstatic.com/firebasejs/',
    'fonts.googleapis.com',
    'fonts.gstatic.com',
    'config.js',
    'js/admin-content-cms.js',
    'js/firebase-auth.js',
    'js/firebase-app-check.js',
    'js/nav-shared.js',
    'js/site-meta.js',
    'favicon.ico',
    'api.open-meteo.com',
    'www.googletagmanager.com'
];

const FIREBASE_STORAGE_HOSTNAMES = new Set([
    'firebasestorage.googleapis.com',
    'storage.googleapis.com'
]);

// Extensões que nunca devem ser cacheadas (sempre busca da rede)
const NEVER_CACHE_EXT = ['.json', '.html', '.mp4', '.webm', '.mov', '.m4v'];

// Instalação
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(async cache => {
                await cache.addAll(OFFLINE_CORE_ASSETS);
                await Promise.allSettled(
                    OPTIONAL_PRECACHE_ASSETS.map(asset => cache.add(asset))
                );
            })
            .then(() => self.skipWaiting())
    );
});

// Ativação
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames
                    .filter(name => name !== CACHE_NAME && name.startsWith('turismo-sms-'))
                    .map(name => caches.delete(name))
            );
        }).then(() => self.clients.claim())
    );
});

// Interceptar requisições
self.addEventListener('fetch', event => {
    // Ignorar requisições não-GET
    if (event.request.method !== 'GET') return;
    
    // Ignorar requisições de extensões
    if (event.request.url.includes('chrome-extension')) return;

    const url = new URL(event.request.url);

    // Nunca cachear APIs externas / Firebase, inclusive todos os hosts Storage usados pelo projeto.
    if (shouldBypassCache(url)) return;

    // Navegações públicas usam network-first com fallback offline.
    if (isSensitivePath(url.pathname)) return;
    if (event.request.mode === 'navigate') {
        if (url.origin !== self.location.origin) return;
        const completeBackgroundWork = createBestEffortBackground(event);
        event.respondWith(handlePublicNavigation(event.request, completeBackgroundWork));
        return;
    }

    // JSON e HTML que não são navegações continuam sempre na rede.
    if (NEVER_CACHE_EXT.some(ext => url.pathname.endsWith(ext))) return;
    
    const completeBackgroundWork = createBestEffortBackground(event);
    event.respondWith(handleNonNavigationRequest(event.request, completeBackgroundWork));
});

async function handlePublicNavigation(request, completeBackgroundWork) {
    let backgroundWork;

    try {
        const response = await fetch(request);

        if (isCacheablePublicNavigation(request, response)) {
            backgroundWork = putInCurrentCache(request, response.clone());
        }

        return response;
    } catch (_) {
        try {
            const cache = await caches.open(CACHE_NAME);
            const visitedResponse = await cache.match(request, { ignoreSearch: true });
            if (visitedResponse) return visitedResponse;

            const offlineResponse = await cache.match(OFFLINE_URL);
            if (offlineResponse) return offlineResponse;
        } catch (_) {
            // Se CacheStorage falhar, ainda devolvemos uma resposta offline controlada.
        }

        return createControlledOfflineResponse();
    } finally {
        completeBackgroundWork(backgroundWork);
    }
}

async function handleNonNavigationRequest(request, completeBackgroundWork) {
    let backgroundWork;

    try {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            backgroundWork = fetchAndCache(request);
            return cachedResponse;
        }

        try {
            const response = await fetch(request);
            if (response && response.status === 200) {
                backgroundWork = putInCurrentCache(request, response.clone());
            }
            return response;
        } catch (_) {
            return undefined;
        }
    } finally {
        completeBackgroundWork(backgroundWork);
    }
}

function isCacheablePublicNavigation(request, response) {
    const url = new URL(request.url);

    return request.method === 'GET'
        && request.mode === 'navigate'
        && url.origin === self.location.origin
        && !isSensitivePath(url.pathname)
        && !shouldBypassCache(url)
        && response
        && response.status === 200
        && response.type !== 'opaque'
        && response.type !== 'opaqueredirect'
        && !response.redirected;
}

function shouldBypassCache(url) {
    const hostname = url.hostname.toLowerCase();

    if (FIREBASE_STORAGE_HOSTNAMES.has(hostname)) return true;
    if (hostname === 'firebasestorage.app' || hostname.endsWith('.firebasestorage.app')) return true;

    return NEVER_CACHE.some(domain => url.href.includes(domain));
}

function createBestEffortBackground(event) {
    let complete;
    const handledPromise = new Promise(resolve => {
        complete = resolve;
    }).catch(() => {});

    event.waitUntil(handledPromise);
    return work => complete(work);
}

async function putInCurrentCache(request, response) {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(request, response);
}

function createControlledOfflineResponse() {
    return new Response(
        '<!doctype html><html lang="pt-BR"><meta charset="utf-8"><title>Offline</title><body><h1>Você está offline</h1><p>Não foi possível carregar esta página agora.</p></body></html>',
        {
            status: 503,
            headers: {
                'Cache-Control': 'no-store',
                'Content-Type': 'text/html; charset=utf-8'
            }
        }
    );
}

// Buscar e atualizar cache
async function fetchAndCache(request) {
    const response = await fetch(request);
    if (response && response.status === 200) {
        await putInCurrentCache(request, response);
    }
}

function isSensitivePath(pathname) {
    const normalizedPath = pathname.length > 1
        ? pathname.replace(/\/+$/, '')
        : pathname;

    return [
        '/admin-firebase',
        '/admin-firebase.html',
        '/portal-usuario',
        '/portal-usuario.html'
    ].includes(normalizedPath);
}

// Push notifications (preparado para futuro)
self.addEventListener('push', event => {
    const options = {
        body: event.data ? event.data.text() : 'Nova atualização disponível!',
        icon: 'images/logo_pin_turismo_3d.png',
        badge: 'images/logo_pin_turismo_3d.png',
        vibrate: [100, 50, 100],
        data: {
            url: './'
        }
    };
    
    event.waitUntil(
        self.registration.showNotification('Turismo SMS', options)
    );
});

// Clique em notificação
self.addEventListener('notificationclick', event => {
    event.notification.close();
    event.waitUntil(
        clients.openWindow(event.notification.data.url || './')
    );
});

