// Shopping Cart Module
// Handles cart operations and storage with persistence

const CART_STORAGE_KEY = 'ecommerce_cart';
const CART_SETTINGS_KEY = 'ecommerce_cart_settings';

// Cart configuration
const CART_CONFIG = {
    TAX_RATE: 0.08, // 8% tax rate
    FREE_SHIPPING_THRESHOLD: 50, // Free shipping over $50
    STANDARD_SHIPPING: 10.00,
    EXPRESS_SHIPPING: 20.00,
    MAX_QUANTITY_PER_ITEM: 99
};

// Get cart from localStorage
export function getCart() {
    try {
        const cart = localStorage.getItem(CART_STORAGE_KEY);
        return cart ? JSON.parse(cart) : [];
    } catch (error) {
        console.error('Error loading cart:', error);
        return [];
    }
}

// Save cart to localStorage
function saveCart(cart) {
    try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
        updateCartCount();
        dispatchCartUpdateEvent();
    } catch (error) {
        console.error('Error saving cart:', error);
    }
}

// Dispatch custom cart update event
function dispatchCartUpdateEvent() {
    const event = new CustomEvent('cartUpdated', {
        detail: {
            itemCount: getCartItemCount(),
            total: getCartTotal()
        }
    });
    window.dispatchEvent(event);
}

// ==================== Cart Operations ====================

// Add item to cart
export function addToCart(product, quantity = 1) {
    const cart = getCart();
    const existingItem = cart.find(item => item.id === product.id);

    if (existingItem) {
        const newQuantity = existingItem.quantity + quantity;
        existingItem.quantity = Math.min(newQuantity, CART_CONFIG.MAX_QUANTITY_PER_ITEM);
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            category: product.category || 'general',
            quantity: Math.min(quantity, CART_CONFIG.MAX_QUANTITY_PER_ITEM),
            addedAt: new Date().toISOString()
        });
    }

    saveCart(cart);
    return cart;
}

// Remove item from cart
export function removeFromCart(productId) {
    let cart = getCart();
    const itemIndex = cart.findIndex(item => item.id === productId);

    if (itemIndex !== -1) {
        cart.splice(itemIndex, 1);
        saveCart(cart);
    }

    return cart;
}

// Update item quantity
export function updateQuantity(productId, quantity) {
    const cart = getCart();
    const item = cart.find(item => item.id === productId);

    if (item) {
        if (quantity <= 0) {
            return removeFromCart(productId);
        }

        // Enforce maximum quantity
        item.quantity = Math.min(quantity, CART_CONFIG.MAX_QUANTITY_PER_ITEM);
        saveCart(cart);
    }

    return cart;
}

// Increment item quantity
export function incrementQuantity(productId) {
    const cart = getCart();
    const item = cart.find(item => item.id === productId);

    if (item && item.quantity < CART_CONFIG.MAX_QUANTITY_PER_ITEM) {
        item.quantity += 1;
        saveCart(cart);
    }

    return cart;
}

// Decrement item quantity
export function decrementQuantity(productId) {
    const cart = getCart();
    const item = cart.find(item => item.id === productId);

    if (item) {
        if (item.quantity > 1) {
            item.quantity -= 1;
            saveCart(cart);
        } else {
            return removeFromCart(productId);
        }
    }

    return cart;
}

// Clear cart
export function clearCart() {
    localStorage.removeItem(CART_STORAGE_KEY);
    localStorage.removeItem(CART_SETTINGS_KEY);
    updateCartCount();
    dispatchCartUpdateEvent();
}

// ==================== Cart Calculations ====================

// Get subtotal (sum of all items before tax and shipping)
export function getSubtotal() {
    const cart = getCart();
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
}

// Get tax amount
export function getTax(subtotal = null) {
    const amount = subtotal !== null ? subtotal : getSubtotal();
    return amount * CART_CONFIG.TAX_RATE;
}

// Get shipping cost
export function getShipping(shippingType = 'standard') {
    const subtotal = getSubtotal();

    // Free shipping threshold
    if (subtotal >= CART_CONFIG.FREE_SHIPPING_THRESHOLD) {
        return 0;
    }

    return shippingType === 'express'
        ? CART_CONFIG.EXPRESS_SHIPPING
        : CART_CONFIG.STANDARD_SHIPPING;
}

