// Stripe Payment Integration Module
// Handles secure payment processing with Stripe

// IMPORTANT: Replace with your actual Stripe publishable key
// Get this from: https://dashboard.stripe.com/apikeys
const STRIPE_PUBLISHABLE_KEY = 'pk_test_YOUR_PUBLISHABLE_KEY_HERE';

// Initialize Stripe
let stripe = null;
let elements = null;
let cardElement = null;
let cardMounted = false;

// Initialize Stripe instance
function initializeStripe() {
    if (!stripe) {
        try {
            stripe = Stripe(STRIPE_PUBLISHABLE_KEY);
            elements = stripe.elements();
        } catch (error) {
            console.error('Failed to initialize Stripe:', error);
            showError('Payment system initialization failed. Please refresh the page.');
        }
    }
}

// Custom styling for card element to match your design
const cardStyle = {
    base: {
        color: '#333',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        fontSmoothing: 'antialiased',
        fontSize: '16px',
        lineHeight: '24px',
        '::placeholder': {
            color: '#999'
        }
    },
    invalid: {
        color: '#e74c3c',
        iconColor: '#e74c3c'
    },
    complete: {
        color: '#27ae60',
        iconColor: '#27ae60'
    }
};

// Initialize Stripe Elements on the page
export function initializeStripeElements() {
    initializeStripe();

    const cardElementContainer = document.getElementById('card-element');

    if (cardElementContainer && !cardMounted && elements) {
        // Create card element with custom styling
        cardElement = elements.create('card', {
            style: cardStyle,
            hidePostalCode: true // We collect ZIP separately in billing address
        });

        // Mount the element
        cardElement.mount('#card-element');
        cardMounted = true;

        // Handle real-time validation errors from Stripe
        cardElement.on('change', function(event) {
            const displayError = document.getElementById('card-errors');
            if (displayError) {
                if (event.error) {
                    displayError.textContent = event.error.message;
                    displayError.style.display = 'block';
                } else {
                    displayError.textContent = '';
                    displayError.style.display = 'none';
                }
            }

            // Add visual feedback to container
            const container = document.getElementById('card-element');
            if (container) {
                if (event.complete) {
                    container.classList.add('StripeElement--complete');
                    container.classList.remove('StripeElement--invalid');
                } else if (event.error) {
                    container.classList.add('StripeElement--invalid');
                    container.classList.remove('StripeElement--complete');
                } else {
                    container.classList.remove('StripeElement--complete', 'StripeElement--invalid');
                }
            }
        });

        console.log('✅ Stripe Elements initialized successfully');
    }
}

// Create Payment Intent on your backend
async function createPaymentIntent(amount, currency = 'usd', metadata = {}) {
    // IMPORTANT: Replace with your actual backend URL
    const backendUrl = 'https://your-backend-url.com/create-payment-intent';

    try {
        const response = await fetch(backendUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                amount: Math.round(amount * 100), // Convert dollars to cents
                currency: currency,
                metadata: metadata
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to create payment intent');
        }

        return await response.json();

    } catch (error) {
        console.error('Error creating payment intent:', error);
        throw error;
    }
}

// Process payment with Stripe
export async function processStripePayment(paymentData) {
    if (!stripe || !cardElement) {
        return {
            success: false,
            error: 'Payment system not initialized. Please refresh the page.'
        };
    }

    try {
        // Show processing overlay
        showPaymentProcessing();

        // Step 1: Create payment intent on backend
        console.log('Creating payment intent for $' + paymentData.amount);

        const { clientSecret } = await createPaymentIntent(
            paymentData.amount,
            paymentData.currency || 'usd',
            {
                email: paymentData.email,
                name: paymentData.billingName
            }
        );

        // Step 2: Confirm card payment with Stripe
        console.log('Confirming payment with Stripe...');

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
                            line2: paymentData.apartment || '',
                            city: paymentData.city,
                            state: paymentData.state,
                            postal_code: paymentData.zip,
                            country: paymentData.country || 'US'
                        }
                    }
                },
                // Handle 3D Secure if required
                return_url: window.location.href
            }
        );

        hidePaymentProcessing();

        if (error) {
            // Payment failed
            console.error('Payment failed:', error);
            return {
                success: false,
                error: error.message
            };
        }

        // Payment succeeded
        console.log('✅ Payment successful:', paymentIntent.id);

        return {
            success: true,
            paymentIntent: paymentIntent,
            transactionId: paymentIntent.id,
            amount: paymentIntent.amount / 100, // Convert cents back to dollars
            currency: paymentIntent.currency,
            status: paymentIntent.status
        };

    } catch (error) {
        hidePaymentProcessing();
        console.error('Payment processing error:', error);

        return {
            success: false,
            error: error.message || 'An unexpected error occurred. Please try again.'
        };
    }
}

