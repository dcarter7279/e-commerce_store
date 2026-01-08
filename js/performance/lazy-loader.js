// Lazy Loading Module
// Handles lazy loading of content, components, and modules

/**
 * Lazy load content sections using Intersection Observer
 */
export class LazyContentLoader {
    constructor(options = {}) {
        this.options = {
            rootMargin: '100px',
            threshold: 0.1,
            loadingClass: 'content-loading',
            loadedClass: 'content-loaded',
            ...options
        };

        this.observer = null;
        this.init();
    }

    init() {
        if (!('IntersectionObserver' in window)) {
            this.loadAllContent();
            return;
        }

        this.observer = new IntersectionObserver(
            this.handleIntersection.bind(this),
            {
                rootMargin: this.options.rootMargin,
                threshold: this.options.threshold
            }
        );

        this.observeContent();
    }

    handleIntersection(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                this.loadContent(entry.target);
                this.observer.unobserve(entry.target);
            }
        });
    }

    async loadContent(element) {
        element.classList.add(this.options.loadingClass);

        const contentSrc = element.dataset.lazyContent;
        const componentName = element.dataset.lazyComponent;

        try {
            if (contentSrc) {
                // Load HTML content from URL
                const response = await fetch(contentSrc);
                const html = await response.text();
                element.innerHTML = html;
            } else if (componentName) {
                // Load JavaScript component dynamically
                await this.loadComponent(element, componentName);
            }

            element.classList.remove(this.options.loadingClass);
            element.classList.add(this.options.loadedClass);
            element.dispatchEvent(new CustomEvent('contentLoaded'));
        } catch (error) {
            console.error('Error loading content:', error);
            element.classList.remove(this.options.loadingClass);
            element.classList.add('content-error');
        }
    }

    async loadComponent(element, componentName) {
        // Dynamic import of component
        const module = await import(`../${componentName}.js`);

        if (module.default) {
            const component = new module.default(element);
            if (component.render) {
                component.render();
            }
        } else if (module.render) {
            module.render(element);
        }
    }

    observeContent() {
        const elements = document.querySelectorAll('[data-lazy-content], [data-lazy-component]');
        elements.forEach(el => this.observer.observe(el));
    }

    loadAllContent() {
        const elements = document.querySelectorAll('[data-lazy-content], [data-lazy-component]');
        elements.forEach(el => this.loadContent(el));
    }

    disconnect() {
        if (this.observer) {
            this.observer.disconnect();
        }
    }
}

/**
 * Lazy load JavaScript modules on demand
 */
export class ModuleLoader {
    constructor() {
        this.loadedModules = new Map();
        this.loadingModules = new Map();
    }

    /**
     * Load module dynamically
     * @param {string} modulePath - Path to module
     * @returns {Promise} - Module exports
     */
    async load(modulePath) {
        // Check if already loaded
        if (this.loadedModules.has(modulePath)) {
            return this.loadedModules.get(modulePath);
        }

        // Check if currently loading
        if (this.loadingModules.has(modulePath)) {
            return this.loadingModules.get(modulePath);
        }

        // Start loading
        const loadPromise = import(modulePath)
            .then(module => {
                this.loadedModules.set(modulePath, module);
                this.loadingModules.delete(modulePath);
                return module;
            })
            .catch(error => {
                this.loadingModules.delete(modulePath);
                throw error;
            });

        this.loadingModules.set(modulePath, loadPromise);
        return loadPromise;
    }

    /**
     * Preload modules in the background
     * @param {Array<string>} paths - Array of module paths
     */
    preload(paths) {
        paths.forEach(path => {
            if (!this.loadedModules.has(path) && !this.loadingModules.has(path)) {
                this.load(path).catch(() => {
                    // Ignore preload errors
                });
            }
        });
    }

    /**
     * Check if module is loaded
     * @param {string} modulePath
     * @returns {boolean}
     */
    isLoaded(modulePath) {
        return this.loadedModules.has(modulePath);
    }

    /**
     * Unload module (for testing/hot reload)
     * @param {string} modulePath
     */
    unload(modulePath) {
        this.loadedModules.delete(modulePath);
    }
}

/**
 * Route-based code splitting
 * Load different modules based on current route
 */
export class RouteBasedLoader {
    constructor() {
        this.moduleLoader = new ModuleLoader();
        this.routes = new Map();
        this.currentRoute = null;
    }

