# Quick Setup Instructions for Stripe Integration

Follow these steps to get Stripe payments working in your e-commerce site.

## Step 1: Get Your Stripe API Keys

1. Sign up for a Stripe account at [https://stripe.com](https://stripe.com)
2. Go to the Stripe Dashboard: [https://dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys)
3. Copy your keys:
   - **Publishable key** (starts with `pk_test_`)
   - **Secret key** (starts with `sk_test_`)

## Step 2: Configure Frontend

1. Open `js/stripe-payment.js`
2. Replace `pk_test_YOUR_PUBLISHABLE_KEY_HERE` with your actual publishable key:

```javascript
const STRIPE_PUBLISHABLE_KEY = 'pk_test_51abc123...'; // Your key here
```

## Step 3: Setup Backend

### Install Dependencies

```bash
cd "c:\Users\dcarter1\OneDrive - E & J Gallo Winery\Desktop\e-commerce_site"
npm install
```

### Configure Environment

1. Copy `.env.example` to `.env`:
```bash
copy .env.example .env
```

2. Edit `.env` and add your Stripe secret key:
```
STRIPE_SECRET_KEY=sk_test_51abc123...
```

### Start the Server

```bash
npm start
```

The server will start at `http://localhost:3000`

## Step 4: Update Frontend URL

In `js/stripe-payment.js`, update the backend URL:

```javascript
const backendUrl = 'http://localhost:3000/create-payment-intent';
```

## Step 5: Test the Integration

### Use Stripe Test Cards

When testing, use these card numbers:

**Success:**
- Card: `4242 4242 4242 4242`
- Expiry: Any future date (e.g., `12/34`)
- CVC: Any 3 digits (e.g., `123`)
- ZIP: Any 5 digits (e.g., `12345`)

**Declined:**
- Card: `4000 0000 0000 9995`

**Requires Authentication (3D Secure):**
- Card: `4000 0025 0000 3155`

### Test Flow

1. Open `index.html` in your browser
2. Add items to cart
3. Go to checkout
4. Fill in shipping information
5. Fill in payment details using test card
6. Complete the order
7. Check the server console for payment confirmation

## Step 6: Setup Webhooks (Optional but Recommended)

### For Local Testing

1. Install Stripe CLI: [https://stripe.com/docs/stripe-cli](https://stripe.com/docs/stripe-cli)

2. Login to Stripe CLI:
```bash
stripe login
```

3. Forward webhooks to your local server:
```bash
stripe listen --forward-to localhost:3000/webhook
```

4. Copy the webhook signing secret (starts with `whsec_`) and add to `.env`:
```
STRIPE_WEBHOOK_SECRET=whsec_abc123...
```

### For Production

1. Go to [https://dashboard.stripe.com/webhooks](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. Enter your URL: `https://yourdomain.com/webhook`
4. Select events to listen for:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.succeeded`
   - `charge.failed`
5. Copy the signing secret and add to your production `.env`

## Step 7: Update Multi-Step Checkout

The multi-step checkout needs to be updated to use Stripe. Add this to `multi-step-checkout.html`:

```html
<!-- Add before closing </body> tag -->
<script src="https://js.stripe.com/v3/"></script>
<script type="module">
    import { initializeStripeElements } from './js/stripe-payment.js';

    // Initialize Stripe when page loads
    document.addEventListener('DOMContentLoaded', () => {
        initializeStripeElements();
    });
</script>
```

## Troubleshooting

### "Stripe is not defined"

Make sure you've included the Stripe.js script:
```html
<script src="https://js.stripe.com/v3/"></script>
```

### "Failed to create payment intent"

1. Check that your server is running (`npm start`)
2. Verify the backend URL in `stripe-payment.js`
3. Check browser console for CORS errors
4. Verify your Stripe secret key in `.env`

### CORS Errors

Make sure your server has CORS enabled (already configured in `server.js`):
```javascript
app.use(cors());
```

### Webhook Signature Verification Failed

1. Make sure you're using the correct webhook secret
2. For local testing, use Stripe CLI
3. Check that the endpoint is receiving raw body data

## Going to Production

Before going live:

1. **Get Live API Keys:**
   - Replace test keys (`pk_test_`, `sk_test_`) with live keys (`pk_live_`, `sk_live_`)

2. **Enable HTTPS:**
   - Stripe requires HTTPS in production
   - Use a service like Let's Encrypt for free SSL

3. **Update Environment:**
   ```
   NODE_ENV=production
   STRIPE_SECRET_KEY=sk_live_your_live_key
   ```

4. **Setup Production Webhooks:**
   - Configure webhook endpoints in Stripe Dashboard
   - Use your production domain

5. **Test with Small Amounts:**
   - Do test transactions with real cards using small amounts
   - Verify order fulfillment works correctly

6. **Enable Stripe Radar:**
   - Enable fraud detection in Stripe Dashboard
   - Configure rules for suspicious transactions

## Security Checklist

- [ ] Never commit `.env` file to git (already in `.gitignore`)
- [ ] Never expose secret key in frontend code
- [ ] Always validate amounts on backend
- [ ] Use HTTPS in production
- [ ] Verify webhook signatures
- [ ] Implement rate limiting on payment endpoints
- [ ] Log all payment attempts for auditing
- [ ] Set up monitoring and alerts

## Support Resources

- **Stripe Documentation:** [https://stripe.com/docs](https://stripe.com/docs)
- **API Reference:** [https://stripe.com/docs/api](https://stripe.com/docs/api)
- **Testing Guide:** [https://stripe.com/docs/testing](https://stripe.com/docs/testing)
- **Stripe Support:** [https://support.stripe.com](https://support.stripe.com)

## Need Help?

1. Check the comprehensive guide: `STRIPE_INTEGRATION_GUIDE.md`
2. Review Stripe's official documentation
3. Check browser console for errors
4. Check server logs for backend errors
5. Test with Stripe CLI for webhook issues

---

**You're all set!** Your e-commerce site can now securely accept payments through Stripe. 🎉
