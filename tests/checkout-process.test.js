// Checkout Process Tests
// Tests for multi-step checkout flow: info, shipping, payment, confirmation

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

    // Mock a cart with items
    const cart = [
        {
            product: TestDataFactory.createProduct({ id: 'prod_1', price: 29.99 }),
            quantity: 2
        },
        {
            product: TestDataFactory.createProduct({ id: 'prod_2', price: 49.99 }),
            quantity: 1
        }
    ];

    localStorage.setItem('cart', JSON.stringify(cart));
});

runner.afterEach(() => {
    mockAPI.clear();
    document.body.innerHTML = '';
});

/**
 * Checkout Initialization Tests
 */
runner.test('Should initialize checkout from cart', async () => {
    const { initCheckout, getCheckoutData } = await import('../js/multi-step-checkout.js');

    await initCheckout();

    const checkoutData = getCheckoutData();

    Assert.isTrue(Array.isArray(checkoutData.items), 'Checkout should have items array');
    Assert.greaterThan(checkoutData.items.length, 0, 'Checkout should have items from cart');
});

runner.test('Should not allow checkout with empty cart', async () => {
    localStorage.setItem('cart', JSON.stringify([]));

    document.body.innerHTML = '<button id="checkout-btn">Checkout</button>';

    const { canCheckout } = await import('../js/multi-step-checkout.js');

    const result = canCheckout();

    Assert.isFalse(result, 'Should not allow checkout with empty cart');
});

runner.test('Should redirect to cart if cart is empty', async () => {
    localStorage.setItem('cart', JSON.stringify([]));

    let redirected = false;
    const originalAssign = window.location.assign;
    window.location.assign = (url) => {
        redirected = url.includes('cart');
    };

    const { initCheckout } = await import('../js/multi-step-checkout.js');

    await initCheckout();

    window.location.assign = originalAssign;

    Assert.isTrue(redirected, 'Should redirect to cart page');
});

/**
 * Step Navigation Tests
 */
runner.test('Should show step 1 (customer info) initially', async () => {
    document.body.innerHTML = `
        <div id="checkout-container">
            <div id="step-1" class="checkout-step active"></div>
            <div id="step-2" class="checkout-step"></div>
            <div id="step-3" class="checkout-step"></div>
        </div>
    `;

    const { initCheckout } = await import('../js/multi-step-checkout.js');

    await initCheckout();

    const step1Visible = await TestUtils.isVisible('#step-1.active');
    Assert.isTrue(step1Visible, 'Step 1 should be active initially');
});

runner.test('Should navigate to next step', async () => {
    document.body.innerHTML = `
        <div id="checkout-container">
            <div id="step-1" class="checkout-step active"></div>
            <div id="step-2" class="checkout-step"></div>
            <button id="next-btn">Next</button>
        </div>
    `;

    const { goToNextStep, getCurrentStep } = await import('../js/multi-step-checkout.js');

    await TestUtils.click('#next-btn');
    goToNextStep();

    await TestUtils.wait(200);

    const currentStep = getCurrentStep();
    Assert.equals(currentStep, 2, 'Should navigate to step 2');
});

runner.test('Should navigate to previous step', async () => {
    document.body.innerHTML = `
        <div id="checkout-container">
            <div id="step-1" class="checkout-step"></div>
            <div id="step-2" class="checkout-step active"></div>
            <button id="back-btn">Back</button>
        </div>
    `;

    const { goToPreviousStep, getCurrentStep } = await import('../js/multi-step-checkout.js');

    await TestUtils.click('#back-btn');
    goToPreviousStep();

    await TestUtils.wait(200);

    const currentStep = getCurrentStep();
    Assert.equals(currentStep, 1, 'Should navigate to step 1');
});

runner.test('Should update step indicator', async () => {
    document.body.innerHTML = `
        <div class="step-indicator">
            <div class="step completed" data-step="1">1</div>
            <div class="step active" data-step="2">2</div>
            <div class="step" data-step="3">3</div>
        </div>
    `;

    const { updateStepIndicator } = await import('../js/multi-step-checkout.js');

    updateStepIndicator(2);

    await TestUtils.wait(100);

    const step1 = document.querySelector('[data-step="1"]');
    const step2 = document.querySelector('[data-step="2"]');

    Assert.isTrue(step1.classList.contains('completed'), 'Previous steps should be marked completed');
    Assert.isTrue(step2.classList.contains('active'), 'Current step should be active');
});

