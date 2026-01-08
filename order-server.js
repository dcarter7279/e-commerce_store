// Order Management Server
// Handles order creation, storage, email notifications, and order history

const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage (use database in production)
let orders = [];

// Email transporter configuration
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: process.env.SMTP_USER ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    } : undefined
});

// Create test account if no SMTP configured
async function setupEmailTransporter() {
    if (!process.env.SMTP_USER) {
        try {
            const testAccount = await nodemailer.createTestAccount();
            transporter = nodemailer.createTransport({
                host: 'smtp.ethereal.email',
                port: 587,
                secure: false,
                auth: {
                    user: testAccount.user,
                    pass: testAccount.pass
                }
            });
            console.log('📧 Using test email account:', testAccount.user);
            console.log('📬 Preview emails at: https://ethereal.email');
        } catch (error) {
            console.log('⚠️  Email service not configured');
        }
    }
}

setupEmailTransporter();

// ==================== Helper Functions ====================

// Generate unique order number
function generateOrderNumber() {
    const prefix = 'ORD';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
}

// Calculate order totals
function calculateOrderTotals(items, shippingCost = 0, taxRate = 0.08) {
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * taxRate;
    const total = subtotal + tax + shippingCost;

    return {
        subtotal: parseFloat(subtotal.toFixed(2)),
        tax: parseFloat(tax.toFixed(2)),
        shipping: parseFloat(shippingCost.toFixed(2)),
        total: parseFloat(total.toFixed(2))
    };
}

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

// Format date
function formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// ==================== Email Templates ====================

