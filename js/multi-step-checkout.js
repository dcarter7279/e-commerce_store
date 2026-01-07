// Multi-Step Checkout JavaScript
// Handles form validation, step navigation, and order processing

import { getCart, clearCart, calculateCartTotals } from './cart.js';

// State management
let currentStep = 1;
const totalSteps = 4;
let formData = {
    shipping: {},
    payment: {},
    shippingMethod: 'standard'
};

// Shipping costs
const SHIPPING_COSTS = {
    standard: 10.00,
    express: 20.00,
    overnight: 35.00
};

// Initialize checkout page
export function initCheckout() {
    loadCartItems();
    updateOrderSummary();
    attachEventListeners();
    updateProgressBar();

    // Auto-fill test data in development
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        autoFillTestData();
    }
}

// Load cart items into order summary
function loadCartItems() {
    const cart = getCart();
    const container = document.getElementById('summary-items-list');

    if (!container) return;

    if (cart.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666;">Your cart is empty</p>';
        return;
    }

    container.innerHTML = cart.map(item => `
        <div class="summary-item">
            <img src="${item.image}" alt="${item.name}" class="summary-item-image">
            <div class="summary-item-info">
                <div class="summary-item-name">${item.name}</div>
                <div class="summary-item-meta">Qty: ${item.quantity}</div>
            </div>
            <div class="summary-item-price">$${(item.price * item.quantity).toFixed(2)}</div>
        </div>
    `).join('');
}

// Update order summary totals
function updateOrderSummary() {
    const totals = calculateCartTotals();
    const shippingMethod = formData.shippingMethod || 'standard';
    const shippingCost = SHIPPING_COSTS[shippingMethod];

    // Update shipping cost in totals
    totals.shipping = shippingCost;
    totals.total = totals.subtotal + totals.tax + shippingCost;

    // Update DOM
    document.getElementById('summary-subtotal').textContent = `$${totals.subtotal.toFixed(2)}`;
    document.getElementById('summary-shipping').textContent = `$${totals.shipping.toFixed(2)}`;
    document.getElementById('summary-tax').textContent = `$${totals.tax.toFixed(2)}`;
    document.getElementById('summary-total').textContent = `$${totals.total.toFixed(2)}`;

    return totals;
}

// Attach event listeners
function attachEventListeners() {
    // Next button
    const nextBtns = document.querySelectorAll('.btn-next');
    nextBtns.forEach(btn => {
        btn.addEventListener('click', handleNext);
    });

    // Back button
    const backBtns = document.querySelectorAll('.btn-back');
    backBtns.forEach(btn => {
        btn.addEventListener('click', handleBack);
    });

    // Shipping method selection
    const shippingOptions = document.querySelectorAll('input[name="shipping-method"]');
    shippingOptions.forEach(option => {
        option.addEventListener('change', handleShippingMethodChange);
    });

    // Payment method selection
    const paymentMethods = document.querySelectorAll('input[name="payment-method"]');
    paymentMethods.forEach(method => {
        method.addEventListener('change', handlePaymentMethodChange);
    });

    // Billing address checkbox
    const sameAsShipping = document.getElementById('same-as-shipping');
    if (sameAsShipping) {
        sameAsShipping.addEventListener('change', handleBillingAddressToggle);
    }

    // Edit buttons in review step
    const editBtns = document.querySelectorAll('.edit-btn');
    editBtns.forEach(btn => {
        btn.addEventListener('click', handleEdit);
    });

    // Place order button
    const placeOrderBtn = document.getElementById('place-order-btn');
    if (placeOrderBtn) {
        placeOrderBtn.addEventListener('click', handlePlaceOrder);
    }

    // Real-time validation
    const inputs = document.querySelectorAll('input, select');
    inputs.forEach(input => {
        input.addEventListener('blur', () => validateField(input));
        input.addEventListener('input', () => {
            if (input.classList.contains('error')) {
                validateField(input);
            }
        });
    });

    // Form submission prevention
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', (e) => e.preventDefault());
    });
}

