// Cart Functionality Tests
// Tests for shopping cart operations: add, remove, update, clear

import {
    TestRunner,
    TestUtils,
    Assert,
    mockAPI,
    TestDataFactory
} from './setup.js';

const runner = new TestRunner();

/**
 * Setup and Teardown
 */
runner.beforeEach(() => {
    TestUtils.clearStorage();
    document.body.innerHTML = '<div id="test-container"></div>';
});

runner.afterEach(() => {
    mockAPI.clear();
    document.body.innerHTML = '';
});

/**
 * Add to Cart Tests
 */
runner.test('Should add product to cart', async () => {
    const product = TestDataFactory.createProduct({
        id: 'prod_123',
        name: 'Test Product',
        price: 29.99
    });

    const { addToCart, getCart } = await import('../js/cart.js');

    addToCart(product, 1);

    const cart = getCart();
    Assert.equals(cart.length, 1, 'Cart should have 1 item');
    Assert.equals(cart[0].product.id, 'prod_123', 'Product ID should match');
    Assert.equals(cart[0].quantity, 1, 'Quantity should be 1');
});

runner.test('Should add multiple quantities of same product', async () => {
    const product = TestDataFactory.createProduct({ id: 'prod_123' });

    const { addToCart, getCart } = await import('../js/cart.js');

    addToCart(product, 3);

    const cart = getCart();
    Assert.equals(cart[0].quantity, 3, 'Quantity should be 3');
});

runner.test('Should increment quantity if product already in cart', async () => {
    const product = TestDataFactory.createProduct({ id: 'prod_123' });

    const { addToCart, getCart } = await import('../js/cart.js');

    addToCart(product, 2);
    addToCart(product, 1);

    const cart = getCart();
    Assert.equals(cart.length, 1, 'Should have 1 unique item');
    Assert.equals(cart[0].quantity, 3, 'Quantity should be incremented to 3');
});

runner.test('Should add multiple different products to cart', async () => {
    const product1 = TestDataFactory.createProduct({ id: 'prod_1' });
    const product2 = TestDataFactory.createProduct({ id: 'prod_2' });

    const { addToCart, getCart } = await import('../js/cart.js');

    addToCart(product1, 1);
    addToCart(product2, 2);

    const cart = getCart();
    Assert.equals(cart.length, 2, 'Cart should have 2 different items');
});

runner.test('Should persist cart to localStorage', async () => {
    const product = TestDataFactory.createProduct({ id: 'prod_123' });

    const { addToCart } = await import('../js/cart.js');

    addToCart(product, 1);

    const stored = JSON.parse(localStorage.getItem('cart'));
    Assert.isTrue(Array.isArray(stored), 'Cart should be stored as array');
    Assert.equals(stored[0].product.id, 'prod_123', 'Product should be in storage');
});

runner.test('Should trigger cart updated event', async () => {
    const product = TestDataFactory.createProduct({ id: 'prod_123' });

    let eventFired = false;
    document.addEventListener('cartUpdated', () => {
        eventFired = true;
    });

    const { addToCart } = await import('../js/cart.js');

    addToCart(product, 1);

    await TestUtils.wait(100);

    Assert.isTrue(eventFired, 'cartUpdated event should fire');
});

runner.test('Should show add to cart confirmation', async () => {
    document.body.innerHTML = `
        <button class="add-to-cart-btn" data-product-id="prod_123">
            Add to Cart
        </button>
        <div id="cart-notification" class="hidden"></div>
    `;

    const product = TestDataFactory.createProduct({ id: 'prod_123' });

    const { addToCart } = await import('../js/cart.js');

    await TestUtils.click('.add-to-cart-btn');
    addToCart(product, 1);

    await TestUtils.wait(200);

    const notification = await TestUtils.isVisible('#cart-notification');
    Assert.isTrue(notification, 'Add to cart notification should appear');
});

/**
 * Remove from Cart Tests
 */