function generateOrderConfirmationEmail(order) {
    const itemsHtml = order.items.map(item => `
        <tr>
            <td style="padding: 12px; border-bottom: 1px solid #eee;">
                <strong>${item.name}</strong><br>
                <span style="color: #666; font-size: 14px;">Qty: ${item.quantity}</span>
            </td>
            <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">
                ${formatCurrency(item.price * item.quantity)}
            </td>
        </tr>
    `).join('');

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Order Confirmation - ${order.orderNumber}</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
                <tr>
                    <td align="center">
                        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                            <!-- Header -->
                            <tr>
                                <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
                                    <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Order Confirmed!</h1>
                                    <p style="color: #ffffff; margin: 10px 0 0; opacity: 0.9;">Thank you for your purchase</p>
                                </td>
                            </tr>

                            <!-- Order Details -->
                            <tr>
                                <td style="padding: 30px 40px;">
                                    <div style="background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 15px; margin-bottom: 25px;">
                                        <p style="margin: 0; color: #666; font-size: 14px;">Order Number</p>
                                        <p style="margin: 5px 0 0; color: #333; font-size: 20px; font-weight: bold;">${order.orderNumber}</p>
                                    </div>

                                    <p style="color: #666; margin-bottom: 20px;">
                                        Hi ${order.shipping.firstName},
                                    </p>
                                    <p style="color: #666; margin-bottom: 25px;">
                                        We've received your order and will send you a shipping confirmation email as soon as your order ships.
                                    </p>

                                    <!-- Order Items -->
                                    <h2 style="color: #333; font-size: 18px; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid #667eea;">
                                        Order Items
                                    </h2>
                                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 25px;">
                                        ${itemsHtml}
                                    </table>

                                    <!-- Order Summary -->
                                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 25px;">
                                        <tr>
                                            <td style="padding: 8px 0; color: #666;">Subtotal:</td>
                                            <td style="padding: 8px 0; text-align: right; color: #333;">${formatCurrency(order.totals.subtotal)}</td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 8px 0; color: #666;">Shipping:</td>
                                            <td style="padding: 8px 0; text-align: right; color: #333;">${formatCurrency(order.totals.shipping)}</td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 8px 0; color: #666;">Tax:</td>
                                            <td style="padding: 8px 0; text-align: right; color: #333;">${formatCurrency(order.totals.tax)}</td>
                                        </tr>
                                        <tr style="border-top: 2px solid #eee;">
                                            <td style="padding: 12px 0; font-weight: bold; font-size: 18px; color: #333;">Total:</td>
                                            <td style="padding: 12px 0; text-align: right; font-weight: bold; font-size: 18px; color: #667eea;">${formatCurrency(order.totals.total)}</td>
                                        </tr>
                                    </table>

                                    <!-- Shipping Address -->
                                    <h2 style="color: #333; font-size: 18px; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid #667eea;">
                                        Shipping Address
                                    </h2>
                                    <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin-bottom: 25px;">
                                        <p style="margin: 0; color: #333; font-weight: bold;">${order.shipping.firstName} ${order.shipping.lastName}</p>
                                        <p style="margin: 5px 0; color: #666;">${order.shipping.address}</p>
                                        ${order.shipping.apartment ? `<p style="margin: 5px 0; color: #666;">${order.shipping.apartment}</p>` : ''}
                                        <p style="margin: 5px 0; color: #666;">${order.shipping.city}, ${order.shipping.state} ${order.shipping.zip}</p>
                                    </div>

                                    <!-- Payment Method -->
                                    <h2 style="color: #333; font-size: 18px; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid #667eea;">
                                        Payment Method
                                    </h2>
                                    <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin-bottom: 25px;">
                                        <p style="margin: 0; color: #666;">
                                            ${order.payment.method === 'card' ? 'Credit Card' : 'PayPal'}
                                            ${order.payment.transactionId ? `<br><small>Transaction ID: ${order.payment.transactionId}</small>` : ''}
                                        </p>
                                    </div>
                                </td>
                            </tr>

                            <!-- Footer -->
                            <tr>
                                <td style="background-color: #f8f9fa; padding: 30px 40px; text-align: center; border-top: 1px solid #eee;">
                                    <p style="margin: 0 0 15px; color: #666; font-size: 14px;">
                                        Questions? Contact us at support@e-store.com
                                    </p>
                                    <p style="margin: 0; color: #999; font-size: 12px;">
                                        © 2026 E-Store. All rights reserved.
                                    </p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
    `;
}

function generateShippingConfirmationEmail(order, trackingNumber) {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Your Order Has Shipped!</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
                <tr>
                    <td align="center">
                        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px;">
                            <tr>
                                <td style="background: linear-gradient(135deg, #27ae60 0%, #229954 100%); padding: 40px 20px; text-align: center;">
                                    <h1 style="color: #ffffff; margin: 0;">Your Order Has Shipped!</h1>
                                    <p style="color: #ffffff; margin: 10px 0 0; opacity: 0.9;">Order #${order.orderNumber}</p>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding: 30px 40px;">
                                    <p style="color: #666; margin-bottom: 20px;">
                                        Good news! Your order is on its way.
                                    </p>
                                    <div style="background-color: #e8f5e9; border-left: 4px solid #27ae60; padding: 15px; margin: 20px 0;">
                                        <p style="margin: 0; color: #666; font-size: 14px;">Tracking Number</p>
                                        <p style="margin: 5px 0 0; color: #27ae60; font-size: 20px; font-weight: bold;">${trackingNumber}</p>
                                    </div>
                                    <p style="text-align: center; margin: 25px 0;">
                                        <a href="https://track.example.com/${trackingNumber}"
                                           style="display: inline-block; background-color: #27ae60; color: #ffffff;
                                                  padding: 12px 30px; text-decoration: none; border-radius: 6px;
                                                  font-weight: bold;">
                                            Track Your Package
                                        </a>
                                    </p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
    `;
}

// ==================== Order Endpoints ====================

// Health check
app.get('/api/orders/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        orders: orders.length
    });
});