    /**
     * Register route with its module
     * @param {string} route - Route pattern
     * @param {string} modulePath - Module to load for this route
     * @param {Function} preload - Optional preload function
     */
    register(route, modulePath, preload = null) {
        this.routes.set(route, { modulePath, preload });
    }

    /**
     * Load module for current route
     * @returns {Promise}
     */
    async loadCurrentRoute() {
        const route = this.getCurrentRoute();

        if (route === this.currentRoute) {
            return; // Already loaded
        }

        const routeConfig = this.routes.get(route);

        if (!routeConfig) {
            console.warn(`No module registered for route: ${route}`);
            return;
        }

        try {
            const module = await this.moduleLoader.load(routeConfig.modulePath);

            this.currentRoute = route;

            // Execute preload if available
            if (routeConfig.preload) {
                routeConfig.preload(module);
            }

            return module;
        } catch (error) {
            console.error(`Error loading module for route ${route}:`, error);
            throw error;
        }
    }

    /**
     * Get current route from URL
     * @returns {string}
     */
    getCurrentRoute() {
        const path = window.location.pathname;
        const page = path.split('/').pop() || 'index.html';
        return page.replace('.html', '');
    }

    /**
     * Preload route modules
     * @param {Array<string>} routes - Routes to preload
     */
    preloadRoutes(routes) {
        routes.forEach(route => {
            const routeConfig = this.routes.get(route);
            if (routeConfig) {
                this.moduleLoader.preload([routeConfig.modulePath]);
            }
        });
    }
}

/**
 * Intersection-based module loader
 * Load modules when elements come into view
 */
export class ViewportModuleLoader {
    constructor() {
        this.moduleLoader = new ModuleLoader();
        this.observer = null;
        this.init();
    }

    init() {
        if (!('IntersectionObserver' in window)) {
            return;
        }

        this.observer = new IntersectionObserver(
            this.handleIntersection.bind(this),
            {
                rootMargin: '200px',
                threshold: 0
            }
        );
    }

    handleIntersection(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const element = entry.target;
                const modulePath = element.dataset.loadModule;

                if (modulePath) {
                    this.loadModule(element, modulePath);
                    this.observer.unobserve(element);
                }
            }
        });
    }

    async loadModule(element, modulePath) {
        element.classList.add('module-loading');

        try {
            const module = await this.moduleLoader.load(modulePath);

            if (module.default && typeof module.default === 'function') {
                new module.default(element);
            } else if (module.init) {
                module.init(element);
            }

            element.classList.remove('module-loading');
            element.classList.add('module-loaded');
        } catch (error) {
            console.error('Error loading module:', error);
            element.classList.remove('module-loading');
            element.classList.add('module-error');
        }
    }

    observe(element) {
        if (this.observer && element.dataset.loadModule) {
            this.observer.observe(element);
        }
    }

    observeAll() {
        if (!this.observer) return;

        const elements = document.querySelectorAll('[data-load-module]');
        elements.forEach(el => this.observer.observe(el));
    }

    disconnect() {
        if (this.observer) {
            this.observer.disconnect();
        }
    }
}

/**
 * Defer script loading
 * Load non-critical scripts after page load
 */
export class DeferredScriptLoader {
    constructor() {
        this.loaded = new Set();
        this.queue = [];
        this.loading = false;
    }

    /**
     * Add script to load queue
     * @param {Object} config - Script configuration
     */
    add(config) {
        const { src, async = true, defer = false, priority = 'low', onLoad, onError } = config;

        if (this.loaded.has(src)) {
            if (onLoad) onLoad();
            return Promise.resolve();
        }

        return new Promise((resolve, reject) => {
            this.queue.push({
                src,
                async,
                defer,
                priority,
                onLoad: () => {
                    this.loaded.add(src);
                    if (onLoad) onLoad();
                    resolve();
                },
                onError: (error) => {
                    if (onError) onError(error);
                    reject(error);
                }
            });

            this.processQueue();
        });
    }

    /**
     * Process script queue
     */
    processQueue() {
        if (this.loading || this.queue.length === 0) return;

        this.loading = true;

        // Sort by priority
        this.queue.sort((a, b) => {
            const priorities = { high: 3, medium: 2, low: 1 };
            return priorities[b.priority] - priorities[a.priority];
        });

        const script = this.queue.shift();
        this.loadScript(script);
    }