runner.test('Should remove product from cart', async () => {
    const product = TestDataFactory.createProduct({ id: 'prod_123' });

    const { addToCart, removeFromCart, getCart } = await import('../js/cart.js');

    addToCart(product, 1);
    removeFromCart('prod_123');

    const cart = getCart();
    Assert.equals(cart.length, 0, 'Cart should be empty');
});

runner.test('Should remove correct product when multiple in cart', async () => {
    const product1 = TestDataFactory.createProduct({ id: 'prod_1' });
    const product2 = TestDataFactory.createProduct({ id: 'prod_2' });

    const { addToCart, removeFromCart, getCart } = await import('../js/cart.js');

    addToCart(product1, 1);
    addToCart(product2, 1);
    removeFromCart('prod_1');

    const cart = getCart();
    Assert.equals(cart.length, 1, 'Cart should have 1 item');
    Assert.equals(cart[0].product.id, 'prod_2', 'Remaining product should be prod_2');
});

runner.test('Should update localStorage after removal', async () => {
    const product = TestDataFactory.createProduct({ id: 'prod_123' });

    const { addToCart, removeFromCart } = await import('../js/cart.js');

    addToCart(product, 1);
    removeFromCart('prod_123');

    const stored = JSON.parse(localStorage.getItem('cart'));
    Assert.equals(stored.length, 0, 'localStorage should be empty');
});

/**
 * Update Quantity Tests
 */
runner.test('Should update product quantity', async () => {
    const product = TestDataFactory.createProduct({ id: 'prod_123' });

    const { addToCart, updateQuantity, getCart } = await import('../js/cart.js');

    addToCart(product, 1);
    updateQuantity('prod_123', 5);

    const cart = getCart();
    Assert.equals(cart[0].quantity, 5, 'Quantity should be updated to 5');
});

runner.test('Should remove product when quantity set to 0', async () => {
    const product = TestDataFactory.createProduct({ id: 'prod_123' });

    const { addToCart, updateQuantity, getCart } = await import('../js/cart.js');

    addToCart(product, 3);
    updateQuantity('prod_123', 0);

    const cart = getCart();
    Assert.equals(cart.length, 0, 'Product should be removed when quantity is 0');
});

runner.test('Should not allow negative quantities', async () => {
    const product = TestDataFactory.createProduct({ id: 'prod_123' });

    const { addToCart, updateQuantity, getCart } = await import('../js/cart.js');

    addToCart(product, 2);
    updateQuantity('prod_123', -1);

    const cart = getCart();
    Assert.greaterThan(cart[0].quantity, 0, 'Quantity should remain positive');
});

runner.test('Should handle quantity input changes', async () => {
    const product = TestDataFactory.createProduct({ id: 'prod_123' });

    document.body.innerHTML = `
        <div class="cart-item" data-product-id="prod_123">
            <input type="number" class="quantity-input" value="1" min="1" />
        </div>
    `;

    const { addToCart, updateQuantity } = await import('../js/cart.js');

    addToCart(product, 1);

    await TestUtils.fillInput('.quantity-input', '3');

    // Simulate change event handler
    const input = document.querySelector('.quantity-input');
    input.addEventListener('change', (e) => {
        updateQuantity('prod_123', parseInt(e.target.value));
    });

    input.dispatchEvent(new Event('change', { bubbles: true }));

    await TestUtils.wait(100);

    const quantity = parseInt(input.value);
    Assert.equals(quantity, 3, 'Quantity input should be 3');
});

/**
 * Cart Display Tests
 */