// Create new order
app.post('/api/orders', async (req, res) => {
    try {
        const { items, shipping, payment, shippingMethod, userId } = req.body;

        // Validation
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                error: 'Order must contain at least one item'
            });
        }

        if (!shipping || !shipping.email) {
            return res.status(400).json({
                error: 'Shipping information is required'
            });
        }

        // Determine shipping cost based on method
        const shippingCosts = {
            standard: 10.00,
            express: 20.00,
            overnight: 35.00
        };
        const shippingCost = shippingCosts[shippingMethod] || shippingCosts.standard;

        // Calculate totals
        const totals = calculateOrderTotals(items, shippingCost);

        // Create order
        const order = {
            id: crypto.randomUUID(),
            orderNumber: generateOrderNumber(),
            userId: userId || null,
            items: items,
            shipping: shipping,
            payment: {
                method: payment?.method || 'card',
                transactionId: payment?.transactionId || null
            },
            shippingMethod: shippingMethod || 'standard',
            totals: totals,
            status: 'pending',
            statusHistory: [
                {
                    status: 'pending',
                    timestamp: new Date().toISOString(),
                    note: 'Order placed'
                }
            ],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // Save order
        orders.push(order);

        // Send confirmation email
        try {
            const emailHtml = generateOrderConfirmationEmail(order);
            const info = await transporter.sendMail({
                from: process.env.EMAIL_FROM || '"E-Store" <noreply@e-store.com>',
                to: shipping.email,
                subject: `Order Confirmation - ${order.orderNumber}`,
                html: emailHtml
            });

            console.log('✅ Order confirmation email sent:', info.messageId);

            if (process.env.NODE_ENV === 'development') {
                console.log('📧 Preview URL:', nodemailer.getTestMessageUrl(info));
            }
        } catch (emailError) {
            console.error('❌ Failed to send confirmation email:', emailError);
            // Continue even if email fails
        }

        console.log(`✅ Order created: ${order.orderNumber}`);

        res.status(201).json({
            success: true,
            message: 'Order created successfully',
            order: order
        });

    } catch (error) {
        console.error('Order creation error:', error);
        res.status(500).json({
            error: 'Failed to create order',
            message: error.message
        });
    }
});

// Get order by order number
app.get('/api/orders/:orderNumber', (req, res) => {
    try {
        const { orderNumber } = req.params;

        const order = orders.find(o => o.orderNumber === orderNumber);

        if (!order) {
            return res.status(404).json({
                error: 'Order not found'
            });
        }

        res.json({
            success: true,
            order: order
        });

    } catch (error) {
        console.error('Get order error:', error);
        res.status(500).json({
            error: 'Failed to retrieve order'
        });
    }
});

// Get user's orders
app.get('/api/orders/user/:userId', (req, res) => {
    try {
        const { userId } = req.params;

        const userOrders = orders
            .filter(o => o.userId === userId)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        res.json({
            success: true,
            orders: userOrders,
            count: userOrders.length
        });

    } catch (error) {
        console.error('Get user orders error:', error);
        res.status(500).json({
            error: 'Failed to retrieve orders'
        });
    }
});

// Get orders by email
app.get('/api/orders/email/:email', (req, res) => {
    try {
        const { email } = req.params;

        const userOrders = orders
            .filter(o => o.shipping.email.toLowerCase() === email.toLowerCase())
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        res.json({
            success: true,
            orders: userOrders,
            count: userOrders.length
        });

    } catch (error) {
        console.error('Get orders by email error:', error);
        res.status(500).json({
            error: 'Failed to retrieve orders'
        });
    }
});

// Update order status
app.patch('/api/orders/:orderNumber/status', async (req, res) => {
    try {
        const { orderNumber } = req.params;
        const { status, note, trackingNumber } = req.body;

        const order = orders.find(o => o.orderNumber === orderNumber);

        if (!order) {
            return res.status(404).json({
                error: 'Order not found'
            });
        }

        // Valid statuses
        const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                error: 'Invalid status',
                validStatuses: validStatuses
            });
        }

        // Update status
        order.status = status;
        order.updatedAt = new Date().toISOString();
        order.statusHistory.push({
            status: status,
            timestamp: new Date().toISOString(),
            note: note || `Order ${status}`
        });

        if (trackingNumber) {
            order.trackingNumber = trackingNumber;
        }

        // Send shipping notification if status is 'shipped'
        if (status === 'shipped' && trackingNumber) {
            try {
                const emailHtml = generateShippingConfirmationEmail(order, trackingNumber);
                await transporter.sendMail({
                    from: process.env.EMAIL_FROM || '"E-Store" <noreply@e-store.com>',
                    to: order.shipping.email,
                    subject: `Your Order Has Shipped - ${order.orderNumber}`,
                    html: emailHtml
                });

                console.log('✅ Shipping notification sent');
            } catch (emailError) {
                console.error('❌ Failed to send shipping notification:', emailError);
            }
        }

        console.log(`✅ Order ${orderNumber} status updated to: ${status}`);

        res.json({
            success: true,
            message: 'Order status updated',
            order: order
        });

    } catch (error) {
        console.error('Update order status error:', error);
        res.status(500).json({
            error: 'Failed to update order status'
        });
    }
});

