/**
 * ============================================================
 * SERVICE WORKER - PWA TURISMO SMS
 * ============================================================
 * 
 * Permite que o site funcione offline como um app mobile.
 */

const CACHE_NAME = 'turismo-sms-v5';
const OFFLINE_URL = 'offline.html';

// Arquivos para cache inicial (caminhos relativos para GitHub Pages)
const PRECACHE_ASSETS = [
    './',
    'index.html',
    'eventos.html',
    'reservas.html',
    'roteiro-ia.html',
    'o-que-fazer.html',
    'sabores.html',
    'galeria.html',
    'offline.html',
    'translations.js',
    'config.js',
    'js/chatbot.js',
    'js/roteiro-ia.js',
    'js/reservas.js',
    'images/logo_pin_turismo_3d.png',
    'images/FOTO_GERAL_SAO_MATEUS_DO_SUL.jpg',
    'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Raleway:wght@400;500;600;700&display=swap'
];

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
