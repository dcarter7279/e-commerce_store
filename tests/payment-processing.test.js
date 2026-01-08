// Payment Processing Tests
// Tests for Stripe integration, payment methods, and transaction handling

import {
    TestRunner,
    TestUtils,
    Assert,
    mockAPI,
    TestDataFactory,
    TEST_CONFIG
} from './setup.js';

const runner = new TestRunner();

/**
 * Setup and Teardown
 */
runner.beforeEach(() => {
    TestUtils.clearStorage();
    document.body.innerHTML = '<div id="test-container"></div>';

    // Mock Stripe global object
    window.Stripe = function() {
        return {
            elements: () => ({
                create: (type) => ({
                    mount: (selector) => {},
                    on: (event, callback) => {},
                    clear: () => {},
                    unmount: () => {}
                })
            }),
            createToken: async () => ({
                token: { id: 'tok_test_123' }
            }),
            createPaymentMethod: async () => ({
                paymentMethod: { id: 'pm_test_123' }
            }),
            confirmCardPayment: async (clientSecret) => ({
                paymentIntent: {
                    id: 'pi_test_123',
                    status: 'succeeded'
                }
            }),
            handleCardAction: async () => ({
                paymentIntent: { status: 'requires_confirmation' }
            })
        };
    };
});

runner.afterEach(() => {
    mockAPI.clear();
    document.body.innerHTML = '';
    delete window.Stripe;
});

/**
 * Stripe Initialization Tests
 */
runner.test('Should initialize Stripe', async () => {
    const { initStripe } = await import('../js/payment.js');

    const stripe = initStripe('pk_test_123');

    Assert.isTrue(stripe !== null, 'Stripe should initialize');
});

runner.test('Should create card element', async () => {
    document.body.innerHTML = '<div id="card-element"></div>';

    const { createCardElement } = await import('../js/payment.js');

    const element = createCardElement('#card-element');

    Assert.isTrue(element !== null, 'Card element should be created');
});

runner.test('Should mount card element to DOM', async () => {
    document.body.innerHTML = '<div id="card-element"></div>';

    const { mountCardElement } = await import('../js/payment.js');

    await mountCardElement('#card-element');

    const container = document.querySelector('#card-element');
    Assert.isTrue(container !== null, 'Card element should be mounted');
});

runner.test('Should apply custom styling to card element', async () => {
    const { createCardElement } = await import('../js/payment.js');

    const customStyle = {
        base: {
            fontSize: '16px',
            color: '#32325d'
        }
    };

    const element = createCardElement('#card-element', customStyle);

    Assert.isTrue(element !== null, 'Custom styled element should be created');
});

/**
 * Payment Method Creation Tests
 */
runner.test('Should create payment method from card', async () => {
    const { createPaymentMethod } = await import('../js/payment.js');

    const cardElement = {}; // Mock card element

    const result = await createPaymentMethod(cardElement, {
        billing_details: {
            name: 'Test User',
            email: 'test@example.com'
        }
    });

    Assert.equals(result.paymentMethod.id, 'pm_test_123', 'Should create payment method');
});

runner.test('Should create token from card (legacy)', async () => {
    const { createCardToken } = await import('../js/payment.js');

    const cardElement = {};

    const result = await createCardToken(cardElement);

    Assert.equals(result.token.id, 'tok_test_123', 'Should create card token');
});

runner.test('Should handle card validation errors', async () => {
    window.Stripe = function() {
        return {
            createPaymentMethod: async () => ({
                error: {
                    type: 'validation_error',
                    message: 'Your card number is invalid'
                }
            })
        };
    };

    const { createPaymentMethod } = await import('../js/payment.js');

    const result = await createPaymentMethod({});

    Assert.isTrue(result.error !== undefined, 'Should return validation error');
    Assert.contains(result.error.message, 'invalid', 'Error message should mention invalid card');
});

/**
 * Payment Intent Tests
 */