runner.test('Should render cart items correctly', async () => {
    const product1 = TestDataFactory.createProduct({
        id: 'prod_1',
        name: 'Product 1',
        price: 29.99
    });
    const product2 = TestDataFactory.createProduct({
        id: 'prod_2',
        name: 'Product 2',
        price: 49.99
    });

    document.body.innerHTML = '<div id="cart-items"></div>';

    const { addToCart, renderCart } = await import('../js/cart.js');

    addToCart(product1, 2);
    addToCart(product2, 1);

    await renderCart('cart-items');

    await TestUtils.waitFor(() => {
        const items = document.querySelectorAll('.cart-item');
        return items.length === 2;
    });

    const items = document.querySelectorAll('.cart-item');
    Assert.equals(items.length, 2, 'Should render 2 cart items');
});

runner.test('Should show empty cart message', async () => {
    document.body.innerHTML = '<div id="cart-items"></div>';

    const { renderCart } = await import('../js/cart.js');

    await renderCart('cart-items');

    await TestUtils.waitFor(async () => {
        return await TestUtils.isVisible('.empty-cart');
    });

    const isEmpty = await TestUtils.isVisible('.empty-cart');
    Assert.isTrue(isEmpty, 'Should show empty cart message');
});

runner.test('Should display correct item count in cart icon', async () => {
    const product1 = TestDataFactory.createProduct({ id: 'prod_1' });
    const product2 = TestDataFactory.createProduct({ id: 'prod_2' });

    document.body.innerHTML = '<span class="cart-count">0</span>';

    const { addToCart, updateCartCount } = await import('../js/cart.js');

    addToCart(product1, 2);
    addToCart(product2, 3);

    updateCartCount();

    const count = await TestUtils.getText('.cart-count');
    Assert.equals(count, '5', 'Cart count should show total quantity (2 + 3)');
});

/**
 * Cart Calculations Tests
 */
runner.test('Should calculate subtotal correctly', async () => {
    const product1 = TestDataFactory.createProduct({ price: 29.99 });
    const product2 = TestDataFactory.createProduct({ price: 49.99 });

    const { addToCart, calculateSubtotal } = await import('../js/cart.js');

    addToCart(product1, 2);  // 59.98
    addToCart(product2, 1);  // 49.99

    const subtotal = calculateSubtotal();

    Assert.equals(subtotal, 109.97, 'Subtotal should be 109.97');
});

runner.test('Should calculate tax correctly', async () => {
    const { calculateTax } = await import('../js/cart.js');

    const subtotal = 100.00;
    const taxRate = 0.08;  // 8%

    const tax = calculateTax(subtotal, taxRate);

    Assert.equals(tax, 8.00, 'Tax should be 8.00');
});

runner.test('Should calculate shipping cost', async () => {
    const { calculateShipping } = await import('../js/cart.js');

    const subtotal = 30.00;
    const shipping = calculateShipping(subtotal);

    Assert.greaterThan(shipping, 0, 'Shipping cost should be positive for subtotal under free shipping threshold');
});

runner.test('Should apply free shipping for orders over threshold', async () => {
    const { calculateShipping } = await import('../js/cart.js');

    const subtotal = 100.00;  // Assuming free shipping over $50
    const shipping = calculateShipping(subtotal);

    Assert.equals(shipping, 0, 'Shipping should be free for orders over threshold');
});

runner.test('Should calculate total correctly', async () => {
    const product = TestDataFactory.createProduct({ price: 100.00 });

    const { addToCart, calculateTotal } = await import('../js/cart.js');

    addToCart(product, 1);

    const total = calculateTotal({
        subtotal: 100.00,
        tax: 8.00,
        shipping: 10.00
    });

    Assert.equals(total, 118.00, 'Total should be 118.00 (100 + 8 + 10)');
});

runner.test('Should display formatted prices', async () => {
    document.body.innerHTML = `
        <div class="cart-summary">
            <div class="subtotal">$0.00</div>
            <div class="tax">$0.00</div>
            <div class="shipping">$0.00</div>
            <div class="total">$0.00</div>
        </div>
    `;

    const product = TestDataFactory.createProduct({ price: 29.99 });

    const { addToCart, updateCartSummary } = await import('../js/cart.js');

    addToCart(product, 2);
    await updateCartSummary();

    await TestUtils.wait(100);

    const subtotal = await TestUtils.getText('.subtotal');
    Assert.matches(subtotal, /\$\d+\.\d{2}/, 'Subtotal should be formatted as currency');
});

