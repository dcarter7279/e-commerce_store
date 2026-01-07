# Stripe Payment Flow Diagram

## Complete Payment Process Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         USER CHECKOUT FLOW                               │
└─────────────────────────────────────────────────────────────────────────┘

  1. User adds items to cart
     │
     ├─── cart.js: addToCart() → localStorage
     │
  2. User clicks "Proceed to Checkout"
     │
     ├─── Navigates to multi-step-checkout.html
     │
  3. STEP 1: Shipping Information
     │
     ├─── User fills: name, email, address, shipping method
     ├─── Validates: email format, ZIP code, required fields
     ├─── Saves: formData.shipping
     │
  4. STEP 2: Payment Information
     │
     ├─── Stripe Elements loads (stripe-payment.js)
     │    └─── Initializes card input field
     │    └─── Real-time validation
     │
     ├─── User enters card details
     │    └─── Card number, expiry, CVC
     │    └─── Stripe validates in real-time
     │
     ├─── User fills billing address
     │
  5. STEP 3: Review Order
     │
     ├─── Displays shipping, payment, and cart summary
     ├─── User can edit previous steps
     │
  6. User clicks "Place Order"
     │
     └─────────────────────────────────────────────────────────────┐
                                                                     │
┌────────────────────────────────────────────────────────────────────┘
│
│  PAYMENT PROCESSING FLOW
│
│  ┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│  │   Frontend      │         │   Your Server   │         │   Stripe API    │
│  │ (Browser/JS)    │         │  (Node.js)      │         │                 │
│  └────────┬────────┘         └────────┬────────┘         └────────┬────────┘
│           │                           │                           │
│  1        │  Calculate total          │                           │
│           │  amount from cart         │                           │
│           │                           │                           │
│  2        │  POST /create-payment-    │                           │
│           │  intent                   │                           │
│           │  {                        │                           │
│           │    amount: 12999,         │                           │
│           │    currency: 'usd'        │                           │
│           │  }                        │                           │
│           │                           │                           │
│           │ ─────────────────────────>│                           │
│           │                           │                           │
│  3        │                           │  Validate amount          │
│           │                           │  and currency             │
│           │                           │                           │
│  4        │                           │  stripe.paymentIntents    │
│           │                           │  .create({...})           │
│           │                           │                           │
│           │                           │ ─────────────────────────>│
│           │                           │                           │
│  5        │                           │                           │  Create
│           │                           │                           │  Payment
│           │                           │                           │  Intent
│           │                           │                           │
│           │                           │ <─────────────────────────│
│           │                           │  {                        │
│           │                           │    clientSecret: 'pi_...' │
│           │                           │  }                        │
│           │                           │                           │
│  6        │ <─────────────────────────│                           │
│           │  {                        │                           │
│           │    clientSecret: 'pi_...' │                           │
│           │  }                        │                           │
│           │                           │                           │
│  7        │  stripe.confirmCardPayment│                           │
│           │  (clientSecret, {         │                           │
│           │    payment_method: {      │                           │
│           │      card: cardElement,   │                           │
│           │      billing_details: {...│                           │
│           │    }                      │                           │
│           │  })                       │                           │
│           │                           │                           │
│           │ ───────────────────────────────────────────────────>│
│           │                           │                           │
│  8        │                           │                           │  Process
│           │                           │                           │  Payment
│           │                           │                           │  (charge
│           │                           │                           │   card)
│           │                           │                           │
│  9a       │ <───────────────────────────────────────────────────│
│  SUCCESS  │  {                        │                           │
│           │    paymentIntent: {       │                           │
│           │      id: 'pi_123',        │                           │
│           │      status: 'succeeded'  │                           │
│           │    }                      │                           │
│           │  }                        │                           │
│           │                           │                           │
│  10       │  Display success message  │                           │
│           │  Show order confirmation  │                           │
│           │  Clear shopping cart      │                           │
│           │  Save order to localStorage                          │
│           │                           │                           │
│           │                           │ <─────────────────────────│
│           │                           │  Webhook Event:           │
│           │                           │  payment_intent.succeeded │
│           │                           │                           │
│  11       │                           │  Send confirmation email  │
│           │                           │  Update database          │
│           │                           │  Fulfill order            │
│           │                           │                           │
│           │                           │                           │
│  9b       │ <───────────────────────────────────────────────────│
│  ERROR    │  {                        │                           │
│           │    error: {               │                           │
│           │      message: 'Card      │                           │
│           │       declined'           │                           │
│           │    }                      │                           │
│           │  }                        │                           │
│           │                           │                           │
│  10       │  Display error message    │                           │
│           │  Keep user on payment step│                           │
│           │  Allow retry              │                           │
│           │                           │                           │
└───────────┴───────────────────────────┴───────────────────────────┴──────────
```

## Data Flow Detail

### 1. Cart Data Structure
```javascript
cart = [
  {
    id: 1,
    name: "Premium Wireless Headphones",
    price: 99.99,
    quantity: 2,
    image: "..."
  }
]
```

### 2. Frontend Calculates Total
```javascript
subtotal = 199.98
tax = 15.99 (8%)
shipping = 10.00
total = 225.97
```

### 3. Payment Intent Request
```javascript
POST /create-payment-intent
{
  "amount": 22597,  // $225.97 in cents
  "currency": "usd",
  "metadata": {
    "email": "customer@example.com",
    "name": "John Doe"
  }
}
```

### 4. Backend Creates Payment Intent
```javascript
const paymentIntent = await stripe.paymentIntents.create({
  amount: 22597,
  currency: 'usd',
  automatic_payment_methods: { enabled: true }
});

// Returns: { clientSecret: 'pi_xxx_secret_yyy' }
```

### 5. Frontend Confirms Payment
```javascript
const {error, paymentIntent} = await stripe.confirmCardPayment(
  clientSecret,
  {
    payment_method: {
      card: cardElement,
      billing_details: {
        name: 'John Doe',
        email: 'customer@example.com',
        address: { ... }
      }
    }
  }
);
```

### 6. Stripe Processes Payment
- Validates card details
- Checks for fraud (Stripe Radar)
- Requests 3D Secure if needed
- Charges the card
- Returns result to frontend

### 7. Webhook Notification
```javascript
// Stripe sends webhook to your server
POST /webhook
{
  "type": "payment_intent.succeeded",
  "data": {
    "object": {
      "id": "pi_123",
      "amount": 22597,
      "status": "succeeded",
      "metadata": { ... }
    }
  }
}
```

## Security Layers

```
┌──────────────────────────────────────────────────────────────┐
│  SECURITY LAYERS IN STRIPE INTEGRATION                       │
└──────────────────────────────────────────────────────────────┘

1. PCI COMPLIANCE
   └─ Card data never touches your server
   └─ Stripe.js handles all sensitive data
   └─ Stripe is PCI DSS Level 1 certified

2. ENCRYPTION
   └─ All communication over HTTPS/TLS
   └─ Card data encrypted at rest
   └─ Tokenization of payment methods

3. AUTHENTICATION
   └─ API keys (publishable and secret)
   └─ Webhook signature verification
   └─ 3D Secure (SCA) support

4. FRAUD DETECTION
   └─ Stripe Radar (machine learning)
   └─ CVC verification
   └─ Address verification (AVS)
   └─ IP address checking

5. BACKEND VALIDATION
   └─ Amount verification on server
   └─ Currency validation
   └─ Idempotency keys for retries
   └─ Rate limiting

6. WEBHOOK SECURITY
   └─ Signature verification
   └─ Event validation
   └─ Replay attack prevention
```

## Error Handling Flow

```
User submits payment
       │
       ├─── Frontend validation fails?
       │    └─ Yes → Show error, don't send to Stripe
       │    └─ No  → Continue
       │
       ├─── Create Payment Intent fails?
       │    └─ Yes → Show server error
       │    └─ No  → Continue
       │
       ├─── Card validation fails? (Stripe.js)
       │    └─ Yes → Show card error
       │    └─ No  → Continue
       │
       ├─── Payment processing fails?
       │    └─ Yes → Show payment error
       │         ├─ Insufficient funds
       │         ├─ Card declined
       │         ├─ Expired card
       │         ├─ Network error
       │         └─ Other error
       │    └─ No  → Success!
       │
       └─── Show confirmation
            └─ Clear cart
            └─ Display order number
            └─ Send confirmation email (webhook)
```

## State Management

```
┌─────────────────────────────────────────────┐
│  Frontend State (multi-step-checkout.js)    │
├─────────────────────────────────────────────┤
│  currentStep: 1-4                           │
│  formData: {                                │
│    shipping: { ... },                       │
│    payment: { ... },                        │
│    shippingMethod: 'standard'               │
│  }                                          │
│  cart: [ ... ]                              │
│  totals: { subtotal, tax, shipping, total } │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  Stripe State (stripe-payment.js)           │
├─────────────────────────────────────────────┤
│  stripe: Stripe instance                    │
│  elements: Elements instance                │
│  cardElement: Card Element instance         │
│  cardMounted: boolean                       │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  Backend State (server.js)                  │
├─────────────────────────────────────────────┤
│  paymentIntent: Created intent              │
│  orders: Database of completed orders       │
│  webhookEvents: Log of Stripe events        │
└─────────────────────────────────────────────┘
```

---

This diagram shows the complete flow from cart to confirmation, including all security measures and error handling!
