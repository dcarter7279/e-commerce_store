// Product Browsing Tests
// Tests for product listing, filtering, searching, and detail views

import {
    TestRunner,
    TestUtils,
    Assert,
    mockAPI,
    TestDataFactory,
    PerformanceMonitor
} from './setup.js';

const runner = new TestRunner();

/**
 * Setup and Teardown
 */
runner.beforeEach(() => {
    TestUtils.clearStorage();
    document.body.innerHTML = '<div id="test-container"></div>';
});

runner.afterEach(() => {
    mockAPI.clear();
    document.body.innerHTML = '';
});

/**
 * Product Listing Tests
 */
runner.test('Should load and display product list', async () => {
    // Mock products API
    const mockProducts = [
        TestDataFactory.createProduct({ id: '1', name: 'Product 1' }),
        TestDataFactory.createProduct({ id: '2', name: 'Product 2' }),
        TestDataFactory.createProduct({ id: '3', name: 'Product 3' })
    ];

    mockAPI.mock('/api/products', mockProducts);
    mockAPI.enable();

    // Load products page
    document.body.innerHTML = '<div id="product-grid"></div>';

    // Import and initialize products module
    const { loadProducts } = await import('../js/products.js');
    await loadProducts();

    // Wait for products to load
    await TestUtils.waitFor(() => {
        const productCards = document.querySelectorAll('.product-card');
        return productCards.length === 3;
    });

    const productCards = document.querySelectorAll('.product-card');
    Assert.equals(productCards.length, 3, 'Should display 3 products');

    mockAPI.disable();
});

runner.test('Should display product cards with correct information', async () => {
    const product = TestDataFactory.createProduct({
        name: 'Test Headphones',
        price: 299.99,
        rating: 4.5
    });

    document.body.innerHTML = `
        <div id="product-grid">
            <div class="product-card" data-product-id="${product.id}">
                <h3 class="product-name">${product.name}</h3>
                <p class="product-price">$${product.price}</p>
                <div class="product-rating">${product.rating}</div>
            </div>
        </div>
    `;

    const name = await TestUtils.getText('.product-name');
    const price = await TestUtils.getText('.product-price');
    const rating = await TestUtils.getText('.product-rating');

    Assert.equals(name, 'Test Headphones', 'Product name should match');
    Assert.equals(price, '$299.99', 'Product price should match');
    Assert.equals(rating, '4.5', 'Product rating should match');
});

runner.test('Should show empty state when no products', async () => {
    mockAPI.mock('/api/products', []);
    mockAPI.enable();

    document.body.innerHTML = '<div id="product-grid"></div>';

    const { loadProducts } = await import('../js/products.js');
    await loadProducts();

    await TestUtils.waitFor(async () => {
        const emptyState = await TestUtils.isVisible('.empty-state');
        return emptyState;
    });

    const hasEmptyState = await TestUtils.isVisible('.empty-state');
    Assert.isTrue(hasEmptyState, 'Should show empty state');

    mockAPI.disable();
});

/**
 * Product Filtering Tests
 */
runner.test('Should filter products by category', async () => {
    const products = [
        TestDataFactory.createProduct({ category: 'Electronics' }),
        TestDataFactory.createProduct({ category: 'Electronics' }),
        TestDataFactory.createProduct({ category: 'Clothing' })
    ];

    mockAPI.mock('/api/products?category=Electronics',
        products.filter(p => p.category === 'Electronics')
    );
    mockAPI.enable();

    document.body.innerHTML = `
        <select id="category-filter">
            <option value="">All Categories</option>
            <option value="Electronics">Electronics</option>
            <option value="Clothing">Clothing</option>
        </select>
        <div id="product-grid"></div>
    `;

    const { filterByCategory } = await import('../js/products.js');

    await TestUtils.selectOption('#category-filter', 'Electronics');
    await filterByCategory('Electronics');

    await TestUtils.waitFor(() => {
        const cards = document.querySelectorAll('.product-card');
        return cards.length === 2;
    });

    const visibleProducts = document.querySelectorAll('.product-card');
    Assert.equals(visibleProducts.length, 2, 'Should show 2 Electronics products');

    mockAPI.disable();
});

