// Simple Express Server for Stripe Payment Integration
// This is a basic backend server to handle Stripe payments

// PREREQUISITES:
// 1. Install dependencies: npm install express stripe cors dotenv
// 2. Create .env file with your Stripe secret key
// 3. Run server: node server.js

const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_YOUR_SECRET_KEY_HERE');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors()); // Allow cross-origin requests
app.use(express.json()); // Parse JSON bodies

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        stripe: process.env.STRIPE_SECRET_KEY ? 'configured' : 'not configured'
    });
});

// Create Payment Intent endpoint
app.post('/create-payment-intent', async (req, res) => {
    try {
        const { amount, currency, metadata } = req.body;

        // Validation
        if (!amount || amount <= 0) {
            return res.status(400).json({
                error: 'Invalid amount. Amount must be greater than 0.'
            });
        }

        // Ensure amount is an integer (Stripe requires cents)
        const amountInCents = Math.round(amount);

        if (amountInCents < 50) { // Stripe minimum is $0.50
            return res.status(400).json({
                error: 'Amount must be at least $0.50 USD'
            });
        }

        console.log(`Creating payment intent for ${amountInCents / 100} ${currency || 'USD'}`);

        // Create a PaymentIntent with the order amount and currency
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amountInCents,
            currency: currency || 'usd',
            automatic_payment_methods: {
                enabled: true,
            },
            // Add metadata for tracking
            metadata: {
                ...metadata,
                created_at: new Date().toISOString()
            },
            // Optional: Add description
            description: 'E-Commerce Order Payment'
        });

        // Log successful creation
        console.log(`✅ Payment Intent created: ${paymentIntent.id}`);

        // Send publishable key and PaymentIntent details to client
        res.json({
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id
        });

    } catch (error) {
        console.error('❌ Error creating payment intent:', error);

        // Send error to client
        res.status(500).json({
            error: error.message || 'Failed to create payment intent'
        });
    }
});

// Webhook endpoint to handle Stripe events
app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
        // Verify webhook signature
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
        console.error('⚠️  Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
        case 'payment_intent.succeeded':
            const paymentIntent = event.data.object;
            console.log('💰 PaymentIntent succeeded:', paymentIntent.id);

            // TODO: Fulfill the order
            // - Update order status in database
            // - Send confirmation email
            // - Update inventory
            // - Trigger shipping process

            await handleSuccessfulPayment(paymentIntent);
            break;

        case 'payment_intent.payment_failed':
            const failedPayment = event.data.object;
            console.log('❌ PaymentIntent failed:', failedPayment.id);

            // TODO: Handle failed payment
            // - Notify customer
            // - Log the error
            // - Update order status

            await handleFailedPayment(failedPayment);
            break;

        case 'charge.succeeded':
            const charge = event.data.object;
            console.log('✅ Charge succeeded:', charge.id);
            break;

        case 'charge.failed':
            const failedCharge = event.data.object;
            console.log('❌ Charge failed:', failedCharge.id);
            break;

        default:
            console.log(`ℹ️  Unhandled event type: ${event.type}`);
    }

    // Return a 200 response to acknowledge receipt of the event
    res.json({ received: true });
});

// Handle successful payment
async function handleSuccessfulPayment(paymentIntent) {
    // Example implementation
    console.log('Processing successful payment...');
    console.log('Amount:', paymentIntent.amount / 100, paymentIntent.currency.toUpperCase());
    console.log('Customer:', paymentIntent.metadata?.email || 'N/A');

    // In a real application, you would:
    // 1. Update your database
    // 2. Send confirmation email
    // 3. Update inventory
    // 4. Create shipping label
    // 5. Send notification to admin

    // Example: Save to database
    /*
    await db.orders.update({
        paymentIntentId: paymentIntent.id
    }, {
        status: 'paid',
        paidAt: new Date(),
        amount: paymentIntent.amount / 100
    });
    */
}

// Handle failed payment
async function handleFailedPayment(paymentIntent) {
    console.log('Processing failed payment...');
    console.log('Reason:', paymentIntent.last_payment_error?.message || 'Unknown');

    // In a real application, you would:
    // 1. Update order status to 'payment_failed'
    // 2. Send notification email to customer
    // 3. Log the error for analysis
    // 4. Potentially retry or request alternative payment

    // Example: Update database
    /*
    await db.orders.update({
        paymentIntentId: paymentIntent.id
    }, {
        status: 'payment_failed',
        failureReason: paymentIntent.last_payment_error?.message
    });
    */
}

// Refund endpoint (optional)
app.post('/refund', async (req, res) => {
    try {
        const { paymentIntentId, amount, reason } = req.body;

        if (!paymentIntentId) {
            return res.status(400).json({ error: 'Payment Intent ID required' });
        }

        // Create refund
        const refund = await stripe.refunds.create({
            payment_intent: paymentIntentId,
            amount: amount, // Optional: partial refund amount in cents
            reason: reason || 'requested_by_customer'
        });

        console.log('💸 Refund created:', refund.id);

        res.json({
            success: true,
            refund: refund
        });

    } catch (error) {
        console.error('Error creating refund:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get payment details (optional)
app.get('/payment/:id', async (req, res) => {
    try {
        const paymentIntent = await stripe.paymentIntents.retrieve(req.params.id);

        res.json({
            id: paymentIntent.id,
            amount: paymentIntent.amount / 100,
            currency: paymentIntent.currency,
            status: paymentIntent.status,
            created: new Date(paymentIntent.created * 1000).toISOString()
        });

    } catch (error) {
        console.error('Error retrieving payment:', error);
        res.status(500).json({ error: error.message });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: err.message
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not found',
        path: req.path
    });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log('\n🚀 Server started successfully!');
    console.log(`📡 Listening on port ${PORT}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    console.log(`💳 Payment endpoint: http://localhost:${PORT}/create-payment-intent`);
    console.log(`🪝 Webhook endpoint: http://localhost:${PORT}/webhook`);

    // Configuration warnings
    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === 'sk_test_YOUR_SECRET_KEY_HERE') {
        console.log('\n⚠️  WARNING: Stripe secret key not configured!');
        console.log('Create a .env file with: STRIPE_SECRET_KEY=sk_test_your_key_here');
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
        console.log('\n⚠️  WARNING: Webhook secret not configured!');
        console.log('Set STRIPE_WEBHOOK_SECRET in .env for webhook verification');
    }

    console.log('\n✅ Server is ready to accept payments!\n');
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
    });
});
