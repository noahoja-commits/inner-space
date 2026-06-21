/**
 * InnerSpace PWA Service Worker
 * Handles offline assets caching and high-speed loading.
 */

const CACHE_NAME = 'innerspace-cache-v2';
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
    './icon-512.png',
    './apple-touch-icon.png'
];

// Cross-origin CDN hosts whose responses we cache at runtime so the app
// keeps working offline (Lucide icons + Google Fonts CSS/font files).
const RUNTIME_CDN_HOSTS = [
    'unpkg.com',
    'fonts.googleapis.com',
    'fonts.gstatic.com'
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

function isRuntimeCdn(url) {
    try {
        return RUNTIME_CDN_HOSTS.includes(new URL(url).hostname);
    } catch (err) {
        return false;
    }
}

// Stale-while-revalidate for CDN assets: serve the cached copy instantly
// (works offline) while refreshing it in the background when online.
function staleWhileRevalidate(request) {
    return caches.open(CACHE_NAME).then(cache =>
        cache.match(request).then(cached => {
            const networkFetch = fetch(request).then(networkResponse => {
                // opaque (type 'opaque') responses are allowed for cross-origin CDNs
                if (networkResponse && (networkResponse.ok || networkResponse.type === 'opaque')) {
                    cache.put(request, networkResponse.clone());
                }
                return networkResponse;
            }).catch(() => cached);

            return cached || networkFetch;
        })
    );
}

// Fetch Event - Serve cached assets first, fall back to network
self.addEventListener('fetch', (e) => {
    const url = e.request.url;

    // Cache-first / stale-while-revalidate for whitelisted cross-origin CDN assets
    if (isRuntimeCdn(url)) {
        e.respondWith(staleWhileRevalidate(e.request));
        return;
    }

    // Avoid caching non-HTTP requests (like chrome extensions or file scheme)
    if (!url.startsWith(self.location.origin)) return;

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

                    // Dynamically cache any new successful same-origin requests
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(e.request, responseToCache);
                    });

                    return networkResponse;
                });
            })
    );
});