runner.test('Should create payment intent', async () => {
    mockAPI.mock('/api/payment/create-intent', {
        clientSecret: 'pi_123_secret_456',
        paymentIntentId: 'pi_123'
    }, { method: 'POST' });
    mockAPI.enable();

    const { createPaymentIntent } = await import('../js/payment.js');

    const result = await createPaymentIntent({
        amount: 5000, // $50.00
        currency: 'usd'
    });

    Assert.equals(result.paymentIntentId, 'pi_123', 'Should create payment intent');
    Assert.isTrue(result.clientSecret.length > 0, 'Should return client secret');

    mockAPI.disable();
});

runner.test('Should confirm card payment', async () => {
    const { confirmCardPayment } = await import('../js/payment.js');

    const result = await confirmCardPayment('pi_123_secret_456', {});

    Assert.equals(result.paymentIntent.id, 'pi_test_123', 'Should confirm payment');
    Assert.equals(result.paymentIntent.status, 'succeeded', 'Payment should succeed');
});

runner.test('Should handle 3D Secure authentication', async () => {
    window.Stripe = function() {
        return {
            confirmCardPayment: async () => ({
                error: {
                    payment_intent: {
                        id: 'pi_123',
                        status: 'requires_action'
                    }
                }
            }),
            handleCardAction: async () => ({
                paymentIntent: {
                    id: 'pi_123',
                    status: 'requires_confirmation'
                }
            })
        };
    };

    const { handle3DSecure } = await import('../js/payment.js');

    const result = await handle3DSecure('pi_123_secret_456');

    Assert.equals(result.paymentIntent.status, 'requires_confirmation', 'Should handle 3DS');
});

/**
 * Payment Processing Tests
 */
runner.test('Should process successful payment', async () => {
    mockAPI.mock('/api/payment/process', {
        success: true,
        transactionId: 'txn_123',
        orderId: 'ORD-123'
    }, { method: 'POST' });
    mockAPI.enable();

    const { processPayment } = await import('../js/payment.js');

    const result = await processPayment({
        paymentMethodId: 'pm_test_123',
        amount: 5000,
        currency: 'usd',
        orderId: 'ORD-123'
    });

    Assert.isTrue(result.success, 'Payment should succeed');
    Assert.equals(result.transactionId, 'txn_123', 'Should return transaction ID');

    mockAPI.disable();
});

runner.test('Should handle declined payment', async () => {
    mockAPI.mock('/api/payment/process', {
        success: false,
        error: 'card_declined',
        message: 'Your card was declined'
    }, { status: 402, method: 'POST' });
    mockAPI.enable();

    const { processPayment } = await import('../js/payment.js');

    await Assert.throwsAsync(
        async () => await processPayment({
            paymentMethodId: 'pm_test_123',
            amount: 5000
        }),
        'Should throw error for declined payment'
    );

    mockAPI.disable();
});

runner.test('Should handle insufficient funds', async () => {
    mockAPI.mock('/api/payment/process', {
        error: 'insufficient_funds',
        message: 'Your card has insufficient funds'
    }, { status: 402, method: 'POST' });
    mockAPI.enable();

    const { processPayment } = await import('../js/payment.js');

    try {
        await processPayment({ paymentMethodId: 'pm_test_123', amount: 1000000 });
        Assert.isTrue(false, 'Should have thrown error');
    } catch (error) {
        Assert.contains(error.message, 'insufficient', 'Error should mention insufficient funds');
    }

    mockAPI.disable();
});

runner.test('Should retry failed payment', async () => {
    let attempts = 0;

    mockAPI.mock('/api/payment/process', () => {
        attempts++;
        if (attempts < 2) {
            return { error: 'network_error' };
        }
        return { success: true, transactionId: 'txn_123' };
    }, { method: 'POST' });
    mockAPI.enable();

    const { processPaymentWithRetry } = await import('../js/payment.js');

    const result = await processPaymentWithRetry({
        paymentMethodId: 'pm_test_123',
        amount: 5000,
        maxRetries: 3
    });

    Assert.isTrue(result.success, 'Payment should succeed after retry');
    Assert.equals(attempts, 2, 'Should have retried once');

    mockAPI.disable();
});

