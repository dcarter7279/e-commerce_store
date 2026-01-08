// Service Worker for E-Commerce Site
// Implements caching strategies for performance optimization

const CACHE_VERSION = 'v1';
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `dynamic-${CACHE_VERSION}`;
const IMAGE_CACHE = `images-${CACHE_VERSION}`;

// Resources to precache
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/css/styles.css',
    '/css/products.css',
    '/js/app.js',
    '/js/products.js',
    '/js/cart.js'
];

// Maximum cache sizes
const MAX_DYNAMIC_CACHE = 50;
const MAX_IMAGE_CACHE = 60;

/**
 * Install event - precache static assets
 */
self.addEventListener('install', (event) => {
    console.log('[SW] Installing Service Worker');

    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then(cache => {
                console.log('[SW] Precaching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

/**
 * Activate event - clean up old caches
 */
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating Service Worker');

    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames
                        .filter(name => name !== STATIC_CACHE &&
                                       name !== DYNAMIC_CACHE &&
                                       name !== IMAGE_CACHE)
                        .map(name => {
                            console.log('[SW] Deleting old cache:', name);
                            return caches.delete(name);
                        })
                );
            })
            .then(() => self.clients.claim())
    );
});

/**
 * Fetch event - implement caching strategies
 */
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip cross-origin requests
    if (url.origin !== location.origin) {
        return;
    }

    // Choose strategy based on request type
    if (isImageRequest(request)) {
        event.respondWith(cacheFirst(request, IMAGE_CACHE, MAX_IMAGE_CACHE));
    } else if (isStaticAsset(request)) {
        event.respondWith(cacheFirst(request, STATIC_CACHE));
    } else if (isAPIRequest(request)) {
        event.respondWith(networkFirst(request, DYNAMIC_CACHE));
    } else {
        event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE, MAX_DYNAMIC_CACHE));
    }
});

/**
 * Cache First strategy
 * Good for static assets that don't change often
 */
async function cacheFirst(request, cacheName, maxItems = null) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);

    if (cached) {
        return cached;
    }

    try {
        const response = await fetch(request);

        if (response.ok) {
            // Clone and cache
            const responseClone = response.clone();

            if (maxItems) {
                await limitCacheSize(cacheName, maxItems);
            }

            cache.put(request, responseClone);
        }

        return response;
    } catch (error) {
        console.error('[SW] Fetch failed:', error);
        return new Response('Network error', {
            status: 408,
            headers: { 'Content-Type': 'text/plain' }
        });
    }
}

/**
 * Network First strategy
 * Good for API requests that need fresh data
 */
async function networkFirst(request, cacheName, timeout = 3000) {
    const cache = await caches.open(cacheName);

    try {
        const fetchPromise = fetch(request);
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('timeout')), timeout)
        );

        const response = await Promise.race([fetchPromise, timeoutPromise]);

        if (response.ok) {
            cache.put(request, response.clone());
        }

        return response;
    } catch (error) {
        console.log('[SW] Network failed, falling back to cache');

        const cached = await cache.match(request);

        if (cached) {
            return cached;
        }

        return new Response('Network error and no cache available', {
            status: 503,
            headers: { 'Content-Type': 'text/plain' }
        });
    }
}

/**
 * Stale While Revalidate strategy
 * Good for pages that can show stale content while updating
 */
async function staleWhileRevalidate(request, cacheName, maxItems = null) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);

    // Fetch fresh version in background
    const fetchPromise = fetch(request)
        .then(async response => {
            if (response.ok) {
                if (maxItems) {
                    await limitCacheSize(cacheName, maxItems);
                }

                cache.put(request, response.clone());
            }

            return response;
        })
        .catch(error => {
            console.error('[SW] Background fetch failed:', error);
        });

    // Return cached version immediately if available
    return cached || fetchPromise;
}

/**
 * Limit cache size
 */
async function limitCacheSize(cacheName, maxItems) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();

    if (keys.length > maxItems) {
        // Delete oldest entries
        const deleteCount = keys.length - maxItems;

        for (let i = 0; i < deleteCount; i++) {
            await cache.delete(keys[i]);
        }
    }
}

/**
 * Check if request is for an image
 */
function isImageRequest(request) {
    return request.destination === 'image' ||
           /\.(jpg|jpeg|png|gif|webp|svg|avif)(\?|$)/i.test(request.url);
}

/**
 * Check if request is for a static asset
 */
function isStaticAsset(request) {
    return request.destination === 'script' ||
           request.destination === 'style' ||
           /\.(js|css|woff|woff2|ttf|otf|eot)(\?|$)/i.test(request.url);
}

/**
 * Check if request is for API
 */
function isAPIRequest(request) {
    return request.url.includes('/api/');
}

/**
 * Message handler for commands from main thread
 */
self.addEventListener('message', (event) => {
    const { type, urls } = event.data;

    switch (type) {
        case 'PRECACHE':
            event.waitUntil(
                caches.open(STATIC_CACHE)
                    .then(cache => cache.addAll(urls))
            );
            break;

        case 'CLEAR_CACHE':
            event.waitUntil(
                caches.keys()
                    .then(names => Promise.all(names.map(name => caches.delete(name))))
            );
            break;

        case 'SKIP_WAITING':
            self.skipWaiting();
            break;
    }
});
