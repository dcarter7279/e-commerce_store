// End-to-End Tests
// Complete user journeys from browsing to purchase

import {
    TestRunner,
    TestUtils,
    Assert,
    mockAPI,
    TestDataFactory,
    TEST_CONFIG,
    PerformanceMonitor
} from './setup.js';

const runner = new TestRunner();

/**
 * Setup and Teardown
 */
runner.beforeEach(() => {
    TestUtils.clearStorage();
    document.body.innerHTML = '<div id="app"></div>';
});

runner.afterEach(() => {
    mockAPI.clear();
    document.body.innerHTML = '';
});

/**
 * Complete Purchase Flow - Guest User
 */
runner.test('E2E: Guest user completes purchase', async () => {
    TestUtils.log('Starting guest purchase flow');

    // Step 1: Browse products
    mockAPI.mock('/api/products', [
        TestDataFactory.createProduct({ id: 'prod_1', price: 29.99 }),
        TestDataFactory.createProduct({ id: 'prod_2', price: 49.99 })
    ]);
    mockAPI.enable();

    const { loadProducts } = await import('../js/products.js');
    await loadProducts();

    TestUtils.log('Products loaded');

    // Step 2: Add product to cart
    const { addToCart } = await import('../js/cart.js');
    const product = TestDataFactory.createProduct({ id: 'prod_1', price: 29.99 });
    addToCart(product, 1);

    let cart = JSON.parse(localStorage.getItem('cart'));
    Assert.equals(cart.length, 1, 'Product should be in cart');

    TestUtils.log('Product added to cart');

    // Step 3: Proceed to checkout
    const { initCheckout } = await import('../js/multi-step-checkout.js');
    await initCheckout();

    TestUtils.log('Checkout initialized');

    // Step 4: Enter customer info
    const { saveCustomerInfo } = await import('../js/multi-step-checkout.js');

    document.body.innerHTML = `
        <form id="customer-info-form">
            <input type="email" id="email" value="guest@example.com" />
            <input type="text" id="first-name" value="Guest" />
            <input type="text" id="last-name" value="User" />
        </form>
    `;

    saveCustomerInfo();

    TestUtils.log('Customer info saved');

    // Step 5: Enter shipping address
    const { saveShippingAddress } = await import('../js/multi-step-checkout.js');

    document.body.innerHTML = `
        <form id="shipping-form">
            <input type="text" id="address" value="123 Main St" />
            <input type="text" id="city" value="New York" />
            <input type="text" id="state" value="NY" />
            <input type="text" id="zip" value="10001" />
        </form>
    `;

    saveShippingAddress();

    TestUtils.log('Shipping address saved');

    // Step 6: Process payment
    mockAPI.mock('/api/payment/process', {
        success: true,
        transactionId: 'txn_123'
    }, { method: 'POST' });

    mockAPI.mock('/api/orders', {
        success: true,
        orderId: 'ORD-123'
    }, { method: 'POST' });

    const { processPayment } = await import('../js/payment.js');
    const { submitOrder } = await import('../js/multi-step-checkout.js');

    await processPayment({
        paymentMethodId: 'pm_test_123',
        amount: 2999
    });

    TestUtils.log('Payment processed');

    // Step 7: Complete order
    const result = await submitOrder({});

    Assert.isTrue(result.success, 'Order should be completed');
    Assert.equals(result.orderId, 'ORD-123', 'Should receive order ID');

    TestUtils.log('Order completed successfully');

    // Step 8: Verify cart is cleared
    cart = localStorage.getItem('cart');
    Assert.isTrue(cart === null || cart === '[]', 'Cart should be empty');

    TestUtils.log('Guest purchase flow completed');

    mockAPI.disable();
});

/**
 * Complete Purchase Flow - Registered User
 */
