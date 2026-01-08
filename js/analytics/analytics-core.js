// Analytics Core Module
// Unified analytics tracking system supporting multiple providers

/**
 * Analytics Manager
 * Central hub for all analytics tracking
 */
export class AnalyticsManager {
    constructor(config = {}) {
        this.config = {
            enabled: config.enabled !== false,
            debug: config.debug || false,
            providers: config.providers || [],
            respectDoNotTrack: config.respectDoNotTrack !== false,
            anonymizeIP: config.anonymizeIP !== false,
            ...config
        };

        this.providers = new Map();
        this.queue = [];
        this.initialized = false;
        this.userId = null;
        this.sessionId = this.generateSessionId();

        this.init();
    }

    /**
     * Initialize analytics
     */
    async init() {
        // Check Do Not Track
        if (this.config.respectDoNotTrack && this.isDoNotTrackEnabled()) {
            console.log('[Analytics] Do Not Track enabled, analytics disabled');
            this.config.enabled = false;
            return;
        }

        // Load configured providers
        for (const providerConfig of this.config.providers) {
            await this.loadProvider(providerConfig);
        }

        // Process queued events
        this.processQueue();

        this.initialized = true;

        // Track page view on init
        this.trackPageView();

        this.log('Analytics initialized');
    }

    /**
     * Load analytics provider
     */
    async loadProvider(config) {
        const { name, type, config: providerConfig } = config;

        try {
            let provider;

            switch (type) {
                case 'google-analytics':
                    const { GoogleAnalyticsProvider } = await import('./providers/google-analytics.js');
                    provider = new GoogleAnalyticsProvider(providerConfig);
                    break;

                case 'custom':
                    const { CustomAnalyticsProvider } = await import('./providers/custom-analytics.js');
                    provider = new CustomAnalyticsProvider(providerConfig);
                    break;

                default:
                    console.warn(`[Analytics] Unknown provider type: ${type}`);
                    return;
            }

            await provider.init();
            this.providers.set(name, provider);

            this.log(`Provider loaded: ${name}`);
        } catch (error) {
            console.error(`[Analytics] Failed to load provider ${name}:`, error);
        }
    }

    /**
     * Track event
     */
    track(eventName, properties = {}) {
        if (!this.config.enabled) return;

        const event = {
            name: eventName,
            properties: {
                ...properties,
                timestamp: Date.now(),
                sessionId: this.sessionId,
                userId: this.userId,
                url: window.location.href,
                referrer: document.referrer
            }
        };

        if (!this.initialized) {
            this.queue.push(event);
            return;
        }

        this.sendToProviders('track', event);
        this.log('Event tracked:', eventName, properties);
    }

    /**
     * Track page view
     */
    trackPageView(properties = {}) {
        this.track('page_view', {
            page_title: document.title,
            page_location: window.location.href,
            page_path: window.location.pathname,
            ...properties
        });
    }

    /**
     * Set user ID
     */
    setUserId(userId) {
        this.userId = userId;
        this.sendToProviders('setUserId', userId);
        this.log('User ID set:', userId);
    }

    /**
     * Set user properties
     */
    setUserProperties(properties) {
        this.sendToProviders('setUserProperties', properties);
        this.log('User properties set:', properties);
    }

    /**
     * Send to all providers
     */
    sendToProviders(method, ...args) {
        this.providers.forEach(provider => {
            if (typeof provider[method] === 'function') {
                try {
                    provider[method](...args);
                } catch (error) {
                    console.error(`[Analytics] Provider error:`, error);
                }
            }
        });
    }

    /**
     * Process queued events
     */
    processQueue() {
        while (this.queue.length > 0) {
            const event = this.queue.shift();
            this.sendToProviders('track', event);
        }
    }

    /**
     * Generate session ID
     */
    generateSessionId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Check if Do Not Track is enabled
     */
    isDoNotTrackEnabled() {
        return navigator.doNotTrack === '1' ||
               window.doNotTrack === '1' ||
               navigator.msDoNotTrack === '1';
    }

    /**
     * Enable analytics
     */
    enable() {
        this.config.enabled = true;
        this.log('Analytics enabled');
    }