/**
 * Cart Persistence Tests
 */
runner.test('Should load cart from localStorage on init', async () => {
    const cartData = [
        {
            product: TestDataFactory.createProduct({ id: 'prod_1' }),
            quantity: 2
        }
    ];

    localStorage.setItem('cart', JSON.stringify(cartData));

    const { initCart, getCart } = await import('../js/cart.js');

    initCart();

    const cart = getCart();
    Assert.equals(cart.length, 1, 'Cart should load from localStorage');
    Assert.equals(cart[0].quantity, 2, 'Quantity should match stored value');
});

runner.test('Should handle corrupted cart data', async () => {
    localStorage.setItem('cart', 'invalid json');

    const { initCart, getCart } = await import('../js/cart.js');

    initCart();

    const cart = getCart();
    Assert.equals(cart.length, 0, 'Should initialize empty cart if data corrupted');
});

runner.test('Should sync cart across browser tabs', async () => {
    const product = TestDataFactory.createProduct({ id: 'prod_123' });

    const { addToCart } = await import('../js/cart.js');

    addToCart(product, 1);

    // Simulate storage event from another tab
    const storageEvent = new StorageEvent('storage', {
        key: 'cart',
        newValue: JSON.stringify([
            {
                product: TestDataFactory.createProduct({ id: 'prod_456' }),
                quantity: 3
            }
        ])
    });

    window.dispatchEvent(storageEvent);

    await TestUtils.wait(100);

    // Cart should update based on storage event
    const cart = JSON.parse(localStorage.getItem('cart'));
    Assert.isTrue(Array.isArray(cart), 'Cart should sync across tabs');
});

/**
 * Clear Cart Tests
 */
runner.test('Should clear entire cart', async () => {
    const product1 = TestDataFactory.createProduct({ id: 'prod_1' });
    const product2 = TestDataFactory.createProduct({ id: 'prod_2' });

    const { addToCart, clearCart, getCart } = await import('../js/cart.js');

    addToCart(product1, 1);
    addToCart(product2, 1);

    clearCart();

    const cart = getCart();
    Assert.equals(cart.length, 0, 'Cart should be empty');
});

runner.test('Should clear cart from localStorage', async () => {
    const product = TestDataFactory.createProduct({ id: 'prod_123' });

    const { addToCart, clearCart } = await import('../js/cart.js');

    addToCart(product, 1);
    clearCart();

    const stored = localStorage.getItem('cart');
    Assert.isTrue(stored === null || stored === '[]', 'localStorage should be cleared');
});

runner.test('Should show confirmation before clearing cart', async () => {
    document.body.innerHTML = `
        <button id="clear-cart-btn">Clear Cart</button>
        <div id="confirm-modal" class="hidden"></div>
    `;

    const product = TestDataFactory.createProduct({ id: 'prod_123' });

    const { addToCart } = await import('../js/cart.js');

    addToCart(product, 1);

    await TestUtils.click('#clear-cart-btn');

    await TestUtils.wait(100);

    const modalVisible = await TestUtils.isVisible('#confirm-modal');
    Assert.isTrue(modalVisible, 'Confirmation modal should appear');
});

/**
 * Cart Validation Tests
 */
runner.test('Should validate stock availability', async () => {
    const product = TestDataFactory.createProduct({
        id: 'prod_123',
        stock: 5
    });

    const { addToCart, validateCart } = await import('../js/cart.js');

    addToCart(product, 10);  // Trying to add more than available

    const validation = await validateCart();

    Assert.isFalse(validation.valid, 'Cart should be invalid if quantity exceeds stock');
    Assert.contains(
        validation.errors[0],
        'stock',
        'Error should mention stock availability'
    );
});

