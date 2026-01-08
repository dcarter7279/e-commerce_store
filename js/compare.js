// Product Comparison Module
// Allows users to compare multiple products side-by-side

const COMPARE_STORAGE_KEY = 'e-store-compare';
const MAX_COMPARE_PRODUCTS = 4; // Maximum products to compare at once

/**
 * Get products in comparison list
 * @returns {Array<number>} - Array of product IDs
 */
export function getCompareList() {
    try {
        const compareList = localStorage.getItem(COMPARE_STORAGE_KEY);
        return compareList ? JSON.parse(compareList) : [];
    } catch (error) {
        console.error('Error reading compare list:', error);
        return [];
    }
}

/**
 * Save compare list to localStorage
 */
function saveCompareList(productIds) {
    try {
        localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(productIds));
        return true;
    } catch (error) {
        console.error('Error saving compare list:', error);
        return false;
    }
}

/**
 * Add product to comparison
 * @param {number} productId - Product ID to add
 * @returns {Object} - Result object with success status and message
 */
export function addToCompare(productId) {
    const compareList = getCompareList();

    // Check if already in list
    if (compareList.includes(productId)) {
        return {
            success: false,
            message: 'Product already in comparison'
        };
    }

    // Check maximum limit
    if (compareList.length >= MAX_COMPARE_PRODUCTS) {
        return {
            success: false,
            message: `You can compare up to ${MAX_COMPARE_PRODUCTS} products at a time`
        };
    }

    // Add to list
    compareList.push(productId);
    const saved = saveCompareList(compareList);

    if (saved) {
        updateCompareCount();
        dispatchCompareEvent('added', productId);
        return {
            success: true,
            message: 'Added to comparison'
        };
    }

    return {
        success: false,
        message: 'Failed to add to comparison'
    };
}

/**
 * Remove product from comparison
 * @param {number} productId - Product ID to remove
 * @returns {boolean} - Success status
 */
export function removeFromCompare(productId) {
    const compareList = getCompareList();
    const index = compareList.indexOf(productId);

    if (index > -1) {
        compareList.splice(index, 1);
        const saved = saveCompareList(compareList);

        if (saved) {
            updateCompareCount();
            dispatchCompareEvent('removed', productId);
        }

        return saved;
    }

    return false;
}

/**
 * Toggle product in comparison
 * @param {number} productId - Product ID to toggle
 * @returns {Object} - Result object
 */
export function toggleCompare(productId) {
    const compareList = getCompareList();

    if (compareList.includes(productId)) {
        removeFromCompare(productId);
        return { inCompare: false };
    } else {
        const result = addToCompare(productId);
        return { inCompare: result.success, ...result };
    }
}

/**
 * Check if product is in comparison
 * @param {number} productId - Product ID to check
 * @returns {boolean}
 */
export function isInCompare(productId) {
    const compareList = getCompareList();
    return compareList.includes(productId);
}

/**
 * Get comparison count
 * @returns {number}
 */
export function getCompareCount() {
    return getCompareList().length;
}

/**
 * Update compare count in UI
 */
export function updateCompareCount() {
    const count = getCompareCount();
    const badges = document.querySelectorAll('.compare-count');

    badges.forEach(badge => {
        badge.textContent = count;
        badge.style.display = count > 0 ? 'inline-block' : 'none';
    });
}

/**
 * Clear entire comparison list
 */
export function clearCompareList() {
    const saved = saveCompareList([]);

    if (saved) {
        updateCompareCount();
        dispatchCompareEvent('cleared');
    }

    return saved;
}

/**
 * Get compare products with full details
 * @returns {Promise<Array>} - Array of product objects
 */
export async function getCompareProducts() {
    const compareIds = getCompareList();

    if (compareIds.length === 0) {
        return [];
    }

    const { getProductById } = await import('./products.js');

    const products = compareIds
        .map(id => getProductById(id))
        .filter(product => product !== null);

    return products;
}

/**
 * Render comparison page
 * @param {string} containerId - Container ID
 */
