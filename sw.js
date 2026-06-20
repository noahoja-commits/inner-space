/**
 * InnerSpace PWA Service Worker
 * Handles offline assets caching and high-speed loading.
 */

const CACHE_NAME = 'innerspace-cache-v1';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './style.css',
    './manifest.json',
    './js/app.js',
    './js/canvas.js',
    './js/values.js',
    './js/wheel.js',
    './js/personality.js',
    './js/journal.js',
    './js/breath.js',
    './js/history.js',
    './icon-192.png',
    './icon-512.png'
];

// Install Event - Pre-cache all core assets
self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[Service Worker] Pre-caching offline assets');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate Event - Clean up stale cache versions
self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.map(key => {
                    if (key !== CACHE_NAME) {
                        console.log('[Service Worker] Removing old cache version:', key);
                        return caches.delete(key);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch Event - Serve cached assets first, fall back to network
self.addEventListener('fetch', (e) => {
    // Avoid caching non-HTTP requests (like chrome extensions or file scheme)
    if (!e.request.url.startsWith(self.location.origin)) return;

    e.respondWith(
        caches.match(e.request)
            .then(cachedResponse => {
                if (cachedResponse) {
                    return cachedResponse;
                }
                
                return fetch(e.request).then(networkResponse => {
                    // Check valid response
                    if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                        return networkResponse;
                    }

                    // Dynamically cache any new successful requests
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(e.request, responseToCache);
                    });

                    return networkResponse;
                });
            })
    );
});