/**
 * Customer Information Tests
 */
runner.test('Should validate customer information form', async () => {
    document.body.innerHTML = `
        <form id="customer-info-form">
            <input type="email" id="email" value="" required />
            <input type="text" id="first-name" value="" required />
            <input type="text" id="last-name" value="" required />
        </form>
    `;

    const { validateCustomerInfo } = await import('../js/multi-step-checkout.js');

    const validation = validateCustomerInfo();

    Assert.isFalse(validation.valid, 'Empty form should not validate');
    Assert.greaterThan(validation.errors.length, 0, 'Should have validation errors');
});

runner.test('Should validate email format', async () => {
    document.body.innerHTML = `
        <form id="customer-info-form">
            <input type="email" id="email" value="invalid-email" />
        </form>
    `;

    const { validateEmail } = await import('../js/multi-step-checkout.js');

    const isValid = validateEmail('invalid-email');

    Assert.isFalse(isValid, 'Invalid email should not validate');
});

runner.test('Should accept valid customer information', async () => {
    document.body.innerHTML = `
        <form id="customer-info-form">
            <input type="email" id="email" value="test@example.com" />
            <input type="text" id="first-name" value="John" />
            <input type="text" id="last-name" value="Doe" />
            <input type="tel" id="phone" value="555-0123" />
        </form>
    `;

    const { validateCustomerInfo } = await import('../js/multi-step-checkout.js');

    const validation = validateCustomerInfo();

    Assert.isTrue(validation.valid, 'Valid form should validate');
});

runner.test('Should save customer info to checkout data', async () => {
    document.body.innerHTML = `
        <form id="customer-info-form">
            <input type="email" id="email" value="test@example.com" />
            <input type="text" id="first-name" value="John" />
            <input type="text" id="last-name" value="Doe" />
        </form>
    `;

    const { saveCustomerInfo, getCheckoutData } = await import('../js/multi-step-checkout.js');

    saveCustomerInfo();

    const checkoutData = getCheckoutData();

    Assert.equals(checkoutData.customer.email, 'test@example.com', 'Email should be saved');
    Assert.equals(checkoutData.customer.firstName, 'John', 'First name should be saved');
});

runner.test('Should check for existing account by email', async () => {
    mockAPI.mock('/api/users/check-email', { exists: true, userId: 'user_123' });
    mockAPI.enable();

    const { checkExistingAccount } = await import('../js/multi-step-checkout.js');

    const result = await checkExistingAccount('test@example.com');

    Assert.isTrue(result.exists, 'Should detect existing account');

    mockAPI.disable();
});

/**
 * Shipping Information Tests
 */
runner.test('Should validate shipping address', async () => {
    document.body.innerHTML = `
        <form id="shipping-form">
            <input type="text" id="address" value="" required />
            <input type="text" id="city" value="" required />
            <input type="text" id="state" value="" required />
            <input type="text" id="zip" value="" required />
        </form>
    `;

    const { validateShippingAddress } = await import('../js/multi-step-checkout.js');

    const validation = validateShippingAddress();

    Assert.isFalse(validation.valid, 'Empty shipping form should not validate');
});

runner.test('Should validate ZIP code format', async () => {
    const { validateZipCode } = await import('../js/multi-step-checkout.js');

    Assert.isTrue(validateZipCode('12345'), '5-digit ZIP should validate');
    Assert.isTrue(validateZipCode('12345-6789'), '9-digit ZIP should validate');
    Assert.isFalse(validateZipCode('1234'), 'Invalid ZIP should not validate');
});

runner.test('Should save shipping address', async () => {
    document.body.innerHTML = `
        <form id="shipping-form">
            <input type="text" id="address" value="123 Main St" />
            <input type="text" id="city" value="New York" />
            <input type="text" id="state" value="NY" />
            <input type="text" id="zip" value="10001" />
        </form>
    `;

    const { saveShippingAddress, getCheckoutData } = await import('../js/multi-step-checkout.js');

    saveShippingAddress();

    const checkoutData = getCheckoutData();

    Assert.equals(checkoutData.shipping.address, '123 Main St', 'Address should be saved');
    Assert.equals(checkoutData.shipping.city, 'New York', 'City should be saved');
});

