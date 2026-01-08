# Analytics Integration Guide

Complete guide for integrating analytics tracking into your e-commerce site to monitor user behavior, conversion rates, and sales performance.

## Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Core Concepts](#core-concepts)
4. [Setup & Configuration](#setup--configuration)
5. [E-commerce Tracking](#e-commerce-tracking)
6. [User Behavior Tracking](#user-behavior-tracking)
7. [Conversion Funnels](#conversion-funnels)
8. [Privacy & Compliance](#privacy--compliance)
9. [Integration Examples](#integration-examples)
10. [Testing & Debugging](#testing--debugging)
11. [Best Practices](#best-practices)
12. [API Reference](#api-reference)

---

## Overview

### What's Included

The analytics system provides comprehensive tracking capabilities:

- **E-commerce Events**: Product views, add-to-cart, purchases, searches
- **User Behavior**: Scroll depth, engagement time, clicks, form interactions
- **Conversion Funnels**: Multi-step process tracking and abandonment analysis
- **Privacy Compliance**: GDPR-compliant with cookie consent management
- **Multi-Provider Support**: Google Analytics 4, custom endpoints, extensible architecture

### Architecture

```
analytics/
├── analytics-core.js          # Core tracking engine
├── analytics-helpers.js       # Helper functions for common scenarios
├── privacy-manager.js         # GDPR compliance and consent
└── providers/
    ├── google-analytics.js    # GA4 integration
    └── custom-analytics.js    # Custom endpoint tracking
```

---

## Quick Start

### 1. Basic Setup

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>My Store</title>

    <!-- Analytics CSS -->
    <link rel="stylesheet" href="css/analytics.css">
</head>
<body>
    <!-- Your content -->

    <!-- Cookie Consent Banner (automatically shown) -->

    <!-- Analytics Scripts -->
    <script type="module">
        import { AnalyticsManager } from './js/analytics/analytics-core.js';
        import { GoogleAnalyticsProvider } from './js/analytics/providers/google-analytics.js';
        import { CookieConsentManager } from './js/analytics/privacy-manager.js';

        // Initialize consent manager
        const consent = new CookieConsentManager({
            onConsentChange: (preferences) => {
                console.log('Consent changed:', preferences);
            }
        });

        // Initialize analytics only if consent given
        if (consent.isAnalyticsAllowed()) {
            const analytics = new AnalyticsManager({
                providers: [
                    new GoogleAnalyticsProvider({
                        measurementId: 'G-XXXXXXXXXX'  // Your GA4 ID
                    })
                ],
                debug: true
            });

            await analytics.init();

            // Make available globally
            window.analytics = analytics;
        }
    </script>
</body>
</html>
```

### 2. Track Your First Event

```javascript
// Track a simple event
analytics.track('button_clicked', {
    button_name: 'Subscribe',
    location: 'header'
});

// Track a page view
analytics.trackPageView({
    page_title: 'Home',
    page_location: window.location.href
});
```

---

## Core Concepts

### Event Structure

All events follow a consistent structure:

```javascript
{
    name: 'event_name',           // Required: Event identifier
    properties: {                  // Optional: Event metadata
        key: 'value',
        category: 'ecommerce',
        value: 99.99
    },
    timestamp: 1234567890,        // Auto-added: Unix timestamp
    userId: 'user123',            // Auto-added if set
    sessionId: 'session456'       // Auto-added
}
```

### Analytics Manager

The central hub that:
- Manages multiple analytics providers
- Handles user identification
- Manages session tracking
- Distributes events to all providers

### Providers

Individual analytics services (GA4, custom endpoint, etc.) that:
- Receive events from the Analytics Manager
- Transform events to their specific format
- Send data to their respective servers

### Privacy Manager

Handles consent and compliance:
- Displays cookie consent banner
- Manages user preferences
- Controls analytics initialization
- Provides data export/deletion

---

## Setup & Configuration

### Google Analytics 4 Setup

```javascript
import { AnalyticsManager } from './js/analytics/analytics-core.js';
import { GoogleAnalyticsProvider } from './js/analytics/providers/google-analytics.js';

const analytics = new AnalyticsManager({
    providers: [
        new GoogleAnalyticsProvider({
            measurementId: 'G-XXXXXXXXXX',  // Your GA4 measurement ID
            debug: false,                    // Enable debug mode
            config: {
                // Additional GA4 config
                send_page_view: false,       // We'll track manually
                cookie_flags: 'SameSite=None;Secure'
            }
        })
    ],
    autoPageViews: true,    // Automatically track page views
    debug: true             // Enable debug logging
});

await analytics.init();
```

### Custom Analytics Endpoint Setup

```javascript
import { CustomAnalyticsProvider } from './js/analytics/providers/custom-analytics.js';

const analytics = new AnalyticsManager({
    providers: [
        new CustomAnalyticsProvider({
            endpoint: '/api/analytics',   // Your analytics endpoint
            batchSize: 10,                // Send after 10 events
            flushInterval: 5000,          // Or every 5 seconds
            debug: true
        })
    ]
});

await analytics.init();
```

### Multi-Provider Setup

```javascript
const analytics = new AnalyticsManager({
    providers: [
        // Google Analytics
        new GoogleAnalyticsProvider({
            measurementId: 'G-XXXXXXXXXX'
        }),

        // Custom endpoint
        new CustomAnalyticsProvider({
            endpoint: '/api/analytics'
        }),

        // Add more providers as needed
    ]
});
```

### Privacy-Compliant Setup

```javascript
import { PrivacyCompliantAnalytics } from './js/analytics/privacy-manager.js';
import { CookieConsentManager } from './js/analytics/privacy-manager.js';

// Initialize consent manager
const consent = new CookieConsentManager({
    position: 'bottom',
    privacyPolicyUrl: '/privacy-policy.html',
    onConsentChange: (preferences) => {
        // Reload analytics if consent granted
        if (preferences.analytics) {
            initAnalytics();
        }
    }
});

// Initialize privacy-compliant analytics
const analytics = new PrivacyCompliantAnalytics({
    providers: [
        new GoogleAnalyticsProvider({
            measurementId: 'G-XXXXXXXXXX',
            anonymizeIp: true  // Anonymize IP addresses
        })
    ]
});

await analytics.init();
```

---

## E-commerce Tracking

### Product Views

```javascript
import { EcommerceTracker } from './js/analytics/analytics-core.js';

const ecommerce = new EcommerceTracker(analytics);

// Track when user views a product
ecommerce.trackProductView({
    id: 'PROD-123',
    name: 'Premium Headphones',
    category: 'Electronics/Audio',
    price: 299.99,
    brand: 'AudioTech',
    variant: 'Black'
});
```

### Add to Cart

```javascript
// Track when user adds product to cart
ecommerce.trackAddToCart({
    id: 'PROD-123',
    name: 'Premium Headphones',
    price: 299.99,
    category: 'Electronics/Audio'
}, 1);  // quantity
```

### Product Impressions

Track when products are visible in lists:

```javascript
import { trackProductImpressions } from './js/analytics/analytics-helpers.js';

// Auto-track products as they scroll into view
trackProductImpressions('product-grid', 'Search Results');
```

This automatically tracks when products become visible using IntersectionObserver.

### Begin Checkout

```javascript
ecommerce.trackBeginCheckout(
    [
        {
            id: 'PROD-123',
            name: 'Premium Headphones',
            price: 299.99,
            quantity: 1
        },
        {
            id: 'PROD-456',
            name: 'Wireless Mouse',
            price: 49.99,
            quantity: 2
        }
    ],
    399.97  // total value
);
```

### Purchase Tracking

```javascript
ecommerce.trackPurchase({
    orderId: 'ORD-789',
    totalAmount: 399.97,
    tax: 32.00,
    shipping: 10.00,
    currency: 'USD',
    items: [
        {
            id: 'PROD-123',
            name: 'Premium Headphones',
            price: 299.99,
            quantity: 1,
            category: 'Electronics/Audio'
        },
        {
            id: 'PROD-456',
            name: 'Wireless Mouse',
            price: 49.99,
            quantity: 2,
            category: 'Electronics/Accessories'
        }
    ],
    paymentMethod: 'credit_card',
    shippingMethod: 'standard'
});
```

### Search Tracking

```javascript
ecommerce.trackSearch('wireless headphones', 24);  // query, result count
```

### Wishlist Tracking

```javascript
ecommerce.trackAddToWishlist({
    id: 'PROD-123',
    name: 'Premium Headphones',
    price: 299.99
});

ecommerce.trackRemoveFromWishlist({
    id: 'PROD-123',
    name: 'Premium Headphones'
});
```

### Product Comparison

```javascript
ecommerce.trackProductComparison([
    { id: 'PROD-123', name: 'Premium Headphones' },
    { id: 'PROD-789', name: 'Budget Headphones' }
]);
```

---

## User Behavior Tracking

### Scroll Depth

Automatically track how far users scroll:

```javascript
import { UserBehaviorTracker } from './js/analytics/analytics-core.js';

const behavior = new UserBehaviorTracker(analytics);

// Track scroll depth at 25%, 50%, 75%, 100%
behavior.trackScrollDepth();
```

Events fired:
- `scroll_25` when user reaches 25%
- `scroll_50` when user reaches 50%
- `scroll_75` when user reaches 75%
- `scroll_100` when user reaches bottom

### Engagement Time

Track how long users actively engage with content:

```javascript
// Track engagement time (sends every 15 seconds of active engagement)
behavior.trackEngagementTime();
```

### Click Tracking

Track clicks on specific elements:

```javascript
// Track all clicks on buttons
behavior.trackClicks('button', {
    category: 'button_clicks'
});

// Track clicks on product cards
behavior.trackClicks('.product-card', {
    category: 'product_clicks'
});
```

### Form Interactions

Track form field interactions:

```javascript
// Track interactions with checkout form
behavior.trackFormInteractions('#checkout-form', {
    form_name: 'checkout'
});
```

Events tracked:
- `form_field_focus` - User focuses on field
- `form_field_blur` - User leaves field
- `form_field_error` - Validation error
- `form_submit` - Form submitted
- `form_abandon` - User leaves without submitting

---

## Conversion Funnels

### Define a Funnel

```javascript
import { ConversionFunnelTracker } from './js/analytics/analytics-core.js';

const funnelTracker = new ConversionFunnelTracker(analytics);

// Define checkout funnel
funnelTracker.defineFunnel('checkout', [
    { name: 'cart_view', label: 'Cart View' },
    { name: 'checkout_info', label: 'Checkout Info' },
    { name: 'checkout_shipping', label: 'Shipping' },
    { name: 'checkout_payment', label: 'Payment' },
    { name: 'purchase_complete', label: 'Complete' }
]);
```

### Track Funnel Steps

```javascript
// User views cart
funnelTracker.trackStep('checkout', 'cart_view', {
    cart_value: 399.97,
    item_count: 3
});

// User enters shipping info
funnelTracker.trackStep('checkout', 'checkout_shipping', {
    shipping_method: 'standard'
});

// User completes purchase
funnelTracker.trackCompletion('checkout', {
    order_id: 'ORD-789',
    revenue: 399.97
});
```

### Track Abandonment

```javascript
// Automatically tracked when user leaves without completing
funnelTracker.trackAbandonment('checkout', 'checkout_payment', {
    reason: 'page_exit',
    cart_value: 399.97
});
```

### Checkout Helper

```javascript
import { CheckoutTracker } from './js/analytics/analytics-helpers.js';

const checkoutTracker = new CheckoutTracker(analytics);

// Initialize automatic tracking
checkoutTracker.init();

// Tracks are sent automatically as user progresses:
// - Step 1: Cart view
// - Step 2: Checkout info
// - Step 3: Shipping
// - Step 4: Payment
// - Step 5: Purchase complete
```

---

## Privacy & Compliance

### Cookie Consent Banner

The consent banner appears automatically on first visit:

```javascript
import { CookieConsentManager } from './js/analytics/privacy-manager.js';

const consent = new CookieConsentManager({
    position: 'bottom',                    // 'bottom' or 'top'
    privacyPolicyUrl: '/privacy.html',     // Link to privacy policy
    cookiePolicyUrl: '/cookies.html',      // Link to cookie policy

    onConsentChange: (preferences) => {
        console.log('Consent updated:', preferences);

        // Reinitialize analytics if needed
        if (preferences.analytics) {
            initAnalytics();
        }
    }
});

// Check if analytics allowed
if (consent.isAnalyticsAllowed()) {
    // Initialize analytics
}

// Check if marketing allowed
if (consent.isMarketingAllowed()) {
    // Initialize marketing pixels
}

// Show settings button for users to change preferences
consent.showSettingsButton();
```

### Data Anonymization

```javascript
import { DataAnonymizer } from './js/analytics/privacy-manager.js';

// Anonymize IP address
const anonymizedIP = DataAnonymizer.anonymizeIP('192.168.1.1');
// Returns: '192.168.0.0'

// Hash email for tracking
const hashedEmail = await DataAnonymizer.hashEmail('user@example.com');

// Remove PII from data
const cleanData = DataAnonymizer.removePII({
    email: 'user@example.com',
    name: 'John Doe',
    product: 'Premium Headphones',
    price: 299.99
});
// Returns: { product: 'Premium Headphones', price: 299.99 }
```

### GDPR Compliance

```javascript
import { GDPRCompliance } from './js/analytics/privacy-manager.js';

// Check if user is in EU
const isEU = await GDPRCompliance.isEUUser();

// Export user data (GDPR right to access)
const userData = await GDPRCompliance.exportUserData('user123');

// Delete user data (GDPR right to erasure)
await GDPRCompliance.deleteUserData('user123');

// Respect Do Not Track
if (navigator.doNotTrack === '1') {
    console.log('User has Do Not Track enabled');
    // Don't initialize analytics
}
```

### Privacy-Compliant Analytics

```javascript
import { PrivacyCompliantAnalytics } from './js/analytics/privacy-manager.js';

// Automatically respects consent settings
const analytics = new PrivacyCompliantAnalytics({
    providers: [
        new GoogleAnalyticsProvider({
            measurementId: 'G-XXXXXXXXXX',
            anonymizeIp: true,
            allowAdFeatures: false  // Disable advertising features
        })
    ],
    respectDoNotTrack: true,
    consentRequired: true
});

// Events only tracked if consent given
analytics.track('event_name', { property: 'value' });
```

---

## Integration Examples

### Product Page Integration

```javascript
// product-details.js
import { analytics } from './init-analytics.js';
import { trackProductDetailView } from './js/analytics/analytics-helpers.js';

// Get product ID from URL or data attribute
const productId = document.querySelector('[data-product-id]').dataset.productId;

// Track product view
trackProductDetailView(productId);

// Track add to cart
document.querySelector('.add-to-cart-btn').addEventListener('click', () => {
    const product = getProductData();  // Your function

    analytics.ecommerce.trackAddToCart(product, 1);
});

// Track add to wishlist
document.querySelector('.wishlist-btn').addEventListener('click', () => {
    const product = getProductData();

    analytics.ecommerce.trackAddToWishlist(product);
});
```

### Product Listing Integration

```javascript
// products-page.js
import { trackProductImpressions } from './js/analytics/analytics-helpers.js';

// Automatically track product impressions
trackProductImpressions('product-grid', 'Category Page');

// Track when user clicks on product
document.querySelector('#product-grid').addEventListener('click', (e) => {
    const productCard = e.target.closest('.product-card');

    if (productCard) {
        const productId = productCard.dataset.productId;

        analytics.track('product_click', {
            product_id: productId,
            list_name: 'Category Page',
            position: Array.from(productCard.parentElement.children).indexOf(productCard)
        });
    }
});
```

### Search Integration

```javascript
// search.js
import { trackSearchQuery } from './js/analytics/analytics-helpers.js';

document.querySelector('#search-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const query = document.querySelector('#search-input').value;

    // Perform search
    const results = await searchProducts(query);

    // Track search
    trackSearchQuery(query, results.length);

    // Display results
    displayResults(results);
});
```

### Checkout Integration

```javascript
// checkout.js
import { CheckoutTracker } from './js/analytics/analytics-helpers.js';

const checkoutTracker = new CheckoutTracker(analytics);

// Initialize automatic tracking
checkoutTracker.init();

// Manual tracking for specific steps
document.querySelector('#shipping-form').addEventListener('submit', (e) => {
    e.preventDefault();

    const shippingMethod = document.querySelector('input[name="shipping"]:checked').value;

    checkoutTracker.trackShippingInfo(shippingMethod);

    // Continue to next step
    showPaymentForm();
});

document.querySelector('#payment-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const paymentMethod = document.querySelector('input[name="payment"]:checked').value;

    checkoutTracker.trackPaymentInfo(paymentMethod);

    // Process payment
    const order = await processPayment();

    if (order.success) {
        checkoutTracker.trackPurchase(order);
        window.location.href = `/order-confirmation.html?id=${order.id}`;
    }
});
```

### Cart Integration

```javascript
// cart.js
import { trackCartView } from './js/analytics/analytics-helpers.js';

// Track cart view on page load
trackCartView();

// Track remove from cart
document.querySelector('#cart-items').addEventListener('click', (e) => {
    if (e.target.classList.contains('remove-item')) {
        const item = getCartItem(e.target.dataset.itemId);

        analytics.track('remove_from_cart', {
            currency: 'USD',
            value: item.price * item.quantity,
            items: [{
                item_id: item.id,
                item_name: item.name,
                price: item.price,
                quantity: item.quantity
            }]
        });
    }
});
```

### Authentication Integration

```javascript
// auth.js
import { trackAuth } from './js/analytics/analytics-helpers.js';

// Track login
document.querySelector('#login-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const result = await login();

    if (result.success) {
        trackAuth('login', 'email');

        // Set user ID in analytics
        analytics.setUserId(result.user.id);
        analytics.setUserProperties({
            user_type: result.user.type,
            account_created: result.user.createdAt
        });
    }
});

// Track signup
document.querySelector('#signup-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const result = await signup();

    if (result.success) {
        trackAuth('signup', 'email');
        analytics.setUserId(result.user.id);
    }
});

// Track logout
document.querySelector('#logout-btn').addEventListener('click', () => {
    trackAuth('logout', 'manual');
    analytics.setUserId(null);
});
```

### Error Tracking

```javascript
// error-tracking.js
import { trackError } from './js/analytics/analytics-helpers.js';

// Global error handler
window.addEventListener('error', (event) => {
    trackError(event.error, {
        type: 'javascript_error',
        url: window.location.href
    });
});

// Unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
    trackError(event.reason, {
        type: 'unhandled_promise',
        url: window.location.href
    });
});

// Custom error tracking
try {
    await processPayment();
} catch (error) {
    trackError(error, {
        type: 'payment_error',
        step: 'checkout'
    });
}
```

---

## Testing & Debugging

### Enable Debug Mode

```javascript
const analytics = new AnalyticsManager({
    providers: [...],
    debug: true  // Enables console logging
});
```

Debug output shows:
- Events being tracked
- Provider responses
- Errors and warnings

### Test Events

```javascript
// Test basic event tracking
analytics.track('test_event', {
    test_property: 'test_value',
    timestamp: Date.now()
});

// Test e-commerce event
analytics.ecommerce.trackProductView({
    id: 'TEST-123',
    name: 'Test Product',
    price: 99.99
});

// Check console for debug output
```

### Google Analytics Debug View

1. Enable debug mode in GA4 provider:
```javascript
new GoogleAnalyticsProvider({
    measurementId: 'G-XXXXXXXXXX',
    debug: true
})
```

2. Open Google Analytics
3. Go to Admin > DebugView
4. Interact with your site
5. View events in real-time

### Custom Endpoint Testing

```javascript
// server.js (Node.js example)
app.post('/api/analytics', (req, res) => {
    console.log('Analytics event received:', req.body);

    // Validate event structure
    const { events } = req.body;

    events.forEach(event => {
        console.log('Event:', event.name);
        console.log('Properties:', event.properties);
        console.log('Timestamp:', new Date(event.timestamp));
    });

    res.status(200).send({ success: true });
});
```

### Verify Cookie Consent

```javascript
// Check consent status
const consent = new CookieConsentManager();

console.log('Analytics allowed:', consent.isAnalyticsAllowed());
console.log('Marketing allowed:', consent.isMarketingAllowed());
console.log('Preferences:', consent.getPreferences());
```

### Browser DevTools

1. Open DevTools (F12)
2. Go to Network tab
3. Filter by "analytics" or your custom endpoint
4. Verify events are being sent
5. Check request/response details

---

## Best Practices

### Event Naming

Use consistent, descriptive names:

```javascript
// Good
analytics.track('product_added_to_cart', { product_id: '123' });
analytics.track('checkout_started', { cart_value: 99.99 });
analytics.track('search_performed', { query: 'shoes' });

// Avoid
analytics.track('click', { thing: 'product' });
analytics.track('event1', { data: '123' });
```

### Property Organization

Keep properties flat and typed:

```javascript
// Good
analytics.track('purchase_completed', {
    order_id: 'ORD-789',
    revenue: 399.97,
    item_count: 3,
    currency: 'USD'
});

// Avoid nested objects
analytics.track('purchase_completed', {
    order: {
        id: 'ORD-789',
        details: {
            revenue: 399.97
        }
    }
});
```

### User Identification

Set user ID after authentication:

```javascript
// On login
async function handleLogin(user) {
    // Set user ID
    analytics.setUserId(user.id);

    // Set user properties
    analytics.setUserProperties({
        user_type: user.type,
        plan: user.plan,
        signup_date: user.createdAt
    });
}

// On logout
function handleLogout() {
    analytics.setUserId(null);
}
```

### Performance

Batch events when possible:

```javascript
// Custom provider batches automatically
const customProvider = new CustomAnalyticsProvider({
    batchSize: 10,        // Send after 10 events
    flushInterval: 5000   // Or every 5 seconds
});

// Manual batching
const events = [];

for (const product of products) {
    events.push({
        name: 'product_impression',
        properties: { product_id: product.id }
    });
}

// Send all at once
events.forEach(event => analytics.track(event.name, event.properties));
```

### Error Handling

Always handle errors gracefully:

```javascript
try {
    await analytics.init();
} catch (error) {
    console.error('Analytics initialization failed:', error);
    // Continue without analytics
}

// Track errors but don't break functionality
document.querySelector('#buy-btn').addEventListener('click', () => {
    try {
        analytics.track('purchase_initiated');
    } catch (error) {
        console.warn('Analytics tracking failed:', error);
    }

    // Continue with purchase flow
    processPurchase();
});
```

### Privacy First

Always respect user privacy:

```javascript
// Check consent before tracking
if (consent.isAnalyticsAllowed()) {
    analytics.track('event_name', properties);
}

// Anonymize sensitive data
const safeData = DataAnonymizer.removePII(userData);
analytics.setUserProperties(safeData);

// Respect Do Not Track
if (navigator.doNotTrack === '1') {
    // Don't initialize analytics
}
```

---

## API Reference

### AnalyticsManager

#### Constructor

```javascript
new AnalyticsManager(config)
```

**Parameters:**
- `config.providers` (Array): Array of analytics providers
- `config.autoPageViews` (Boolean): Automatically track page views (default: false)
- `config.debug` (Boolean): Enable debug logging (default: false)

#### Methods

**`async init()`**
Initialize analytics manager and all providers.

**`track(eventName, properties)`**
Track a custom event.
- `eventName` (String): Event name
- `properties` (Object): Event properties

**`trackPageView(properties)`**
Track a page view.
- `properties` (Object): Page properties (title, location, etc.)

**`setUserId(userId)`**
Set the user ID for tracking.
- `userId` (String|null): User identifier

**`setUserProperties(properties)`**
Set user properties.
- `properties` (Object): User attributes

### EcommerceTracker

#### Constructor

```javascript
new EcommerceTracker(analyticsManager)
```

#### Methods

**`trackProductView(product)`**
Track product view.
- `product.id` (String): Product ID
- `product.name` (String): Product name
- `product.price` (Number): Product price
- `product.category` (String): Product category

**`trackAddToCart(product, quantity)`**
Track add to cart.
- `product` (Object): Product data
- `quantity` (Number): Quantity added

**`trackRemoveFromCart(product, quantity)`**
Track remove from cart.

**`trackBeginCheckout(items, totalValue)`**
Track checkout initiation.
- `items` (Array): Cart items
- `totalValue` (Number): Cart total

**`trackPurchase(order)`**
Track completed purchase.
- `order.orderId` (String): Order ID
- `order.totalAmount` (Number): Order total
- `order.items` (Array): Order items

**`trackSearch(query, resultCount)`**
Track search.
- `query` (String): Search query
- `resultCount` (Number): Number of results

### UserBehaviorTracker

#### Constructor

```javascript
new UserBehaviorTracker(analyticsManager, options)
```

#### Methods

**`trackScrollDepth()`**
Track scroll depth (25%, 50%, 75%, 100%).

**`trackEngagementTime()`**
Track active engagement time.

**`trackClicks(selector, properties)`**
Track clicks on elements.
- `selector` (String): CSS selector
- `properties` (Object): Additional properties

**`trackFormInteractions(formSelector, properties)`**
Track form field interactions.

### ConversionFunnelTracker

#### Methods

**`defineFunnel(name, steps)`**
Define a conversion funnel.
- `name` (String): Funnel name
- `steps` (Array): Array of step objects

**`trackStep(funnelName, stepName, properties)`**
Track funnel step completion.

**`trackCompletion(funnelName, properties)`**
Track funnel completion.

**`trackAbandonment(funnelName, stepName, properties)`**
Track funnel abandonment.

### CookieConsentManager

#### Constructor

```javascript
new CookieConsentManager(options)
```

**Options:**
- `position` (String): 'bottom' or 'top'
- `privacyPolicyUrl` (String): Privacy policy URL
- `onConsentChange` (Function): Callback when consent changes

#### Methods

**`showConsentBanner()`**
Display consent banner.

**`isAnalyticsAllowed()`**
Check if analytics tracking is allowed.

**`isMarketingAllowed()`**
Check if marketing tracking is allowed.

**`getPreferences()`**
Get current consent preferences.

**`savePreferences(preferences)`**
Save consent preferences.

### Helper Functions

**`trackProductImpressions(containerId, listName)`**
Auto-track product impressions using IntersectionObserver.

**`initAddToCartTracking()`**
Auto-track all add-to-cart button clicks.

**`trackProductDetailView(productId)`**
Track product detail page view.

**`trackSearchQuery(query, resultCount)`**
Track search query.

**`trackCartView()`**
Track cart page view.

**`trackAuth(action, method)`**
Track authentication events.
- `action`: 'login', 'signup', 'logout'
- `method`: 'email', 'google', 'facebook', etc.

**`trackError(error, context)`**
Track JavaScript errors.

**`initOutboundLinkTracking()`**
Auto-track clicks on external links.

---

## Next Steps

1. **Set up your analytics provider** (Google Analytics or custom endpoint)
2. **Implement cookie consent** if serving EU users
3. **Add product view tracking** to product pages
4. **Implement checkout tracking** using CheckoutTracker
5. **Test in debug mode** to verify events
6. **Monitor in production** using your analytics dashboard

For questions or issues, refer to the code comments or create an issue in your repository.

---

**Happy Tracking!** 📊