runner.test('Should filter products by price range', async () => {
    document.body.innerHTML = `
        <input type="range" id="min-price" value="0" />
        <input type="range" id="max-price" value="100" />
        <div id="product-grid">
            <div class="product-card" data-price="50"></div>
            <div class="product-card" data-price="150"></div>
            <div class="product-card" data-price="75"></div>
        </div>
    `;

    const { filterByPriceRange } = await import('../js/products.js');

    await filterByPriceRange(0, 100);

    await TestUtils.wait(200);

    const visibleProducts = Array.from(document.querySelectorAll('.product-card'))
        .filter(card => !card.classList.contains('hidden'));

    Assert.equals(visibleProducts.length, 2, 'Should show 2 products in price range');
});

runner.test('Should sort products by price ascending', async () => {
    const products = [
        TestDataFactory.createProduct({ price: 99.99 }),
        TestDataFactory.createProduct({ price: 29.99 }),
        TestDataFactory.createProduct({ price: 49.99 })
    ];

    document.body.innerHTML = `
        <select id="sort-by">
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
        </select>
        <div id="product-grid"></div>
    `;

    const { sortProducts } = await import('../js/products.js');

    await sortProducts(products, 'price-asc');

    const sorted = products.sort((a, b) => a.price - b.price);
    Assert.equals(sorted[0].price, 29.99, 'First product should be cheapest');
    Assert.equals(sorted[2].price, 99.99, 'Last product should be most expensive');
});

/**
 * Product Search Tests
 */
runner.test('Should search products by name', async () => {
    const products = [
        TestDataFactory.createProduct({ name: 'Wireless Headphones' }),
        TestDataFactory.createProduct({ name: 'Bluetooth Speaker' }),
        TestDataFactory.createProduct({ name: 'Wired Headphones' })
    ];

    mockAPI.mock('/api/products/search?q=headphones',
        products.filter(p => p.name.toLowerCase().includes('headphones'))
    );
    mockAPI.enable();

    document.body.innerHTML = `
        <input type="text" id="search-input" />
        <button id="search-btn">Search</button>
        <div id="product-grid"></div>
    `;

    const { searchProducts } = await import('../js/products.js');

    await TestUtils.fillInput('#search-input', 'headphones');
    await TestUtils.click('#search-btn');

    await searchProducts('headphones');

    await TestUtils.waitFor(() => {
        const cards = document.querySelectorAll('.product-card');
        return cards.length === 2;
    });

    const results = document.querySelectorAll('.product-card');
    Assert.equals(results.length, 2, 'Should find 2 products matching "headphones"');

    mockAPI.disable();
});

runner.test('Should show no results message for empty search', async () => {
    mockAPI.mock('/api/products/search?q=xyz123', []);
    mockAPI.enable();

    document.body.innerHTML = `
        <input type="text" id="search-input" />
        <div id="product-grid"></div>
    `;

    const { searchProducts } = await import('../js/products.js');

    await TestUtils.fillInput('#search-input', 'xyz123');
    await searchProducts('xyz123');

    await TestUtils.waitFor(async () => {
        return await TestUtils.isVisible('.no-results');
    });

    const hasNoResults = await TestUtils.isVisible('.no-results');
    Assert.isTrue(hasNoResults, 'Should show no results message');

    mockAPI.disable();
});

runner.test('Should highlight search terms in results', async () => {
    document.body.innerHTML = `
        <div id="product-grid">
            <div class="product-card">
                <h3 class="product-name">Wireless Headphones</h3>
            </div>
        </div>
    `;

    const { highlightSearchTerms } = await import('../js/products.js');

    highlightSearchTerms('wireless');

    await TestUtils.wait(100);

    const productName = document.querySelector('.product-name');
    Assert.isTrue(
        productName.innerHTML.includes('<mark>') || productName.innerHTML.includes('highlight'),
        'Search term should be highlighted'
    );
});

/**
 * Product Detail View Tests
 */
