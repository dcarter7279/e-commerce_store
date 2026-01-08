// Image Optimization Module
// Handles lazy loading, responsive images, and image optimization

/**
 * Lazy load images using Intersection Observer
 * Images should have data-src instead of src attribute
 */
export class LazyImageLoader {
    constructor(options = {}) {
        this.options = {
            root: null,
            rootMargin: '50px',
            threshold: 0.01,
            loadingClass: 'lazy-loading',
            loadedClass: 'lazy-loaded',
            errorClass: 'lazy-error',
            ...options
        };

        this.observer = null;
        this.init();
    }

    init() {
        if (!('IntersectionObserver' in window)) {
            // Fallback for older browsers
            this.loadAllImages();
            return;
        }

        this.observer = new IntersectionObserver(
            this.handleIntersection.bind(this),
            {
                root: this.options.root,
                rootMargin: this.options.rootMargin,
                threshold: this.options.threshold
            }
        );

        this.observeImages();
    }

    handleIntersection(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                this.loadImage(entry.target);
                this.observer.unobserve(entry.target);
            }
        });
    }

    loadImage(img) {
        const src = img.dataset.src;
        const srcset = img.dataset.srcset;

        if (!src && !srcset) return;

        img.classList.add(this.options.loadingClass);

        // Create new image to preload
        const loader = new Image();

        loader.onload = () => {
            this.applyImage(img, src, srcset);
            img.classList.remove(this.options.loadingClass);
            img.classList.add(this.options.loadedClass);

            // Dispatch custom event
            img.dispatchEvent(new CustomEvent('imageLoaded', { detail: { src } }));
        };

        loader.onerror = () => {
            img.classList.remove(this.options.loadingClass);
            img.classList.add(this.options.errorClass);

            // Apply fallback image if available
            if (img.dataset.fallback) {
                this.applyImage(img, img.dataset.fallback, null);
            }

            img.dispatchEvent(new CustomEvent('imageError', { detail: { src } }));
        };

        // Start loading
        if (srcset) {
            loader.srcset = srcset;
        }
        loader.src = src;
    }

    applyImage(img, src, srcset) {
        if (srcset) {
            img.srcset = srcset;
        }
        img.src = src;

        // Remove data attributes to prevent reloading
        delete img.dataset.src;
        delete img.dataset.srcset;
    }

    observeImages() {
        const images = document.querySelectorAll('img[data-src]');
        images.forEach(img => this.observer.observe(img));
    }

    loadAllImages() {
        // Fallback for browsers without IntersectionObserver
        const images = document.querySelectorAll('img[data-src]');
        images.forEach(img => this.loadImage(img));
    }

    disconnect() {
        if (this.observer) {
            this.observer.disconnect();
        }
    }

    observe(element) {
        if (this.observer && element.dataset.src) {
            this.observer.observe(element);
        }
    }
}

/**
 * Generate responsive image srcset
 * @param {string} baseUrl - Base image URL
 * @param {Array} widths - Array of widths to generate
 * @returns {string} - Srcset string
 */
export function generateSrcset(baseUrl, widths = [320, 640, 960, 1280, 1920]) {
    return widths
        .map(width => `${baseUrl}?w=${width} ${width}w`)
        .join(', ');
}

/**
 * Generate sizes attribute for responsive images
 * @param {Object} breakpoints - Object with breakpoint: size pairs
 * @returns {string} - Sizes string
 */
export function generateSizes(breakpoints = {
    '(max-width: 480px)': '100vw',
    '(max-width: 768px)': '50vw',
    '(max-width: 1024px)': '33vw'
}) {
    const sizes = Object.entries(breakpoints)
        .map(([media, size]) => `${media} ${size}`)
        .join(', ');

    return sizes + ', 25vw'; // Default size
}

/**
 * Create optimized image element
 * @param {Object} config - Image configuration
 * @returns {HTMLImageElement}
 */
export function createOptimizedImage(config) {
    const {
        src,
        alt = '',
        lazy = true,
        widths = [320, 640, 960, 1280],
        sizes = null,
        className = '',
        fallback = null
    } = config;

    const img = document.createElement('img');
    img.alt = alt;

    if (className) {
        img.className = className;
    }

    if (lazy) {
        // Use data attributes for lazy loading
        img.dataset.src = src;

        if (widths && widths.length > 0) {
            img.dataset.srcset = generateSrcset(src, widths);
        }

        if (fallback) {
            img.dataset.fallback = fallback;
        }

        // Use low-quality placeholder
        img.src = createPlaceholder(100, 100);

        if (sizes) {
            img.sizes = typeof sizes === 'string' ? sizes : generateSizes(sizes);
        }
    } else {
        // Load immediately
        img.src = src;

        if (widths && widths.length > 0) {
            img.srcset = generateSrcset(src, widths);
        }

        if (sizes) {
            img.sizes = typeof sizes === 'string' ? sizes : generateSizes(sizes);
        }
    }

    return img;
}

/**
 * Create placeholder image (data URL)
 * @param {number} width - Placeholder width
 * @param {number} height - Placeholder height
 * @param {string} color - Background color
 * @returns {string} - Data URL
 */
export function createPlaceholder(width = 100, height = 100, color = '#f0f0f0') {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, width, height);

    return canvas.toDataURL();
}

/**
 * Preload critical images
 * @param {Array<string>} urls - Array of image URLs to preload
 * @returns {Promise} - Resolves when all images are loaded
 */
export function preloadImages(urls) {
    const promises = urls.map(url => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(url);
            img.onerror = () => reject(url);
            img.src = url;
        });
    });

    return Promise.allSettled(promises);
}