runner.test('Should copy billing address from shipping', async () => {
    document.body.innerHTML = `
        <input type="checkbox" id="same-as-shipping" checked />
        <form id="shipping-form">
            <input type="text" id="address" value="123 Main St" />
            <input type="text" id="city" value="New York" />
        </form>
        <form id="billing-form">
            <input type="text" id="billing-address" value="" />
            <input type="text" id="billing-city" value="" />
        </form>
    `;

    const { copyShippingToBilling } = await import('../js/multi-step-checkout.js');

    await TestUtils.click('#same-as-shipping');
    copyShippingToBilling();

    await TestUtils.wait(100);

    const billingAddress = document.querySelector('#billing-address').value;
    const billingCity = document.querySelector('#billing-city').value;

    Assert.equals(billingAddress, '123 Main St', 'Billing address should match shipping');
    Assert.equals(billingCity, 'New York', 'Billing city should match shipping');
});

runner.test('Should fetch shipping options', async () => {
    mockAPI.mock('/api/shipping/options', [
        { id: 'standard', name: 'Standard', cost: 5.99, days: '5-7' },
        { id: 'express', name: 'Express', cost: 15.99, days: '2-3' },
        { id: 'overnight', name: 'Overnight', cost: 29.99, days: '1' }
    ]);
    mockAPI.enable();

    const { getShippingOptions } = await import('../js/multi-step-checkout.js');

    const options = await getShippingOptions();

    Assert.equals(options.length, 3, 'Should fetch 3 shipping options');
    Assert.equals(options[0].id, 'standard', 'First option should be standard');

    mockAPI.disable();
});

runner.test('Should calculate shipping cost based on selection', async () => {
    document.body.innerHTML = `
        <input type="radio" name="shipping" value="standard" data-cost="5.99" checked />
        <input type="radio" name="shipping" value="express" data-cost="15.99" />
    `;

    const { getSelectedShipping } = await import('../js/multi-step-checkout.js');

    const shipping = getSelectedShipping();

    Assert.equals(shipping.cost, 5.99, 'Should calculate standard shipping cost');
});

/**
 * Payment Information Tests
 */
runner.test('Should validate credit card number', async () => {
    const { validateCardNumber } = await import('../js/multi-step-checkout.js');

    Assert.isTrue(validateCardNumber('4242424242424242'), 'Valid card should validate');
    Assert.isFalse(validateCardNumber('1234567890123456'), 'Invalid card should not validate');
    Assert.isFalse(validateCardNumber('4242'), 'Short number should not validate');
});

runner.test('Should validate card expiry date', async () => {
    const { validateExpiry } = await import('../js/multi-step-checkout.js');

    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    const futureMonth = (futureDate.getMonth() + 1).toString().padStart(2, '0');
    const futureYear = futureDate.getFullYear().toString().slice(-2);

    Assert.isTrue(
        validateExpiry(`${futureMonth}/${futureYear}`),
        'Future date should validate'
    );
    Assert.isFalse(validateExpiry('01/20'), 'Past date should not validate');
});

runner.test('Should validate CVV', async () => {
    const { validateCVV } = await import('../js/multi-step-checkout.js');

    Assert.isTrue(validateCVV('123'), '3-digit CVV should validate');
    Assert.isTrue(validateCVV('1234'), '4-digit CVV should validate (Amex)');
    Assert.isFalse(validateCVV('12'), 'Short CVV should not validate');
});

runner.test('Should format card number input', async () => {
    document.body.innerHTML = '<input type="text" id="card-number" />';

    const { formatCardNumber } = await import('../js/multi-step-checkout.js');

    await TestUtils.fillInput('#card-number', '4242424242424242');

    const formatted = formatCardNumber('4242424242424242');

    Assert.contains(formatted, ' ', 'Card number should be formatted with spaces');
});

runner.test('Should detect card type', async () => {
    const { detectCardType } = await import('../js/multi-step-checkout.js');

    Assert.equals(detectCardType('4242424242424242'), 'visa', 'Should detect Visa');
    Assert.equals(detectCardType('5555555555554444'), 'mastercard', 'Should detect Mastercard');
    Assert.equals(detectCardType('378282246310005'), 'amex', 'Should detect Amex');
});

