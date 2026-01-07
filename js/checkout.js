// Checkout Module
// Handles checkout process and order submission

import { getCart, getCartSummary, clearCart } from './cart.js';

// Render order summary
export function renderOrderSummary(containerId, shippingType = 'standard') {
    const container = document.getElementById(containerId);
    if (!container) return;

    const cart = getCart();

    if (cart.length === 0) {
        container.innerHTML = `
            <div class="cart-empty">
                <p>Your cart is empty</p>
                <a href="index.html" class="btn">Continue Shopping</a>
            </div>
        `;
        return;
    }

    const summary = getCartSummary(shippingType);

    const itemsHTML = cart.map(item => `
        <div class="order-item">
            <div class="item-info">
                <span class="item-name">${item.name}</span>
                <span class="item-quantity">Qty: ${item.quantity}</span>
            </div>
            <span class="item-price">$${(item.price * item.quantity).toFixed(2)}</span>
        </div>
    `).join('');

    container.innerHTML = `
        <h3>Order Summary</h3>
        <div class="order-items">
            ${itemsHTML}
        </div>
        <div class="summary-totals">
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
            ${summary.savings > 0 ? `
                <div class="summary-row savings">
                    <span class="summary-row-label">You Save:</span>
                    <span class="summary-row-value savings-amount">$${summary.savings.toFixed(2)}</span>
                </div>
            ` : ''}
            <div class="summary-row total">
                <span class="summary-row-label">Total:</span>
                <span class="summary-row-value">$${summary.total.toFixed(2)}</span>
            </div>
        </div>
        <div class="security-badge">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>
            Secure Checkout
        </div>
    `;
}

// Validate form
export function validateCheckoutForm(formData) {
    const errors = [];

    // Required fields
    const requiredFields = ['fullName', 'email', 'phone', 'address', 'city', 'zip', 'cardNumber', 'cardName', 'expiryDate', 'cvv'];

    requiredFields.forEach(field => {
        if (!formData[field] || formData[field].trim() === '') {
            errors.push(`${field} is required`);
        }
    });

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
        errors.push('Invalid email format');
    }

    // Phone validation (basic)
    const phoneRegex = /^\d{10}$/;
    if (formData.phone && !phoneRegex.test(formData.phone.replace(/\D/g, ''))) {
        errors.push('Phone number must be 10 digits');
    }

    // Card number validation (basic - should be 16 digits)
    const cardRegex = /^\d{16}$/;
    if (formData.cardNumber && !cardRegex.test(formData.cardNumber.replace(/\s/g, ''))) {
        errors.push('Card number must be 16 digits');
    }

    // CVV validation
    const cvvRegex = /^\d{3,4}$/;
    if (formData.cvv && !cvvRegex.test(formData.cvv)) {
        errors.push('CVV must be 3 or 4 digits');
    }

    return errors;
}

// Process checkout
export function processCheckout(formData, shippingType = 'standard') {
    const errors = validateCheckoutForm(formData);

    if (errors.length > 0) {
        return {
            success: false,
            errors: errors
        };
    }

    // Generate order ID
    const orderId = 'ORD-' + Date.now();

    // Get order details
    const cart = getCart();
    const summary = getCartSummary(shippingType);

    const order = {
        orderId: orderId,
        customerInfo: {
            name: formData.fullName,
            email: formData.email,
            phone: formData.phone,
            address: {
                street: formData.address,
                city: formData.city,
                state: formData.state,
                zip: formData.zip
            }
        },
        items: cart,
        subtotal: summary.subtotal,
        tax: summary.tax,
        shipping: summary.shipping,
        total: summary.total,
        date: new Date().toISOString()
    };

    // Save order to localStorage (in a real app, this would be sent to a server)
    saveOrder(order);

    // Clear cart
    clearCart();

    return {
        success: true,
        orderId: orderId,
        order: order
    };
}

// Save order to localStorage
function saveOrder(order) {
    const orders = getOrders();
    orders.push(order);
    localStorage.setItem('ecommerce_orders', JSON.stringify(orders));
}

// Get all orders
export function getOrders() {
    const orders = localStorage.getItem('ecommerce_orders');
    return orders ? JSON.parse(orders) : [];
}

// Display success message
export function displaySuccessMessage(orderId, orderTotal) {
    return `
        <div class="success-message">
            <div class="success-icon">✓</div>
            <h3>Order Placed Successfully!</h3>
            <p>Thank you for your order.</p>
            <p>Your order ID is: <span class="order-id">${orderId}</span></p>
            ${orderTotal ? `<p>Order Total: <strong>$${orderTotal.toFixed(2)}</strong></p>` : ''}
            <p>A confirmation email has been sent to your email address.</p>
            <a href="index.html" class="btn btn-primary">Continue Shopping</a>
        </div>
    `;
}

// Setup checkout form
export function setupCheckoutForm() {
    const form = document.getElementById('checkout-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        // Get form data
        const formData = {
            fullName: form.fullName.value,
            email: form.email.value,
            phone: form.phone.value,
            address: form.address.value,
            city: form.city.value,
            state: form.state.value,
            zip: form.zip.value,
            cardNumber: form.cardNumber.value,
            cardName: form.cardName.value,
            expiryDate: form.expiryDate.value,
            cvv: form.cvv.value
        };

        // Process checkout (default to standard shipping)
        const result = processCheckout(formData, 'standard');

        if (result.success) {
            // Display success message
            const container = document.querySelector('.checkout-container');
            container.innerHTML = displaySuccessMessage(result.orderId, result.order.total);
        } else {
            // Display errors
            alert('Please fix the following errors:\n' + result.errors.join('\n'));
        }
    });
}