export async function renderComparePage(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Show loading
    container.innerHTML = '<div class="loading"><div class="spinner"></div><p>Loading comparison...</p></div>';

    try {
        const products = await getCompareProducts();

        if (products.length === 0) {
            container.innerHTML = `
                <div class="empty-compare">
                    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                        <path d="M9 11l3 3L22 4"></path>
                        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                    </svg>
                    <h3>No Products to Compare</h3>
                    <p>Add products to compare their features side-by-side</p>
                    <a href="index.html" class="btn btn-primary">Browse Products</a>
                </div>
            `;
            return;
        }

        // Render comparison table
        renderComparisonTable(container, products);

    } catch (error) {
        console.error('Error rendering comparison:', error);
        container.innerHTML = `
            <div class="error-state">
                <h3>Oops! Something went wrong</h3>
                <p>We couldn't load the comparison. Please try again.</p>
                <button class="btn btn-primary" onclick="location.reload()">Retry</button>
            </div>
        `;
    }
}

/**
 * Render comparison table
 */
function renderComparisonTable(container, products) {
    const comparisonFeatures = extractComparisonFeatures(products);

    container.innerHTML = `
        <div class="compare-header">
            <h2>Compare Products (${products.length})</h2>
            <div class="compare-actions">
                <button class="btn btn-outline btn-small" id="clear-compare">Clear All</button>
                <a href="index.html" class="btn btn-primary btn-small">Add More Products</a>
            </div>
        </div>

        <div class="comparison-table-container">
            <table class="comparison-table">
                <!-- Product Images Row -->
                <thead>
                    <tr>
                        <th class="feature-label">Product</th>
                        ${products.map(product => `
                            <th class="product-column">
                                <div class="product-header">
                                    <button class="remove-from-compare" data-product-id="${product.id}" title="Remove from comparison">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <line x1="18" y1="6" x2="6" y2="18"></line>
                                            <line x1="6" y1="6" x2="18" y2="18"></line>
                                        </svg>
                                    </button>
                                    <img src="${product.image}" alt="${product.name}" class="product-image">
                                    <h4>${product.name}</h4>
                                    <p class="product-price">$${product.price.toFixed(2)}</p>
                                    <div class="product-rating">
                                        ${'★'.repeat(Math.floor(product.rating || 0))}${'☆'.repeat(5 - Math.floor(product.rating || 0))}
                                        <span>(${product.reviews || 0})</span>
                                    </div>
                                </div>
                            </th>
                        `).join('')}
                    </tr>
                </thead>

                <!-- Features Comparison -->
                <tbody>
                    ${comparisonFeatures.map(feature => `
                        <tr>
                            <td class="feature-label">${feature.label}</td>
                            ${products.map(product => `
                                <td class="feature-value">${getFeatureValue(product, feature.key)}</td>
                            `).join('')}
                        </tr>
                    `).join('')}

                    <!-- Actions Row -->
                    <tr class="actions-row">
                        <td class="feature-label">Actions</td>
                        ${products.map(product => `
                            <td>
                                <div class="product-actions">
                                    <button class="btn btn-primary btn-small add-to-cart-btn" data-product-id="${product.id}">
                                        Add to Cart
                                    </button>
                                    <a href="product-detail.html?id=${product.id}" class="btn btn-outline btn-small">
                                        View Details
                                    </a>
                                </div>
                            </td>
                        `).join('')}
                    </tr>
                </tbody>
            </table>
        </div>
    `;

    // Add event handlers
    const clearBtn = document.getElementById('clear-compare');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if (confirm('Clear all products from comparison?')) {
                clearCompareList();
                renderComparePage(container.id);
            }
        });
    }

    // Remove individual products
    container.querySelectorAll('.remove-from-compare').forEach(btn => {
        btn.addEventListener('click', () => {
            const productId = parseInt(btn.dataset.productId);
            removeFromCompare(productId);
            renderComparePage(container.id);
        });
    });
}

/**
 * Extract comparison features from products
 */
function extractComparisonFeatures(products) {
    const features = [
        { key: 'price', label: 'Price' },
        { key: 'category', label: 'Category' },
        { key: 'rating', label: 'Customer Rating' },
        { key: 'reviews', label: 'Number of Reviews' },
        { key: 'inStock', label: 'Availability' },
        { key: 'featured', label: 'Featured Product' },
        { key: 'onSale', label: 'On Sale' },
        { key: 'description', label: 'Description' }
    ];

    // Add product-specific features if they exist
    const allFeatures = new Set();
    products.forEach(product => {
        if (product.features && Array.isArray(product.features)) {
            product.features.forEach(f => allFeatures.add(f));
        }
    });

    // Add unique features to comparison
    Array.from(allFeatures).forEach((feature, index) => {
        features.push({
            key: `feature_${index}`,
            label: feature,
            isFeature: true,
            featureText: feature
        });
    });

    return features;
}