// Handle next button click
function handleNext(e) {
    e.preventDefault();

    if (currentStep === 1) {
        if (validateShippingForm()) {
            saveShippingData();
            goToStep(2);
        }
    } else if (currentStep === 2) {
        if (validatePaymentForm()) {
            savePaymentData();
            populateReviewStep();
            goToStep(3);
        }
    } else if (currentStep === 3) {
        // Review step - already validated
        goToStep(3);
    }
}

// Handle back button click
function handleBack(e) {
    e.preventDefault();
    goToStep(currentStep - 1);
}

// Navigate to a specific step
function goToStep(step) {
    if (step < 1 || step > totalSteps) return;

    // Hide current step
    document.querySelectorAll('.checkout-step').forEach(s => s.classList.remove('active'));

    // Show target step
    const targetStep = document.getElementById(`step-${step}`);
    if (targetStep) {
        targetStep.classList.add('active');
    }

    currentStep = step;
    updateProgressBar();

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Update progress bar
function updateProgressBar() {
    const progressBar = document.querySelector('.checkout-progress');
    const steps = document.querySelectorAll('.progress-step');

    if (progressBar) {
        progressBar.setAttribute('data-progress', currentStep);
    }

    steps.forEach((step, index) => {
        const stepNumber = index + 1;

        if (stepNumber < currentStep) {
            step.classList.add('completed');
            step.classList.remove('active');
        } else if (stepNumber === currentStep) {
            step.classList.add('active');
            step.classList.remove('completed');
        } else {
            step.classList.remove('active', 'completed');
        }
    });
}

// Validate shipping form
function validateShippingForm() {
    const form = document.getElementById('shipping-form');
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;

    requiredFields.forEach(field => {
        if (!validateField(field)) {
            isValid = false;
        }
    });

    return isValid;
}

// Validate payment form
function validatePaymentForm() {
    const form = document.getElementById('payment-form');
    const paymentMethod = document.querySelector('input[name="payment-method"]:checked');

    if (!paymentMethod) {
        alert('Please select a payment method');
        return false;
    }

    // If credit card is selected, validate card fields
    if (paymentMethod.value === 'card') {
        const cardFields = form.querySelectorAll('.card-fields [required]');
        let isValid = true;

        cardFields.forEach(field => {
            if (!validateField(field)) {
                isValid = false;
            }
        });

        return isValid;
    }

    // For PayPal, just need billing address if different
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

// Validate individual field
function validateField(field) {
    const value = field.value.trim();
    let isValid = true;
    let errorMessage = '';

    // Required field validation
    if (field.hasAttribute('required') && !value) {
        isValid = false;
        errorMessage = 'This field is required';
    }

    // Email validation
    else if (field.type === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            isValid = false;
            errorMessage = 'Please enter a valid email address';
        }
    }

    // Phone validation
    else if (field.type === 'tel' && value) {
        const phoneRegex = /^[\d\s\-\+\(\)]+$/;
        if (!phoneRegex.test(value) || value.replace(/\D/g, '').length < 10) {
            isValid = false;
            errorMessage = 'Please enter a valid phone number';
        }
    }

    // ZIP code validation
    else if (field.id && field.id.includes('zip') && value) {
        const zipRegex = /^\d{5}(-\d{4})?$/;
        if (!zipRegex.test(value)) {
            isValid = false;
            errorMessage = 'Please enter a valid ZIP code (e.g., 12345 or 12345-6789)';
        }
    }

    // Card number validation
    else if (field.id === 'card-number' && value) {
        const cardRegex = /^\d{13,19}$/;
        const cleanValue = value.replace(/\s/g, '');
        if (!cardRegex.test(cleanValue)) {
            isValid = false;
            errorMessage = 'Please enter a valid card number';
        }
    }

    // Expiry date validation
    else if (field.id === 'expiry-date' && value) {
        const expiryRegex = /^(0[1-9]|1[0-2])\/\d{2}$/;
        if (!expiryRegex.test(value)) {
            isValid = false;
            errorMessage = 'Please enter a valid expiry date (MM/YY)';
        } else {
            // Check if date is in the future
            const [month, year] = value.split('/');
            const expiry = new Date(2000 + parseInt(year), parseInt(month) - 1);
            const today = new Date();
            if (expiry < today) {
                isValid = false;
                errorMessage = 'Card has expired';
            }
        }
    }

    // CVV validation
    else if (field.id === 'cvv' && value) {
        const cvvRegex = /^\d{3,4}$/;
        if (!cvvRegex.test(value)) {
            isValid = false;
            errorMessage = 'Please enter a valid CVV';
        }
    }

    // Update field UI
    if (isValid) {
        field.classList.remove('error');
        const errorElement = field.parentElement.querySelector('.error-message');
        if (errorElement) {
            errorElement.textContent = '';
        }
    } else {
        field.classList.add('error');
        const errorElement = field.parentElement.querySelector('.error-message');
        if (errorElement) {
            errorElement.textContent = errorMessage;
        }
    }

    return isValid;
}

// Save shipping data
function saveShippingData() {
    formData.shipping = {
        firstName: document.getElementById('first-name').value,
        lastName: document.getElementById('last-name').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        address: document.getElementById('address').value,
        apartment: document.getElementById('apartment').value,
        city: document.getElementById('city').value,
        state: document.getElementById('state').value,
        zip: document.getElementById('zip').value
    };

    const shippingMethod = document.querySelector('input[name="shipping-method"]:checked');
    if (shippingMethod) {
        formData.shippingMethod = shippingMethod.value;
    }
}

// Save payment data
function savePaymentData() {
    const paymentMethod = document.querySelector('input[name="payment-method"]:checked');
    formData.payment = {
        method: paymentMethod ? paymentMethod.value : 'card'
    };

    const sameAsShipping = document.getElementById('same-as-shipping');
    if (sameAsShipping && sameAsShipping.checked) {
        formData.payment.billingAddress = formData.shipping;
    } else {
        formData.payment.billingAddress = {
            address: document.getElementById('billing-address').value,
            apartment: document.getElementById('billing-apartment').value,
            city: document.getElementById('billing-city').value,
            state: document.getElementById('billing-state').value,
            zip: document.getElementById('billing-zip').value
        };
    }

    if (paymentMethod && paymentMethod.value === 'card') {
        // Note: In production, never store full card details client-side
        formData.payment.card = {
            lastFour: document.getElementById('card-number').value.slice(-4)
        };
    }
}

// Handle shipping method change
function handleShippingMethodChange(e) {
    const options = document.querySelectorAll('.shipping-option');
    options.forEach(opt => opt.classList.remove('selected'));

    const selectedOption = e.target.closest('.shipping-option');
    if (selectedOption) {
        selectedOption.classList.add('selected');
    }

    formData.shippingMethod = e.target.value;
    updateOrderSummary();
}

// Handle payment method change
function handlePaymentMethodChange(e) {
    const methods = document.querySelectorAll('.payment-method');
    methods.forEach(method => method.classList.remove('selected'));

    const selectedMethod = e.target.closest('.payment-method');
    if (selectedMethod) {
        selectedMethod.classList.add('selected');
    }

    // Show/hide card fields
    const cardFields = document.querySelector('.card-fields');
    if (cardFields) {
        if (e.target.value === 'card') {
            cardFields.classList.add('active');
        } else {
            cardFields.classList.remove('active');
        }
    }
}

// Handle billing address toggle
function handleBillingAddressToggle(e) {
    const billingFields = document.querySelector('.billing-address-fields');
    if (billingFields) {
        if (e.target.checked) {
            billingFields.style.display = 'none';
            // Remove required from billing fields
            billingFields.querySelectorAll('[required]').forEach(field => {
                field.removeAttribute('required');
                field.classList.remove('error');
            });
        } else {
            billingFields.style.display = 'block';
            // Add required back to billing fields
            billingFields.querySelectorAll('input').forEach(field => {
                if (field.id !== 'billing-apartment') {
                    field.setAttribute('required', '');
                }
            });
        }
    }
}

// Populate review step
function populateReviewStep() {
    const shipping = formData.shipping;
    const payment = formData.payment;
    const shippingMethodName = getShippingMethodName(formData.shippingMethod);

    // Shipping information
    document.getElementById('review-shipping-info').innerHTML = `
        <p><strong>${shipping.firstName} ${shipping.lastName}</strong></p>
        <p>${shipping.address}${shipping.apartment ? ', ' + shipping.apartment : ''}</p>
        <p>${shipping.city}, ${shipping.state} ${shipping.zip}</p>
        <p>${shipping.email}</p>
        <p>${shipping.phone}</p>
        <p><strong>Shipping Method:</strong> ${shippingMethodName}</p>
    `;

    // Payment information
    const billingAddress = payment.billingAddress;
    let paymentInfo = `<p><strong>Payment Method:</strong> ${payment.method === 'card' ? 'Credit Card' : 'PayPal'}</p>`;

    if (payment.method === 'card' && payment.card) {
        paymentInfo += `<p>Card ending in ${payment.card.lastFour}</p>`;
    }

    paymentInfo += `
        <p><strong>Billing Address:</strong></p>
        <p>${billingAddress.address}${billingAddress.apartment ? ', ' + billingAddress.apartment : ''}</p>
        <p>${billingAddress.city}, ${billingAddress.state} ${billingAddress.zip}</p>
    `;

    document.getElementById('review-payment-info').innerHTML = paymentInfo;

    // Order items
    const cart = getCart();
    document.getElementById('review-order-items').innerHTML = cart.map(item => `
        <div class="order-item">
            <img src="${item.image}" alt="${item.name}" class="item-image">
            <div class="item-details">
                <div class="item-name">${item.name}</div>
                <div class="item-quantity">Quantity: ${item.quantity}</div>
            </div>
            <div class="item-price">$${(item.price * item.quantity).toFixed(2)}</div>
        </div>
    `).join('');
}

// Handle edit button click
function handleEdit(e) {
    const section = e.target.dataset.section;

    if (section === 'shipping') {
        goToStep(1);
    } else if (section === 'payment') {
        goToStep(2);
    }
}

// Handle place order
function handlePlaceOrder(e) {
    e.preventDefault();

    // In production, this would send data to backend
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
        payment: { method: formData.payment.method },
        items: getCart(),
        totals
    };

    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    orders.push(order);
    localStorage.setItem('orders', JSON.stringify(orders));
}