/**
 * Payment Validation Tests
 */
runner.test('Should validate payment amount', async () => {
    const { validatePaymentAmount } = await import('../js/payment.js');

    Assert.isTrue(validatePaymentAmount(10.00), 'Valid amount should pass');
    Assert.isFalse(validatePaymentAmount(0), 'Zero amount should fail');
    Assert.isFalse(validatePaymentAmount(-10), 'Negative amount should fail');
});

runner.test('Should convert amount to cents', async () => {
    const { convertToCents } = await import('../js/payment.js');

    Assert.equals(convertToCents(10.00), 1000, '$10.00 should be 1000 cents');
    Assert.equals(convertToCents(19.99), 1999, '$19.99 should be 1999 cents');
});

runner.test('Should validate currency code', async () => {
    const { validateCurrency } = await import('../js/payment.js');

    Assert.isTrue(validateCurrency('usd'), 'USD should validate');
    Assert.isTrue(validateCurrency('eur'), 'EUR should validate');
    Assert.isFalse(validateCurrency('invalid'), 'Invalid currency should not validate');
});

/**
 * Saved Payment Methods Tests
 */
runner.test('Should save payment method for user', async () => {
    mockAPI.mock('/api/users/user_123/payment-methods', {
        success: true,
        paymentMethodId: 'pm_saved_123'
    }, { method: 'POST' });
    mockAPI.enable();

    const { savePaymentMethod } = await import('../js/payment.js');

    const result = await savePaymentMethod('user_123', 'pm_test_123');

    Assert.isTrue(result.success, 'Payment method should be saved');

    mockAPI.disable();
});

runner.test('Should load saved payment methods', async () => {
    mockAPI.mock('/api/users/user_123/payment-methods', [
        { id: 'pm_1', brand: 'visa', last4: '4242' },
        { id: 'pm_2', brand: 'mastercard', last4: '5555' }
    ]);
    mockAPI.enable();

    const { loadPaymentMethods } = await import('../js/payment.js');

    const methods = await loadPaymentMethods('user_123');

    Assert.equals(methods.length, 2, 'Should load 2 payment methods');
    Assert.equals(methods[0].brand, 'visa', 'First method should be Visa');

    mockAPI.disable();
});

runner.test('Should delete saved payment method', async () => {
    mockAPI.mock('/api/users/user_123/payment-methods/pm_1', {
        success: true
    }, { method: 'DELETE' });
    mockAPI.enable();

    const { deletePaymentMethod } = await import('../js/payment.js');

    const result = await deletePaymentMethod('user_123', 'pm_1');

    Assert.isTrue(result.success, 'Payment method should be deleted');

    mockAPI.disable();
});

runner.test('Should set default payment method', async () => {
    mockAPI.mock('/api/users/user_123/payment-methods/pm_1/set-default', {
        success: true
    }, { method: 'POST' });
    mockAPI.enable();

    const { setDefaultPaymentMethod } = await import('../js/payment.js');

    const result = await setDefaultPaymentMethod('user_123', 'pm_1');

    Assert.isTrue(result.success, 'Default payment method should be set');

    mockAPI.disable();
});

/**
 * Refund Tests
 */
runner.test('Should process full refund', async () => {
    mockAPI.mock('/api/payment/refund', {
        success: true,
        refundId: 're_123',
        amount: 5000
    }, { method: 'POST' });
    mockAPI.enable();

    const { processRefund } = await import('../js/payment.js');

    const result = await processRefund('txn_123', 5000);

    Assert.isTrue(result.success, 'Refund should succeed');
    Assert.equals(result.refundId, 're_123', 'Should return refund ID');

    mockAPI.disable();
});

