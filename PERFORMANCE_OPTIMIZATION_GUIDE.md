# Performance Optimization Guide

Complete guide to optimizing the performance of your e-commerce site through image optimization, lazy loading, code splitting, caching, and monitoring.

## Table of Contents

1. [Overview](#overview)
2. [Image Optimization](#image-optimization)
3. [Lazy Loading](#lazy-loading)
4. [Code Splitting & Dynamic Imports](#code-splitting--dynamic-imports)
5. [Caching Strategies](#caching-strategies)
6. [Performance Monitoring](#performance-monitoring)
7. [Service Workers](#service-workers)
8. [Best Practices](#best-practices)
9. [Performance Checklist](#performance-checklist)

---

## Overview

Performance optimization is crucial for e-commerce sites. Studies show:
- **53%** of mobile users abandon sites that take longer than 3 seconds to load
- **1 second** delay in page load can reduce conversions by 7%
- **Fast sites** rank higher in search results

### Performance Modules

- **[js/performance/image-optimizer.js](js/performance/image-optimizer.js)** - Image lazy loading and optimization
- **[js/performance/lazy-loader.js](js/performance/lazy-loader.js)** - Content and module lazy loading
- **[js/performance/cache-manager.js](js/performance/cache-manager.js)** - Caching strategies
- **[js/performance/performance-monitor.js](js/performance/performance-monitor.js)** - Performance tracking
- **[sw.js](sw.js)** - Service Worker for offline caching

---

## Image Optimization

Images typically account for 50-70% of page weight. Optimizing them is critical.

### Lazy Loading Images

**Basic Implementation:**

```html
<!-- Instead of: -->
<img src="product.jpg" alt="Product">

<!-- Use: -->
<img data-src="product.jpg" alt="Product" class="lazy">
```

```javascript
import { LazyImageLoader } from './js/performance/image-optimizer.js';

// Initialize lazy loading
const lazyLoader = new LazyImageLoader({
    rootMargin: '50px',    // Load 50px before entering viewport
    threshold: 0.01,
    loadingClass: 'lazy-loading',
    loadedClass: 'lazy-loaded'
});
```

### Responsive Images

Generate responsive images with srcset:

```javascript
import { generateSrcset, generateSizes, createOptimizedImage } from './js/performance/image-optimizer.js';

const img = createOptimizedImage({
    src: 'product.jpg',
    alt: 'Product Name',
    lazy: true,
    widths: [320, 640, 960, 1280, 1920],
    sizes: {
        '(max-width: 480px)': '100vw',
        '(max-width: 768px)': '50vw',
        '(max-width: 1024px)': '33vw'
    }
});

document.getElementById('container').appendChild(img);
```

Generated HTML:

```html
<img
    data-src="product.jpg"
    data-srcset="product.jpg?w=320 320w, product.jpg?w=640 640w, ..."
    sizes="(max-width: 480px) 100vw, (max-width: 768px) 50vw, 25vw"
    alt="Product Name"
>
```

### Background Image Lazy Loading

```html
<div data-bg-src="hero-image.jpg" class="hero-section"></div>
```

```javascript
import { BackgroundImageLoader } from './js/performance/image-optimizer.js';

const bgLoader = new BackgroundImageLoader();
```

### Progressive Image Loading

Load blurred thumbnail first, then full image:

```javascript
import { ProgressiveImageLoader } from './js/performance/image-optimizer.js';

new ProgressiveImageLoader(container, {
    thumbnailSrc: 'product-thumb.jpg',  // Tiny, blurred version
    fullSrc: 'product-full.jpg',        // Full resolution
    alt: 'Product'
});
```

### Modern Image Formats

Detect and use modern formats (WebP, AVIF):

```javascript
import { detectImageFormats, getOptimizedImageUrl } from './js/performance/image-optimizer.js';

const formats = await detectImageFormats();

if (formats.avif) {
    console.log('Browser supports AVIF!');
}

const optimizedUrl = getOptimizedImageUrl('product.jpg', formats);
// Returns: product.jpg?format=avif (if supported)
```

### Image Preloading

Preload critical images:

```javascript
import { preloadImages } from './js/performance/image-optimizer.js';

// Preload hero images
await preloadImages([
    '/images/hero-1.jpg',
    '/images/hero-2.jpg'
]);
```

### Image Performance Metrics

Track image loading performance:

```javascript
import { ImageMetrics } from './js/performance/image-optimizer.js';

const img = document.querySelector('img');
const metrics = await ImageMetrics.trackImageLoad(img);

console.log(metrics);
// {
//     url: 'product.jpg',
//     loadTime: 234,
//     cached: false,
//     size: { width: 800, height: 600 }
// }

// Analyze all images on page
const pageMetrics = await ImageMetrics.analyzePageImages();
console.log(`Average load time: ${pageMetrics.avgLoadTime}ms`);
```

---

## Lazy Loading

Lazy load content, components, and modules to reduce initial bundle size.

### Content Lazy Loading

Load HTML content when elements come into view:

```html
<div data-lazy-content="/partials/reviews.html"></div>
```

```javascript
import { LazyContentLoader } from './js/performance/lazy-loader.js';

const contentLoader = new LazyContentLoader({
    rootMargin: '100px',
    threshold: 0.1
});
```

### Component Lazy Loading

Load JavaScript components dynamically:

```html
<div data-lazy-component="components/product-carousel"></div>
```

The component module will be loaded when the element enters the viewport.

### Module Lazy Loading

Load modules on demand:

```javascript
import { ModuleLoader } from './js/performance/lazy-loader.js';

const loader = new ModuleLoader();

// Load when needed
const module = await loader.load('./js/advanced-features.js');

// Preload in background
loader.preload([
    './js/checkout.js',
    './js/payment.js'
]);
```

### Route-Based Code Splitting

Load different modules per page:

```javascript
import { RouteBasedLoader } from './js/performance/lazy-loader.js';

const routeLoader = new RouteBasedLoader();

// Register routes
routeLoader.register('index', './js/home-page.js');
routeLoader.register('product-detail', './js/product-detail-page.js');
routeLoader.register('cart', './js/cart-page.js');
routeLoader.register('checkout', './js/checkout-page.js');

// Load module for current route
await routeLoader.loadCurrentRoute();

// Preload likely next routes
routeLoader.preloadRoutes(['product-detail', 'cart']);
```

### Viewport-Based Module Loading

Load modules when elements enter viewport:

```html
<section data-load-module="./js/reviews-section.js">
    <!-- Reviews will load when section is visible -->
</section>
```

```javascript
import { ViewportModuleLoader } from './js/performance/lazy-loader.js';

const viewportLoader = new ViewportModuleLoader();
viewportLoader.observeAll();
```

### Deferred Script Loading

Load non-critical scripts after page load:

```javascript
import { DeferredScriptLoader } from './js/performance/lazy-loader.js';

const scriptLoader = new DeferredScriptLoader();

// Load analytics after page load
scriptLoader.add({
    src: 'https://analytics.example.com/script.js',
    priority: 'low',
    async: true,
    onLoad: () => console.log('Analytics loaded')
});

// Load multiple scripts
await scriptLoader.loadAll([
    { src: '/js/social-share.js', priority: 'low' },
    { src: '/js/chat-widget.js', priority: 'medium' }
]);
```

### Resource Prefetching

Prefetch resources for next navigation:

```javascript
import { ResourcePrefetcher } from './js/performance/lazy-loader.js';

const prefetcher = new ResourcePrefetcher();

// Prefetch next page
prefetcher.prefetch('/product-detail.html', 'document');

// Preconnect to third-party domains
prefetcher.preconnect('https://cdn.example.com');

// DNS prefetch
prefetcher.dnsPrefetch('https://analytics.example.com');

// Auto-prefetch on hover
prefetcher.enableHoverPrefetch();

// Prefetch visible links
prefetcher.prefetchVisibleLinks();
```

### Idle Task Scheduling

Run non-critical tasks when browser is idle:

```javascript
import { IdleTaskScheduler } from './js/performance/lazy-loader.js';

const scheduler = new IdleTaskScheduler();

// Schedule low-priority task
scheduler.schedule(() => {
    console.log('Running when idle...');
    // Cleanup, analytics, etc.
}, { priority: 'low', timeout: 2000 });

// Schedule multiple tasks
scheduler.scheduleAll([
    () => console.log('Task 1'),
    () => console.log('Task 2'),
    () => console.log('Task 3')
]);
```

---

## Code Splitting & Dynamic Imports

### Basic Dynamic Import

```javascript
// Instead of:
import { heavyModule } from './heavy-module.js';

// Use:
button.addEventListener('click', async () => {
    const { heavyModule } = await import('./heavy-module.js');
    heavyModule.doSomething();
});
```

### Feature-Based Splitting

```javascript
// app.js
document.getElementById('show-reviews').addEventListener('click', async () => {
    const { renderReviews } = await import('./js/reviews.js');
    renderReviews();
});

document.getElementById('compare-products').addEventListener('click', async () => {
    const { renderComparison } = await import('./js/compare.js');
    renderComparison();
});
```

### Vendor Code Splitting

Separate vendor code from application code:

```javascript
// vendors.js - Loaded first
export { default as axios } from 'axios';
export { default as moment } from 'moment';

// app.js - Loaded after
import { axios, moment } from './vendors.js';
```

### Route-Based Splitting

```javascript
// router.js
const routes = {
    '/': () => import('./pages/home.js'),
    '/products': () => import('./pages/products.js'),
    '/cart': () => import('./pages/cart.js'),
    '/checkout': () => import('./pages/checkout.js')
};

async function loadRoute(path) {
    const loadModule = routes[path];
    if (loadModule) {
        const module = await loadModule();
        module.init();
    }
}
```

### Component Lazy Loading

```javascript
class ProductCard {
    async loadAdvancedFeatures() {
        if (!this.advancedLoaded) {
            const { comparison, wishlist } = await import('./product-features.js');
            this.comparison = comparison;
            this.wishlist = wishlist;
            this.advancedLoaded = true;
        }
    }
}
```

---

## Caching Strategies

### Memory Cache

Fast in-memory caching with TTL:

```javascript
import { MemoryCache } from './js/performance/cache-manager.js';

const cache = new MemoryCache({
    defaultTTL: 300000,  // 5 minutes
    maxSize: 100
});

// Set cache
cache.set('products', productsData, 600000);  // 10 minutes

// Get cache
const products = cache.get('products');

// Check if exists
if (cache.has('products')) {
    // Use cached data
}

// Cleanup expired entries
cache.cleanup();
```

### LocalStorage Cache

Persistent caching with JSON serialization:

```javascript
import { LocalStorageCache } from './js/performance/cache-manager.js';

const cache = new LocalStorageCache({
    prefix: 'app_',
    defaultTTL: 3600000  // 1 hour
});

cache.set('userSettings', settings);
const settings = cache.get('userSettings');

// Get statistics
const stats = cache.stats();
console.log(`Valid entries: ${stats.validEntries}`);
console.log(`Total size: ${stats.totalSize} bytes`);
```

### API Response Caching

```javascript
import { ApiCache } from './js/performance/cache-manager.js';

const apiCache = new ApiCache({
    ttl: 300000,           // 5 minutes memory cache
    persistentTTL: 3600000, // 1 hour storage cache
    useStorage: true
});

// Fetch with cache
const products = await apiCache.fetch('/api/products', {
    params: { category: 'electronics' },
    ttl: 600000  // Override default TTL
});

// Force refresh
const fresh = await apiCache.fetch('/api/products', {
    forceRefresh: true
});

// Invalidate cache
apiCache.invalidate('/api/products');
```

### Memoization

Cache function results:

```javascript
import { Memoizer } from './js/performance/cache-manager.js';

const memoizer = new Memoizer({ maxSize: 50 });

// Memoize expensive calculation
const expensiveCalc = (a, b) => {
    console.log('Calculating...');
    return a * b * 1000;
};

const memoized = memoizer.memoize(expensiveCalc);

console.log(memoized(5, 10));  // Calculating... 50000
console.log(memoized(5, 10));  // 50000 (cached, no log)

// Memoize async function
const fetchUser = async (id) => {
    const response = await fetch(`/api/users/${id}`);
    return response.json();
};

const memoizedFetch = memoizer.memoizeAsync(fetchUser);

await memoizedFetch(123);  // Fetches from API
await memoizedFetch(123);  // Returns cached
```

### Stale-While-Revalidate

Return cached data immediately while fetching fresh data in background:

```javascript
import { StaleWhileRevalidate } from './js/performance/cache-manager.js';

const swrCache = new StaleWhileRevalidate();

const data = await swrCache.fetch('/api/products', {
    onUpdate: (freshData) => {
        console.log('Fresh data received:', freshData);
        updateUI(freshData);
    }
});

// Returns cached data immediately
// Fetches fresh data in background
// Calls onUpdate when fresh data arrives
```

### Auto-Cleanup Cache

Automatically cleanup expired entries:

```javascript
import { AutoCleanCache, LocalStorageCache } from './js/performance/cache-manager.js';

const storageCache = new LocalStorageCache();
const autoCache = new AutoCleanCache(storageCache, 600000);  // Cleanup every 10 min

// Use normally
autoCache.set('key', 'value');
const value = autoCache.get('key');

// Automatically cleans expired entries
```

---

## Performance Monitoring

### Core Web Vitals

Monitor LCP, FID, CLS, FCP, TTFB:

```javascript
import { WebVitalsMonitor } from './js/performance/performance-monitor.js';

const monitor = new WebVitalsMonitor({
    onReport: (metrics) => {
        console.log('Core Web Vitals:', metrics);
        // Send to analytics
    },
    reportInterval: 30000  // Report every 30 seconds
});

// Get current metrics
const metrics = monitor.getMetrics();
console.log(`LCP: ${metrics.lcp}ms`);
console.log(`FID: ${metrics.fid}ms`);
console.log(`CLS: ${metrics.cls}`);

// Check scores
const scores = monitor.getScores();
console.log(`LCP Score: ${scores.lcp}`);  // 'good', 'needs-improvement', or 'poor'
```

### Resource Monitoring

Track resource load times:

```javascript
import { ResourceMonitor } from './js/performance/performance-monitor.js';

const resourceMonitor = new ResourceMonitor();

// Collect resource data
resourceMonitor.collect();

// Get statistics
const stats = resourceMonitor.getStats();
console.log(`Total resources: ${stats.total}`);
console.log(`Total size: ${stats.totalSize} bytes`);
console.log(`Cache rate: ${stats.cacheRate}%`);
console.log('By type:', stats.byType);

// Find slow resources
const slow = resourceMonitor.findSlowResources(1000);  // Over 1 second
console.log('Slow resources:', slow);

// Find large resources
const large = resourceMonitor.findLargeResources(100000);  // Over 100KB
console.log('Large resources:', large);
```

### Page Load Metrics

```javascript
import { PageLoadMonitor } from './js/performance/performance-monitor.js';

const pageMonitor = new PageLoadMonitor();
const metrics = pageMonitor.getMetrics();

console.log(`DNS Lookup: ${metrics.dns}ms`);
console.log(`TCP Connection: ${metrics.tcp}ms`);
console.log(`Request Time: ${metrics.request}ms`);
console.log(`DOM Processing: ${metrics.domProcessing}ms`);
console.log(`Total Load Time: ${metrics.totalTime}ms`);
```

### Frame Rate Monitoring

Track rendering performance (FPS):

```javascript
import { FrameRateMonitor } from './js/performance/performance-monitor.js';

const fpsMonitor = new FrameRateMonitor();

fpsMonitor.start();

// Get current FPS
setInterval(() => {
    const fps = fpsMonitor.getFPS();
    console.log(`Current FPS: ${fps}`);
}, 1000);

// Get statistics
const stats = fpsMonitor.getStats();
console.log(`Avg FPS: ${stats.avg}`);
console.log(`Min FPS: ${stats.min}`);
console.log(`Max FPS: ${stats.max}`);

fpsMonitor.stop();
```

### Memory Monitoring

```javascript
import { MemoryMonitor } from './js/performance/performance-monitor.js';

const memoryMonitor = new MemoryMonitor();

if (memoryMonitor.supported) {
    const usage = memoryMonitor.getUsage();
    console.log(`Used: ${(usage.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Total: ${(usage.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Limit: ${(usage.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`);

    if (memoryMonitor.isHighUsage(80)) {
        console.warn('High memory usage detected!');
    }
}
```

### Performance Budget

Validate performance against budgets:

```javascript
import { PerformanceBudget } from './js/performance/performance-monitor.js';

const budget = new PerformanceBudget({
    lcp: 2500,        // 2.5 seconds
    fid: 100,         // 100ms
    cls: 0.1,
    totalSize: 500000, // 500KB
    imageSize: 200000, // 200KB
    scriptSize: 150000 // 150KB
});

const result = await budget.check();

if (!result.passed) {
    console.error('Performance budget violations:');
    console.log(budget.generateReport());
}
```

---

## Service Workers

### Register Service Worker

```javascript
import { ServiceWorkerCache } from './js/performance/cache-manager.js';

const swCache = new ServiceWorkerCache();

// Register
await swCache.register('/sw.js');

// Precache resources
swCache.precache([
    '/css/critical.css',
    '/js/app.js'
]);

// Clear all caches
await swCache.clearCaches();
```

### Service Worker Implementation

The included [sw.js](sw.js) implements:

1. **Cache First** - For static assets (CSS, JS, fonts)
2. **Network First** - For API requests
3. **Stale While Revalidate** - For HTML pages

### Offline Support

```javascript
// sw.js automatically caches resources

// Handle offline in your app
window.addEventListener('online', () => {
    console.log('Back online!');
    // Sync data
});

window.addEventListener('offline', () => {
    console.log('Offline');
    // Show offline UI
});
```

---

## Best Practices

### 1. Critical Rendering Path

**Inline critical CSS:**

```html
<head>
    <style>
        /* Critical above-the-fold CSS */
        .hero { /* ... */ }
        .nav { /* ... */ }
    </style>

    <!-- Load non-critical CSS async -->
    <link rel="preload" href="styles.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
    <noscript><link rel="stylesheet" href="styles.css"></noscript>
</head>
```

**Defer non-critical JavaScript:**

```html
<script defer src="app.js"></script>
```

### 2. Resource Hints

```html
<head>
    <!-- DNS Prefetch -->
    <link rel="dns-prefetch" href="https://cdn.example.com">

    <!-- Preconnect -->
    <link rel="preconnect" href="https://api.example.com">

    <!-- Prefetch next page -->
    <link rel="prefetch" href="/product-detail.html">

    <!-- Preload critical resources -->
    <link rel="preload" href="hero-image.jpg" as="image">
</head>
```

### 3. Image Best Practices

- Use **WebP/AVIF** formats when supported
- Implement **lazy loading** for below-the-fold images
- Use **responsive images** with srcset
- Serve images at **appropriate sizes** (don't use CSS to resize)
- Compress images (**80-85%** quality is usually sufficient)
- Use **CDN** for image delivery

### 4. JavaScript Best Practices

- **Code split** by route and feature
- **Defer** non-critical scripts
- **Minify** and **compress** (gzip/brotli)
- **Tree shake** unused code
- Use **dynamic imports** for heavy modules
- Implement **lazy loading** for components

### 5. CSS Best Practices

- **Inline critical CSS** (above-the-fold)
- **Remove unused CSS** (PurgeCSS, UnCSS)
- **Minify** CSS
- Use **CSS containment** for performance isolation
- Avoid **@import** in CSS (use build tools)

### 6. Caching Strategy

| Resource Type | Strategy | Cache Duration |
|--------------|----------|----------------|
| HTML Pages | Stale-While-Revalidate | 1 hour |
| Static Assets (versioned) | Cache First | 1 year |
| API Responses | Network First | 5 minutes |
| Images | Cache First | 30 days |
| Fonts | Cache First | 1 year |

### 7. Performance Monitoring

- Track **Core Web Vitals** (LCP, FID, CLS)
- Monitor **resource sizes** and **load times**
- Set **performance budgets**
- Use **Real User Monitoring** (RUM)
- Implement **synthetic monitoring**

---

## Performance Checklist

### Images
- [ ] Lazy load images below the fold
- [ ] Use responsive images (srcset)
- [ ] Use modern formats (WebP, AVIF)
- [ ] Optimize image sizes
- [ ] Compress images (80-85% quality)
- [ ] Use CDN for delivery
- [ ] Implement progressive loading

### JavaScript
- [ ] Code split by route
- [ ] Defer non-critical scripts
- [ ] Minify and compress
- [ ] Tree shake unused code
- [ ] Use dynamic imports
- [ ] Implement lazy loading
- [ ] Remove console.logs in production

### CSS
- [ ] Inline critical CSS
- [ ] Remove unused CSS
- [ ] Minify CSS
- [ ] Defer non-critical CSS
- [ ] Use CSS containment
- [ ] Optimize animations (use transform/opacity)

### Caching
- [ ] Implement Service Worker
- [ ] Cache static assets
- [ ] Cache API responses
- [ ] Set appropriate cache headers
- [ ] Use stale-while-revalidate
- [ ] Implement auto-cleanup

### Fonts
- [ ] Use system fonts when possible
- [ ] Subset custom fonts
- [ ] Use font-display: swap
- [ ] Preload critical fonts
- [ ] Self-host fonts

### Third-Party Scripts
- [ ] Defer/async third-party scripts
- [ ] Use facades for heavy widgets
- [ ] Audit and remove unused scripts
- [ ] Use resource hints (dns-prefetch, preconnect)

### Monitoring
- [ ] Track Core Web Vitals
- [ ] Set performance budgets
- [ ] Monitor resource sizes
- [ ] Track page load times
- [ ] Implement error tracking

### Network
- [ ] Use HTTP/2 or HTTP/3
- [ ] Enable compression (gzip/brotli)
- [ ] Minimize redirects
- [ ] Use CDN
- [ ] Optimize API responses

### Mobile
- [ ] Test on real devices
- [ ] Optimize for 3G/4G
- [ ] Reduce JavaScript execution
- [ ] Minimize main thread work
- [ ] Avoid layout thrashing

---

## Quick Wins

### 1. Enable Text Compression

```javascript
// Express.js
const compression = require('compression');
app.use(compression());
```

### 2. Add Cache Headers

```javascript
// Express.js
app.use(express.static('public', {
    maxAge: '1y',
    immutable: true
}));
```

### 3. Preload Critical Resources

```html
<link rel="preload" href="critical.css" as="style">
<link rel="preload" href="hero.jpg" as="image">
```

### 4. Use Async/Defer for Scripts

```html
<script async src="analytics.js"></script>
<script defer src="app.js"></script>
```

### 5. Implement Lazy Loading

```javascript
import { lazyLoader } from './js/performance/image-optimizer.js';
// All images with data-src are now lazy loaded
```

---

## Measuring Improvement

### Before Optimization

1. Run Lighthouse audit
2. Record Web Vitals
3. Measure page load time
4. Check resource sizes
5. Monitor FPS

### After Optimization

1. Re-run Lighthouse
2. Compare Web Vitals
3. Verify improvements
4. Check budget compliance
5. Monitor in production

### Tools

- **Lighthouse** - Overall performance audit
- **WebPageTest** - Detailed waterfall analysis
- **Chrome DevTools** - Performance profiling
- **Web Vitals Extension** - Real-time metrics
- **Bundle Analyzer** - JavaScript bundle analysis

---

## Summary

Performance optimization is an ongoing process:

1. **Measure** - Use monitoring tools
2. **Optimize** - Apply techniques systematically
3. **Validate** - Check improvements
4. **Monitor** - Track over time
5. **Iterate** - Continuously improve

### Key Metrics to Target

| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| LCP | < 2.5s | 2.5s - 4s | > 4s |
| FID | < 100ms | 100ms - 300ms | > 300ms |
| CLS | < 0.1 | 0.1 - 0.25 | > 0.25 |
| FCP | < 1.8s | 1.8s - 3s | > 3s |
| TTFB | < 800ms | 800ms - 1800ms | > 1800ms |

Start with the techniques that provide the biggest impact for your specific use case!
