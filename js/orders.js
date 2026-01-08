// Order Management Module
// Handles order creation, retrieval, and display

// API Configuration
const ORDER_API_URL = 'http://localhost:3002/api/orders';

// ==================== Order Creation ====================

export async function createOrder(orderData) {
    try {
        const response = await fetch(ORDER_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to create order');
        }

        const result = await response.json();
        return {
            success: true,
            order: result.order
        };

    } catch (error) {
        console.error('Create order error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// ==================== Order Retrieval ====================

export async function getOrderByNumber(orderNumber) {
    try {
        const response = await fetch(`${ORDER_API_URL}/${orderNumber}`);

        if (!response.ok) {
            throw new Error('Order not found');
        }

        const result = await response.json();
        return {
            success: true,
            order: result.order
        };

    } catch (error) {
        console.error('Get order error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

export async function getUserOrders(userId) {
    try {
        const response = await fetch(`${ORDER_API_URL}/user/${userId}`);

        if (!response.ok) {
            throw new Error('Failed to retrieve orders');
        }

        const result = await response.json();
        return {
            success: true,
            orders: result.orders,
            count: result.count
        };

    } catch (error) {
        console.error('Get user orders error:', error);
        return {
            success: false,
            error: error.message,
            orders: []
        };
    }
}

export async function getOrdersByEmail(email) {
    try {
        const response = await fetch(`${ORDER_API_URL}/email/${encodeURIComponent(email)}`);

        if (!response.ok) {
            throw new Error('Failed to retrieve orders');
        }

        const result = await response.json();
        return {
            success: true,
            orders: result.orders,
            count: result.count
        };

    } catch (error) {
        console.error('Get orders by email error:', error);
        return {
            success: false,
            error: error.message,
            orders: []
        };
    }
}

// ==================== Order Status Updates ====================

export async function updateOrderStatus(orderNumber, status, note, trackingNumber) {
    try {
        const response = await fetch(`${ORDER_API_URL}/${orderNumber}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                status,
                note,
                trackingNumber
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to update order status');
        }

        const result = await response.json();
        return {
            success: true,
            order: result.order
        };

    } catch (error) {
        console.error('Update order status error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

export async function cancelOrder(orderNumber, reason) {
    try {
        const response = await fetch(`${ORDER_API_URL}/${orderNumber}/cancel`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ reason })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to cancel order');
        }

        const result = await response.json();
        return {
            success: true,
            order: result.order
        };

    } catch (error) {
        console.error('Cancel order error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// ==================== UI Rendering ====================

export function renderOrderHistory(orders, containerId) {
    const container = document.getElementById(containerId);

    if (!container) {
        console.error('Container not found:', containerId);
        return;
    }

    if (!orders || orders.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                    <line x1="3" y1="6" x2="21" y2="6"></line>
                    <path d="M16 10a4 4 0 0 1-8 0"></path>
                </svg>
                <h3>No orders yet</h3>
                <p>Start shopping to see your order history here</p>
                <a href="index.html" class="btn btn-primary">Start Shopping</a>
            </div>
        `;
        return;
    }

    container.innerHTML = orders.map(order => createOrderCard(order)).join('');
    attachOrderEventListeners();
}

function createOrderCard(order) {
    const statusClass = getStatusClass(order.status);
    const statusLabel = getStatusLabel(order.status);

    return `
        <div class="order-card" data-order-id="${order.orderNumber}">
            <div class="order-header">
                <div class="order-info">
                    <h3 class="order-number">
                        <a href="order-details.html?order=${order.orderNumber}">
                            Order #${order.orderNumber}
                        </a>
                    </h3>
                    <p class="order-date">${formatDate(order.createdAt)}</p>
                </div>
                <span class="order-status ${statusClass}">${statusLabel}</span>
            </div>

            <div class="order-items">
                ${order.items.slice(0, 3).map(item => `
                    <div class="order-item-preview">
                        <img src="${item.image}" alt="${item.name}" class="order-item-image">
                        <div class="order-item-info">
                            <span class="order-item-name">${item.name}</span>
                            <span class="order-item-qty">Qty: ${item.quantity}</span>
                        </div>
                    </div>
                `).join('')}
                ${order.items.length > 3 ? `
                    <p class="order-more-items">+${order.items.length - 3} more item${order.items.length - 3 > 1 ? 's' : ''}</p>
                ` : ''}
            </div>

            <div class="order-footer">
                <div class="order-total">
                    <span class="total-label">Total:</span>
                    <span class="total-amount">${formatCurrency(order.totals.total)}</span>
                </div>
                <div class="order-actions">
                    <a href="order-details.html?order=${order.orderNumber}" class="btn btn-secondary btn-small">
                        View Details
                    </a>
                    ${order.status === 'pending' || order.status === 'processing' ? `
                        <button class="btn btn-secondary btn-small cancel-order-btn" data-order="${order.orderNumber}">
                            Cancel Order
                        </button>
                    ` : ''}
                    ${order.trackingNumber ? `
                        <a href="#track-${order.trackingNumber}" class="btn btn-primary btn-small">
                            Track Package
                        </a>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
}

function attachOrderEventListeners() {
    // Cancel order buttons
    const cancelButtons = document.querySelectorAll('.cancel-order-btn');
    cancelButtons.forEach(btn => {
        btn.addEventListener('click', handleCancelOrder);
    });
}

async function handleCancelOrder(e) {
    const orderNumber = e.target.dataset.order;

    if (!confirm('Are you sure you want to cancel this order?')) {
        return;
    }

    const reason = prompt('Please provide a reason for cancellation (optional):');

    const result = await cancelOrder(orderNumber, reason);

    if (result.success) {
        showNotification('Order cancelled successfully', 'success');
        // Refresh order display
        const card = e.target.closest('.order-card');
        if (card) {
            const statusBadge = card.querySelector('.order-status');
            if (statusBadge) {
                statusBadge.className = 'order-status cancelled';
                statusBadge.textContent = 'Cancelled';
            }
            e.target.remove(); // Remove cancel button
        }
    } else {
        showNotification(result.error, 'error');
    }
}

// ==================== Order Details Page ====================

export async function renderOrderDetails(orderNumber, containerId) {
    const container = document.getElementById(containerId);

    if (!container) {
        console.error('Container not found:', containerId);
        return;
    }

    // Show loading
    container.innerHTML = '<div class="loading">Loading order details...</div>';

    const result = await getOrderByNumber(orderNumber);

    if (!result.success) {
        container.innerHTML = `
            <div class="error-state">
                <h2>Order Not Found</h2>
                <p>${result.error}</p>
                <a href="profile.html" class="btn btn-primary">Back to Orders</a>
            </div>
        `;
        return;
    }

    const order = result.order;
    container.innerHTML = createOrderDetailsHTML(order);
}

function createOrderDetailsHTML(order) {
    const statusClass = getStatusClass(order.status);
    const statusLabel = getStatusLabel(order.status);

    return `
        <div class="order-details-container">
            <!-- Order Header -->
            <div class="order-details-header">
                <div>
                    <h1>Order #${order.orderNumber}</h1>
                    <p class="order-date">Placed on ${formatDate(order.createdAt)}</p>
                </div>
                <span class="order-status-badge ${statusClass}">${statusLabel}</span>
            </div>

            <!-- Order Timeline -->
            <div class="order-timeline">
                <h2>Order Status</h2>
                <div class="timeline">
                    ${order.statusHistory.map((status, index) => `
                        <div class="timeline-item ${index === order.statusHistory.length - 1 ? 'active' : ''}">
                            <div class="timeline-marker"></div>
                            <div class="timeline-content">
                                <p class="timeline-status">${getStatusLabel(status.status)}</p>
                                <p class="timeline-date">${formatDate(status.timestamp)}</p>
                                ${status.note ? `<p class="timeline-note">${status.note}</p>` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- Order Items -->
            <div class="order-section">
                <h2>Items Ordered</h2>
                <div class="order-items-list">
                    ${order.items.map(item => `
                        <div class="order-item-detail">
                            <img src="${item.image}" alt="${item.name}" class="item-image">
                            <div class="item-info">
                                <h3>${item.name}</h3>
                                <p class="item-price">${formatCurrency(item.price)} × ${item.quantity}</p>
                            </div>
                            <div class="item-total">
                                ${formatCurrency(item.price * item.quantity)}
                            </div>
                        </div>
                    `).join('')}
                </div>

                <!-- Order Totals -->
                <div class="order-totals">
                    <div class="total-row">
                        <span>Subtotal:</span>
                        <span>${formatCurrency(order.totals.subtotal)}</span>
                    </div>
                    <div class="total-row">
                        <span>Shipping:</span>
                        <span>${formatCurrency(order.totals.shipping)}</span>
                    </div>
                    <div class="total-row">
                        <span>Tax:</span>
                        <span>${formatCurrency(order.totals.tax)}</span>
                    </div>
                    <div class="total-row total">
                        <span>Total:</span>
                        <span>${formatCurrency(order.totals.total)}</span>
                    </div>
                </div>
            </div>

            <!-- Shipping & Payment Info -->
            <div class="order-info-grid">
                <div class="info-card">
                    <h3>Shipping Address</h3>
                    <p class="recipient-name">${order.shipping.firstName} ${order.shipping.lastName}</p>
                    <p>${order.shipping.address}</p>
                    ${order.shipping.apartment ? `<p>${order.shipping.apartment}</p>` : ''}
                    <p>${order.shipping.city}, ${order.shipping.state} ${order.shipping.zip}</p>
                    ${order.shipping.phone ? `<p>Phone: ${order.shipping.phone}</p>` : ''}
                </div>

                <div class="info-card">
                    <h3>Payment Method</h3>
                    <p>${order.payment.method === 'card' ? 'Credit Card' : 'PayPal'}</p>
                    ${order.payment.transactionId ? `
                        <p class="transaction-id">Transaction ID: ${order.payment.transactionId}</p>
                    ` : ''}
                </div>

                ${order.trackingNumber ? `
                    <div class="info-card">
                        <h3>Tracking Information</h3>
                        <p class="tracking-number">${order.trackingNumber}</p>
                        <a href="#track" class="btn btn-primary btn-small">Track Package</a>
                    </div>
                ` : ''}
            </div>

            <!-- Actions -->
            <div class="order-actions-footer">
                ${order.status === 'pending' || order.status === 'processing' ? `
                    <button class="btn btn-secondary" onclick="window.location.reload()">
                        Cancel Order
                    </button>
                ` : ''}
                <a href="profile.html" class="btn btn-primary">Back to Orders</a>
            </div>
        </div>
    `;
}

// ==================== Helper Functions ====================

function getStatusClass(status) {
    const classes = {
        pending: 'pending',
        processing: 'processing',
        shipped: 'shipped',
        delivered: 'delivered',
        cancelled: 'cancelled'
    };
    return classes[status] || 'pending';
}

function getStatusLabel(status) {
    const labels = {
        pending: 'Pending',
        processing: 'Processing',
        shipped: 'Shipped',
        delivered: 'Delivered',
        cancelled: 'Cancelled'
    };
    return labels[status] || status;
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
        return 'Today at ' + date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit'
        });
    } else if (days === 1) {
        return 'Yesterday at ' + date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit'
        });
    } else if (days < 7) {
        return `${days} days ago`;
    } else {
        return date.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });
    }
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => notification.classList.add('show'), 10);

    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ==================== Local Storage Fallback ====================

// For demo purposes, also save orders to localStorage
export function saveOrderToLocalStorage(order) {
    try {
        const orders = JSON.parse(localStorage.getItem('orders') || '[]');
        orders.push(order);
        localStorage.setItem('orders', JSON.stringify(orders));
    } catch (error) {
        console.error('Failed to save order to localStorage:', error);
    }
}

export function getOrdersFromLocalStorage(email) {
    try {
        const orders = JSON.parse(localStorage.getItem('orders') || '[]');
        return email
            ? orders.filter(o => o.shipping?.email === email)
            : orders;
    } catch (error) {
        console.error('Failed to get orders from localStorage:', error);
        return [];
    }
}