/**
 * Get optimal image format support
 * @returns {Promise<Object>} - Supported formats
 */
export async function detectImageFormats() {
    const formats = {
        webp: false,
        avif: false,
        jpeg2000: false
    };

    // Check WebP support
    formats.webp = await checkImageFormat('data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAwA0JaQAA3AA/vuUAAA=');

    // Check AVIF support
    formats.avif = await checkImageFormat('data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgANogQEAwgMg8f8D///8WfhwB8+ErK42A=');

    return formats;
}

/**
 * Check if image format is supported
 * @param {string} dataUrl - Data URL of test image
 * @returns {Promise<boolean>}
 */
function checkImageFormat(dataUrl) {
    return new Promise(resolve => {
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = dataUrl;
    });
}

/**
 * Get optimized image URL based on supported formats
 * @param {string} baseUrl - Base image URL
 * @param {Object} formats - Supported formats from detectImageFormats()
 * @returns {string} - Optimized URL
 */
export function getOptimizedImageUrl(baseUrl, formats) {
    if (formats.avif) {
        return `${baseUrl}?format=avif`;
    } else if (formats.webp) {
        return `${baseUrl}?format=webp`;
    }
    return baseUrl;
}

/**
 * Background image lazy loader
 * For elements with background images
 */
export class BackgroundImageLoader {
    constructor(options = {}) {
        this.options = {
            rootMargin: '50px',
            threshold: 0.01,
            ...options
        };

        this.observer = null;
        this.init();
    }

    init() {
        if (!('IntersectionObserver' in window)) {
            this.loadAllBackgrounds();
            return;
        }

        this.observer = new IntersectionObserver(
            this.handleIntersection.bind(this),
            {
                rootMargin: this.options.rootMargin,
                threshold: this.options.threshold
            }
        );

        this.observeElements();
    }

    handleIntersection(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                this.loadBackground(entry.target);
                this.observer.unobserve(entry.target);
            }
        });
    }

    loadBackground(element) {
        const bgUrl = element.dataset.bgSrc;

        if (!bgUrl) return;

        // Preload the image
        const img = new Image();
        img.onload = () => {
            element.style.backgroundImage = `url('${bgUrl}')`;
            element.classList.add('bg-loaded');
            delete element.dataset.bgSrc;
        };

        img.src = bgUrl;
    }

    observeElements() {
        const elements = document.querySelectorAll('[data-bg-src]');
        elements.forEach(el => this.observer.observe(el));
    }

    loadAllBackgrounds() {
        const elements = document.querySelectorAll('[data-bg-src]');
        elements.forEach(el => this.loadBackground(el));
    }

    disconnect() {
        if (this.observer) {
            this.observer.disconnect();
        }
    }
}

/**
 * Progressive image loading with blur effect
 * Loads a tiny blurred placeholder first, then the full image
 */
export class ProgressiveImageLoader {
    constructor(container, config) {
        this.container = container;
        this.config = {
            thumbnailSrc: config.thumbnailSrc,
            fullSrc: config.fullSrc,
            alt: config.alt || '',
            className: config.className || ''
        };

        this.init();
    }

    init() {
        // Create thumbnail (blurred)
        const thumbnail = new Image();
        thumbnail.src = this.config.thumbnailSrc;
        thumbnail.alt = this.config.alt;
        thumbnail.className = `progressive-thumbnail ${this.config.className}`;
        thumbnail.style.filter = 'blur(10px)';

        this.container.appendChild(thumbnail);

        // Load full image
        const fullImage = new Image();
        fullImage.onload = () => {
            fullImage.alt = this.config.alt;
            fullImage.className = `progressive-full ${this.config.className}`;
            this.container.appendChild(fullImage);

            // Fade in full image
            fullImage.classList.add('loaded');

            // Remove thumbnail after transition
            setTimeout(() => {
                this.container.removeChild(thumbnail);
            }, 500);
        };

        fullImage.src = this.config.fullSrc;
    }
}

/**
 * Image performance metrics
 */
export class ImageMetrics {
    static trackImageLoad(img) {
        const startTime = performance.now();

        return new Promise((resolve) => {
            if (img.complete) {
                resolve({
                    url: img.src,
                    loadTime: 0,
                    cached: true,
                    size: { width: img.naturalWidth, height: img.naturalHeight }
                });
                return;
            }

            img.addEventListener('load', () => {
                const loadTime = performance.now() - startTime;
                resolve({
                    url: img.src,
                    loadTime,
                    cached: false,
                    size: { width: img.naturalWidth, height: img.naturalHeight }
                });
            });

            img.addEventListener('error', () => {
                resolve({
                    url: img.src,
                    loadTime: performance.now() - startTime,
                    error: true
                });
            });
        });
    }

    static async analyzePageImages() {
        const images = Array.from(document.querySelectorAll('img'));
        const metrics = await Promise.all(
            images.map(img => this.trackImageLoad(img))
        );

        const totalLoadTime = metrics.reduce((sum, m) => sum + (m.loadTime || 0), 0);
        const avgLoadTime = totalLoadTime / metrics.length;
        const cached = metrics.filter(m => m.cached).length;
        const errors = metrics.filter(m => m.error).length;

        return {
            totalImages: metrics.length,
            totalLoadTime,
            avgLoadTime,
            cached,
            errors,
            metrics
        };
    }
}

// Export singleton instance for easy use
export const lazyLoader = new LazyImageLoader();
export const bgLoader = new BackgroundImageLoader();
