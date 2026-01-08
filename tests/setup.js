// Test Setup and Configuration
// Provides utilities and helpers for all tests

/**
 * Test Configuration
 */
export const TEST_CONFIG = {
    baseUrl: 'http://localhost:3000',
    timeout: 5000,

    // Test user credentials
    testUsers: {
        regular: {
            email: 'test@example.com',
            password: 'Test123!@#',
            name: 'Test User'
        },
        admin: {
            email: 'admin@example.com',
            password: 'Admin123!@#',
            name: 'Admin User'
        }
    },

    // Test payment details (use Stripe test cards)
    testPayment: {
        success: {
            cardNumber: '4242424242424242',
            expiry: '12/25',
            cvc: '123',
            zip: '12345'
        },
        decline: {
            cardNumber: '4000000000000002',
            expiry: '12/25',
            cvc: '123',
            zip: '12345'
        },
        requiresAuth: {
            cardNumber: '4000002500003155',
            expiry: '12/25',
            cvc: '123',
            zip: '12345'
        }
    },

    // Test products
    testProducts: {
        product1: {
            id: 'prod_test_001',
            name: 'Test Product 1',
            price: 29.99,
            category: 'Electronics'
        },
        product2: {
            id: 'prod_test_002',
            name: 'Test Product 2',
            price: 49.99,
            category: 'Clothing'
        }
    }
};

/**
 * Test Utilities
 */
export class TestUtils {
    /**
     * Wait for element to be present
     */
    static async waitForElement(selector, timeout = TEST_CONFIG.timeout) {
        const startTime = Date.now();

        while (Date.now() - startTime < timeout) {
            const element = document.querySelector(selector);
            if (element) return element;
            await this.wait(100);
        }

        throw new Error(`Element ${selector} not found within ${timeout}ms`);
    }

    /**
     * Wait for elements to be present
     */
    static async waitForElements(selector, timeout = TEST_CONFIG.timeout) {
        const startTime = Date.now();

        while (Date.now() - startTime < timeout) {
            const elements = document.querySelectorAll(selector);
            if (elements.length > 0) return Array.from(elements);
            await this.wait(100);
        }

        throw new Error(`Elements ${selector} not found within ${timeout}ms`);
    }

    /**
     * Wait for condition to be true
     */
    static async waitFor(condition, timeout = TEST_CONFIG.timeout) {
        const startTime = Date.now();

        while (Date.now() - startTime < timeout) {
            if (await condition()) return true;
            await this.wait(100);
        }

        throw new Error(`Condition not met within ${timeout}ms`);
    }

    /**
     * Wait for specified time
     */
    static wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Click element
     */
    static async click(selector) {
        const element = await this.waitForElement(selector);
        element.click();
        await this.wait(100);
    }

    /**
     * Fill input field
     */
    static async fillInput(selector, value) {
        const input = await this.waitForElement(selector);
        input.value = value;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        await this.wait(50);
    }

    /**
     * Select option from dropdown
     */
    static async selectOption(selector, value) {
        const select = await this.waitForElement(selector);
        select.value = value;
        select.dispatchEvent(new Event('change', { bubbles: true }));
        await this.wait(50);
    }

    /**
     * Get element text
     */
    static async getText(selector) {
        const element = await this.waitForElement(selector);
        return element.textContent.trim();
    }

    /**
     * Check if element is visible
     */
    static async isVisible(selector) {
        try {
            const element = await this.waitForElement(selector, 1000);
            const style = window.getComputedStyle(element);
            return style.display !== 'none' && style.visibility !== 'hidden' && element.offsetParent !== null;
        } catch {
            return false;
        }
    }

    /**
     * Check if element exists
     */
    static exists(selector) {
        return document.querySelector(selector) !== null;
    }

    /**
     * Clear localStorage
     */
    static clearStorage() {
        localStorage.clear();
        sessionStorage.clear();
    }

    /**
     * Mock localStorage data
     */
    static mockStorage(data) {
        Object.entries(data).forEach(([key, value]) => {
            localStorage.setItem(key, JSON.stringify(value));
        });
    }

    /**
     * Generate random email
     */
    static randomEmail() {
        return `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@example.com`;
    }

    /**
     * Generate random string
     */
    static randomString(length = 10) {
        return Math.random().toString(36).substr(2, length);
    }

    /**
     * Simulate file upload
     */
    static async uploadFile(selector, file) {
        const input = await this.waitForElement(selector);

        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        input.files = dataTransfer.files;

        input.dispatchEvent(new Event('change', { bubbles: true }));
        await this.wait(100);
    }