    /**
     * Disable analytics
     */
    disable() {
        this.config.enabled = false;
        this.log('Analytics disabled');
    }

    /**
     * Debug logging
     */
    log(...args) {
        if (this.config.debug) {
            console.log('[Analytics]', ...args);
        }
    }
}

/**
 * Enhanced E-commerce Tracker
 * Tracks e-commerce specific events
 */
export class EcommerceTracker {
    constructor(analytics) {
        this.analytics = analytics;
    }

    /**
     * Track product impression
     */
    trackProductImpression(product, list = 'default') {
        this.analytics.track('view_item_list', {
            items: [this.formatProduct(product)],
            item_list_id: list,
            item_list_name: list
        });
    }

    /**
     * Track product view
     */
    trackProductView(product) {
        this.analytics.track('view_item', {
            currency: 'USD',
            value: product.price,
            items: [this.formatProduct(product)]
        });
    }

    /**
     * Track add to cart
     */
    trackAddToCart(product, quantity = 1) {
        this.analytics.track('add_to_cart', {
            currency: 'USD',
            value: product.price * quantity,
            items: [{
                ...this.formatProduct(product),
                quantity
            }]
        });
    }

    /**
     * Track remove from cart
     */
    trackRemoveFromCart(product, quantity = 1) {
        this.analytics.track('remove_from_cart', {
            currency: 'USD',
            value: product.price * quantity,
            items: [{
                ...this.formatProduct(product),
                quantity
            }]
        });
    }

    /**
     * Track view cart
     */
    trackViewCart(items, totalValue) {
        this.analytics.track('view_cart', {
            currency: 'USD',
            value: totalValue,
            items: items.map(item => ({
                ...this.formatProduct(item.product),
                quantity: item.quantity
            }))
        });
    }

    /**
     * Track begin checkout
     */
    trackBeginCheckout(items, totalValue) {
        this.analytics.track('begin_checkout', {
            currency: 'USD',
            value: totalValue,
            items: items.map(item => ({
                ...this.formatProduct(item.product),
                quantity: item.quantity
            }))
        });
    }

    /**
     * Track checkout progress
     */
    trackCheckoutProgress(step, items, totalValue, stepName = '') {
        this.analytics.track('checkout_progress', {
            checkout_step: step,
            checkout_option: stepName,
            currency: 'USD',
            value: totalValue,
            items: items.map(item => ({
                ...this.formatProduct(item.product),
                quantity: item.quantity
            }))
        });
    }

    /**
     * Track add shipping info
     */
    trackAddShippingInfo(items, totalValue, shippingTier) {
        this.analytics.track('add_shipping_info', {
            currency: 'USD',
            value: totalValue,
            shipping_tier: shippingTier,
            items: items.map(item => ({
                ...this.formatProduct(item.product),
                quantity: item.quantity
            }))
        });
    }

    /**
     * Track add payment info
     */
    trackAddPaymentInfo(items, totalValue, paymentType) {
        this.analytics.track('add_payment_info', {
            currency: 'USD',
            value: totalValue,
            payment_type: paymentType,
            items: items.map(item => ({
                ...this.formatProduct(item.product),
                quantity: item.quantity
            }))
        });
    }

    /**
     * Track purchase
     */
    trackPurchase(order) {
        this.analytics.track('purchase', {
            transaction_id: order.id,
            value: order.total,
            currency: 'USD',
            tax: order.tax || 0,
            shipping: order.shipping || 0,
            coupon: order.coupon || '',
            items: order.items.map(item => ({
                ...this.formatProduct(item.product),
                quantity: item.quantity
            }))
        });
    }

    /**
     * Track refund
     */
    trackRefund(order) {
        this.analytics.track('refund', {
            transaction_id: order.id,
            value: order.total,
            currency: 'USD',
            items: order.items.map(item => ({
                ...this.formatProduct(item.product),
                quantity: item.quantity
            }))
        });
    }

    /**
     * Track product search
     */
    trackSearch(query, results = null) {
        this.analytics.track('search', {
            search_term: query,
            results_count: results?.length || 0
        });
    }