// Generate order number
function generateOrderNumber() {
    const prefix = 'ORD';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
}

// Get shipping method name
function getShippingMethodName(method) {
    const names = {
        standard: 'Standard Shipping (5-7 business days) - $10.00',
        express: 'Express Shipping (2-3 business days) - $20.00',
        overnight: 'Overnight Shipping (1 business day) - $35.00'
    };
    return names[method] || names.standard;
}

// Auto-fill test data for development
function autoFillTestData() {
    // Only auto-fill if URL has ?test=1
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('test') !== '1') return;

    // Shipping data
    document.getElementById('first-name').value = 'John';
    document.getElementById('last-name').value = 'Doe';
    document.getElementById('email').value = 'john.doe@example.com';
    document.getElementById('phone').value = '555-123-4567';
    document.getElementById('address').value = '123 Main Street';
    document.getElementById('apartment').value = 'Apt 4B';
    document.getElementById('city').value = 'San Francisco';
    document.getElementById('state').value = 'CA';
    document.getElementById('zip').value = '94102';

    // Select standard shipping
    const standardShipping = document.querySelector('input[value="standard"]');
    if (standardShipping) {
        standardShipping.checked = true;
        standardShipping.dispatchEvent(new Event('change'));
    }

    // Payment data
    document.getElementById('card-number').value = '4532123456789012';
    document.getElementById('card-name').value = 'John Doe';
    document.getElementById('expiry-date').value = '12/28';
    document.getElementById('cvv').value = '123';

    // Check same as shipping
    const sameAsShipping = document.getElementById('same-as-shipping');
    if (sameAsShipping) {
        sameAsShipping.checked = true;
        sameAsShipping.dispatchEvent(new Event('change'));
    }
}

// Format card number input (add spaces)
export function formatCardNumber(input) {
    let value = input.value.replace(/\s/g, '');
    let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
    input.value = formattedValue;
}

// Format expiry date input
export function formatExpiryDate(input) {
    let value = input.value.replace(/\D/g, '');
    if (value.length >= 2) {
        value = value.substring(0, 2) + '/' + value.substring(2, 4);
    }
    input.value = value;
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCheckout);
} else {
    initCheckout();
}