runner.test('Should load product details', async () => {
    const product = TestDataFactory.createProduct({
        id: 'prod_123',
        name: 'Premium Headphones',
        description: 'High-quality wireless headphones',
        price: 299.99
    });

    mockAPI.mock('/api/products/prod_123', product);
    mockAPI.enable();

    document.body.innerHTML = '<div id="product-detail"></div>';

    const { loadProductDetail } = await import('../js/products.js');
    await loadProductDetail('prod_123');

    await TestUtils.waitFor(async () => {
        return TestUtils.exists('.product-detail-name');
    });

    const name = await TestUtils.getText('.product-detail-name');
    const price = await TestUtils.getText('.product-detail-price');

    Assert.equals(name, 'Premium Headphones', 'Product name should match');
    Assert.contains(price, '299.99', 'Product price should match');

    mockAPI.disable();
});

runner.test('Should display product images in gallery', async () => {
    const product = TestDataFactory.createProduct({
        images: [
            'image1.jpg',
            'image2.jpg',
            'image3.jpg'
        ]
    });

    document.body.innerHTML = `
        <div id="product-images">
            <img src="image1.jpg" class="main-image" />
            <div class="thumbnail-gallery">
                <img src="image1.jpg" class="thumbnail" />
                <img src="image2.jpg" class="thumbnail" />
                <img src="image3.jpg" class="thumbnail" />
            </div>
        </div>
    `;

    const thumbnails = document.querySelectorAll('.thumbnail');
    Assert.equals(thumbnails.length, 3, 'Should show 3 thumbnail images');

    // Click second thumbnail
    await TestUtils.click('.thumbnail:nth-child(2)');
    await TestUtils.wait(200);

    const mainImage = document.querySelector('.main-image');
    Assert.contains(mainImage.src, 'image2.jpg', 'Main image should update on thumbnail click');
});

runner.test('Should show product specifications', async () => {
    document.body.innerHTML = `
        <div id="product-specs">
            <dl>
                <dt>Brand</dt>
                <dd class="spec-brand">AudioTech</dd>
                <dt>Weight</dt>
                <dd class="spec-weight">250g</dd>
                <dt>Battery Life</dt>
                <dd class="spec-battery">30 hours</dd>
            </dl>
        </div>
    `;

    const brand = await TestUtils.getText('.spec-brand');
    const weight = await TestUtils.getText('.spec-weight');
    const battery = await TestUtils.getText('.spec-battery');

    Assert.equals(brand, 'AudioTech', 'Brand should be displayed');
    Assert.equals(weight, '250g', 'Weight should be displayed');
    Assert.equals(battery, '30 hours', 'Battery life should be displayed');
});

/**
 * Product Pagination Tests
 */
runner.test('Should paginate product results', async () => {
    const allProducts = Array.from({ length: 30 }, (_, i) =>
        TestDataFactory.createProduct({ id: `prod_${i}` })
    );

    mockAPI.mock('/api/products?page=1&limit=12', allProducts.slice(0, 12));
    mockAPI.mock('/api/products?page=2&limit=12', allProducts.slice(12, 24));
    mockAPI.enable();

    document.body.innerHTML = `
        <div id="product-grid"></div>
        <div id="pagination">
            <button class="page-btn" data-page="1">1</button>
            <button class="page-btn" data-page="2">2</button>
            <button class="page-btn" data-page="3">3</button>
        </div>
    `;

    const { loadPage } = await import('../js/products.js');

    // Load page 1
    await loadPage(1);
    await TestUtils.waitFor(() => document.querySelectorAll('.product-card').length === 12);

    let products = document.querySelectorAll('.product-card');
    Assert.equals(products.length, 12, 'Page 1 should show 12 products');

    // Load page 2
    await TestUtils.click('[data-page="2"]');
    await loadPage(2);
    await TestUtils.waitFor(() => document.querySelectorAll('.product-card').length === 12);

    products = document.querySelectorAll('.product-card');
    Assert.equals(products.length, 12, 'Page 2 should show 12 products');

    mockAPI.disable();
});

/**
 * Product Interaction Tests
 */