// Get cart total (subtotal + tax + shipping)
export function getCartTotal(shippingType = 'standard') {
    const subtotal = getSubtotal();
    const tax = getTax(subtotal);
    const shipping = getShipping(shippingType);

    return subtotal + tax + shipping;
}

// Get detailed cart summary
export function getCartSummary(shippingType = 'standard') {
    const subtotal = getSubtotal();
    const tax = getTax(subtotal);
    const shipping = getShipping(shippingType);
    const total = subtotal + tax + shipping;
    const itemCount = getCartItemCount();
    const savings = getSavings();

    return {
        subtotal,
        tax,
        shipping,
        total,
        itemCount,
        savings,
        freeShipping: subtotal >= CART_CONFIG.FREE_SHIPPING_THRESHOLD,
        freeShippingRemaining: Math.max(0, CART_CONFIG.FREE_SHIPPING_THRESHOLD - subtotal)
    };
}

// Calculate cart totals (alias for multi-step checkout compatibility)
export function calculateCartTotals(shippingType = 'standard') {
    const subtotal = getSubtotal();
    const tax = getTax(subtotal);
    const shipping = getShipping(shippingType);
    const total = subtotal + tax + shipping;

    return {
        subtotal,
        tax,
        shipping,
        total
    };
}

// Get total savings (if products have original prices)
export function getSavings() {
    const cart = getCart();
    return cart.reduce((savings, item) => {
        if (item.originalPrice && item.originalPrice > item.price) {
            return savings + ((item.originalPrice - item.price) * item.quantity);
        }
        return savings;
    }, 0);
}

// Get cart item count
export function getCartItemCount() {
    const cart = getCart();
    return cart.reduce((count, item) => count + item.quantity, 0);
}

// Check if cart is empty
export function isCartEmpty() {
    return getCart().length === 0;
}

// Get item by ID from cart
export function getCartItem(productId) {
    const cart = getCart();
    return cart.find(item => item.id === productId);
}

// Check if item exists in cart
export function isInCart(productId) {
    return getCartItem(productId) !== undefined;
}

// ==================== UI Helpers ====================

// Update cart count badge
export function updateCartCount() {
    const cartCountElements = document.querySelectorAll('#cart-count, .cart-count');
    const count = getCartItemCount();

    cartCountElements.forEach(element => {
        element.textContent = count;

        // Add animation class
        element.classList.add('updated');
        setTimeout(() => element.classList.remove('updated'), 300);
    });
}

// Create cart item HTML
export function createCartItemHTML(item) {
    const itemTotal = item.price * item.quantity;
    const isMaxQuantity = item.quantity >= CART_CONFIG.MAX_QUANTITY_PER_ITEM;

    return `
        <div class="cart-item" data-item-id="${item.id}">
            <div class="cart-item-image-container">
                <img src="${item.image}" alt="${item.name}" class="cart-item-image">
            </div>
            <div class="cart-item-details">
                <h3 class="cart-item-name">${item.name}</h3>
                <p class="cart-item-price">$${item.price.toFixed(2)} each</p>
                ${item.category ? `<span class="cart-item-category">${item.category}</span>` : ''}
                <div class="quantity-controls">
                    <button class="quantity-btn decrease-btn"
                            data-item-id="${item.id}"
                            aria-label="Decrease quantity">-</button>
                    <span class="quantity-display">${item.quantity}</span>
                    <button class="quantity-btn increase-btn"
                            data-item-id="${item.id}"
                            ${isMaxQuantity ? 'disabled' : ''}
                            aria-label="Increase quantity">+</button>
                </div>
                ${isMaxQuantity ? '<small class="quantity-warning">Maximum quantity reached</small>' : ''}
            </div>
            <div class="cart-item-actions">
                <p class="cart-item-total">$${itemTotal.toFixed(2)}</p>
                <button class="remove-btn"
                        data-item-id="${item.id}"
                        aria-label="Remove ${item.name}">Remove</button>
            </div>
        </div>
    `;
}

