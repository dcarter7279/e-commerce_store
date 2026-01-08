// Privacy Manager
// Handles cookie consent and privacy-compliant tracking

/**
 * Cookie Consent Manager
 * Manages user consent for analytics tracking
 */
export class CookieConsentManager {
    constructor(config = {}) {
        this.config = {
            cookieName: 'analytics_consent',
            cookieExpiry: 365,  // days
            categories: ['necessary', 'analytics', 'marketing'],
            autoShow: config.autoShow !== false,
            ...config
        };

        this.consent = this.loadConsent();
        this.listeners = new Set();

        if (this.config.autoShow && !this.hasConsent()) {
            this.showConsentBanner();
        }
    }

    /**
     * Load consent from cookie
     */
    loadConsent() {
        const cookie = this.getCookie(this.config.cookieName);

        if (cookie) {
            try {
                return JSON.parse(decodeURIComponent(cookie));
            } catch {
                return null;
            }
        }

        return null;
    }

    /**
     * Save consent to cookie
     */
    saveConsent(consent) {
        const value = encodeURIComponent(JSON.stringify(consent));
        const expires = new Date();
        expires.setDate(expires.getDate() + this.config.cookieExpiry);

        document.cookie = `${this.config.cookieName}=${value}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;

        this.consent = consent;
        this.notifyListeners();
    }

    /**
     * Check if user has given consent
     */
    hasConsent(category = null) {
        if (!this.consent) return false;

        if (category) {
            return this.consent[category] === true;
        }

        return true;  // Has made a choice
    }

    /**
     * Check if analytics is allowed
     */
    isAnalyticsAllowed() {
        return this.hasConsent('analytics');
    }

    /**
     * Check if marketing is allowed
     */
    isMarketingAllowed() {
        return this.hasConsent('marketing');
    }

    /**
     * Accept all categories
     */
    acceptAll() {
        const consent = {};

        this.config.categories.forEach(category => {
            consent[category] = true;
        });

        this.saveConsent(consent);
        this.hideConsentBanner();
    }

    /**
     * Reject optional categories
     */
    rejectOptional() {
        const consent = {
            necessary: true  // Always true
        };

        this.config.categories.forEach(category => {
            if (category !== 'necessary') {
                consent[category] = false;
            }
        });

        this.saveConsent(consent);
        this.hideConsentBanner();
    }

    /**
     * Save custom preferences
     */
    savePreferences(preferences) {
        this.saveConsent({
            necessary: true,
            ...preferences
        });
        this.hideConsentBanner();
    }

    /**
     * Show consent banner
     */
    showConsentBanner() {
        // Remove existing banner
        this.hideConsentBanner();

        const banner = this.createConsentBanner();
        document.body.appendChild(banner);

        // Animate in
        setTimeout(() => banner.classList.add('show'), 10);
    }

    /**
     * Hide consent banner
     */
    hideConsentBanner() {
        const banner = document.getElementById('cookie-consent-banner');

        if (banner) {
            banner.classList.remove('show');
            setTimeout(() => banner.remove(), 300);
        }
    }

    /**
     * Create consent banner HTML
     */
    createConsentBanner() {
        const banner = document.createElement('div');
        banner.id = 'cookie-consent-banner';
        banner.className = 'cookie-consent-banner';

        banner.innerHTML = `
            <div class="consent-content">
                <div class="consent-message">
                    <h3>Cookie Preferences</h3>
                    <p>We use cookies to enhance your experience, analyze site traffic, and for marketing purposes.
                    You can customize your preferences or accept all cookies.</p>
                </div>
                <div class="consent-actions">
                    <button class="btn btn-outline" id="consent-customize">Customize</button>
                    <button class="btn btn-secondary" id="consent-reject">Reject Optional</button>
                    <button class="btn btn-primary" id="consent-accept">Accept All</button>
                </div>
            </div>
            <div class="consent-details" id="consent-details" style="display: none;">
                <div class="consent-category">
                    <label>
                        <input type="checkbox" checked disabled>
                        <span><strong>Necessary</strong> - Required for site functionality</span>
                    </label>
                </div>
                <div class="consent-category">
                    <label>
                        <input type="checkbox" id="consent-analytics" checked>
                        <span><strong>Analytics</strong> - Help us understand how you use our site</span>
                    </label>
                </div>
                <div class="consent-category">
                    <label>
                        <input type="checkbox" id="consent-marketing">
                        <span><strong>Marketing</strong> - Personalized ads and content</span>
                    </label>
                </div>
                <div class="consent-actions">
                    <button class="btn btn-primary" id="consent-save">Save Preferences</button>
                </div>
            </div>
        `;

        // Add event listeners
        banner.querySelector('#consent-accept').addEventListener('click', () => {
            this.acceptAll();
        });

        banner.querySelector('#consent-reject').addEventListener('click', () => {
            this.rejectOptional();
        });

        banner.querySelector('#consent-customize').addEventListener('click', () => {
            banner.querySelector('#consent-details').style.display = 'block';
        });

        banner.querySelector('#consent-save').addEventListener('click', () => {
            const preferences = {
                analytics: banner.querySelector('#consent-analytics').checked,
                marketing: banner.querySelector('#consent-marketing').checked
            };
            this.savePreferences(preferences);
        });

        return banner;
    }

    /**
     * Get cookie value
     */
    getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);

        if (parts.length === 2) {
            return parts.pop().split(';').shift();
        }

        return null;
    }

    /**
     * Add consent change listener
     */
    onChange(callback) {
        this.listeners.add(callback);
    }

    /**
     * Remove consent change listener
     */
    offChange(callback) {
        this.listeners.delete(callback);
    }

    /**
     * Notify listeners of consent change
     */
    notifyListeners() {
        this.listeners.forEach(callback => {
            try {
                callback(this.consent);
            } catch (error) {
                console.error('Consent listener error:', error);
            }
        });
    }

    /**
     * Revoke consent
     */
    revokeConsent() {
        document.cookie = `${this.config.cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        this.consent = null;
        this.notifyListeners();
        this.showConsentBanner();
    }
}

/**
 * Privacy-Compliant Analytics Wrapper
 * Only tracks when consent is given
 */
export class PrivacyCompliantAnalytics {
    constructor(analyticsInstance, consentManager) {
        this.analytics = analyticsInstance;
        this.consent = consentManager;

        // Update analytics state when consent changes
        this.consent.onChange((consent) => {
            if (consent.analytics) {
                this.analytics.enable();
            } else {
                this.analytics.disable();
            }
        });

        // Set initial state
        if (!this.consent.isAnalyticsAllowed()) {
            this.analytics.disable();
        }
    }

