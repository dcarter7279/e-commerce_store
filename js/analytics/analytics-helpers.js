// Analytics Helper Functions
// Utilities for common analytics tasks

import { analytics, ecommerce } from './analytics-core.js';
import { getProductById } from '../products.js';

/**
 * Auto-track product card impressions
 * Call this after rendering product grids
 */
export function trackProductImpressions(containerId, listName = 'product_list') {
    const container = document.getElementById(containerId);
    if (!container) return;

    const productCards = container.querySelectorAll('[data-product-id]');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const productId = parseInt(entry.target.dataset.productId);
                const product = getProductById(productId);

                if (product) {
                    ecommerce.trackProductImpression(product, listName);
                    observer.unobserve(entry.target);
                }
            }
        });
    }, {
        threshold: 0.5  // 50% visible
    });

    productCards.forEach(card => observer.observe(card));
}

/**
 * Track all add-to-cart buttons
 * Automatically tracks when users click add to cart
 */
export function initAddToCartTracking() {
    document.addEventListener('click', (e) => {
        const button = e.target.closest('.add-to-cart-btn, [data-action="add-to-cart"]');

        if (button) {
            const productId = parseInt(button.dataset.productId);
            const quantity = parseInt(button.dataset.quantity || 1);
            const product = getProductById(productId);

            if (product) {
                ecommerce.trackAddToCart(product, quantity);
            }
        }
    });
}

/**
 * Track product detail page view
 * Call this on product detail pages
 */
export function trackProductDetailView(productId) {
    const product = getProductById(productId);

    if (product) {
        ecommerce.trackProductView(product);
    }
}

/**
 * Track search queries
 * Call when users search
 */
export function trackSearchQuery(query, results = null) {
    ecommerce.trackSearch(query, results);
}

/**
 * Track cart view
 * Call when users view their cart
 */
export function trackCartView() {
    import('../cart.js').then(({ getCart, getCartTotal }) => {
        const cart = getCart();
        const total = getCartTotal();

        const items = cart.map(item => ({
            product: getProductById(item.id),
            quantity: item.quantity
        }));

        ecommerce.trackViewCart(items, total);
    });
}

/**
 * Track checkout flow
 */
export class CheckoutTracker {
    constructor() {
        this.step = 0;
        this.items = [];
        this.total = 0;
    }

    /**
     * Initialize with cart data
     */
    init() {
        import('../cart.js').then(({ getCart, getCartTotal }) => {
            const cart = getCart();
            this.total = getCartTotal();

            this.items = cart.map(item => ({
                product: getProductById(item.id),
                quantity: item.quantity
            }));

            // Track begin checkout
            ecommerce.trackBeginCheckout(this.items, this.total);
        });
    }

    /**
     * Track checkout step
     */
    trackStep(stepNumber, stepName) {
        this.step = stepNumber;
        ecommerce.trackCheckoutProgress(stepNumber, this.items, this.total, stepName);
    }

    /**
     * Track shipping info added
     */
    trackShippingInfo(shippingTier) {
        ecommerce.trackAddShippingInfo(this.items, this.total, shippingTier);
    }

    /**
     * Track payment info added
     */
    trackPaymentInfo(paymentType) {
        ecommerce.trackAddPaymentInfo(this.items, this.total, paymentType);
    }

    /**
     * Track purchase completion
     */
    trackPurchase(order) {
        ecommerce.trackPurchase(order);
    }
}

/**
 * Track user authentication events
 */
export function trackAuth(action, method = 'email') {
    analytics.track(`user_${action}`, {
        method,
        timestamp: Date.now()
    });
}

/**
 * Track errors
 */
export function trackError(error, context = {}) {
    analytics.track('error', {
        error_message: error.message || error,
        error_stack: error.stack || '',
        error_context: context,
        page: window.location.pathname
    });
}

/**
 * Track performance metrics
 */
export function trackPerformance() {
    if (!('performance' in window)) return;

    const navigation = performance.getEntriesByType('navigation')[0];

    if (navigation) {
        analytics.track('performance_timing', {
            dns: navigation.domainLookupEnd - navigation.domainLookupStart,
            tcp: navigation.connectEnd - navigation.connectStart,
            request: navigation.responseStart - navigation.requestStart,
            response: navigation.responseEnd - navigation.responseStart,
            dom_processing: navigation.domComplete - navigation.domLoading,
            page_load: navigation.loadEventEnd - navigation.navigationStart
        });
    }
}