/**
 * Get feature value for display
 */
function getFeatureValue(product, featureKey) {
    if (featureKey.startsWith('feature_')) {
        // Check if product has this feature
        const featureIndex = parseInt(featureKey.split('_')[1]);
        const allFeatures = extractAllUniqueFeatures();
        const featureText = allFeatures[featureIndex];

        if (product.features && product.features.includes(featureText)) {
            return '<span class="feature-yes">✓ Yes</span>';
        }
        return '<span class="feature-no">✗ No</span>';
    }

    switch (featureKey) {
        case 'price':
            return `$${product.price.toFixed(2)}`;
        case 'category':
            return product.category || 'N/A';
        case 'rating':
            return product.rating ? `${product.rating}/5` : 'No rating';
        case 'reviews':
            return product.reviews || 0;
        case 'inStock':
            return product.inStock ? '<span class="feature-yes">✓ In Stock</span>' : '<span class="feature-no">Out of Stock</span>';
        case 'featured':
            return product.featured ? '<span class="feature-yes">✓ Yes</span>' : '<span class="feature-no">No</span>';
        case 'onSale':
            return product.onSale ? '<span class="feature-yes">✓ Yes</span>' : '<span class="feature-no">No</span>';
        case 'description':
            return product.description || 'N/A';
        default:
            return product[featureKey] || 'N/A';
    }
}

/**
 * Extract all unique features from all products
 */
function extractAllUniqueFeatures() {
    const compareList = getCompareList();
    const allFeatures = new Set();

    compareList.forEach(id => {
        const product = window.productsData?.find(p => p.id === id);
        if (product && product.features) {
            product.features.forEach(f => allFeatures.add(f));
        }
    });

    return Array.from(allFeatures);
}

/**
 * Dispatch compare event
 */
function dispatchCompareEvent(action, productId = null) {
    const event = new CustomEvent('compareChanged', {
        detail: { action, productId, count: getCompareCount() }
    });
    window.dispatchEvent(event);
}

/**
 * Create compare button HTML
 * @param {number} productId - Product ID
 * @returns {string} - HTML string
 */
export function createCompareButton(productId) {
    const inCompare = isInCompare(productId);
    const activeClass = inCompare ? 'active' : '';

    return `
        <button
            class="compare-btn ${activeClass}"
            data-product-id="${productId}"
            title="${inCompare ? 'Remove from comparison' : 'Add to comparison'}"
        >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 11l3 3L22 4"></path>
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
            </svg>
            ${inCompare ? 'In Comparison' : 'Compare'}
        </button>
    `;
}

/**
 * Initialize compare button handlers
 */
export function initCompareButtons() {
    document.addEventListener('click', (e) => {
        const compareBtn = e.target.closest('.compare-btn');
        if (!compareBtn) return;

        e.preventDefault();
        e.stopPropagation();

        const productId = parseInt(compareBtn.dataset.productId);
        if (!productId) return;

        const result = toggleCompare(productId);

        // Update button
        if (result.inCompare) {
            compareBtn.classList.add('active');
            compareBtn.title = 'Remove from comparison';
            compareBtn.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9 11l3 3L22 4"></path>
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                </svg>
                In Comparison
            `;
        } else {
            compareBtn.classList.remove('active');
            compareBtn.title = 'Add to comparison';
            compareBtn.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9 11l3 3L22 4"></path>
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                </svg>
                Compare
            `;
        }

        // Show notification
        showCompareNotification(result);
    });
}

/**
 * Show compare notification
 */
function showCompareNotification(result) {
    const notification = document.createElement('div');
    notification.className = `compare-notification ${result.success ? 'success' : 'error'}`;
    notification.textContent = result.message || 'Updated';

    document.body.appendChild(notification);

    setTimeout(() => notification.classList.add('show'), 10);

    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => document.body.removeChild(notification), 300);
    }, 3000);
}

// Initialize compare count on module load
if (typeof document !== 'undefined') {
    updateCompareCount();
}
