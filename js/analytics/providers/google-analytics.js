// Google Analytics 4 Provider
// Implements analytics tracking for GA4

export class GoogleAnalyticsProvider {
    constructor(config) {
        this.config = {
            measurementId: config.measurementId,
            debug: config.debug || false,
            ...config
        };

        this.ready = false;
    }

    /**
     * Initialize Google Analytics
     */
    async init() {
        if (!this.config.measurementId) {
            console.error('[GA] Measurement ID not provided');
            return;
        }

        // Load gtag.js
        await this.loadScript();

        // Initialize gtag
        window.dataLayer = window.dataLayer || [];
        window.gtag = function() {
            window.dataLayer.push(arguments);
        };

        window.gtag('js', new Date());
        window.gtag('config', this.config.measurementId, {
            send_page_view: false,  // We'll handle this manually
            debug_mode: this.config.debug
        });

        this.ready = true;

        this.log('Google Analytics initialized');
    }

    /**
     * Load gtag script
     */
    loadScript() {
        return new Promise((resolve, reject) => {
            if (window.gtag) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.async = true;
            script.src = `https://www.googletagmanager.com/gtag/js?id=${this.config.measurementId}`;

            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load gtag.js'));

            document.head.appendChild(script);
        });
    }

    /**
     * Track event
     */
    track(event) {
        if (!this.ready) {
            console.warn('[GA] Not initialized');
            return;
        }

        const { name, properties } = event;

        window.gtag('event', name, properties);

        this.log('Event tracked:', name, properties);
    }

    /**
     * Set user ID
     */
    setUserId(userId) {
        if (!this.ready) return;

        window.gtag('config', this.config.measurementId, {
            user_id: userId
        });

        this.log('User ID set:', userId);
    }

    /**
     * Set user properties
     */
    setUserProperties(properties) {
        if (!this.ready) return;

        window.gtag('set', 'user_properties', properties);

        this.log('User properties set:', properties);
    }

    /**
     * Debug logging
     */
    log(...args) {
        if (this.config.debug) {
            console.log('[GA]', ...args);
        }
    }
}