    /**
     * Take screenshot (for debugging)
     */
    static async screenshot(name) {
        if (typeof html2canvas !== 'undefined') {
            const canvas = await html2canvas(document.body);
            const link = document.createElement('a');
            link.download = `${name}-${Date.now()}.png`;
            link.href = canvas.toDataURL();
            link.click();
        }
    }

    /**
     * Log test step
     */
    static log(message, level = 'info') {
        const timestamp = new Date().toISOString();
        const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
        console.log(`${prefix} ${message}`);
    }
}

/**
 * Assertion helpers
 */
export class Assert {
    static isTrue(condition, message = 'Expected condition to be true') {
        if (!condition) {
            throw new Error(message);
        }
    }

    static isFalse(condition, message = 'Expected condition to be false') {
        if (condition) {
            throw new Error(message);
        }
    }

    static equals(actual, expected, message) {
        if (actual !== expected) {
            throw new Error(message || `Expected ${expected}, got ${actual}`);
        }
    }

    static notEquals(actual, expected, message) {
        if (actual === expected) {
            throw new Error(message || `Expected not ${expected}, got ${actual}`);
        }
    }

    static contains(array, item, message) {
        if (!array.includes(item)) {
            throw new Error(message || `Expected array to contain ${item}`);
        }
    }

    static greaterThan(actual, expected, message) {
        if (actual <= expected) {
            throw new Error(message || `Expected ${actual} to be greater than ${expected}`);
        }
    }

    static lessThan(actual, expected, message) {
        if (actual >= expected) {
            throw new Error(message || `Expected ${actual} to be less than ${expected}`);
        }
    }

    static throws(fn, message = 'Expected function to throw') {
        try {
            fn();
            throw new Error(message);
        } catch (error) {
            // Expected
        }
    }

    static async throwsAsync(fn, message = 'Expected async function to throw') {
        try {
            await fn();
            throw new Error(message);
        } catch (error) {
            // Expected
        }
    }

    static matches(actual, pattern, message) {
        if (!pattern.test(actual)) {
            throw new Error(message || `Expected ${actual} to match ${pattern}`);
        }
    }
}

/**
 * Test Runner
 */
export class TestRunner {
    constructor() {
        this.tests = [];
        this.beforeEachHooks = [];
        this.afterEachHooks = [];
        this.beforeAllHooks = [];
        this.afterAllHooks = [];
        this.results = {
            passed: 0,
            failed: 0,
            skipped: 0,
            total: 0,
            duration: 0,
            tests: []
        };
    }

    /**
     * Register a test
     */
    test(name, fn, options = {}) {
        this.tests.push({
            name,
            fn,
            skip: options.skip || false,
            only: options.only || false
        });
    }

    /**
     * Register before each hook
     */
    beforeEach(fn) {
        this.beforeEachHooks.push(fn);
    }

    /**
     * Register after each hook
     */
    afterEach(fn) {
        this.afterEachHooks.push(fn);
    }

    /**
     * Register before all hook
     */
    beforeAll(fn) {
        this.beforeAllHooks.push(fn);
    }

    /**
     * Register after all hook
     */
    afterAll(fn) {
        this.afterAllHooks.push(fn);
    }

    /**
     * Run all tests
     */
    async run() {
        const startTime = Date.now();

        console.log('\n🧪 Starting test suite...\n');

        // Run before all hooks
        for (const hook of this.beforeAllHooks) {
            await hook();
        }

        // Filter tests
        const hasOnly = this.tests.some(t => t.only);
        const testsToRun = hasOnly
            ? this.tests.filter(t => t.only)
            : this.tests.filter(t => !t.skip);

        this.results.total = testsToRun.length;

        // Run tests
        for (const test of testsToRun) {
            await this.runTest(test);
        }

        // Run after all hooks
        for (const hook of this.afterAllHooks) {
            await hook();
        }

        this.results.duration = Date.now() - startTime;

        // Print results
        this.printResults();

        return this.results;
    }

    /**
     * Run a single test
     */
    async runTest(test) {
        const testResult = {
            name: test.name,
            status: 'pending',
            duration: 0,
            error: null
        };

        const startTime = Date.now();

        try {
            // Run before each hooks
            for (const hook of this.beforeEachHooks) {
                await hook();
            }

            // Run test
            TestUtils.log(`Running: ${test.name}`);
            await test.fn();

            // Run after each hooks
            for (const hook of this.afterEachHooks) {
                await hook();
            }

            testResult.status = 'passed';
            testResult.duration = Date.now() - startTime;
            this.results.passed++;

            console.log(`✅ ${test.name} (${testResult.duration}ms)`);
        } catch (error) {
            testResult.status = 'failed';
            testResult.duration = Date.now() - startTime;
            testResult.error = error.message;
            this.results.failed++;

            console.error(`❌ ${test.name} (${testResult.duration}ms)`);
            console.error(`   Error: ${error.message}`);
            console.error(`   Stack: ${error.stack}`);
        }

        this.results.tests.push(testResult);
    }

