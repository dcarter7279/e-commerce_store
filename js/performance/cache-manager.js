// Cache Management Module
// Handles various caching strategies for performance optimization

/**
 * Memory Cache
 * Fast in-memory caching with TTL support
 */
export class MemoryCache {
    constructor(options = {}) {
        this.cache = new Map();
        this.defaultTTL = options.defaultTTL || 300000; // 5 minutes
        this.maxSize = options.maxSize || 100;
    }

    /**
     * Set cache entry
     * @param {string} key - Cache key
     * @param {*} value - Value to cache
     * @param {number} ttl - Time to live in milliseconds
     */
    set(key, value, ttl = this.defaultTTL) {
        // Enforce max size
        if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }

        this.cache.set(key, {
            value,
            expires: Date.now() + ttl
        });
    }

    /**
     * Get cache entry
     * @param {string} key - Cache key
     * @returns {*} - Cached value or null
     */
    get(key) {
        const entry = this.cache.get(key);

        if (!entry) return null;

        // Check if expired
        if (Date.now() > entry.expires) {
            this.cache.delete(key);
            return null;
        }

        return entry.value;
    }

    /**
     * Check if key exists and is valid
     * @param {string} key
     * @returns {boolean}
     */
    has(key) {
        const entry = this.cache.get(key);

        if (!entry) return false;

        if (Date.now() > entry.expires) {
            this.cache.delete(key);
            return false;
        }

        return true;
    }

    /**
     * Delete cache entry
     * @param {string} key
     */
    delete(key) {
        this.cache.delete(key);
    }

    /**
     * Clear all cache
     */
    clear() {
        this.cache.clear();
    }

    /**
     * Get cache size
     * @returns {number}
     */
    size() {
        return this.cache.size;
    }

    /**
     * Clean expired entries
     */
    cleanup() {
        const now = Date.now();
        const keysToDelete = [];

        this.cache.forEach((entry, key) => {
            if (now > entry.expires) {
                keysToDelete.push(key);
            }
        });

        keysToDelete.forEach(key => this.cache.delete(key));

        return keysToDelete.length;
    }
}

/**
 * LocalStorage Cache with JSON serialization
 */
export class LocalStorageCache {
    constructor(options = {}) {
        this.prefix = options.prefix || 'cache_';
        this.defaultTTL = options.defaultTTL || 3600000; // 1 hour
    }

    /**
     * Set cache entry
     */
    set(key, value, ttl = this.defaultTTL) {
        try {
            const entry = {
                value,
                expires: Date.now() + ttl,
                created: Date.now()
            };

            localStorage.setItem(
                this.prefix + key,
                JSON.stringify(entry)
            );

            return true;
        } catch (error) {
            console.error('LocalStorage cache error:', error);
            return false;
        }
    }

    /**
     * Get cache entry
     */
    get(key) {
        try {
            const item = localStorage.getItem(this.prefix + key);

            if (!item) return null;

            const entry = JSON.parse(item);

            // Check if expired
            if (Date.now() > entry.expires) {
                this.delete(key);
                return null;
            }

            return entry.value;
        } catch (error) {
            console.error('LocalStorage cache error:', error);
            return null;
        }
    }

    /**
     * Check if key exists
     */
    has(key) {
        return this.get(key) !== null;
    }

    /**
     * Delete entry
     */
    delete(key) {
        localStorage.removeItem(this.prefix + key);
    }

    /**
     * Clear all cache entries with prefix
     */
    clear() {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith(this.prefix)) {
                localStorage.removeItem(key);
            }
        });
    }

    /**
     * Clean expired entries
     */
    cleanup() {
        const now = Date.now();
        const keys = Object.keys(localStorage);
        let cleaned = 0;

        keys.forEach(key => {
            if (!key.startsWith(this.prefix)) return;

            try {
                const entry = JSON.parse(localStorage.getItem(key));
                if (now > entry.expires) {
                    localStorage.removeItem(key);
                    cleaned++;
                }
            } catch (error) {
                // Invalid entry, remove it
                localStorage.removeItem(key);
                cleaned++;
            }
        });

        return cleaned;
    }

    /**
     * Get cache statistics
     */
    stats() {
        const keys = Object.keys(localStorage);
        const cacheKeys = keys.filter(k => k.startsWith(this.prefix));

        let totalSize = 0;
        let validEntries = 0;
        let expiredEntries = 0;

        cacheKeys.forEach(key => {
            const item = localStorage.getItem(key);
            totalSize += item.length;

            try {
                const entry = JSON.parse(item);
                if (Date.now() > entry.expires) {
                    expiredEntries++;
                } else {
                    validEntries++;
                }
            } catch {
                // Invalid entry
            }
        });

        return {
            totalEntries: cacheKeys.length,
            validEntries,
            expiredEntries,
            totalSize,
            avgSize: totalSize / cacheKeys.length || 0
        };
    }
}