// Get all orders (admin only - add authentication in production)
app.get('/api/orders', (req, res) => {
    try {
        const { status, limit = 50, offset = 0 } = req.query;

        let filteredOrders = orders;

        // Filter by status if provided
        if (status) {
            filteredOrders = filteredOrders.filter(o => o.status === status);
        }

        // Sort by creation date (newest first)
        filteredOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        // Pagination
        const paginatedOrders = filteredOrders.slice(
            parseInt(offset),
            parseInt(offset) + parseInt(limit)
        );

        res.json({
            success: true,
            orders: paginatedOrders,
            total: filteredOrders.length,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

    } catch (error) {
        console.error('Get all orders error:', error);
        res.status(500).json({
            error: 'Failed to retrieve orders'
        });
    }
});

// Cancel order
app.post('/api/orders/:orderNumber/cancel', async (req, res) => {
    try {
        const { orderNumber } = req.params;
        const { reason } = req.body;

        const order = orders.find(o => o.orderNumber === orderNumber);

        if (!order) {
            return res.status(404).json({
                error: 'Order not found'
            });
        }

        // Can only cancel pending or processing orders
        if (!['pending', 'processing'].includes(order.status)) {
            return res.status(400).json({
                error: 'Order cannot be cancelled',
                message: 'Only pending or processing orders can be cancelled'
            });
        }

        order.status = 'cancelled';
        order.updatedAt = new Date().toISOString();
        order.statusHistory.push({
            status: 'cancelled',
            timestamp: new Date().toISOString(),
            note: reason || 'Order cancelled by customer'
        });

        console.log(`✅ Order ${orderNumber} cancelled`);

        res.json({
            success: true,
            message: 'Order cancelled successfully',
            order: order
        });

    } catch (error) {
        console.error('Cancel order error:', error);
        res.status(500).json({
            error: 'Failed to cancel order'
        });
    }
});

// ==================== Statistics Endpoint ====================

app.get('/api/orders/stats/summary', (req, res) => {
    try {
        const totalOrders = orders.length;
        const totalRevenue = orders.reduce((sum, order) => sum + order.totals.total, 0);

        const statusCounts = orders.reduce((acc, order) => {
            acc[order.status] = (acc[order.status] || 0) + 1;
            return acc;
        }, {});

        res.json({
            success: true,
            stats: {
                totalOrders,
                totalRevenue: parseFloat(totalRevenue.toFixed(2)),
                averageOrderValue: totalOrders > 0 ? parseFloat((totalRevenue / totalOrders).toFixed(2)) : 0,
                statusCounts
            }
        });

    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({
            error: 'Failed to retrieve statistics'
        });
    }
});

// ==================== Error Handling ====================

app.use((req, res) => {
    res.status(404).json({
        error: 'Not found',
        path: req.path
    });
});

app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: err.message
    });
});

// ==================== Start Server ====================

const PORT = process.env.ORDER_PORT || 3002;

app.listen(PORT, () => {
    console.log('\n📦 Order Management Server Started!');
    console.log(`📡 Listening on port ${PORT}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/api/orders/health`);
    console.log(`📝 Create order: POST http://localhost:${PORT}/api/orders`);
    console.log(`📋 Get orders: GET http://localhost:${PORT}/api/orders`);
    console.log('\n✅ Order management system ready!\n');
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing server');
    process.exit(0);
});