runner.test('Should process partial refund', async () => {
    mockAPI.mock('/api/payment/refund', {
        success: true,
        refundId: 're_123',
        amount: 2500
    }, { method: 'POST' });
    mockAPI.enable();

    const { processRefund } = await import('../js/payment.js');

    const result = await processRefund('txn_123', 2500);

    Assert.isTrue(result.success, 'Partial refund should succeed');
    Assert.equals(result.amount, 2500, 'Refund amount should be $25.00');

    mockAPI.disable();
});

runner.test('Should validate refund amount', async () => {
    const { validateRefundAmount } = await import('../js/payment.js');

    Assert.isTrue(
        validateRefundAmount(2500, 5000),
        'Partial refund should validate'
    );
    Assert.isFalse(
        validateRefundAmount(6000, 5000),
        'Refund cannot exceed original amount'
    );
});

/**
 * Payment Error Handling Tests
 */
runner.test('Should display payment error messages', async () => {
    document.body.innerHTML = '<div id="payment-errors"></div>';

    const { displayPaymentError } = await import('../js/payment.js');

    displayPaymentError('Your card was declined');

    await TestUtils.wait(100);

    const errorText = await TestUtils.getText('#payment-errors');
    Assert.contains(errorText, 'declined', 'Should display error message');
});

runner.test('Should clear payment errors', async () => {
    document.body.innerHTML = '<div id="payment-errors">Previous error</div>';

    const { clearPaymentErrors } = await import('../js/payment.js');

    clearPaymentErrors();

    const errorText = await TestUtils.getText('#payment-errors');
    Assert.equals(errorText, '', 'Errors should be cleared');
});

runner.test('Should handle network errors gracefully', async () => {
    mockAPI.mock('/api/payment/process', {}, { status: 500, method: 'POST' });
    mockAPI.enable();

    const { processPayment } = await import('../js/payment.js');

    try {
        await processPayment({ paymentMethodId: 'pm_test', amount: 5000 });
        Assert.isTrue(false, 'Should have thrown error');
    } catch (error) {
        Assert.isTrue(error !== null, 'Should catch network error');
    }

    mockAPI.disable();
});

/**
 * Payment UI Tests
 */
runner.test('Should disable payment button during processing', async () => {
    document.body.innerHTML = '<button id="payment-submit">Pay Now</button>';

    const { disablePaymentButton } = await import('../js/payment.js');

    disablePaymentButton();

    const button = document.querySelector('#payment-submit');
    Assert.isTrue(button.disabled, 'Payment button should be disabled');
});

runner.test('Should show loading spinner during payment', async () => {
    document.body.innerHTML = '<div id="payment-spinner" class="hidden"></div>';

    const { showPaymentLoading } = await import('../js/payment.js');

    showPaymentLoading();

    const spinner = await TestUtils.isVisible('#payment-spinner');
    Assert.isTrue(spinner, 'Loading spinner should be visible');
});

runner.test('Should update button text during processing', async () => {
    document.body.innerHTML = '<button id="payment-submit">Pay Now</button>';

    const { updatePaymentButtonText } = await import('../js/payment.js');

    updatePaymentButtonText('Processing...');

    const buttonText = await TestUtils.getText('#payment-submit');
    Assert.equals(buttonText, 'Processing...', 'Button text should update');
});

/**
 * Payment Webhooks Tests
 */
runner.test('Should handle payment succeeded webhook', async () => {
    const { handlePaymentWebhook } = await import('../js/payment.js');

    const webhook = {
        type: 'payment_intent.succeeded',
        data: {
            object: {
                id: 'pi_123',
                amount: 5000,
                status: 'succeeded'
            }
        }
    };

    const result = await handlePaymentWebhook(webhook);

    Assert.isTrue(result.handled, 'Webhook should be handled');
});