/**
 * API Response Cache
 * Caches API responses with smart invalidation
 */
export class ApiCache {
    constructor(options = {}) {
        this.memoryCache = new MemoryCache({
            defaultTTL: options.ttl || 300000,
            maxSize: options.maxSize || 50
        });

        this.storageCache = new LocalStorageCache({
            prefix: 'api_',
            defaultTTL: options.persistentTTL || 3600000
        });

        this.useStorage = options.useStorage !== false;
    }

    /**
     * Generate cache key from URL and params
     */
    generateKey(url, params = {}) {
        const paramString = Object.keys(params)
            .sort()
            .map(key => `${key}=${params[key]}`)
            .join('&');

        return `${url}${paramString ? '?' + paramString : ''}`;
    }

    /**
     * Fetch with cache
     * @param {string} url - API URL
     * @param {Object} options - Fetch options
     * @returns {Promise}
     */
    async fetch(url, options = {}) {
        const {
            params = {},
            ttl,
            forceRefresh = false,
            useStorage = this.useStorage
        } = options;

        const cacheKey = this.generateKey(url, params);

        // Check memory cache first
        if (!forceRefresh) {
            const memCached = this.memoryCache.get(cacheKey);
            if (memCached) {
                return Promise.resolve(memCached);
            }

            // Check storage cache
            if (useStorage) {
                const storageCached = this.storageCache.get(cacheKey);
                if (storageCached) {
                    // Restore to memory cache
                    this.memoryCache.set(cacheKey, storageCached, ttl);
                    return Promise.resolve(storageCached);
                }
            }
        }

        // Fetch from API
        try {
            const response = await fetch(url, options.fetchOptions);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // Cache the response
            this.memoryCache.set(cacheKey, data, ttl);

            if (useStorage) {
                this.storageCache.set(cacheKey, data, ttl);
            }

            return data;
        } catch (error) {
            console.error('API fetch error:', error);
            throw error;
        }
    }

    /**
     * Invalidate cache for URL
     */
    invalidate(url, params = {}) {
        const cacheKey = this.generateKey(url, params);
        this.memoryCache.delete(cacheKey);
        this.storageCache.delete(cacheKey);
    }

    /**
     * Invalidate all cache
     */
    invalidateAll() {
        this.memoryCache.clear();
        this.storageCache.clear();
    }

    /**
     * Cleanup expired entries
     */
    cleanup() {
        this.memoryCache.cleanup();
        this.storageCache.cleanup();
    }
}

/**
 * Memoization decorator for function results
 */
export class Memoizer {
    constructor(options = {}) {
        this.cache = new Map();
        this.maxSize = options.maxSize || 100;
        this.keyGenerator = options.keyGenerator || this.defaultKeyGenerator;
    }

    defaultKeyGenerator(...args) {
        return JSON.stringify(args);
    }

    /**
     * Memoize a function
     * @param {Function} fn - Function to memoize
     * @returns {Function} - Memoized function
     */
    memoize(fn) {
        return (...args) => {
            const key = this.keyGenerator(...args);

            if (this.cache.has(key)) {
                return this.cache.get(key);
            }

            const result = fn(...args);

            // Enforce max size
            if (this.cache.size >= this.maxSize) {
                const firstKey = this.cache.keys().next().value;
                this.cache.delete(firstKey);
            }

            this.cache.set(key, result);
            return result;
        };
    }

    /**
     * Memoize async function
     */
    memoizeAsync(fn) {
        const pending = new Map();

        return async (...args) => {
            const key = this.keyGenerator(...args);

            // Return cached result
            if (this.cache.has(key)) {
                return this.cache.get(key);
            }

            // Return pending promise if already fetching
            if (pending.has(key)) {
                return pending.get(key);
            }

            // Create new promise
            const promise = fn(...args)
                .then(result => {
                    this.cache.set(key, result);
                    pending.delete(key);
                    return result;
                })
                .catch(error => {
                    pending.delete(key);
                    throw error;
                });

            pending.set(key, promise);
            return promise;
        };
    }