// Validate that the card element has been filled out
export async function validateStripeCard() {
    if (!cardElement) {
        console.error('Card element not initialized');
        return false;
    }

    // Check for any error messages
    const cardErrors = document.getElementById('card-errors');
    if (cardErrors && cardErrors.textContent.trim()) {
        return false;
    }

    // Note: Stripe Elements doesn't provide a direct "isEmpty" check
    // We rely on the real-time validation from the 'change' event
    // If there are no errors shown, we assume the card is valid
    return true;
}

// Show payment processing overlay
function showPaymentProcessing() {
    // Remove existing overlay if any
    hidePaymentProcessing();

    const overlay = document.createElement('div');
    overlay.id = 'payment-processing-overlay';
    overlay.className = 'payment-processing-overlay';
    overlay.innerHTML = `
        <div class="payment-processing-content">
            <div class="payment-spinner"></div>
            <h3 style="margin: 1rem 0 0.5rem; color: #333;">Processing Payment...</h3>
            <p style="margin: 0; color: #666;">Please don't close this window</p>
            <p style="margin: 0.5rem 0 0; font-size: 0.875rem; color: #999;">This may take a few moments</p>
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

// Handle payment errors with user-friendly messages
export function handlePaymentError(error) {
    console.error('Payment error:', error);

    // Show error in the card errors div
    const displayError = document.getElementById('card-errors');
    if (displayError) {
        displayError.textContent = error;
        displayError.style.display = 'block';
    }

    // Show user-friendly error message based on error type
    let errorMessage = error;

    if (error.includes('card')) {
        errorMessage = 'There was an issue with your card. Please check your card details and try again.';
    } else if (error.includes('insufficient')) {
        errorMessage = 'Your card has insufficient funds. Please use a different payment method.';
    } else if (error.includes('declined')) {
        errorMessage = 'Your card was declined. Please contact your bank or use a different card.';
    } else if (error.includes('expired')) {
        errorMessage = 'Your card has expired. Please use a different card.';
    } else if (error.includes('network')) {
        errorMessage = 'Network error. Please check your connection and try again.';
    }

    alert(`Payment Failed\n\n${errorMessage}`);
}

// Show general error message
function showError(message) {
    const displayError = document.getElementById('card-errors');
    if (displayError) {
        displayError.textContent = message;
        displayError.style.display = 'block';
    }
}

// Clear the card element (useful for retrying payment)
export function clearCardElement() {
    if (cardElement) {
        cardElement.clear();

        // Clear any error messages
        const displayError = document.getElementById('card-errors');
        if (displayError) {
            displayError.textContent = '';
            displayError.style.display = 'none';
        }

        // Remove visual feedback classes
        const container = document.getElementById('card-element');
        if (container) {
            container.classList.remove('StripeElement--complete', 'StripeElement--invalid');
        }
    }
}

// Destroy Stripe Elements (cleanup)
export function destroyStripeElements() {
    if (cardElement) {
        cardElement.unmount();
        cardElement.destroy();
        cardElement = null;
        cardMounted = false;
    }
}

// Get card brand (Visa, Mastercard, etc.)
export function getCardBrand() {
    // This would need to be tracked from the change event
    // For now, return unknown
    return 'card';
}

// Utility: Format amount for display
export function formatAmount(amount, currency = 'usd') {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency.toUpperCase()
    }).format(amount);
}

// Check if Stripe is properly initialized
export function isStripeReady() {
    return stripe !== null && cardElement !== null && cardMounted;
}

// Export configuration check
export function checkStripeConfiguration() {
    if (STRIPE_PUBLISHABLE_KEY === 'pk_test_YOUR_PUBLISHABLE_KEY_HERE') {
        console.warn('⚠️  Stripe publishable key not configured!');
        console.warn('Please update STRIPE_PUBLISHABLE_KEY in stripe-payment.js');
        return false;
    }

    if (!STRIPE_PUBLISHABLE_KEY.startsWith('pk_')) {
        console.error('❌ Invalid Stripe publishable key format');
        return false;
    }

    console.log('✅ Stripe configuration looks good');
    return true;
}

// Initialize configuration check on module load
checkStripeConfiguration();