runner.test('Should validate complete payment form', async () => {
    document.body.innerHTML = `
        <form id="payment-form">
            <input type="text" id="card-number" value="4242424242424242" />
            <input type="text" id="expiry" value="12/25" />
            <input type="text" id="cvv" value="123" />
            <input type="text" id="billing-zip" value="12345" />
        </form>
    `;

    const { validatePaymentInfo } = await import('../js/multi-step-checkout.js');

    const validation = validatePaymentInfo();

    Assert.isTrue(validation.valid, 'Valid payment form should validate');
});

/**
 * Order Summary Tests
 */
runner.test('Should display order summary', async () => {
    document.body.innerHTML = '<div id="order-summary"></div>';

    const { renderOrderSummary } = await import('../js/multi-step-checkout.js');

    await renderOrderSummary();

    await TestUtils.waitFor(() => {
        return TestUtils.exists('.summary-item');
    });

    const items = document.querySelectorAll('.summary-item');
    Assert.greaterThan(items.length, 0, 'Should display order items');
});

runner.test('Should calculate order totals', async () => {
    const { calculateOrderTotal } = await import('../js/multi-step-checkout.js');

    const total = calculateOrderTotal({
        subtotal: 100.00,
        shipping: 10.00,
        tax: 8.00,
        discount: 5.00
    });

    Assert.equals(total, 113.00, 'Total should be 113.00 (100 + 10 + 8 - 5)');
});

runner.test('Should apply promo code to order', async () => {
    mockAPI.mock('/api/promo/validate', {
        valid: true,
        code: 'SAVE10',
        discount: 10,
        type: 'percentage'
    });
    mockAPI.enable();

    document.body.innerHTML = `
        <input type="text" id="promo-code" value="SAVE10" />
        <button id="apply-promo">Apply</button>
    `;

    const { applyPromoCode } = await import('../js/multi-step-checkout.js');

    await TestUtils.fillInput('#promo-code', 'SAVE10');
    await TestUtils.click('#apply-promo');

    const result = await applyPromoCode('SAVE10');

    Assert.isTrue(result.valid, 'Valid promo code should apply');
    Assert.equals(result.discount, 10, 'Discount should be 10%');

    mockAPI.disable();
});

/**
 * Order Submission Tests
 */
runner.test('Should submit complete order', async () => {
    mockAPI.mock('/api/orders', {
        success: true,
        orderId: 'ORD-123',
        message: 'Order placed successfully'
    }, { method: 'POST' });
    mockAPI.enable();

    const { submitOrder } = await import('../js/multi-step-checkout.js');

    const orderData = {
        customer: {
            email: 'test@example.com',
            firstName: 'John',
            lastName: 'Doe'
        },
        shipping: {
            address: '123 Main St',
            city: 'New York',
            state: 'NY',
            zip: '10001'
        },
        items: [
            { productId: 'prod_1', quantity: 2, price: 29.99 }
        ],
        total: 59.98
    };

    const result = await submitOrder(orderData);

    Assert.isTrue(result.success, 'Order should submit successfully');
    Assert.equals(result.orderId, 'ORD-123', 'Should return order ID');

    mockAPI.disable();
});

runner.test('Should handle order submission errors', async () => {
    mockAPI.mock('/api/orders', {
        error: 'Payment failed'
    }, { status: 400, method: 'POST' });
    mockAPI.enable();

    const { submitOrder } = await import('../js/multi-step-checkout.js');

    const orderData = {};

    await Assert.throwsAsync(
        async () => await submitOrder(orderData),
        'Should throw error on failed submission'
    );

    mockAPI.disable();
});

runner.test('Should show loading state during submission', async () => {
    mockAPI.mock('/api/orders', { success: true }, { delay: 1000, method: 'POST' });
    mockAPI.enable();

    document.body.innerHTML = `
        <button id="submit-order">Place Order</button>
        <div id="loading-indicator" class="hidden"></div>
    `;

    const { submitOrder } = await import('../js/multi-step-checkout.js');

    const submitPromise = submitOrder({});

    await TestUtils.wait(100);

    const loadingVisible = await TestUtils.isVisible('#loading-indicator');
    Assert.isTrue(loadingVisible, 'Loading indicator should be visible');

    await submitPromise;

    mockAPI.disable();
});

runner.test('Should disable submit button during processing', async () => {
    document.body.innerHTML = '<button id="submit-order">Place Order</button>';

    const { disableSubmitButton } = await import('../js/multi-step-checkout.js');

    disableSubmitButton();

    const button = document.querySelector('#submit-order');
    Assert.isTrue(button.disabled, 'Submit button should be disabled');
});