/**
 * Track outbound links
 */
export function initOutboundLinkTracking() {
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a[href]');

        if (link && link.hostname !== window.location.hostname) {
            analytics.track('outbound_link', {
                url: link.href,
                text: link.textContent.trim()
            });
        }
    });
}

/**
 * Track file downloads
 */
export function initDownloadTracking() {
    const downloadExtensions = ['pdf', 'zip', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'];

    document.addEventListener('click', (e) => {
        const link = e.target.closest('a[href]');

        if (link) {
            const url = new URL(link.href, window.location.href);
            const extension = url.pathname.split('.').pop().toLowerCase();

            if (downloadExtensions.includes(extension)) {
                analytics.track('file_download', {
                    file_name: url.pathname.split('/').pop(),
                    file_type: extension,
                    file_url: url.href
                });
            }
        }
    });
}

/**
 * Track video interactions
 */
export function trackVideoInteraction(videoElement, videoName) {
    const tracked = {
        play: false,
        25: false,
        50: false,
        75: false,
        complete: false
    };

    videoElement.addEventListener('play', () => {
        if (!tracked.play) {
            tracked.play = true;
            analytics.track('video_start', {
                video_name: videoName,
                video_duration: videoElement.duration
            });
        }
    });

    videoElement.addEventListener('pause', () => {
        analytics.track('video_pause', {
            video_name: videoName,
            video_current_time: videoElement.currentTime,
            video_percent: (videoElement.currentTime / videoElement.duration) * 100
        });
    });

    videoElement.addEventListener('timeupdate', () => {
        const percent = (videoElement.currentTime / videoElement.duration) * 100;

        [25, 50, 75].forEach(milestone => {
            if (percent >= milestone && !tracked[milestone]) {
                tracked[milestone] = true;
                analytics.track('video_progress', {
                    video_name: videoName,
                    video_percent: milestone
                });
            }
        });
    });

    videoElement.addEventListener('ended', () => {
        if (!tracked.complete) {
            tracked.complete = true;
            analytics.track('video_complete', {
                video_name: videoName,
                video_duration: videoElement.duration
            });
        }
    });
}

/**
 * Track social sharing
 */
export function trackSocialShare(network, url, title) {
    analytics.track('social_share', {
        network,
        url,
        title,
        page: window.location.pathname
    });
}

/**
 * Track newsletter signup
 */
export function trackNewsletterSignup(email, source = 'website') {
    analytics.track('newsletter_signup', {
        source,
        page: window.location.pathname
    });
}

/**
 * Track customer feedback/rating
 */
export function trackFeedback(rating, category, comment = '') {
    analytics.track('feedback_submitted', {
        rating,
        category,
        has_comment: comment.length > 0,
        page: window.location.pathname
    });
}

/**
 * Track promo code usage
 */
export function trackPromoCode(code, success, discount = 0) {
    analytics.track('promo_code_applied', {
        code,
        success,
        discount_amount: discount
    });
}

/**
 * Track wishlist interactions
 */
export function trackWishlistAction(action, productId) {
    const product = getProductById(productId);

    if (product) {
        if (action === 'add') {
            ecommerce.trackAddToWishlist(product);
        }

        analytics.track(`wishlist_${action}`, {
            product_id: productId,
            product_name: product.name
        });
    }
}

/**
 * Track comparison actions
 */
export function trackComparisonAction(action, productIds) {
    analytics.track(`comparison_${action}`, {
        product_count: productIds.length,
        product_ids: productIds
    });
}

/**
 * Generate analytics report
 */
export async function generateReport(startDate, endDate) {
    // This would typically fetch from your analytics backend
    const report = {
        dateRange: { startDate, endDate },
        metrics: {
            pageViews: 0,
            uniqueVisitors: 0,
            sessions: 0,
            bounceRate: 0,
            avgSessionDuration: 0,
            conversionRate: 0,
            revenue: 0
        },
        topProducts: [],
        topPages: [],
        trafficSources: [],
        deviceBreakdown: {}
    };

    return report;
}

/**
 * Export analytics data
 */
export function exportAnalyticsData(format = 'json') {
    const data = {
        exported_at: new Date().toISOString(),
        user_agent: navigator.userAgent,
        session_id: sessionStorage.getItem('analytics_session_id'),
        // Add more data as needed
    };

    if (format === 'json') {
        const blob = new Blob([JSON.stringify(data, null, 2)], {
            type: 'application/json'
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
}