    /**
     * Load script element
     */
    loadScript(config) {
        const script = document.createElement('script');
        script.src = config.src;
        script.async = config.async;
        script.defer = config.defer;

        script.onload = () => {
            config.onLoad();
            this.loading = false;
            this.processQueue();
        };

        script.onerror = (error) => {
            config.onError(error);
            this.loading = false;
            this.processQueue();
        };

        document.head.appendChild(script);
    }

    /**
     * Load multiple scripts
     * @param {Array} configs - Array of script configurations
     * @returns {Promise}
     */
    loadAll(configs) {
        return Promise.all(configs.map(config => this.add(config)));
    }
}

/**
 * Prefetch resources for next navigation
 */
export class ResourcePrefetcher {
    constructor() {
        this.prefetched = new Set();
    }

    /**
     * Prefetch URL
     * @param {string} url - URL to prefetch
     * @param {string} as - Resource type (script, style, image, document)
     */
    prefetch(url, as = 'document') {
        if (this.prefetched.has(url)) return;

        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = url;
        link.as = as;

        document.head.appendChild(link);
        this.prefetched.add(url);
    }

    /**
     * Preconnect to origin
     * @param {string} origin - Origin to preconnect
     */
    preconnect(origin) {
        const link = document.createElement('link');
        link.rel = 'preconnect';
        link.href = origin;

        document.head.appendChild(link);
    }

    /**
     * DNS prefetch
     * @param {string} origin - Origin for DNS prefetch
     */
    dnsPrefetch(origin) {
        const link = document.createElement('link');
        link.rel = 'dns-prefetch';
        link.href = origin;

        document.head.appendChild(link);
    }

    /**
     * Prefetch on hover
     * Prefetch link when user hovers over it
     */
    enableHoverPrefetch() {
        document.addEventListener('mouseover', (e) => {
            const link = e.target.closest('a[href]');

            if (link && link.href && this.shouldPrefetch(link.href)) {
                this.prefetch(link.href, 'document');
            }
        });
    }

    /**
     * Check if URL should be prefetched
     */
    shouldPrefetch(url) {
        try {
            const urlObj = new URL(url);

            // Only prefetch same-origin HTML pages
            return urlObj.origin === window.location.origin &&
                   urlObj.pathname.endsWith('.html');
        } catch {
            return false;
        }
    }

    /**
     * Prefetch visible links
     */
    prefetchVisibleLinks() {
        const links = document.querySelectorAll('a[href$=".html"]');

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const link = entry.target;
                    this.prefetch(link.href, 'document');
                    observer.unobserve(link);
                }
            });
        }, {
            rootMargin: '300px'
        });

        links.forEach(link => observer.observe(link));
    }
}

/**
 * Idle callback wrapper for non-critical tasks
 */
export class IdleTaskScheduler {
    constructor() {
        this.tasks = [];
        this.running = false;
    }

    /**
     * Schedule task to run when browser is idle
     * @param {Function} task - Task to run
     * @param {Object} options - Options
     */
    schedule(task, options = {}) {
        const { timeout = 2000, priority = 'low' } = options;

        this.tasks.push({ task, timeout, priority });

        if (!this.running) {
            this.processTasks();
        }
    }

    processTasks() {
        if (this.tasks.length === 0) {
            this.running = false;
            return;
        }

        this.running = true;

        if ('requestIdleCallback' in window) {
            const taskConfig = this.tasks.shift();

            requestIdleCallback((deadline) => {
                if (deadline.timeRemaining() > 0 || deadline.didTimeout) {
                    taskConfig.task();
                }
                this.processTasks();
            }, { timeout: taskConfig.timeout });
        } else {
            // Fallback for browsers without requestIdleCallback
            setTimeout(() => {
                const taskConfig = this.tasks.shift();
                taskConfig.task();
                this.processTasks();
            }, 100);
        }
    }

    /**
     * Schedule multiple tasks
     * @param {Array<Function>} tasks - Array of tasks
     */
    scheduleAll(tasks, options = {}) {
        tasks.forEach(task => this.schedule(task, options));
    }
}

// Export singleton instances
export const contentLoader = new LazyContentLoader();
export const moduleLoader = new ModuleLoader();
export const routeLoader = new RouteBasedLoader();
export const viewportLoader = new ViewportModuleLoader();
export const scriptLoader = new DeferredScriptLoader();
export const prefetcher = new ResourcePrefetcher();
export const idleScheduler = new IdleTaskScheduler();