    /**
     * Track add to wishlist
     */
    trackAddToWishlist(product) {
        this.analytics.track('add_to_wishlist', {
            currency: 'USD',
            value: product.price,
            items: [this.formatProduct(product)]
        });
    }

    /**
     * Track product share
     */
    trackShare(product, method) {
        this.analytics.track('share', {
            content_type: 'product',
            item_id: product.id,
            method: method
        });
    }

    /**
     * Format product for analytics
     */
    formatProduct(product) {
        return {
            item_id: product.id.toString(),
            item_name: product.name,
            item_category: product.category || '',
            item_brand: product.brand || '',
            price: product.price,
            currency: 'USD'
        };
    }
}

/**
 * User Behavior Tracker
 * Tracks user interactions and engagement
 */
export class UserBehaviorTracker {
    constructor(analytics) {
        this.analytics = analytics;
        this.scrollDepth = 0;
        this.engagementTime = 0;
        this.startTime = Date.now();
        this.active = true;

        this.init();
    }

    init() {
        // Track scroll depth
        this.trackScrollDepth();

        // Track engagement time
        this.trackEngagementTime();

        // Track clicks
        this.trackClicks();

        // Track form interactions
        this.trackFormInteractions();

        // Track page visibility
        this.trackVisibility();

        // Track session duration on unload
        window.addEventListener('beforeunload', () => {
            this.trackSessionEnd();
        });
    }

    /**
     * Track scroll depth
     */
    trackScrollDepth() {
        let maxScroll = 0;
        const milestones = [25, 50, 75, 90, 100];
        const tracked = new Set();

        const handleScroll = () => {
            const scrollPercentage = Math.round(
                ((window.scrollY + window.innerHeight) / document.documentElement.scrollHeight) * 100
            );

            if (scrollPercentage > maxScroll) {
                maxScroll = scrollPercentage;
                this.scrollDepth = scrollPercentage;

                // Track milestones
                milestones.forEach(milestone => {
                    if (scrollPercentage >= milestone && !tracked.has(milestone)) {
                        tracked.add(milestone);
                        this.analytics.track('scroll_depth', {
                            depth: milestone,
                            page: window.location.pathname
                        });
                    }
                });
            }
        };

        window.addEventListener('scroll', this.throttle(handleScroll, 500));
    }

    /**
     * Track engagement time
     */
    trackEngagementTime() {
        let lastActive = Date.now();

        const updateEngagement = () => {
            if (this.active && document.visibilityState === 'visible') {
                const now = Date.now();
                this.engagementTime += now - lastActive;
                lastActive = now;
            }
        };

        setInterval(updateEngagement, 1000);

        // Track every 30 seconds
        setInterval(() => {
            if (this.engagementTime > 0) {
                this.analytics.track('engagement_time', {
                    engagement_time_msec: this.engagementTime,
                    page: window.location.pathname
                });
            }
        }, 30000);
    }

    /**
     * Track clicks
     */
    trackClicks() {
        document.addEventListener('click', (e) => {
            const target = e.target.closest('[data-track-click]');

            if (target) {
                const label = target.dataset.trackClick;
                const category = target.dataset.trackCategory || 'engagement';

                this.analytics.track('click', {
                    category,
                    label,
                    element_type: target.tagName.toLowerCase(),
                    element_text: target.textContent.trim().substring(0, 50)
                });
            }
        });
    }

    /**
     * Track form interactions
     */
    trackFormInteractions() {
        // Track form starts
        document.addEventListener('focus', (e) => {
            if (e.target.matches('input, textarea, select')) {
                const form = e.target.closest('form');

                if (form && !form.dataset.trackStarted) {
                    form.dataset.trackStarted = 'true';

                    this.analytics.track('form_start', {
                        form_id: form.id || 'unknown',
                        form_name: form.name || 'unknown'
                    });
                }
            }
        }, true);

        // Track form submissions
        document.addEventListener('submit', (e) => {
            const form = e.target;

            this.analytics.track('form_submit', {
                form_id: form.id || 'unknown',
                form_name: form.name || 'unknown'
            });
        }, true);
    }