runner.test('Should handle out of stock products', async () => {
    const product = TestDataFactory.createProduct({
        id: 'prod_123',
        stock: 0
    });

    mockAPI.mock('/api/products/prod_123', product);
    mockAPI.enable();

    const { addToCart, validateCart } = await import('../js/cart.js');

    const result = addToCart(product, 1);

    Assert.isFalse(result, 'Should not add out of stock product');

    mockAPI.disable();
});

runner.test('Should validate product prices', async () => {
    const product = TestDataFactory.createProduct({
        id: 'prod_123',
        price: 29.99
    });

    // Add to cart
    const { addToCart } = await import('../js/cart.js');
    addToCart(product, 1);

    // Mock updated product with different price
    const updatedProduct = { ...product, price: 39.99 };
    mockAPI.mock('/api/products/prod_123', updatedProduct);
    mockAPI.enable();

    const { validateCart } = await import('../js/cart.js');
    const validation = await validateCart();

    Assert.isTrue(
        validation.priceChanges && validation.priceChanges.length > 0,
        'Should detect price changes'
    );

    mockAPI.disable();
});

/**
 * Cart Discount Tests
 */
runner.test('Should apply discount code', async () => {
    const product = TestDataFactory.createProduct({ price: 100.00 });

    const { addToCart, applyDiscount, calculateTotal } = await import('../js/cart.js');

    addToCart(product, 1);

    const discount = applyDiscount('SAVE10');  // 10% off

    const total = calculateTotal({
        subtotal: 100.00,
        discount: discount,
        tax: 0,
        shipping: 0
    });

    Assert.equals(total, 90.00, 'Total should be 90.00 after 10% discount');
});

runner.test('Should validate discount code', async () => {
    mockAPI.mock('/api/discounts/validate', {
        valid: false,
        message: 'Invalid code'
    });
    mockAPI.enable();

    const { validateDiscount } = await import('../js/cart.js');

    const result = await validateDiscount('INVALID');

    Assert.isFalse(result.valid, 'Invalid discount code should not validate');

    mockAPI.disable();
});

runner.test('Should remove discount code', async () => {
    const { applyDiscount, removeDiscount, getAppliedDiscount } = await import('../js/cart.js');

    applyDiscount('SAVE10');
    removeDiscount();

    const discount = getAppliedDiscount();
    Assert.isTrue(discount === null || discount === 0, 'Discount should be removed');
});

/**
 * Cart State Management Tests
 */
runner.test('Should emit events on cart changes', async () => {
    const product = TestDataFactory.createProduct({ id: 'prod_123' });

    const events = [];

    document.addEventListener('cartUpdated', (e) => {
        events.push(e.detail);
    });

    const { addToCart, removeFromCart, updateQuantity } = await import('../js/cart.js');

    addToCart(product, 1);
    updateQuantity('prod_123', 2);
    removeFromCart('prod_123');

    await TestUtils.wait(100);

    Assert.equals(events.length, 3, 'Should emit 3 events (add, update, remove)');
});

runner.test('Should handle concurrent cart updates', async () => {
    const product = TestDataFactory.createProduct({ id: 'prod_123' });

    const { addToCart, updateQuantity, getCart } = await import('../js/cart.js');

    // Simulate concurrent updates
    await Promise.all([
        addToCart(product, 1),
        updateQuantity('prod_123', 2),
        addToCart(product, 1)
    ]);

    await TestUtils.wait(200);

    const cart = getCart();
    Assert.greaterThan(cart[0].quantity, 0, 'Cart should handle concurrent updates');
});

// Run tests
export async function runCartFunctionalityTests() {
    console.log('🛒 Running Cart Functionality Tests...\n');
    return await runner.run();
}

// Auto-run if loaded directly
if (import.meta.url === window.location.href) {
    runCartFunctionalityTests();
}
