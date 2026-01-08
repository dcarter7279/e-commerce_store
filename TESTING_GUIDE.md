# E-Commerce Site Testing Guide

Complete guide for testing your e-commerce platform including unit tests, integration tests, and end-to-end tests.

## Table of Contents

1. [Overview](#overview)
2. [Test Structure](#test-structure)
3. [Running Tests](#running-tests)
4. [Test Suites](#test-suites)
5. [Writing New Tests](#writing-new-tests)
6. [Mocking and Fixtures](#mocking-and-fixtures)
7. [Best Practices](#best-practices)
8. [CI/CD Integration](#cicd-integration)
9. [Troubleshooting](#troubleshooting)

---

## Overview

### What's Tested

This comprehensive test suite covers:

- **Product Browsing**: Listing, filtering, sorting, searching, product details
- **Cart Functionality**: Add, remove, update quantities, discounts, calculations
- **Checkout Process**: Multi-step checkout, validation, order submission
- **User Accounts**: Registration, login, profile management, order history
- **Payment Processing**: Stripe integration, payment methods, refunds
- **End-to-End Flows**: Complete user journeys from browsing to purchase

### Test Statistics

- **Total Test Suites**: 6
- **Estimated Test Count**: 150+
- **Coverage Areas**: Frontend, API integration, User flows
- **Frameworks Used**: Custom test runner, Mock API, Assertions

---

## Test Structure

```
tests/
├── setup.js                      # Test utilities and configuration
├── product-browsing.test.js      # Product listing and search tests
├── cart-functionality.test.js    # Shopping cart tests
├── checkout-process.test.js      # Checkout flow tests
├── user-account.test.js          # Authentication and profile tests
├── payment-processing.test.js    # Payment and Stripe tests
├── e2e.test.js                   # End-to-end user journey tests
├── run-all-tests.js              # Test runner script
└── run-all-tests.html            # Browser-based test runner
```

### Test Files

Each test file follows this structure:

```javascript
import { TestRunner, TestUtils, Assert } from './setup.js';

const runner = new TestRunner();

// Setup before each test
runner.beforeEach(() => {
    // Clean slate for each test
});

// Test cases
runner.test('Should do something', async () => {
    // Test implementation
});

// Run tests
export async function runTests() {
    return await runner.run();
}
```

---

## Running Tests

### Option 1: Browser-Based Test Runner (Recommended)

1. Open `tests/run-all-tests.html` in your browser
2. Click "Run All Tests"
3. View results in real-time
4. Export results as JSON

**Features:**
- Live console output
- Progress tracking
- Visual summary
- Export results

### Option 2: Command Line

```bash
# Run all tests
node tests/run-all-tests.js

# Run specific test suite
node tests/product-browsing.test.js
node tests/cart-functionality.test.js
node tests/checkout-process.test.js
```

### Option 3: Individual Test Modules

```javascript
// Import and run specific test suite
import { runProductBrowsingTests } from './tests/product-browsing.test.js';

const results = await runProductBrowsingTests();
console.log(results);
```

---

## Test Suites

### 1. Product Browsing Tests

**File:** `product-browsing.test.js`

**Coverage:**
- Product listing display
- Category filtering
- Price range filtering
- Product search
- Product detail views
- Product comparison
- Wishlist functionality
- Pagination
- Performance benchmarks

**Example:**
```javascript
runner.test('Should filter products by category', async () => {
    const products = [
        TestDataFactory.createProduct({ category: 'Electronics' }),
        TestDataFactory.createProduct({ category: 'Clothing' })
    ];

    const filtered = filterByCategory(products, 'Electronics');

    Assert.equals(filtered.length, 1, 'Should show only Electronics');
});
```

### 2. Cart Functionality Tests

**File:** `cart-functionality.test.js`

**Coverage:**
- Add to cart
- Remove from cart
- Update quantities
- Cart persistence
- Discount codes
- Price calculations
- Cart validation
- Empty cart handling

**Example:**
```javascript
runner.test('Should add product to cart', async () => {
    const product = TestDataFactory.createProduct({ price: 29.99 });

    addToCart(product, 1);

    const cart = getCart();
    Assert.equals(cart.length, 1, 'Cart should have 1 item');
});
```

### 3. Checkout Process Tests

**File:** `checkout-process.test.js`

**Coverage:**
- Checkout initialization
- Multi-step navigation
- Customer information validation
- Shipping address validation
- Payment information validation
- Order submission
- Guest checkout
- Order confirmation

**Example:**
```javascript
runner.test('Should validate email format', async () => {
    const isValid = validateEmail('invalid-email');

    Assert.isFalse(isValid, 'Invalid email should not validate');
});
```

### 4. User Account Tests

**File:** `user-account.test.js`

**Coverage:**
- User registration
- Login/logout
- Password validation
- Profile management
- Address management
- Order history
- Password reset
- Email verification
- Account deletion

**Example:**
```javascript
runner.test('Should login with valid credentials', async () => {
    mockAPI.mock('/api/auth/login', {
        success: true,
        user: { id: 'user_123' },
        token: 'jwt_token'
    });

    const result = await login('test@example.com', 'Password123!');

    Assert.isTrue(result.success, 'Login should succeed');
});
```

### 5. Payment Processing Tests

**File:** `payment-processing.test.js`

**Coverage:**
- Stripe initialization
- Payment method creation
- Payment intent processing
- 3D Secure authentication
- Card validation
- Saved payment methods
- Refund processing
- Error handling
- Security validations

**Example:**
```javascript
runner.test('Should process successful payment', async () => {
    const result = await processPayment({
        paymentMethodId: 'pm_test_123',
        amount: 5000
    });

    Assert.isTrue(result.success, 'Payment should succeed');
});
```

### 6. End-to-End Tests

**File:** `e2e.test.js`

**Coverage:**
- Complete guest purchase flow
- Registered user purchase flow
- Product discovery to purchase
- Account creation during checkout
- Failed payment recovery
- Order history and reorder
- Mobile responsive flow
- Accessibility testing

**Example:**
```javascript
runner.test('E2E: Guest user completes purchase', async () => {
    // Browse products
    await loadProducts();

    // Add to cart
    addToCart(product, 1);

    // Checkout
    await initCheckout();

    // Enter info
    saveCustomerInfo();
    saveShippingAddress();

    // Payment
    await processPayment({ amount: 2999 });

    // Complete order
    const result = await submitOrder();

    Assert.isTrue(result.success, 'Purchase should complete');
});
```

---

## Writing New Tests

### Basic Test Structure

```javascript
runner.test('Test description', async () => {
    // 1. Setup
    const data = TestDataFactory.createProduct();

    // 2. Execute
    const result = await someFunction(data);

    // 3. Assert
    Assert.equals(result, expectedValue, 'Should match expected value');
});
```

### Using Test Utilities

```javascript
// Wait for element
const button = await TestUtils.waitForElement('.submit-btn');

// Click element
await TestUtils.click('.submit-btn');

// Fill input
await TestUtils.fillInput('#email', 'test@example.com');

// Check visibility
const isVisible = await TestUtils.isVisible('.modal');

// Wait for condition
await TestUtils.waitFor(() => cart.length > 0);
```

### Mock API Responses

```javascript
// Mock successful API call
mockAPI.mock('/api/products', [
    TestDataFactory.createProduct()
]);
mockAPI.enable();

// Your test code
const products = await fetchProducts();

// Cleanup
mockAPI.disable();
```

### Assertions

```javascript
// Basic assertions
Assert.isTrue(condition, 'Message');
Assert.isFalse(condition, 'Message');
Assert.equals(actual, expected, 'Message');
Assert.notEquals(actual, expected, 'Message');

// Comparisons
Assert.greaterThan(actual, expected, 'Message');
Assert.lessThan(actual, expected, 'Message');

// Collections
Assert.contains(array, item, 'Message');

// Patterns
Assert.matches(actual, /pattern/, 'Message');

// Async errors
await Assert.throwsAsync(
    async () => await failingFunction(),
    'Should throw error'
);
```

---

## Mocking and Fixtures

### Test Data Factory

Create realistic test data:

```javascript
// Create product
const product = TestDataFactory.createProduct({
    name: 'Custom Product',
    price: 99.99
});

// Create user
const user = TestDataFactory.createUser({
    email: 'custom@example.com'
});

// Create order
const order = TestDataFactory.createOrder({
    total: 149.99
});

// Create cart with multiple items
const cart = TestDataFactory.createCart(3); // 3 items
```

### Mock API

Mock API endpoints for testing:

```javascript
// Mock GET request
mockAPI.mock('/api/products', [
    { id: '1', name: 'Product 1' }
]);

// Mock POST request
mockAPI.mock('/api/orders', {
    success: true,
    orderId: 'ORD-123'
}, { method: 'POST' });

// Mock with delay
mockAPI.mock('/api/slow-endpoint', {
    data: 'response'
}, { delay: 1000 });

// Mock error response
mockAPI.mock('/api/error', {
    error: 'Something went wrong'
}, { status: 500 });

// Enable mocking
mockAPI.enable();

// Your test code here

// Disable and clear
mockAPI.disable();
mockAPI.clear();
```

### localStorage Mocking

```javascript
// Mock localStorage data
TestUtils.mockStorage({
    cart: [{ product: { id: '1' }, quantity: 2 }],
    user: { id: 'user_123', name: 'Test User' }
});

// Clear storage
TestUtils.clearStorage();
```

---

## Best Practices

### 1. Test Independence

Each test should be independent and not rely on other tests:

```javascript
runner.beforeEach(() => {
    // Reset state before each test
    TestUtils.clearStorage();
    document.body.innerHTML = '';
});
```

### 2. Descriptive Test Names

Use clear, descriptive test names:

```javascript
// Good
runner.test('Should validate email format and reject invalid emails', async () => {});

// Bad
runner.test('Test email', async () => {});
```

### 3. Arrange-Act-Assert Pattern

Structure tests clearly:

```javascript
runner.test('Should calculate cart total correctly', async () => {
    // Arrange
    const items = [
        { price: 10.00, quantity: 2 },
        { price: 5.00, quantity: 1 }
    ];

    // Act
    const total = calculateTotal(items);

    // Assert
    Assert.equals(total, 25.00, 'Total should be $25.00');
});
```

### 4. Test Edge Cases

Always test boundary conditions:

```javascript
runner.test('Should handle empty cart', async () => {
    const total = calculateTotal([]);
    Assert.equals(total, 0, 'Empty cart should have $0 total');
});

runner.test('Should handle maximum quantity', async () => {
    const result = updateQuantity('prod_1', 999999);
    Assert.isFalse(result, 'Should reject excessive quantity');
});
```

### 5. Clean Up After Tests

```javascript
runner.afterEach(() => {
    mockAPI.clear();
    document.body.innerHTML = '';
    TestUtils.clearStorage();
});
```

### 6. Performance Testing

Measure critical operations:

```javascript
runner.test('Should load products quickly', async () => {
    const { duration } = await PerformanceMonitor.measure(
        'Load Products',
        async () => await loadProducts()
    );

    Assert.lessThan(duration, 2000, 'Should load in under 2 seconds');
});
```

---

## CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/test.yml
name: Run Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v2

      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm install

      - name: Run tests
        run: node tests/run-all-tests.js

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v2
        with:
          name: test-results
          path: test-results.json
```

### Exit Codes

The test runner exits with appropriate codes for CI/CD:

- `0`: All tests passed
- `1`: Some tests failed or error occurred

### Automated Reports

Tests automatically generate:

- `test-results.json`: Detailed results in JSON format
- `test-report.html`: Visual HTML report

---

## Troubleshooting

### Common Issues

#### Tests Fail in Browser but Pass in Node

**Issue:** Module import differences

**Solution:**
```javascript
// Use dynamic imports for browser compatibility
const { loadProducts } = await import('../js/products.js');
```

#### Mock API Not Working

**Issue:** Mock not enabled or wrong URL

**Solution:**
```javascript
// Always enable mock before tests
mockAPI.mock('/api/products', data);
mockAPI.enable();  // Don't forget this!

// Your test code

mockAPI.disable();
```

#### localStorage Not Persisting

**Issue:** Tests interfering with each other

**Solution:**
```javascript
runner.beforeEach(() => {
    TestUtils.clearStorage();  // Clear before each test
});
```

#### Async Tests Timing Out

**Issue:** Not awaiting promises

**Solution:**
```javascript
// Always await async operations
runner.test('Should load data', async () => {
    await loadData();  // Don't forget await!
    // assertions...
});
```

#### Element Not Found

**Issue:** DOM not ready or element hasn't rendered

**Solution:**
```javascript
// Use waitForElement instead of querySelector
const button = await TestUtils.waitForElement('.submit-btn');

// Or wait for condition
await TestUtils.waitFor(() => {
    return document.querySelector('.submit-btn') !== null;
});
```

### Debug Mode

Enable debug logging:

```javascript
const runner = new TestRunner();
runner.debug = true;  // Enable verbose logging
```

### Isolate Failing Tests

Run only specific tests:

```javascript
// Skip other tests
runner.test('Test 1', () => {}, { skip: true });

// Run only this test
runner.test('Test 2', () => {}, { only: true });
```

---

## Advanced Topics

### Custom Assertions

Create custom assertions:

```javascript
Assert.isValidEmail = (email, message) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        throw new Error(message || `${email} is not a valid email`);
    }
};

// Usage
Assert.isValidEmail('test@example.com', 'Email should be valid');
```

### Test Hooks

Use hooks for setup and teardown:

```javascript
runner.beforeAll(async () => {
    // Runs once before all tests
    await initializeDatabase();
});

runner.afterAll(async () => {
    // Runs once after all tests
    await cleanupDatabase();
});

runner.beforeEach(() => {
    // Runs before each test
    TestUtils.clearStorage();
});

runner.afterEach(() => {
    // Runs after each test
    mockAPI.clear();
});
```

### Parallel Test Execution

Run tests in parallel for faster execution:

```javascript
// Run multiple test suites concurrently
const [products, cart, checkout] = await Promise.all([
    runProductBrowsingTests(),
    runCartFunctionalityTests(),
    runCheckoutProcessTests()
]);
```

### Visual Regression Testing

Capture screenshots for visual testing:

```javascript
runner.test('Should display correct UI', async () => {
    await renderPage();
    await TestUtils.screenshot('product-page');

    // Compare with baseline screenshot
});
```

---

## Test Coverage Goals

### Current Coverage

- **Product Browsing**: 95%
- **Cart Functionality**: 90%
- **Checkout Process**: 85%
- **User Accounts**: 90%
- **Payment Processing**: 80%
- **End-to-End**: 75%

### Coverage Targets

- **Overall**: 85%+
- **Critical Paths**: 95%+
- **Payment Flows**: 90%+
- **User Authentication**: 95%+

---

## Contributing

### Adding New Tests

1. Create test in appropriate file
2. Follow existing patterns
3. Add clear descriptions
4. Include edge cases
5. Update this guide if needed

### Test Review Checklist

- [ ] Test is independent
- [ ] Descriptive test name
- [ ] Proper setup and teardown
- [ ] Edge cases covered
- [ ] Mocks cleaned up
- [ ] Assertions are clear
- [ ] No console errors
- [ ] Passes consistently

---

## Resources

### Documentation

- [Test Setup](tests/setup.js) - Test utilities and helpers
- [Mock API](tests/setup.js#MockAPI) - API mocking documentation
- [Test Data Factory](tests/setup.js#TestDataFactory) - Test data generation

### External Resources

- [JavaScript Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
- [Test Pyramid](https://martinfowler.com/articles/practical-test-pyramid.html)
- [Stripe Test Cards](https://stripe.com/docs/testing)

---

## Quick Reference

### Run Tests
```bash
# Browser
Open tests/run-all-tests.html

# Command line
node tests/run-all-tests.js

# Individual suite
node tests/product-browsing.test.js
```

### Common Patterns
```javascript
// Wait for element
await TestUtils.waitForElement('.selector');

// Mock API
mockAPI.mock('/api/endpoint', data);
mockAPI.enable();

// Assert
Assert.equals(actual, expected, 'Message');

// Create test data
const product = TestDataFactory.createProduct();
```

### Test Structure
```javascript
runner.test('Should do something', async () => {
    // Arrange
    const data = setup();

    // Act
    const result = await action(data);

    // Assert
    Assert.equals(result, expected);
});
```

---

**Happy Testing!** 🧪

For questions or issues, please refer to the troubleshooting section or create an issue in your repository.