/**
 * Order Confirmation Tests
 */
runner.test('Should display order confirmation', async () => {
    document.body.innerHTML = '<div id="order-confirmation"></div>';

    const { showOrderConfirmation } = await import('../js/multi-step-checkout.js');

    const orderData = {
        orderId: 'ORD-123',
        total: 59.98,
        email: 'test@example.com'
    };

    await showOrderConfirmation(orderData);

    await TestUtils.waitFor(() => {
        return TestUtils.exists('.order-number');
    });

    const orderNumber = await TestUtils.getText('.order-number');
    Assert.contains(orderNumber, 'ORD-123', 'Should display order number');
});

runner.test('Should clear cart after successful order', async () => {
    const { submitOrder } = await import('../js/multi-step-checkout.js');

    mockAPI.mock('/api/orders', {
        success: true,
        orderId: 'ORD-123'
    }, { method: 'POST' });
    mockAPI.enable();

    await submitOrder({});

    await TestUtils.wait(200);

    const cart = localStorage.getItem('cart');
    Assert.isTrue(cart === null || cart === '[]', 'Cart should be cleared');

    mockAPI.disable();
});

runner.test('Should send confirmation email', async () => {
    mockAPI.mock('/api/orders/ORD-123/send-confirmation', {
        success: true
    }, { method: 'POST' });
    mockAPI.enable();

    const { sendConfirmationEmail } = await import('../js/multi-step-checkout.js');

    const result = await sendConfirmationEmail('ORD-123', 'test@example.com');

    Assert.isTrue(result.success, 'Confirmation email should send');

    mockAPI.disable();
});

/**
 * Guest Checkout Tests
 */
runner.test('Should allow guest checkout', async () => {
    document.body.innerHTML = `
        <input type="checkbox" id="guest-checkout" />
        <div id="account-creation-fields" class="hidden"></div>
    `;

    const { enableGuestCheckout } = await import('../js/multi-step-checkout.js');

    await TestUtils.click('#guest-checkout');
    enableGuestCheckout();

    await TestUtils.wait(100);

    const fieldsHidden = !await TestUtils.isVisible('#account-creation-fields');
    Assert.isTrue(fieldsHidden, 'Account creation fields should be hidden');
});

runner.test('Should offer account creation after guest checkout', async () => {
    document.body.innerHTML = '<div id="create-account-offer" class="hidden"></div>';

    const { showCreateAccountOffer } = await import('../js/multi-step-checkout.js');

    await showCreateAccountOffer('test@example.com');

    const offerVisible = await TestUtils.isVisible('#create-account-offer');
    Assert.isTrue(offerVisible, 'Should show account creation offer');
});

/**
 * Save for Later Tests
 */
runner.test('Should save checkout progress', async () => {
    const checkoutData = {
        customer: { email: 'test@example.com' },
        shipping: { address: '123 Main St' },
        currentStep: 2
    };

    const { saveCheckoutProgress } = await import('../js/multi-step-checkout.js');

    saveCheckoutProgress(checkoutData);

    const saved = JSON.parse(localStorage.getItem('checkout_progress'));
    Assert.equals(saved.currentStep, 2, 'Checkout progress should be saved');
});

runner.test('Should restore checkout progress', async () => {
    const savedData = {
        customer: { email: 'test@example.com' },
        currentStep: 2
    };

    localStorage.setItem('checkout_progress', JSON.stringify(savedData));

    const { restoreCheckoutProgress } = await import('../js/multi-step-checkout.js');

    const restored = restoreCheckoutProgress();

    Assert.equals(restored.currentStep, 2, 'Should restore to step 2');
    Assert.equals(restored.customer.email, 'test@example.com', 'Customer data should be restored');
});

runner.test('Should clear saved progress after successful order', async () => {
    localStorage.setItem('checkout_progress', JSON.stringify({ currentStep: 2 }));

    const { clearCheckoutProgress } = await import('../js/multi-step-checkout.js');

    clearCheckoutProgress();

    const saved = localStorage.getItem('checkout_progress');
    Assert.isTrue(saved === null, 'Checkout progress should be cleared');
});

// Run tests
export async function runCheckoutProcessTests() {
    console.log('💳 Running Checkout Process Tests...\n');
    return await runner.run();
}

// Auto-run if loaded directly
if (import.meta.url === window.location.href) {
    runCheckoutProcessTests();
}