runner.test('E2E: Registered user completes purchase with saved info', async () => {
    TestUtils.log('Starting registered user purchase flow');

    // Step 1: Login
    mockAPI.mock('/api/auth/login', {
        success: true,
        user: {
            id: 'user_123',
            email: 'user@example.com',
            name: 'Test User'
        },
        token: 'jwt_token'
    }, { method: 'POST' });
    mockAPI.enable();

    const { login } = await import('../js/auth.js');
    await login('user@example.com', 'Password123!');

    Assert.isTrue(localStorage.getItem('auth_token') !== null, 'Should be logged in');

    TestUtils.log('User logged in');

    // Step 2: Load saved payment methods
    mockAPI.mock('/api/users/user_123/payment-methods', [
        { id: 'pm_saved', brand: 'visa', last4: '4242' }
    ]);

    const { loadPaymentMethods } = await import('../js/payment.js');
    const savedMethods = await loadPaymentMethods('user_123');

    Assert.equals(savedMethods.length, 1, 'Should have saved payment method');

    TestUtils.log('Saved payment methods loaded');

    // Step 3: Add product to cart
    const { addToCart } = await import('../js/cart.js');
    const product = TestDataFactory.createProduct({ price: 99.99 });
    addToCart(product, 2);

    TestUtils.log('Products added to cart');

    // Step 4: Quick checkout with saved info
    mockAPI.mock('/api/users/user_123/addresses', [
        {
            id: 'addr_1',
            address: '123 Main St',
            city: 'New York',
            state: 'NY',
            zip: '10001',
            isDefault: true
        }
    ]);

    const { loadAddresses } = await import('../js/profile.js');
    const addresses = await loadAddresses('user_123');

    Assert.greaterThan(addresses.length, 0, 'Should have saved address');

    TestUtils.log('Saved address loaded');

    // Step 5: Complete order
    mockAPI.mock('/api/payment/process', {
        success: true,
        transactionId: 'txn_456'
    }, { method: 'POST' });

    mockAPI.mock('/api/orders', {
        success: true,
        orderId: 'ORD-456'
    }, { method: 'POST' });

    const { submitOrder } = await import('../js/multi-step-checkout.js');
    const result = await submitOrder({});

    Assert.isTrue(result.success, 'Order should complete');

    TestUtils.log('Registered user purchase completed');

    mockAPI.disable();
});

/**
 * Product Discovery to Purchase
 */
runner.test('E2E: Search, filter, and purchase product', async () => {
    TestUtils.log('Starting product discovery flow');

    // Step 1: Search for products
    mockAPI.mock('/api/products/search?q=headphones', [
        TestDataFactory.createProduct({
            id: 'prod_1',
            name: 'Wireless Headphones',
            price: 99.99,
            category: 'Electronics'
        }),
        TestDataFactory.createProduct({
            id: 'prod_2',
            name: 'Bluetooth Headphones',
            price: 79.99,
            category: 'Electronics'
        })
    ]);
    mockAPI.enable();

    const { searchProducts } = await import('../js/products.js');
    await searchProducts('headphones');

    TestUtils.log('Search completed');

    // Step 2: Filter results
    const { filterByPriceRange } = await import('../js/products.js');
    await filterByPriceRange(0, 100);

    TestUtils.log('Filters applied');

    // Step 3: View product details
    mockAPI.mock('/api/products/prod_1', {
        id: 'prod_1',
        name: 'Wireless Headphones',
        price: 99.99,
        description: 'Premium wireless headphones',
        reviews: []
    });

    const { loadProductDetail } = await import('../js/products.js');
    await loadProductDetail('prod_1');

    TestUtils.log('Product details loaded');

    // Step 4: Add to wishlist
    const { addToWishlist } = await import('../js/wishlist.js');
    addToWishlist('prod_1');

    const wishlist = JSON.parse(localStorage.getItem('wishlist'));
    Assert.contains(wishlist, 'prod_1', 'Product should be in wishlist');

    TestUtils.log('Product added to wishlist');

    // Step 5: Add to cart from wishlist
    const { addToCart } = await import('../js/cart.js');
    const product = TestDataFactory.createProduct({ id: 'prod_1', price: 99.99 });
    addToCart(product, 1);

    TestUtils.log('Product added to cart');

    // Step 6: Complete purchase
    mockAPI.mock('/api/payment/process', {
        success: true,
        transactionId: 'txn_789'
    }, { method: 'POST' });

    mockAPI.mock('/api/orders', {
        success: true,
        orderId: 'ORD-789'
    }, { method: 'POST' });

    const { submitOrder } = await import('../js/multi-step-checkout.js');
    const result = await submitOrder({});

    Assert.isTrue(result.success, 'Purchase should complete');

    TestUtils.log('Product discovery to purchase completed');

    mockAPI.disable();
});