    /**
     * Print test results
     */
    printResults() {
        console.log('\n📊 Test Results:\n');
        console.log(`Total: ${this.results.total}`);
        console.log(`✅ Passed: ${this.results.passed}`);
        console.log(`❌ Failed: ${this.results.failed}`);
        console.log(`⏭️  Skipped: ${this.results.skipped}`);
        console.log(`⏱️  Duration: ${this.results.duration}ms`);

        const passRate = ((this.results.passed / this.results.total) * 100).toFixed(2);
        console.log(`\n📈 Pass Rate: ${passRate}%\n`);

        if (this.results.failed === 0) {
            console.log('🎉 All tests passed!\n');
        } else {
            console.log('❌ Some tests failed. See errors above.\n');
        }
    }
}

/**
 * Mock API responses
 */
export class MockAPI {
    constructor() {
        this.mocks = new Map();
        this.originalFetch = window.fetch;
    }

    /**
     * Mock an API endpoint
     */
    mock(url, response, options = {}) {
        this.mocks.set(url, {
            response,
            delay: options.delay || 0,
            status: options.status || 200,
            method: options.method || 'GET'
        });
    }

    /**
     * Enable mocking
     */
    enable() {
        window.fetch = async (url, options = {}) => {
            const mock = this.mocks.get(url);

            if (mock && (options.method || 'GET') === mock.method) {
                await TestUtils.wait(mock.delay);

                return {
                    ok: mock.status >= 200 && mock.status < 300,
                    status: mock.status,
                    json: async () => mock.response,
                    text: async () => JSON.stringify(mock.response)
                };
            }

            return this.originalFetch(url, options);
        };
    }

    /**
     * Disable mocking
     */
    disable() {
        window.fetch = this.originalFetch;
    }

    /**
     * Clear all mocks
     */
    clear() {
        this.mocks.clear();
    }
}

/**
 * Test Data Factory
 */
export class TestDataFactory {
    /**
     * Create test product
     */
    static createProduct(overrides = {}) {
        return {
            id: `prod_${TestUtils.randomString(8)}`,
            name: `Test Product ${TestUtils.randomString(5)}`,
            description: 'This is a test product description',
            price: Math.floor(Math.random() * 100) + 10,
            category: 'Electronics',
            image: 'https://via.placeholder.com/300',
            stock: 100,
            rating: 4.5,
            reviews: 42,
            ...overrides
        };
    }

    /**
     * Create test user
     */
    static createUser(overrides = {}) {
        return {
            id: `user_${TestUtils.randomString(8)}`,
            email: TestUtils.randomEmail(),
            name: `Test User ${TestUtils.randomString(5)}`,
            password: 'Test123!@#',
            createdAt: new Date().toISOString(),
            ...overrides
        };
    }

    /**
     * Create test order
     */
    static createOrder(overrides = {}) {
        return {
            id: `order_${TestUtils.randomString(8)}`,
            userId: `user_${TestUtils.randomString(8)}`,
            items: [this.createProduct()],
            total: 99.99,
            status: 'pending',
            createdAt: new Date().toISOString(),
            ...overrides
        };
    }

    /**
     * Create test cart
     */
    static createCart(items = 1) {
        const cartItems = [];
        for (let i = 0; i < items; i++) {
            cartItems.push({
                product: this.createProduct(),
                quantity: Math.floor(Math.random() * 5) + 1
            });
        }
        return cartItems;
    }
}

/**
 * Performance measurement
 */
export class PerformanceMonitor {
    static marks = new Map();

    /**
     * Start performance mark
     */
    static start(name) {
        this.marks.set(name, performance.now());
    }

    /**
     * End performance mark and get duration
     */
    static end(name) {
        const startTime = this.marks.get(name);
        if (!startTime) {
            throw new Error(`No start mark found for ${name}`);
        }

        const duration = performance.now() - startTime;
        this.marks.delete(name);

        return duration;
    }

    /**
     * Measure function execution time
     */
    static async measure(name, fn) {
        this.start(name);
        const result = await fn();
        const duration = this.end(name);

        console.log(`⏱️  ${name}: ${duration.toFixed(2)}ms`);

        return { result, duration };
    }
}

// Export singleton instances
export const mockAPI = new MockAPI();
export const testRunner = new TestRunner();