// Render cart with full calculations
export function renderCart(containerId, shippingType = 'standard') {
    const container = document.getElementById(containerId);
    if (!container) return;

    const cart = getCart();

    if (cart.length === 0) {
        container.innerHTML = `
            <div class="cart-empty">
                <div class="cart-empty-icon">
                    <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="9" cy="21" r="1"></circle>
                        <circle cx="20" cy="21" r="1"></circle>
                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                    </svg>
                </div>
                <p>Your cart is empty</p>
                <a href="index.html" class="btn">Continue Shopping</a>
            </div>
        `;
        return;
    }

    const cartHTML = cart.map(item => createCartItemHTML(item)).join('');
    const summary = getCartSummary(shippingType);

    container.innerHTML = `
        <div class="cart-items">
            ${cartHTML}
        </div>
        <div class="cart-summary">
            <h3>Order Summary</h3>

            <div class="summary-row">
                <span class="summary-row-label">Subtotal (${summary.itemCount} items):</span>
                <span class="summary-row-value">$${summary.subtotal.toFixed(2)}</span>
            </div>

            <div class="summary-row">
                <span class="summary-row-label">Tax (8%):</span>
                <span class="summary-row-value">$${summary.tax.toFixed(2)}</span>
            </div>

            <div class="summary-row">
                <span class="summary-row-label">Shipping:</span>
                <span class="summary-row-value">
                    ${summary.freeShipping ? '<span class="free-shipping">FREE</span>' : `$${summary.shipping.toFixed(2)}`}
                </span>
            </div>

            ${!summary.freeShipping && summary.freeShippingRemaining > 0 ? `
                <div class="free-shipping-progress">
                    <p class="free-shipping-text">
                        Add <strong>$${summary.freeShippingRemaining.toFixed(2)}</strong> more for free shipping!
                    </p>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${(summary.subtotal / CART_CONFIG.FREE_SHIPPING_THRESHOLD * 100).toFixed(1)}%"></div>
                    </div>
                </div>
            ` : ''}

            ${summary.savings > 0 ? `
                <div class="summary-row savings">
                    <span class="summary-row-label">You Save:</span>
                    <span class="summary-row-value savings-amount">$${summary.savings.toFixed(2)}</span>
                </div>
            ` : ''}

            <div class="summary-divider"></div>

            <div class="summary-row total">
                <span class="summary-row-label">Total:</span>
                <span class="summary-row-value">$${summary.total.toFixed(2)}</span>
            </div>

            <a href="multi-step-checkout.html" class="btn btn-success checkout-btn">Proceed to Checkout</a>

            <div class="security-badge">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
                Secure Checkout
            </div>
        </div>
    `;

    attachCartEventListeners();
}

// ==================== Event Handlers ====================

// Attach event listeners to cart controls
function attachCartEventListeners() {
    // Decrease quantity
    document.querySelectorAll('.decrease-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const itemId = parseInt(e.target.dataset.itemId);
            decrementQuantity(itemId);
            renderCart('cart-container');
            showCartNotification('Quantity updated');
        });
    });

    // Increase quantity
    document.querySelectorAll('.increase-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const itemId = parseInt(e.target.dataset.itemId);
            const item = getCartItem(itemId);

            if (item && item.quantity >= CART_CONFIG.MAX_QUANTITY_PER_ITEM) {
                showCartNotification('Maximum quantity reached', 'warning');
                return;
            }

            incrementQuantity(itemId);
            renderCart('cart-container');
            showCartNotification('Quantity updated');
        });
    });

    // Remove item
    document.querySelectorAll('.remove-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const itemId = parseInt(e.target.dataset.itemId);
            const item = getCartItem(itemId);

            if (item && confirm(`Remove ${item.name} from cart?`)) {
                removeFromCart(itemId);
                renderCart('cart-container');
                showCartNotification(`${item.name} removed from cart`);
            }
        });
    });
}

// Show cart notification
function showCartNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `cart-notification cart-notification-${type}`;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('show');
    }, 10);

    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 2000);
}

// ==================== Export Configuration ====================
export const cartConfig = CART_CONFIG;
