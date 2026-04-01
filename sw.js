/**
 * ============================================================
 * SERVICE WORKER - PWA TURISMO SMS
 * ============================================================
 * 
 * Permite que o site funcione offline como um app mobile.
 */

// Incrementar versão sempre que houver mudanças de conteúdo
const CACHE_NAME = 'turismo-sms-v10';
const OFFLINE_URL = 'offline.html';

// Arquivos para cache inicial
// Apenas assets estáticos que raramente mudam
// HTMLs e JSONs são excluídos intencionalmente (sempre buscados da rede)
const PRECACHE_ASSETS = [
    'offline.html',
    'translations.js',
    'config.js',
    'js/chatbot.js',
    'js/reservas.js',
    'js/firebase-auth.js',
    'images/logo_pin_turismo_3d.png',
    'images/FOTO_GERAL_SAO_MATEUS_DO_SUL.jpg',
    'images/PRACA_DO_RIO_IGUACU.jpg',
    'images/PARRERAL__1_.jpg',
    'images/IGREJA_MATRIZ_1.png',
    'images/WEBP/RUA-DO-MATHE-_1_.webp',
    'images/WEBP/PRACA-DO-IGUACU_1.webp',
    'images/mascotes/MASCOTE_CAPIVARA_PINHAO.png',
    'images/mascotes/MASCOTE_MENINO_POLONES_1.png',
    'images/mascotes/MASCOTE_PERY.png',
    'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Raleway:wght@400;500;600;700&display=swap'
];

// URLs que nunca devem ser cacheadas
const NEVER_CACHE = [
    'firebasestorage.googleapis.com',
    'firestore.googleapis.com',
    'identitytoolkit.googleapis.com',
    'formspree.io',
    'graph.instagram.com',
    'www.googletagmanager.com'
];

// Extensões que nunca devem ser cacheadas (sempre busca da rede)
const NEVER_CACHE_EXT = ['.json', '.html'];

// Instalação
self.addEventListener('install', event => {
    console.log('[SW] Instalando...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[SW] Cacheando arquivos');
                return cache.addAll(PRECACHE_ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

// Ativação
self.addEventListener('activate', event => {
    console.log('[SW] Ativando...');
    
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames
                    .filter(name => name !== CACHE_NAME)
                    .map(name => {
                        console.log('[SW] Removendo cache antigo:', name);
                        return caches.delete(name);
                    })
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

    // Nunca cachear APIs externas / Firebase
    if (NEVER_CACHE.some(domain => event.request.url.includes(domain))) return;

    // Nunca cachear JSON e HTML — sempre buscar da rede
    const url = new URL(event.request.url);
    if (NEVER_CACHE_EXT.some(ext => url.pathname.endsWith(ext))) return;
    
    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                // Retornar do cache se disponível
                if (cachedResponse) {
                    // Atualizar cache em background
                    fetchAndCache(event.request);
                    return cachedResponse;
                }
                
                // Senão, buscar da rede
                return fetch(event.request)
                    .then(response => {
                        // Cachear resposta válida
                        if (response && response.status === 200) {
                            const responseClone = response.clone();
                            caches.open(CACHE_NAME)
                                .then(cache => cache.put(event.request, responseClone));
                        }
                        return response;
                    })
                    .catch(() => {
                        // Offline - retornar página offline para navegação
                        if (event.request.mode === 'navigate') {
                            return caches.match('offline.html');
                        }
                    });
            })
    );
});

// Buscar e atualizar cache
function fetchAndCache(request) {
    fetch(request)
        .then(response => {
            if (response && response.status === 200) {
                caches.open(CACHE_NAME)
                    .then(cache => cache.put(request, response));
            }
        })
        .catch(() => {});
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

console.log('[SW] Service Worker carregado');