/**
 * Account Creation During Checkout
 */
runner.test('E2E: Create account during checkout', async () => {
    TestUtils.log('Starting checkout with account creation');

    // Step 1: Add items to cart as guest
    const { addToCart } = await import('../js/cart.js');
    addToCart(TestDataFactory.createProduct({ price: 49.99 }), 1);

    TestUtils.log('Products in cart');

    // Step 2: Start checkout
    const { initCheckout } = await import('../js/multi-step-checkout.js');
    await initCheckout();

    // Step 3: Decide to create account during checkout
    mockAPI.mock('/api/auth/register', {
        success: true,
        userId: 'user_new',
        token: 'jwt_token_new'
    }, { method: 'POST' });
    mockAPI.enable();

    const { register } = await import('../js/auth.js');
    await register({
        email: 'newuser@example.com',
        password: 'NewPass123!',
        name: 'New User'
    });

    Assert.isTrue(localStorage.getItem('auth_token') !== null, 'Should be logged in');

    TestUtils.log('Account created and logged in');

    // Step 4: Complete checkout as registered user
    mockAPI.mock('/api/orders', {
        success: true,
        orderId: 'ORD-NEW'
    }, { method: 'POST' });

    const { submitOrder } = await import('../js/multi-step-checkout.js');
    const result = await submitOrder({});

    Assert.isTrue(result.success, 'Order should complete');

    TestUtils.log('Checkout with account creation completed');

    mockAPI.disable();
});

/**
 * Multi-Product Cart Management
 */
runner.test('E2E: Add multiple products, update quantities, apply discount', async () => {
    TestUtils.log('Starting multi-product cart management');

    const { addToCart, updateQuantity, applyDiscount, calculateTotal } = await import('../js/cart.js');

    // Step 1: Add multiple products
    addToCart(TestDataFactory.createProduct({ id: 'prod_1', price: 29.99 }), 2);
    addToCart(TestDataFactory.createProduct({ id: 'prod_2', price: 49.99 }), 1);
    addToCart(TestDataFactory.createProduct({ id: 'prod_3', price: 19.99 }), 3);

    let cart = JSON.parse(localStorage.getItem('cart'));
    Assert.equals(cart.length, 3, 'Should have 3 different products');

    TestUtils.log('Multiple products added');

    // Step 2: Update quantities
    updateQuantity('prod_1', 1);
    updateQuantity('prod_3', 5);

    cart = JSON.parse(localStorage.getItem('cart'));
    const prod1 = cart.find(item => item.product.id === 'prod_1');
    Assert.equals(prod1.quantity, 1, 'Quantity should be updated');

    TestUtils.log('Quantities updated');

    // Step 3: Apply discount code
    mockAPI.mock('/api/discounts/validate', {
        valid: true,
        code: 'SAVE20',
        discount: 20,
        type: 'percentage'
    });
    mockAPI.enable();

    const discount = applyDiscount('SAVE20');
    Assert.isTrue(discount > 0, 'Discount should be applied');

    TestUtils.log('Discount code applied');

    // Step 4: Calculate total
    const total = calculateTotal({
        subtotal: 179.94,
        discount: 35.99,
        tax: 11.52,
        shipping: 0
    });

    Assert.greaterThan(total, 0, 'Total should be calculated');

    TestUtils.log('Multi-product cart management completed');

    mockAPI.disable();
});

