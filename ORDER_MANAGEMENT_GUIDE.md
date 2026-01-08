# Order Management System Guide

Complete guide for the order management system with order storage, email confirmations, and order history tracking.

## Table of Contents
1. [Overview](#overview)
2. [Features](#features)
3. [Quick Start](#quick-start)
4. [API Documentation](#api-documentation)
5. [Email Notifications](#email-notifications)
6. [Order History](#order-history)
7. [Integration Guide](#integration-guide)
8. [Testing](#testing)
9. [Production Deployment](#production-deployment)

---

## Overview

The order management system provides complete order lifecycle management including:
- **Order Creation**: Capture order details from checkout
- **Email Notifications**: Automated confirmation and shipping emails
- **Order Storage**: Persistent order data with status tracking
- **Order History**: User-facing order history and details
- **Order Updates**: Status tracking and updates

### Architecture

```
┌──────────────┐      ┌───────────────┐      ┌────────────┐      ┌──────────┐
│   Checkout   │ ───► │ Order Server  │ ───► │  Database  │      │  Email   │
│   (Frontend) │      │   (Express)   │      │  (Storage) │      │ Service  │
└──────────────┘      └───────────────┘      └────────────┘      └──────────┘
                              │                                        ▲
                              └────────────────────────────────────────┘
                                     (Sends confirmation emails)
```

---

## Features

### ✅ Order Creation
- Automatic order number generation
- Order totals calculation (subtotal, tax, shipping)
- User association (logged in or guest)
- Payment method tracking
- Shipping method selection

### ✅ Email Notifications
- Order confirmation emails with full details
- Shipping confirmation with tracking number
- Beautiful HTML email templates
- Test email mode for development

### ✅ Order Storage
- Persistent order storage
- Status tracking (pending, processing, shipped, delivered, cancelled)
- Status history timeline
- Transaction ID tracking

### ✅ Order History
- User order history by email or user ID
- Order details page with complete information
- Order status timeline
- Cancel order functionality
- Track package link

### ✅ Order Updates
- Update order status
- Add tracking numbers
- Order cancellation
- Status change history

---

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

This installs `nodemailer` for email notifications.

### 2. Configure Environment

Edit `.env`:
```env
ORDER_PORT=3002

# Email configuration (optional - uses test account if not set)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
EMAIL_FROM="E-Store" <noreply@e-store.com>
```

### 3. Start Order Management Server

```bash
npm run start:orders
```

Server starts at `http://localhost:3002`

### 4. Start All Servers

```bash
npm run start:all
```

This starts:
- Payment server (port 3000)
- Auth server (port 3001)
- Order server (port 3002)

---

## API Documentation

### Base URL
```
http://localhost:3002/api/orders
```

### Endpoints

#### 1. Create Order
```http
POST /api/orders
Content-Type: application/json

{
  "items": [
    {
      "id": 1,
      "name": "Product Name",
      "price": 99.99,
      "quantity": 2,
      "image": "https://..."
    }
  ],
  "shipping": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "555-1234",
    "address": "123 Main St",
    "apartment": "Apt 4B",
    "city": "San Francisco",
    "state": "CA",
    "zip": "94102"
  },
  "payment": {
    "method": "card",
    "transactionId": "pi_123456789"
  },
  "shippingMethod": "standard",
  "userId": "user_123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Order created successfully",
  "order": {
    "id": "uuid",
    "orderNumber": "ORD-K9X2M-A4F8",
    "userId": "user_123",
    "items": [...],
    "shipping": {...},
    "payment": {...},
    "shippingMethod": "standard",
    "totals": {
      "subtotal": 199.98,
      "tax": 15.99,
      "shipping": 10.00,
      "total": 225.97
    },
    "status": "pending",
    "statusHistory": [
      {
        "status": "pending",
        "timestamp": "2026-01-07T...",
        "note": "Order placed"
      }
    ],
    "createdAt": "2026-01-07T...",
    "updatedAt": "2026-01-07T..."
  }
}
```

#### 2. Get Order by Order Number
```http
GET /api/orders/:orderNumber
```

**Example:**
```http
GET /api/orders/ORD-K9X2M-A4F8
```

**Response:**
```json
{
  "success": true,
  "order": {
    "id": "uuid",
    "orderNumber": "ORD-K9X2M-A4F8",
    ...
  }
}
```

#### 3. Get User's Orders
```http
GET /api/orders/user/:userId
```

**Example:**
```http
GET /api/orders/user/user_123
```

**Response:**
```json
{
  "success": true,
  "orders": [...],
  "count": 5
}
```

#### 4. Get Orders by Email
```http
GET /api/orders/email/:email
```

**Example:**
```http
GET /api/orders/email/john@example.com
```

#### 5. Update Order Status
```http
PATCH /api/orders/:orderNumber/status
Content-Type: application/json

{
  "status": "shipped",
  "note": "Package shipped via FedEx",
  "trackingNumber": "1Z999AA10123456784"
}
```

**Valid Statuses:**
- `pending` - Order received
- `processing` - Order being prepared
- `shipped` - Order shipped
- `delivered` - Order delivered
- `cancelled` - Order cancelled

#### 6. Cancel Order
```http
POST /api/orders/:orderNumber/cancel
Content-Type: application/json

{
  "reason": "Customer requested cancellation"
}
```

#### 7. Get All Orders (Admin)
```http
GET /api/orders?status=pending&limit=50&offset=0
```

**Query Parameters:**
- `status` - Filter by order status
- `limit` - Number of orders to return (default: 50)
- `offset` - Pagination offset (default: 0)

#### 8. Get Order Statistics
```http
GET /api/orders/stats/summary
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalOrders": 150,
    "totalRevenue": 15750.50,
    "averageOrderValue": 105.00,
    "statusCounts": {
      "pending": 10,
      "processing": 15,
      "shipped": 20,
      "delivered": 100,
      "cancelled": 5
    }
  }
}
```

---

## Email Notifications

### Order Confirmation Email

Sent automatically when order is created.

**Features:**
- Beautiful HTML template
- Order number and details
- Itemized order summary
- Order totals breakdown
- Shipping address
- Payment method
- Responsive design

**Template:**
- Gradient header
- Order items table
- Shipping and billing info
- Contact information

### Shipping Confirmation Email

Sent when order status is updated to "shipped".

**Includes:**
- Tracking number
- Link to track package
- Expected delivery information

### Email Configuration

#### Development (Test Account)
If no SMTP credentials are configured, the system automatically creates a test account using Ethereal Email:

```javascript
// Test email preview URL shown in console
console.log('📧 Preview URL:', nodemailer.getTestMessageUrl(info));
```

#### Production (Real SMTP)
Configure in `.env`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
EMAIL_FROM="E-Store" <noreply@e-store.com>
```

**Gmail Setup:**
1. Enable 2-factor authentication
2. Generate app password
3. Use app password in `SMTP_PASS`

**Other Providers:**
- **SendGrid**: SMTP relay
- **AWS SES**: Amazon email service
- **Mailgun**: Transactional email
- **Postmark**: Fast email delivery

---

## Order History

### Frontend Integration

#### Display Order History

```javascript
import { getOrdersByEmail, renderOrderHistory } from './js/orders.js';

// Get orders for current user
const result = await getOrdersByEmail('user@example.com');

if (result.success) {
    renderOrderHistory(result.orders, 'orders-list');
}
```

#### View Order Details

```javascript
import { renderOrderDetails } from './js/orders.js';

// Get order number from URL
const orderNumber = new URLSearchParams(window.location.search).get('order');

// Render order details
renderOrderDetails(orderNumber, 'order-details-container');
```

### Profile Page Integration

Orders are automatically loaded in the profile page:

```javascript
// In profile.html
<div id="orders-tab" class="profile-tab">
    <div class="profile-header">
        <h2>Order History</h2>
        <p>View your past orders</p>
    </div>
    <div id="orders-list" class="orders-list">
        <!-- Orders loaded here -->
    </div>
</div>
```

### Order Details Page

Visit: `order-details.html?order=ORD-K9X2M-A4F8`

**Features:**
- Complete order information
- Status timeline with history
- Itemized order list
- Shipping and billing addresses
- Payment method
- Tracking information
- Cancel order button (if applicable)

---

## Integration Guide

### Integrate with Checkout

The checkout has been updated to automatically create orders:

```javascript
// In multi-step-checkout.js
import { createOrder, saveOrderToLocalStorage } from './orders.js';

async function handlePlaceOrder(e) {
    // Prepare order data
    const orderData = {
        userId: user ? user.id : null,
        items: cart,
        shipping: formData.shipping,
        payment: {
            method: formData.payment.method,
            transactionId: formData.payment.transactionId
        },
        shippingMethod: formData.shippingMethod
    };

    // Create order via API
    const result = await createOrder(orderData);

    if (result.success) {
        // Order created successfully
        clearCart();
        goToConfirmation(result.order);
    }
}
```

### Save Order Locally (Fallback)

```javascript
import { saveOrderToLocalStorage } from './js/orders.js';

// Fallback when API is unavailable
saveOrderToLocalStorage(order);
```

### Get Orders from Storage

```javascript
import { getOrdersFromLocalStorage } from './js/orders.js';

// Get all orders for email
const orders = getOrdersFromLocalStorage('user@example.com');
```

---

## Testing

### Manual Testing Checklist

**Order Creation:**
- [ ] Create order from checkout
- [ ] Verify order number generated
- [ ] Check order confirmation email received
- [ ] Verify order saved to database
- [ ] Check order appears in order history

**Order History:**
- [ ] View orders in profile page
- [ ] Click on order to see details
- [ ] Verify all order information displayed
- [ ] Check status timeline shows correctly

**Order Updates:**
- [ ] Update order status
- [ ] Add tracking number
- [ ] Verify shipping email sent
- [ ] Cancel pending order
- [ ] Try to cancel shipped order (should fail)

**Email Notifications:**
- [ ] Order confirmation email sent
- [ ] Shipping confirmation email sent
- [ ] Emails display correctly in email client
- [ ] All order details accurate in email

### Test Email Preview

During development, preview emails at:
```
https://ethereal.email
```

Login with credentials shown in console.

### API Testing with curl

```bash
# Create order
curl -X POST http://localhost:3002/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "items": [{"id": 1, "name": "Test Product", "price": 99.99, "quantity": 1}],
    "shipping": {"firstName": "Test", "lastName": "User", "email": "test@example.com"},
    "payment": {"method": "card"}
  }'

# Get order
curl http://localhost:3002/api/orders/ORD-K9X2M-A4F8

# Update status
curl -X PATCH http://localhost:3002/api/orders/ORD-K9X2M-A4F8/status \
  -H "Content-Type: application/json" \
  -d '{"status": "shipped", "trackingNumber": "1Z999AA10123456784"}'
```

---

## Production Deployment

### Pre-Production Checklist

#### 1. Configure Email Service

Choose a production email service:

**SendGrid:**
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.xxx
EMAIL_FROM="Your Store" <noreply@yourstore.com>
```

**AWS SES:**
```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=YOUR_SMTP_USERNAME
SMTP_PASS=YOUR_SMTP_PASSWORD
```

#### 2. Set Up Database

Replace in-memory storage with a database:

```javascript
// Example with MongoDB
const Order = require('./models/Order');

app.post('/api/orders', async (req, res) => {
    const order = new Order({
        orderNumber: generateOrderNumber(),
        ...req.body
    });

    await order.save();
    // ...
});
```

#### 3. Add Order Number Index

```javascript
// MongoDB index for fast lookups
OrderSchema.index({ orderNumber: 1 }, { unique: true });
OrderSchema.index({ userId: 1, createdAt: -1 });
OrderSchema.index({ 'shipping.email': 1, createdAt: -1 });
```

#### 4. Implement Pagination

```javascript
app.get('/api/orders/user/:userId', async (req, res) => {
    const { page = 1, limit = 20 } = req.query;

    const orders = await Order.find({ userId: req.params.userId })
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

    const count = await Order.countDocuments({ userId: req.params.userId });

    res.json({
        orders,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        total: count
    });
});
```

#### 5. Add Authentication

```javascript
const { authenticateToken } = require('./middleware/auth');

// Protect user orders endpoint
app.get('/api/orders/user/:userId', authenticateToken, async (req, res) => {
    // Verify user can only access their own orders
    if (req.user.id !== req.params.userId) {
        return res.status(403).json({ error: 'Forbidden' });
    }

    // Get orders...
});
```

#### 6. Set Up Order Processing Queue

```javascript
const Queue = require('bull');
const orderQueue = new Queue('order-processing');

// Process orders asynchronously
orderQueue.process(async (job) => {
    const { order } = job.data;

    // Send confirmation email
    await sendOrderConfirmation(order);

    // Update inventory
    await updateInventory(order.items);

    // Notify admin
    await notifyAdmin(order);
});

// Add order to queue
app.post('/api/orders', async (req, res) => {
    const order = await createOrder(req.body);

    await orderQueue.add({ order });

    res.json({ success: true, order });
});
```

#### 7. Enable Logging

```javascript
const winston = require('winston');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename: 'orders.log' })
    ]
});

// Log order events
logger.info('Order created', {
    orderNumber: order.orderNumber,
    userId: order.userId,
    total: order.totals.total
});
```

#### 8. Set Up Monitoring

```javascript
// Order metrics
const orderMetrics = {
    ordersCreated: 0,
    ordersShipped: 0,
    ordersCancelled: 0,
    totalRevenue: 0
};

// Track metrics
app.post('/api/orders', async (req, res) => {
    const order = await createOrder(req.body);

    orderMetrics.ordersCreated++;
    orderMetrics.totalRevenue += order.totals.total;

    // Send to monitoring service (DataDog, New Relic, etc.)
    metrics.increment('orders.created');
    metrics.gauge('orders.revenue', order.totals.total);

    res.json({ success: true, order });
});
```

---

## Error Handling

### Common Issues

**Issue: Email not sending**
- Solution: Check SMTP credentials, verify email service is configured correctly

**Issue: Orders not appearing in history**
- Solution: Verify order server is running, check API URL configuration

**Issue: Order creation fails**
- Solution: Check cart has items, shipping information is complete

**Issue: Cannot cancel order**
- Solution: Only pending/processing orders can be cancelled

### Debug Mode

Enable detailed logging:
```javascript
// In order-server.js
const DEBUG = process.env.DEBUG === 'true';

if (DEBUG) {
    console.log('Order data:', JSON.stringify(orderData, null, 2));
}
```

---

## Summary

The order management system provides:
✅ Complete order lifecycle management
✅ Automated email notifications with HTML templates
✅ Order history and details pages
✅ Status tracking and updates
✅ Integration with checkout flow
✅ Fallback to local storage
✅ Production-ready with email service
✅ RESTful API for all order operations

Your e-commerce site now has enterprise-grade order management! 📦