    /**
     * Track page visibility
     */
    trackVisibility() {
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                this.active = false;
                this.analytics.track('page_hidden', {
                    engagement_time_msec: this.engagementTime
                });
            } else {
                this.active = true;
                this.analytics.track('page_visible');
            }
        });
    }

    /**
     * Track session end
     */
    trackSessionEnd() {
        const sessionDuration = Date.now() - this.startTime;

        this.analytics.track('session_end', {
            session_duration: sessionDuration,
            engagement_time: this.engagementTime,
            scroll_depth: this.scrollDepth,
            page_views: 1  // Will be incremented by SPA navigation
        });
    }

    /**
     * Throttle helper
     */
    throttle(func, delay) {
        let lastCall = 0;
        return (...args) => {
            const now = Date.now();
            if (now - lastCall >= delay) {
                lastCall = now;
                func(...args);
            }
        };
    }
}

/**
 * Conversion Funnel Tracker
 * Tracks user progress through conversion funnels
 */
export class ConversionFunnelTracker {
    constructor(analytics) {
        this.analytics = analytics;
        this.funnels = new Map();
    }

    /**
     * Define a funnel
     */
    defineFunnel(name, steps) {
        this.funnels.set(name, {
            name,
            steps,
            currentStep: null,
            startTime: null,
            stepTimes: new Map()
        });
    }

    /**
     * Track funnel step
     */
    trackStep(funnelName, stepName, properties = {}) {
        const funnel = this.funnels.get(funnelName);

        if (!funnel) {
            console.warn(`[Analytics] Funnel not defined: ${funnelName}`);
            return;
        }

        const stepIndex = funnel.steps.indexOf(stepName);

        if (stepIndex === -1) {
            console.warn(`[Analytics] Invalid step: ${stepName}`);
            return;
        }

        // Start funnel if first step
        if (stepIndex === 0 && !funnel.startTime) {
            funnel.startTime = Date.now();
        }

        // Track time on previous step
        if (funnel.currentStep) {
            const timeOnStep = Date.now() - (funnel.stepTimes.get(funnel.currentStep) || Date.now());
            this.analytics.track('funnel_step_time', {
                funnel: funnelName,
                step: funnel.currentStep,
                time_on_step: timeOnStep
            });
        }

        // Update current step
        funnel.currentStep = stepName;
        funnel.stepTimes.set(stepName, Date.now());

        // Track step
        this.analytics.track('funnel_step', {
            funnel: funnelName,
            step: stepName,
            step_number: stepIndex + 1,
            total_steps: funnel.steps.length,
            ...properties
        });
    }

    /**
     * Track funnel completion
     */
    trackCompletion(funnelName, properties = {}) {
        const funnel = this.funnels.get(funnelName);

        if (!funnel || !funnel.startTime) {
            return;
        }

        const completionTime = Date.now() - funnel.startTime;

        this.analytics.track('funnel_complete', {
            funnel: funnelName,
            completion_time: completionTime,
            steps_completed: funnel.steps.length,
            ...properties
        });

        // Reset funnel
        funnel.currentStep = null;
        funnel.startTime = null;
        funnel.stepTimes.clear();
    }

    /**
     * Track funnel abandonment
     */
    trackAbandonment(funnelName, reason = '') {
        const funnel = this.funnels.get(funnelName);

        if (!funnel) {
            return;
        }

        const stepIndex = funnel.currentStep ? funnel.steps.indexOf(funnel.currentStep) : -1;

        this.analytics.track('funnel_abandoned', {
            funnel: funnelName,
            abandoned_at_step: funnel.currentStep || 'unknown',
            step_number: stepIndex + 1,
            reason
        });

        // Reset funnel
        funnel.currentStep = null;
        funnel.startTime = null;
        funnel.stepTimes.clear();
    }
}

// Export singleton instances
export const analytics = new AnalyticsManager({
    debug: true,
    providers: []  // Will be configured in app
});

export const ecommerce = new EcommerceTracker(analytics);
export const behavior = new UserBehaviorTracker(analytics);
export const funnel = new ConversionFunnelTracker(analytics);
