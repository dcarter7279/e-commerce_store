# Stripe Payment Integration Guide

This guide explains how to integrate Stripe payment processing into the e-commerce multi-step checkout.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Frontend Setup](#frontend-setup)
3. [Backend Setup](#backend-setup)
4. [Payment Form Implementation](#payment-form-implementation)
5. [Payment Processing Flow](#payment-processing-flow)
6. [Security Best Practices](#security-best-practices)
7. [Testing](#testing)

---

## Prerequisites

### 1. Create a Stripe Account
- Sign up at [https://stripe.com](https://stripe.com)
- Get your API keys from the Stripe Dashboard
  - **Publishable Key** (starts with `pk_test_` or `pk_live_`)
  - **Secret Key** (starts with `sk_test_` or `sk_live_`)

### 2. Install Dependencies

**Frontend:**
```html
<!-- Add Stripe.js to your HTML -->
<script src="https://js.stripe.com/v3/"></script>
```

**Backend (Node.js example):**
```bash
npm install stripe express cors body-parser
```

---

## Frontend Setup

### 1. Update `multi-step-checkout.html`

Replace the card input section in Step 2 with Stripe Elements:

```html
<!-- Step 2: Payment Information -->
<div class="checkout-step" id="step-2">
    <div class="step-header">
        <h2 class="step-title">Payment Information</h2>
        <p class="step-description">Secure payment processed by Stripe</p>
    </div>

    <form id="payment-form">
        <!-- Billing Address Section -->
        <div class="form-section">
            <h3 class="section-title">Billing Address</h3>

            <div class="checkbox-group">
                <input type="checkbox" id="same-as-shipping" checked>
                <label for="same-as-shipping">Same as shipping address</label>
            </div>

            <!-- Billing address fields (keep existing code) -->
            <div class="billing-address-fields" style="display: none;">
                <!-- Your existing billing address fields -->
            </div>
        </div>

        <!-- Payment Method Section -->
        <div class="form-section">
            <h3 class="section-title">Payment Method</h3>

            <!-- Payment Method Selection -->
            <div class="payment-methods">
                <label class="payment-method selected">
                    <input type="radio" name="payment-method" value="card" checked>
                    <svg class="payment-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                        <line x1="1" y1="10" x2="23" y2="10"></line>
                    </svg>
                    <span class="payment-label">Credit Card</span>
                </label>

                <label class="payment-method">
                    <input type="radio" name="payment-method" value="paypal">
                    <svg class="payment-icon" viewBox="0 0 24 24">
                        <path d="M20 12v6c0 1.1-.9 2-2 2H6c-1.1 0-2-.9-2-2v-6"></path>
                    </svg>
                    <span class="payment-label">PayPal</span>
                </label>
            </div>

            <!-- Stripe Card Element Container -->
            <div class="card-fields active">
                <div class="form-group">
                    <label for="card-element">Card Details</label>
                    <!-- Stripe Elements will be inserted here -->
                    <div id="card-element" class="stripe-card-element">
                        <!-- A Stripe Element will be inserted here -->
                    </div>
                    <!-- Used to display Element errors -->
                    <div id="card-errors" class="error-message" role="alert"></div>
                </div>
            </div>

            <!-- PayPal Button (shown when PayPal is selected) -->
            <div id="paypal-button-container" style="display: none;"></div>
        </div>

        <!-- Navigation Buttons -->
        <div class="step-navigation">
            <button type="button" class="btn btn-secondary btn-back">
                ← Back to Shipping
            </button>
            <button type="submit" class="btn btn-primary btn-next" id="payment-submit-btn">
                Review Order →
            </button>
        </div>
    </form>
</div>
```

### 2. Add Stripe CSS

Add to `css/multi-step-checkout.css`:

```css
/* Stripe Elements Styling */
.stripe-card-element {
    padding: 0.75rem;
    border: 2px solid var(--border-color);
    border-radius: var(--border-radius);
    background: var(--white);
    transition: var(--transition);
}

.stripe-card-element:focus-within {
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

.stripe-card-element.StripeElement--invalid {
    border-color: var(--danger-color);
}

.stripe-card-element.StripeElement--complete {
    border-color: var(--success-color);
}

/* Stripe Element base styles */
.StripeElement {
    height: 40px;
    padding: 10px 0;
    width: 100%;
}

.StripeElement--focus {
    outline: none;
}

.StripeElement--webkit-autofill {
    background-color: #fefde5 !important;
}

/* Payment processing overlay */
.payment-processing-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
}

.payment-processing-content {
    background: var(--white);
    padding: var(--spacing-xl);
    border-radius: var(--border-radius);
    text-align: center;
    max-width: 400px;
}

.payment-spinner {
    width: 50px;
    height: 50px;
    border: 4px solid var(--bg-light);
    border-top-color: var(--primary-color);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto var(--spacing-md);
}

@keyframes spin {
    to { transform: rotate(360deg); }
}
```

### 3. Create `js/stripe-payment.js`

```javascript
// Stripe Payment Integration Module
// Handles secure payment processing with Stripe

// Initialize Stripe with your publishable key
const stripe = Stripe('pk_test_YOUR_PUBLISHABLE_KEY'); // Replace with your key

// Create Stripe Elements instance
const elements = stripe.elements();

// Custom styling for card element
const cardStyle = {
    base: {
        color: '#333',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontSmoothing: 'antialiased',
        fontSize: '16px',
        '::placeholder': {
            color: '#999'
        }
    },
    invalid: {
        color: '#e74c3c',
        iconColor: '#e74c3c'
    }
};

// Create and mount the card element
const cardElement = elements.create('card', {
    style: cardStyle,
    hidePostalCode: true // We collect this separately
});

let cardMounted = false;

// Initialize Stripe Elements
export function initializeStripeElements() {
    const cardElementContainer = document.getElementById('card-element');

    if (cardElementContainer && !cardMounted) {
        cardElement.mount('#card-element');
        cardMounted = true;

        // Handle real-time validation errors
        cardElement.on('change', function(event) {
            const displayError = document.getElementById('card-errors');
            if (event.error) {
                displayError.textContent = event.error.message;
                displayError.style.display = 'block';
            } else {
                displayError.textContent = '';
                displayError.style.display = 'none';
            }
        });
    }
}

// Create Payment Intent on your backend
async function createPaymentIntent(amount, currency = 'usd') {
    const response = await fetch('https://your-backend-url.com/create-payment-intent', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            amount: Math.round(amount * 100), // Convert to cents
            currency: currency
        })
    });

    if (!response.ok) {
        throw new Error('Failed to create payment intent');
    }

    return await response.json();
}

// Process payment with Stripe
export async function processStripePayment(paymentData) {
    try {
        // Show processing overlay
        showPaymentProcessing();

        // Create payment intent on backend
        const { clientSecret } = await createPaymentIntent(
            paymentData.amount,
            paymentData.currency
        );

        // Confirm card payment
        const { error, paymentIntent } = await stripe.confirmCardPayment(
            clientSecret,
            {
                payment_method: {
                    card: cardElement,
                    billing_details: {
                        name: paymentData.billingName,
                        email: paymentData.email,
                        address: {
                            line1: paymentData.address,
                            city: paymentData.city,
                            state: paymentData.state,
                            postal_code: paymentData.zip,
                            country: 'US'
                        }
                    }
                }
            }
        );

        hidePaymentProcessing();

        if (error) {
            // Payment failed
            throw new Error(error.message);
        }

        // Payment succeeded
        return {
            success: true,
            paymentIntent: paymentIntent,
            transactionId: paymentIntent.id
        };

    } catch (error) {
        hidePaymentProcessing();
        return {
            success: false,
            error: error.message
        };
    }
}

// Validate card element
export function validateStripeCard() {
    return new Promise((resolve) => {
        // Card validation is handled by Stripe Elements
        // We just need to check if the element has been filled
        const cardErrors = document.getElementById('card-errors');
        if (cardErrors.textContent) {
            resolve(false);
        } else {
            resolve(true);
        }
    });
}

// Show payment processing overlay
function showPaymentProcessing() {
    const overlay = document.createElement('div');
    overlay.id = 'payment-processing-overlay';
    overlay.className = 'payment-processing-overlay';
    overlay.innerHTML = `
        <div class="payment-processing-content">
            <div class="payment-spinner"></div>
            <h3>Processing Payment...</h3>
            <p>Please don't close this window</p>
        </div>
    `;
    document.body.appendChild(overlay);
}

// Hide payment processing overlay
function hidePaymentProcessing() {
    const overlay = document.getElementById('payment-processing-overlay');
    if (overlay) {
        overlay.remove();
    }
}

// Handle payment errors
export function handlePaymentError(error) {
    const displayError = document.getElementById('card-errors');
    if (displayError) {
        displayError.textContent = error;
        displayError.style.display = 'block';
    }

    // Show user-friendly error message
    alert(`Payment failed: ${error}\n\nPlease check your card details and try again.`);
}

// Clear card element (for retries)
export function clearCardElement() {
    cardElement.clear();
}
```

### 4. Update `js/multi-step-checkout.js`

Add Stripe integration to your checkout flow:

```javascript
// Add import at the top
import {
    initializeStripeElements,
    processStripePayment,
    validateStripeCard,
    handlePaymentError,
    clearCardElement
} from './stripe-payment.js';

// Update initCheckout function
export function initCheckout() {
    loadCartItems();
    updateOrderSummary();
    attachEventListeners();
    updateProgressBar();

    // Initialize Stripe Elements
    initializeStripeElements();

    // Auto-fill test data in development
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        autoFillTestData();
    }
}

// Update validatePaymentForm function
async function validatePaymentForm() {
    const form = document.getElementById('payment-form');
    const paymentMethod = document.querySelector('input[name="payment-method"]:checked');

    if (!paymentMethod) {
        alert('Please select a payment method');
        return false;
    }

    // If credit card is selected, validate with Stripe
    if (paymentMethod.value === 'card') {
        const isValid = await validateStripeCard();
        if (!isValid) {
            return false;
        }
    }

    // Validate billing address if different from shipping
    const sameAsShipping = document.getElementById('same-as-shipping');
    if (!sameAsShipping.checked) {
        const billingFields = form.querySelectorAll('.billing-address-fields [required]');
        let isValid = true;

        billingFields.forEach(field => {
            if (!validateField(field)) {
                isValid = false;
            }
        });

        return isValid;
    }

    return true;
}

// Update handlePlaceOrder function to use Stripe
async function handlePlaceOrder(e) {
    e.preventDefault();

    const paymentMethod = document.querySelector('input[name="payment-method"]:checked');

    if (paymentMethod.value === 'card') {
        // Process with Stripe
        const totals = updateOrderSummary();
        const billingAddress = formData.payment.billingAddress;

        const paymentData = {
            amount: totals.total,
            currency: 'usd',
            billingName: `${billingAddress.firstName || formData.shipping.firstName} ${billingAddress.lastName || formData.shipping.lastName}`,
            email: formData.shipping.email,
            address: billingAddress.address,
            city: billingAddress.city,
            state: billingAddress.state,
            zip: billingAddress.zip
        };

        const result = await processStripePayment(paymentData);

        if (!result.success) {
            handlePaymentError(result.error);
            return;
        }

        // Payment successful - store transaction ID
        formData.payment.transactionId = result.transactionId;
    }

    // Continue with order completion
    const orderNumber = generateOrderNumber();
    const totals = updateOrderSummary();

    // Update confirmation page
    document.getElementById('confirmation-order-number').textContent = orderNumber;
    document.getElementById('confirmation-email').textContent = formData.shipping.email;
    document.getElementById('confirmation-total').textContent = `$${totals.total.toFixed(2)}`;

    // Clear cart
    clearCart();

    // Go to confirmation step
    goToStep(4);

    // Store order in localStorage (for demo purposes)
    const order = {
        orderNumber,
        date: new Date().toISOString(),
        shipping: formData.shipping,
        payment: {
            method: formData.payment.method,
            transactionId: formData.payment.transactionId
        },
        items: getCart(),
        totals
    };

    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    orders.push(order);
    localStorage.setItem('orders', JSON.stringify(orders));
}
```

---

## Backend Setup

### 1. Create Express Server (`server.js`)

```javascript
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const stripe = require('stripe')('sk_test_YOUR_SECRET_KEY'); // Replace with your secret key

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Create Payment Intent endpoint
app.post('/create-payment-intent', async (req, res) => {
    try {
        const { amount, currency } = req.body;

        // Validate amount
        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'Invalid amount' });
        }

        // Create a PaymentIntent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount, // Amount in cents
            currency: currency || 'usd',
            automatic_payment_methods: {
                enabled: true,
            },
            // Optional: Add metadata
            metadata: {
                integration_check: 'accept_a_payment'
            }
        });

        // Send client secret to frontend
        res.json({
            clientSecret: paymentIntent.client_secret
        });

    } catch (error) {
        console.error('Error creating payment intent:', error);
        res.status(500).json({ error: error.message });
    }
});

// Webhook endpoint for Stripe events
app.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = 'whsec_YOUR_WEBHOOK_SECRET'; // From Stripe Dashboard

    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
        case 'payment_intent.succeeded':
            const paymentIntent = event.data.object;
            console.log('PaymentIntent succeeded:', paymentIntent.id);
            // Fulfill the order, send confirmation email, etc.
            break;

        case 'payment_intent.payment_failed':
            const failedPayment = event.data.object;
            console.log('PaymentIntent failed:', failedPayment.id);
            // Notify customer, log the error, etc.
            break;

        default:
            console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({received: true});
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
```

### 2. Start the Server

```bash
node server.js
```

---

## Payment Processing Flow

```
1. User fills out shipping information → Step 1
2. User fills out payment information → Step 2
   - Stripe Elements validates card in real-time
3. User clicks "Review Order" → Step 3
   - Frontend sends amount to backend
4. Backend creates PaymentIntent with Stripe
   - Returns clientSecret to frontend
5. Frontend confirms payment with Stripe
   - Uses clientSecret + card details
6. Stripe processes payment
   - Returns success/failure
7. If successful → Show confirmation (Step 4)
   - Store order details
   - Clear cart
8. If failed → Show error message
   - Allow user to retry
```

---

## Security Best Practices

### 1. Never Store Card Details
- Never send raw card data to your server
- Let Stripe Elements handle card data securely
- Only store Stripe payment IDs

### 2. Use HTTPS
```javascript
// Enforce HTTPS in production
if (process.env.NODE_ENV === 'production') {
    app.use((req, res, next) => {
        if (req.header('x-forwarded-proto') !== 'https') {
            res.redirect(`https://${req.header('host')}${req.url}`);
        } else {
            next();
        }
    });
}
```

### 3. Validate on Backend
```javascript
// Always validate amount on backend
app.post('/create-payment-intent', async (req, res) => {
    const { amount, currency, orderId } = req.body;

    // Verify order and amount from database
    const order = await getOrderFromDatabase(orderId);

    if (order.total !== amount) {
        return res.status(400).json({ error: 'Amount mismatch' });
    }

    // Proceed with payment intent creation...
});
```

### 4. Use Environment Variables
```javascript
// .env file
STRIPE_SECRET_KEY=sk_test_your_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

// Load in your app
require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
```

### 5. Implement Webhook Verification
- Always verify webhook signatures
- Use Stripe CLI for local testing
- Set up webhook endpoints in Stripe Dashboard

---

## Testing

### 1. Test Card Numbers

Stripe provides test cards for different scenarios:

```javascript
// Success
4242 4242 4242 4242

// Requires authentication (3D Secure)
4000 0025 0000 3155

// Card declined
4000 0000 0000 9995

// Insufficient funds
4000 0000 0000 9995

// Expired card
4000 0000 0000 0069

// Processing error
4000 0000 0000 0119
```

**Card details for testing:**
- Expiry: Any future date (e.g., 12/34)
- CVC: Any 3 digits (e.g., 123)
- ZIP: Any 5 digits (e.g., 12345)

### 2. Test Webhooks Locally

Install Stripe CLI:
```bash
# Install Stripe CLI
# Visit: https://stripe.com/docs/stripe-cli

# Login
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/webhook

# Trigger test webhook
stripe trigger payment_intent.succeeded
```

### 3. Test the Complete Flow

```javascript
// Add test mode indicator
if (window.location.hostname === 'localhost') {
    console.log('🧪 Running in TEST mode');
    console.log('Use test card: 4242 4242 4242 4242');
}
```

---

## Environment Configuration

### Development
```javascript
// stripe-payment.js
const STRIPE_KEY = window.location.hostname === 'localhost'
    ? 'pk_test_YOUR_TEST_KEY'  // Test mode
    : 'pk_live_YOUR_LIVE_KEY'; // Production mode

const stripe = Stripe(STRIPE_KEY);
```

### Production Checklist
- [ ] Replace test keys with live keys
- [ ] Enable HTTPS on your domain
- [ ] Set up production webhook endpoints
- [ ] Configure proper CORS headers
- [ ] Implement rate limiting
- [ ] Set up error monitoring (Sentry, etc.)
- [ ] Test with real cards (small amounts)
- [ ] Review Stripe Dashboard settings

---

## Additional Features

### 1. Save Cards for Future Use

```javascript
// Create a Customer and save payment method
const paymentMethod = await stripe.paymentMethods.create({
    type: 'card',
    card: cardElement,
});

const customer = await stripe.customers.create({
    email: customerEmail,
    payment_method: paymentMethod.id,
});
```

### 2. Support Multiple Currencies

```javascript
// Detect user's location and set currency
const currency = getUserCurrency(); // 'usd', 'eur', 'gbp', etc.

const paymentIntent = await stripe.paymentIntents.create({
    amount: convertToCurrency(amount, currency),
    currency: currency,
});
```

### 3. Handle Subscriptions

```javascript
// Create a subscription
const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: 'price_1234567890' }],
    payment_behavior: 'default_incomplete',
    expand: ['latest_invoice.payment_intent'],
});
```

---

## Support & Documentation

- **Stripe Documentation**: https://stripe.com/docs
- **Stripe API Reference**: https://stripe.com/docs/api
- **Stripe Elements**: https://stripe.com/docs/stripe-js
- **Testing Guide**: https://stripe.com/docs/testing
- **Stripe Dashboard**: https://dashboard.stripe.com

---

## Summary

This integration provides:
✅ Secure payment processing with PCI compliance
✅ Real-time card validation
✅ 3D Secure authentication support
✅ Webhook integration for order fulfillment
✅ Comprehensive error handling
✅ Test mode for development

Your checkout is now ready to accept real payments securely!