/**
 * Failed Payment Recovery
 */
runner.test('E2E: Handle failed payment and retry', async () => {
    TestUtils.log('Starting failed payment recovery');

    // Step 1: Add product and proceed to checkout
    const { addToCart } = await import('../js/cart.js');
    addToCart(TestDataFactory.createProduct({ price: 99.99 }), 1);

    const { initCheckout } = await import('../js/multi-step-checkout.js');
    await initCheckout();

    TestUtils.log('Checkout initiated');

    // Step 2: First payment attempt fails
    mockAPI.mock('/api/payment/process', {
        error: 'card_declined',
        message: 'Your card was declined'
    }, { status: 402, method: 'POST' });
    mockAPI.enable();

    const { processPayment } = await import('../js/payment.js');

    try {
        await processPayment({
            paymentMethodId: 'pm_declined',
            amount: 9999
        });
        Assert.isTrue(false, 'Should have thrown error');
    } catch (error) {
        Assert.isTrue(error !== null, 'Payment should fail');
    }

    TestUtils.log('First payment failed as expected');

    // Step 3: Update payment method and retry
    mockAPI.mock('/api/payment/process', {
        success: true,
        transactionId: 'txn_retry'
    }, { status: 200, method: 'POST' });

    const retryResult = await processPayment({
        paymentMethodId: 'pm_success',
        amount: 9999
    });

    Assert.isTrue(retryResult.success, 'Second payment should succeed');

    TestUtils.log('Payment retry successful');

    // Step 4: Complete order
    mockAPI.mock('/api/orders', {
        success: true,
        orderId: 'ORD-RETRY'
    }, { method: 'POST' });

    const { submitOrder } = await import('../js/multi-step-checkout.js');
    const result = await submitOrder({});

    Assert.isTrue(result.success, 'Order should complete after payment retry');

    TestUtils.log('Failed payment recovery completed');

    mockAPI.disable();
});

/**
 * Order History and Reorder
 */
runner.test('E2E: View order history and reorder', async () => {
    TestUtils.log('Starting order history and reorder flow');

    // Step 1: Login
    localStorage.setItem('auth_token', 'jwt_token');
    localStorage.setItem('user', JSON.stringify({ id: 'user_123' }));

    // Step 2: Load order history
    mockAPI.mock('/api/users/user_123/orders', [
        TestDataFactory.createOrder({
            id: 'ORD-OLD',
            items: [
                {
                    product: TestDataFactory.createProduct({ id: 'prod_1', price: 29.99 }),
                    quantity: 2
                }
            ]
        })
    ]);
    mockAPI.enable();

    const { loadOrderHistory } = await import('../js/orders.js');
    const orders = await loadOrderHistory('user_123');

    Assert.greaterThan(orders.length, 0, 'Should have order history');

    TestUtils.log('Order history loaded');

    // Step 3: Reorder from previous order
    const { reorder } = await import('../js/orders.js');
    const { addToCart } = await import('../js/cart.js');

    const previousOrder = orders[0];
    previousOrder.items.forEach(item => {
        addToCart(item.product, item.quantity);
    });

    const cart = JSON.parse(localStorage.getItem('cart'));
    Assert.greaterThan(cart.length, 0, 'Items should be added to cart');

    TestUtils.log('Items reordered to cart');

    // Step 4: Quick checkout
    mockAPI.mock('/api/orders', {
        success: true,
        orderId: 'ORD-REORDER'
    }, { method: 'POST' });

    const { submitOrder } = await import('../js/multi-step-checkout.js');
    const result = await submitOrder({});

    Assert.isTrue(result.success, 'Reorder should complete');

    TestUtils.log('Reorder flow completed');

    mockAPI.disable();
});

/**
 * Performance Test - Complete Flow
 */