    /**
     * Track event (only if consent given)
     */
    track(...args) {
        if (this.consent.isAnalyticsAllowed()) {
            this.analytics.track(...args);
        }
    }

    /**
     * Track page view (only if consent given)
     */
    trackPageView(...args) {
        if (this.consent.isAnalyticsAllowed()) {
            this.analytics.trackPageView(...args);
        }
    }

    /**
     * Set user ID (only if consent given)
     */
    setUserId(...args) {
        if (this.consent.isAnalyticsAllowed()) {
            this.analytics.setUserId(...args);
        }
    }

    /**
     * Set user properties (only if consent given)
     */
    setUserProperties(...args) {
        if (this.consent.isAnalyticsAllowed()) {
            this.analytics.setUserProperties(...args);
        }
    }
}

/**
 * Data Anonymization Utilities
 */
export class DataAnonymizer {
    /**
     * Anonymize IP address
     */
    static anonymizeIP(ip) {
        const parts = ip.split('.');

        if (parts.length === 4) {
            // IPv4 - zero out last octet
            parts[3] = '0';
            return parts.join('.');
        }

        // IPv6 - zero out last 80 bits
        const ipv6Parts = ip.split(':');
        for (let i = Math.max(0, ipv6Parts.length - 5); i < ipv6Parts.length; i++) {
            ipv6Parts[i] = '0';
        }

        return ipv6Parts.join(':');
    }

    /**
     * Hash email for anonymous tracking
     */
    static async hashEmail(email) {
        const encoder = new TextEncoder();
        const data = encoder.encode(email.toLowerCase());
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    /**
     * Remove PII from object
     */
    static removePII(data) {
        const piiFields = ['email', 'phone', 'address', 'name', 'ssn', 'creditCard'];
        const cleaned = { ...data };

        piiFields.forEach(field => {
            delete cleaned[field];
        });

        return cleaned;
    }

    /**
     * Truncate user agent
     */
    static truncateUserAgent(ua) {
        // Remove version numbers to reduce fingerprinting
        return ua.replace(/\/[\d.]+/g, '');
    }
}

/**
 * GDPR Compliance Helper
 */
export class GDPRCompliance {
    /**
     * Check if user is in EU
     */
    static async isEUUser() {
        try {
            const response = await fetch('https://ipapi.co/json/');
            const data = await response.json();
            const euCountries = ['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE'];
            return euCountries.includes(data.country);
        } catch {
            // Assume EU if check fails (safer for compliance)
            return true;
        }
    }

    /**
     * Generate data export
     */
    static exportUserData(userId) {
        // Collect all user data from localStorage, cookies, etc.
        const data = {
            userId,
            consent: localStorage.getItem('analytics_consent'),
            preferences: localStorage.getItem('user_preferences'),
            cart: localStorage.getItem('cart'),
            wishlist: localStorage.getItem('e-store-wishlist'),
            recentlyViewed: localStorage.getItem('e-store-recently-viewed'),
            exportedAt: new Date().toISOString()
        };

        return data;
    }

    /**
     * Delete user data
     */
    static deleteUserData(userId) {
        // Remove all user data
        const keys = [
            'analytics_consent',
            'user_preferences',
            'cart',
            'e-store-wishlist',
            'e-store-recently-viewed',
            'e-store-compare',
            'e-store-reviews'
        ];

        keys.forEach(key => {
            localStorage.removeItem(key);
        });

        // Clear cookies
        document.cookie.split(';').forEach(cookie => {
            const name = cookie.split('=')[0].trim();
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        });

        console.log('User data deleted for GDPR compliance');
    }
}

// Export singleton instance
export const consentManager = new CookieConsentManager();