    /**
     * Clear cache
     */
    clear() {
        this.cache.clear();
    }
}

/**
 * Service Worker Cache Manager
 * Manages caching with Service Workers
 */
export class ServiceWorkerCache {
    constructor() {
        this.supported = 'serviceWorker' in navigator;
        this.registration = null;
    }

    /**
     * Register service worker
     * @param {string} swPath - Path to service worker file
     */
    async register(swPath = '/sw.js') {
        if (!this.supported) {
            console.warn('Service Workers not supported');
            return false;
        }

        try {
            this.registration = await navigator.serviceWorker.register(swPath);
            console.log('Service Worker registered');

            // Update on page load
            this.registration.update();

            return true;
        } catch (error) {
            console.error('Service Worker registration failed:', error);
            return false;
        }
    }

    /**
     * Unregister service worker
     */
    async unregister() {
        if (this.registration) {
            await this.registration.unregister();
            this.registration = null;
        }
    }

    /**
     * Post message to service worker
     */
    postMessage(message) {
        if (navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage(message);
        }
    }

    /**
     * Clear all caches
     */
    async clearCaches() {
        if (!('caches' in window)) return;

        const cacheNames = await caches.keys();
        await Promise.all(
            cacheNames.map(name => caches.delete(name))
        );
    }

    /**
     * Precache resources
     */
    precache(urls) {
        this.postMessage({
            type: 'PRECACHE',
            urls
        });
    }
}

/**
 * Stale-While-Revalidate Cache
 * Returns cached data immediately while fetching fresh data in background
 */
export class StaleWhileRevalidate {
    constructor() {
        this.cache = new LocalStorageCache({ prefix: 'swr_' });
    }

    /**
     * Fetch with stale-while-revalidate strategy
     * @param {string} url - URL to fetch
     * @param {Object} options - Options
     * @returns {Promise}
     */
    async fetch(url, options = {}) {
        const { onUpdate } = options;
        const cached = this.cache.get(url);

        // Return cached data immediately
        const cachedPromise = cached
            ? Promise.resolve(cached)
            : this.fetchAndCache(url);

        // Fetch fresh data in background
        this.fetchAndCache(url).then(fresh => {
            if (onUpdate && JSON.stringify(fresh) !== JSON.stringify(cached)) {
                onUpdate(fresh);
            }
        }).catch(error => {
            console.error('Background fetch failed:', error);
        });

        return cachedPromise;
    }

    async fetchAndCache(url) {
        try {
            const response = await fetch(url);
            const data = await response.json();
            this.cache.set(url, data);
            return data;
        } catch (error) {
            console.error('Fetch error:', error);
            throw error;
        }
    }

    invalidate(url) {
        this.cache.delete(url);
    }
}

/**
 * Cache with automatic cleanup
 */
export class AutoCleanCache {
    constructor(cache, cleanupInterval = 300000) {
        this.cache = cache;
        this.cleanupInterval = cleanupInterval;
        this.startAutoCleanup();
    }

    startAutoCleanup() {
        this.intervalId = setInterval(() => {
            const cleaned = this.cache.cleanup();
            if (cleaned > 0) {
                console.log(`Cleaned ${cleaned} expired cache entries`);
            }
        }, this.cleanupInterval);
    }

    stopAutoCleanup() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
    }

    // Proxy all cache methods
    get(...args) {
        return this.cache.get(...args);
    }

    set(...args) {
        return this.cache.set(...args);
    }

    has(...args) {
        return this.cache.has(...args);
    }

    delete(...args) {
        return this.cache.delete(...args);
    }

    clear(...args) {
        return this.cache.clear(...args);
    }
}

// Export singleton instances
export const memoryCache = new MemoryCache();
export const storageCache = new LocalStorageCache();
export const apiCache = new ApiCache();
export const memoizer = new Memoizer();
export const swCache = new ServiceWorkerCache();
export const swrCache = new StaleWhileRevalidate();

// Auto-cleanup for storage cache
export const autoCleanStorage = new AutoCleanCache(storageCache, 600000); // 10 minutes