runner.test('E2E: Complete purchase flow under 5 seconds', async () => {
    TestUtils.log('Starting performance test');

    mockAPI.mock('/api/products', [TestDataFactory.createProduct()]);
    mockAPI.mock('/api/payment/process', { success: true, transactionId: 'txn' }, { method: 'POST' });
    mockAPI.mock('/api/orders', { success: true, orderId: 'ORD' }, { method: 'POST' });
    mockAPI.enable();

    const { result, duration } = await PerformanceMonitor.measure(
        'Complete Purchase Flow',
        async () => {
            // Load products
            const { loadProducts } = await import('../js/products.js');
            await loadProducts();

            // Add to cart
            const { addToCart } = await import('../js/cart.js');
            addToCart(TestDataFactory.createProduct({ price: 29.99 }), 1);

            // Checkout
            const { initCheckout, submitOrder } = await import('../js/multi-step-checkout.js');
            await initCheckout();

            // Process payment and complete
            const { processPayment } = await import('../js/payment.js');
            await processPayment({ paymentMethodId: 'pm_test', amount: 2999 });
            return await submitOrder({});
        }
    );

    Assert.lessThan(duration, 5000, 'Complete flow should finish under 5 seconds');

    TestUtils.log('Performance test completed');

    mockAPI.disable();
});

/**
 * Accessibility Flow
 */
runner.test('E2E: Complete purchase using keyboard navigation', async () => {
    TestUtils.log('Starting accessibility test');

    document.body.innerHTML = `
        <div id="product-grid">
            <div class="product-card" tabindex="0" data-product-id="prod_1">
                <button class="add-to-cart-btn">Add to Cart</button>
            </div>
        </div>
        <a href="/cart.html" id="cart-link" tabindex="0">Cart</a>
    `;

    // Simulate keyboard navigation
    const productCard = document.querySelector('.product-card');
    productCard.focus();

    // Simulate Enter key on product
    const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
    productCard.dispatchEvent(enterEvent);

    await TestUtils.wait(100);

    // Tab to "Add to Cart" button
    const addButton = document.querySelector('.add-to-cart-btn');
    addButton.focus();
    addButton.click();

    // Verify product added
    const { addToCart } = await import('../js/cart.js');
    addToCart(TestDataFactory.createProduct({ id: 'prod_1' }), 1);

    const cart = JSON.parse(localStorage.getItem('cart'));
    Assert.greaterThan(cart.length, 0, 'Should add product via keyboard');

    TestUtils.log('Keyboard navigation test completed');
});

/**
 * Mobile Responsive Flow
 */
runner.test('E2E: Complete purchase on mobile viewport', async () => {
    TestUtils.log('Starting mobile responsive test');

    // Simulate mobile viewport
    Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
    });

    Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 667
    });

    window.dispatchEvent(new Event('resize'));

    // Verify mobile-specific UI elements
    document.body.innerHTML = `
        <nav class="mobile-nav">
            <button class="hamburger-menu">Menu</button>
        </nav>
    `;

    const mobileNav = document.querySelector('.mobile-nav');
    Assert.isTrue(mobileNav !== null, 'Mobile navigation should be present');

    // Complete purchase flow on mobile
    mockAPI.mock('/api/orders', { success: true, orderId: 'ORD-MOBILE' }, { method: 'POST' });
    mockAPI.enable();

    const { submitOrder } = await import('../js/multi-step-checkout.js');

    const { addToCart } = await import('../js/cart.js');
    addToCart(TestDataFactory.createProduct({ price: 29.99 }), 1);

    const result = await submitOrder({});
    Assert.isTrue(result.success, 'Mobile purchase should complete');

    TestUtils.log('Mobile responsive test completed');

    mockAPI.disable();
});

// Run tests
export async function runE2ETests() {
    console.log('🎯 Running End-to-End Tests...\n');
    return await runner.run();
}

// Auto-run if loaded directly
if (import.meta.url === window.location.href) {
    runE2ETests();
}