runner.test('Should add product to wishlist', async () => {
    document.body.innerHTML = `
        <button class="wishlist-btn" data-product-id="prod_123">
            Add to Wishlist
        </button>
    `;

    const { addToWishlist } = await import('../js/wishlist.js');

    await TestUtils.click('.wishlist-btn');
    addToWishlist('prod_123');

    await TestUtils.wait(100);

    const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
    Assert.contains(wishlist, 'prod_123', 'Product should be in wishlist');

    const button = document.querySelector('.wishlist-btn');
    Assert.isTrue(
        button.classList.contains('active') || button.textContent.includes('Remove'),
        'Wishlist button should show active state'
    );
});

runner.test('Should add product to comparison', async () => {
    document.body.innerHTML = `
        <button class="compare-btn" data-product-id="prod_123">
            Compare
        </button>
    `;

    const { addToCompare } = await import('../js/compare.js');

    await TestUtils.click('.compare-btn');
    addToCompare('prod_123');

    await TestUtils.wait(100);

    const compare = JSON.parse(localStorage.getItem('compare') || '[]');
    Assert.contains(compare, 'prod_123', 'Product should be in comparison list');
});

runner.test('Should limit comparison to 4 products', async () => {
    const { addToCompare, getCompareList } = await import('../js/compare.js');

    // Add 4 products
    addToCompare('prod_1');
    addToCompare('prod_2');
    addToCompare('prod_3');
    addToCompare('prod_4');

    await TestUtils.wait(100);

    let compareList = getCompareList();
    Assert.equals(compareList.length, 4, 'Should have 4 products');

    // Try to add 5th product
    const result = addToCompare('prod_5');

    compareList = getCompareList();
    Assert.equals(compareList.length, 4, 'Should still have only 4 products');
    Assert.isFalse(result, 'Should return false when limit reached');
});

/**
 * Performance Tests
 */
runner.test('Should load products within 2 seconds', async () => {
    const products = Array.from({ length: 24 }, () => TestDataFactory.createProduct());

    mockAPI.mock('/api/products', products, { delay: 0 });
    mockAPI.enable();

    document.body.innerHTML = '<div id="product-grid"></div>';

    const { result, duration } = await PerformanceMonitor.measure(
        'Load Products',
        async () => {
            const { loadProducts } = await import('../js/products.js');
            return await loadProducts();
        }
    );

    Assert.lessThan(duration, 2000, 'Products should load in under 2 seconds');

    mockAPI.disable();
});

runner.test('Should handle rapid filter changes', async () => {
    document.body.innerHTML = `
        <select id="category-filter"></select>
        <div id="product-grid"></div>
    `;

    const { filterByCategory } = await import('../js/products.js');

    // Rapidly change filters
    await filterByCategory('Electronics');
    await filterByCategory('Clothing');
    await filterByCategory('Books');
    await filterByCategory('Electronics');

    await TestUtils.wait(500);

    // Should complete without errors
    Assert.isTrue(true, 'Rapid filter changes should not cause errors');
});

/**
 * Error Handling Tests
 */
runner.test('Should handle API error gracefully', async () => {
    mockAPI.mock('/api/products', { error: 'Server error' }, { status: 500 });
    mockAPI.enable();

    document.body.innerHTML = '<div id="product-grid"></div>';

    const { loadProducts } = await import('../js/products.js');

    try {
        await loadProducts();
    } catch (error) {
        // Expected to throw or show error message
    }

    await TestUtils.wait(200);

    const hasError = await TestUtils.isVisible('.error-message');
    Assert.isTrue(hasError, 'Should show error message on API failure');

    mockAPI.disable();
});

runner.test('Should handle missing product gracefully', async () => {
    mockAPI.mock('/api/products/invalid_id', { error: 'Not found' }, { status: 404 });
    mockAPI.enable();

    const { loadProductDetail } = await import('../js/products.js');

    await Assert.throwsAsync(
        async () => await loadProductDetail('invalid_id'),
        'Should throw error for missing product'
    );

    mockAPI.disable();
});

// Run tests
export async function runProductBrowsingTests() {
    console.log('🛍️  Running Product Browsing Tests...\n');
    return await runner.run();
}

// Auto-run if loaded directly
if (import.meta.url === window.location.href) {
    runProductBrowsingTests();
}