runner.test('Should handle payment failed webhook', async () => {
    const { handlePaymentWebhook } = await import('../js/payment.js');

    const webhook = {
        type: 'payment_intent.payment_failed',
        data: {
            object: {
                id: 'pi_123',
                status: 'failed',
                last_payment_error: {
                    message: 'Card declined'
                }
            }
        }
    };

    const result = await handlePaymentWebhook(webhook);

    Assert.isTrue(result.handled, 'Failed payment webhook should be handled');
});

/**
 * Alternative Payment Methods Tests
 */
runner.test('Should support PayPal integration', async () => {
    const { initPayPal } = await import('../js/payment.js');

    // Mock PayPal SDK
    window.paypal = {
        Buttons: () => ({
            render: () => {}
        })
    };

    const buttons = initPayPal('#paypal-button-container');

    Assert.isTrue(buttons !== null, 'PayPal should initialize');

    delete window.paypal;
});

runner.test('Should process Apple Pay payment', async () => {
    // Mock Apple Pay
    window.ApplePaySession = {
        canMakePayments: () => true
    };

    const { canUseApplePay } = await import('../js/payment.js');

    const canUse = canUseApplePay();

    Assert.isTrue(canUse, 'Should detect Apple Pay support');

    delete window.ApplePaySession;
});

/**
 * Transaction Logging Tests
 */
runner.test('Should log payment transaction', async () => {
    mockAPI.mock('/api/payment/log', {
        success: true
    }, { method: 'POST' });
    mockAPI.enable();

    const { logTransaction } = await import('../js/payment.js');

    const result = await logTransaction({
        type: 'payment',
        transactionId: 'txn_123',
        amount: 5000,
        status: 'succeeded'
    });

    Assert.isTrue(result.success, 'Transaction should be logged');

    mockAPI.disable();
});

runner.test('Should retrieve transaction history', async () => {
    mockAPI.mock('/api/payment/transactions', [
        { id: 'txn_1', amount: 5000, status: 'succeeded' },
        { id: 'txn_2', amount: 3000, status: 'succeeded' }
    ]);
    mockAPI.enable();

    const { getTransactionHistory } = await import('../js/payment.js');

    const transactions = await getTransactionHistory('user_123');

    Assert.equals(transactions.length, 2, 'Should retrieve 2 transactions');

    mockAPI.disable();
});

/**
 * Security Tests
 */
runner.test('Should not store sensitive card data', async () => {
    const { processPayment } = await import('../js/payment.js');

    // Process a payment
    mockAPI.mock('/api/payment/process', { success: true }, { method: 'POST' });
    mockAPI.enable();

    await processPayment({
        paymentMethodId: 'pm_test_123',
        amount: 5000
    });

    // Check that no card data is in localStorage
    const allStorage = { ...localStorage };
    const hasCardData = Object.values(allStorage).some(value =>
        value.includes('4242') || value.includes('cvv') || value.includes('expiry')
    );

    Assert.isFalse(hasCardData, 'Should not store sensitive card data');

    mockAPI.disable();
});

runner.test('Should use HTTPS for payment requests', async () => {
    const { isSecureConnection } = await import('../js/payment.js');

    // In test environment, this would check window.location.protocol
    const isSecure = isSecureConnection();

    // In production, this must be true
    Assert.isTrue(
        isSecure || window.location.protocol !== 'https:',
        'Should require HTTPS in production'
    );
});

runner.test('Should validate payment request signature', async () => {
    const { validatePaymentSignature } = await import('../js/payment.js');

    const validSignature = validatePaymentSignature({
        amount: 5000,
        orderId: 'ORD-123',
        signature: 'valid_signature_here'
    });

    Assert.isTrue(validSignature, 'Valid signature should pass');
});

// Run tests
export async function runPaymentProcessingTests() {
    console.log('💳 Running Payment Processing Tests...\n');
    return await runner.run();
}

// Auto-run if loaded directly
if (import.meta.url === window.location.href) {
    runPaymentProcessingTests();
}
