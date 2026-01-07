// Product Detail Module
// Handles product detail page functionality

import { getProductById, getProductsByCategory } from './products.js';
import { addToCart } from './cart.js';

// State
let currentProduct = null;
let currentQuantity = 1;
let currentImageIndex = 0;

// Render product detail page
export function renderProductDetail(productId) {
    const product = getProductById(productId);
    const container = document.getElementById('product-detail-container');

    if (!product) {
        container.innerHTML = `
            <div class="error-message">
                <h2>Product Not Found</h2>
                <p>The requested product could not be found.</p>
                <a href="index.html" class="btn">Back to Home</a>
            </div>
        `;
        return;
    }

    currentProduct = product;
    updateBreadcrumb(product);

    // Render product detail HTML
    container.innerHTML = createProductDetailHTML(product);

    // Attach event listeners
    attachDetailEventListeners();
}

// Create product detail HTML
function createProductDetailHTML(product) {
    const images = product.images || [product.image];
    const hasDiscount = product.originalPrice && product.originalPrice > product.price;
    const discount = hasDiscount ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0;
    const savings = hasDiscount ? (product.originalPrice - product.price) : 0;

    return `
        <div class="product-detail-grid">
            <!-- Image Gallery -->
            <div class="product-gallery">
                <div class="main-image-container">
                    <img src="${images[0]}" alt="${product.name}" class="main-image" id="main-product-image">
                    ${product.badge ? `<span class="product-badge-detail ${product.badge.toLowerCase()}">${product.badge}</span>` : ''}
                    <div class="zoom-controls">
                        <button class="zoom-btn" id="zoom-in" aria-label="Zoom in">+</button>
                        <button class="zoom-btn" id="zoom-out" aria-label="Zoom out">−</button>
                    </div>
                </div>
                ${images.length > 1 ? `
                    <div class="thumbnail-gallery">
                        ${images.map((img, index) => `
                            <div class="thumbnail ${index === 0 ? 'active' : ''}" data-index="${index}">
                                <img src="${img}" alt="${product.name} - Image ${index + 1}">
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            </div>

            <!-- Product Info -->
            <div class="product-info">
                <h1 class="product-detail-title">${product.name}</h1>

                <div class="product-meta">
                    <div class="product-rating-detail">
                        <div class="stars-detail">
                            ${generateStars(product.rating)}
                        </div>
                        <span class="rating-text">${product.rating.toFixed(1)} (${product.reviewCount || 0} reviews)</span>
                    </div>
                    ${product.sku ? `<div class="product-sku">SKU: <strong>${product.sku}</strong></div>` : ''}
                </div>

                <!-- Pricing -->
                <div class="product-pricing">
                    <div class="price-container">
                        <span class="current-price">$${product.price.toFixed(2)}</span>
                        ${hasDiscount ? `
                            <span class="original-price">$${product.originalPrice.toFixed(2)}</span>
                            <span class="discount-percentage">${discount}% OFF</span>
                        ` : ''}
                    </div>
                    ${hasDiscount ? `<p class="price-savings">You save: $${savings.toFixed(2)}</p>` : ''}
                </div>

                <!-- Availability -->
                <div class="availability-status ${getStockClass(product.stock)}">
                    <svg class="stock-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        ${getStockIcon(product.stock)}
                    </svg>
                    <span class="stock-text">${getStockText(product.stock)}</span>
                    ${product.stock > 0 && product.stock <= 10 ? `<span class="stock-quantity">Only ${product.stock} left!</span>` : ''}
                </div>

                <!-- Description -->
                <div class="product-description">
                    <p>${product.description}</p>
                    ${product.longDescription ? `<p>${product.longDescription}</p>` : ''}
                </div>

                <!-- Key Features -->
                ${product.features && product.features.length > 0 ? `
                    <div class="key-features">
                        <h3>Key Features</h3>
                        <div class="features-list">
                            ${product.features.map(feature => `
                                <div class="feature-item">
                                    <svg class="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <polyline points="20 6 9 17 4 12"></polyline>
                                    </svg>
                                    <span class="feature-text">${feature}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}

                <!-- Quantity Selector -->
                <div class="quantity-section">
                    <label for="quantity-input">Quantity:</label>
                    <div class="quantity-selector">
                        <button class="quantity-btn-detail" id="qty-decrease" ${currentQuantity <= 1 ? 'disabled' : ''} aria-label="Decrease quantity">−</button>
                        <input type="number" id="quantity-input" class="quantity-input" value="${currentQuantity}" min="1" max="${product.stock || 99}" readonly>
                        <button class="quantity-btn-detail" id="qty-increase" ${currentQuantity >= (product.stock || 99) ? 'disabled' : ''} aria-label="Increase quantity">+</button>
                    </div>
                </div>

                <!-- Action Buttons -->
                <div class="product-actions">
                    <button class="btn btn-success add-to-cart-detail" id="add-to-cart-detail" ${product.stock === 0 ? 'disabled' : ''}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="9" cy="21" r="1"></circle>
                            <circle cx="20" cy="21" r="1"></circle>
                            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                        </svg>
                        ${product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                    </button>
                    <button class="wishlist-btn" id="wishlist-btn" aria-label="Add to wishlist">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                    </button>
                </div>

                <!-- Product Guarantees -->
                <div class="product-guarantees">
                    <div class="guarantee-item">
                        <svg class="guarantee-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M20 7h-9M14 17H5M5 7c0 4.97 4.03 9 9 9"></path>
                        </svg>
                        <span class="guarantee-text">Free Shipping</span>
                    </div>
                    <div class="guarantee-item">
                        <svg class="guarantee-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                            <polyline points="9 22 9 12 15 12 15 22"></polyline>
                        </svg>
                        <span class="guarantee-text">30-Day Returns</span>
                    </div>
                    <div class="guarantee-item">
                        <svg class="guarantee-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                        </svg>
                        <span class="guarantee-text">1-Year Warranty</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Product Tabs -->
        <div class="product-tabs">
            <div class="tab-buttons">
                <button class="tab-btn active" data-tab="specifications">Specifications</button>
                <button class="tab-btn" data-tab="reviews">Reviews (${product.reviewCount || 0})</button>
                <button class="tab-btn" data-tab="shipping">Shipping & Returns</button>
            </div>

            <div class="tab-content active" id="specifications-tab">
                ${createSpecificationsHTML(product)}
            </div>

            <div class="tab-content" id="reviews-tab">
                ${createReviewsHTML(product)}
            </div>

            <div class="tab-content" id="shipping-tab">
                ${createShippingHTML()}
            </div>
        </div>
    `;
}

// Generate star rating HTML
function generateStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    let html = '';
    for (let i = 0; i < fullStars; i++) {
        html += '★';
    }
    if (hasHalfStar) {
        html += '⯨';
    }
    for (let i = 0; i < emptyStars; i++) {
        html += '☆';
    }
    return html;
}

// Get stock class
function getStockClass(stock) {
    if (stock === 0) return 'out-of-stock';
    if (stock <= 10) return 'low-stock';
    return '';
}

// Get stock icon
function getStockIcon(stock) {
    if (stock === 0) {
        return '<circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line>';
    }
    if (stock <= 10) {
        return '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line>';
    }
    return '<polyline points="20 6 9 17 4 12"></polyline>';
}

// Get stock text
function getStockText(stock) {
    if (stock === 0) return 'Out of Stock';
    if (stock <= 10) return `Low Stock - Only ${stock} left`;
    return 'In Stock';
}

// Create specifications HTML
function createSpecificationsHTML(product) {
    const specs = product.specifications || {
        'Brand': 'E-Store',
        'Category': product.category,
        'Condition': 'New',
        'Warranty': '1 Year Manufacturer Warranty'
    };

    return `
        <table class="specifications-table">
            <tbody>
                ${Object.entries(specs).map(([key, value]) => `
                    <tr>
                        <th>${key}</th>
                        <td>${value}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// Create reviews HTML
function createReviewsHTML(product) {
    const reviews = product.reviews || [];
    const reviewCount = product.reviewCount || 0;
    const avgRating = product.rating || 0;

    return `
        <div class="reviews-summary">
            <div class="rating-overview">
                <div class="average-rating">${avgRating.toFixed(1)}</div>
                <div class="stars-detail">${generateStars(avgRating)}</div>
                <p class="rating-text">${reviewCount} reviews</p>
            </div>
            <div class="rating-breakdown">
                ${createRatingBreakdown(reviews)}
            </div>
        </div>

        <div class="reviews-list">
            ${reviews.length > 0 ? reviews.map(review => createReviewItem(review)).join('') : '<p>No reviews yet. Be the first to review this product!</p>'}
        </div>
    `;
}

// Create rating breakdown
function createRatingBreakdown(reviews) {
    const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(review => {
        const rating = Math.floor(review.rating);
        breakdown[rating]++;
    });

    const total = reviews.length || 1;

    return [5, 4, 3, 2, 1].map(star => {
        const count = breakdown[star];
        const percentage = (count / total) * 100;
        return `
            <div class="rating-row">
                <span class="rating-label">${star} stars</span>
                <div class="rating-bar">
                    <div class="rating-fill" style="width: ${percentage}%"></div>
                </div>
                <span class="rating-count">${count}</span>
            </div>
        `;
    }).join('');
}

// Create review item
function createReviewItem(review) {
    const initials = review.author.split(' ').map(n => n[0]).join('').toUpperCase();

    return `
        <div class="review-item">
            <div class="review-header">
                <div class="reviewer-info">
                    <div class="reviewer-avatar">${initials}</div>
                    <div class="reviewer-details">
                        <h4>${review.author}</h4>
                        <span class="review-date">${formatDate(review.date)}</span>
                    </div>
                </div>
                <div class="review-rating">
                    ${generateStars(review.rating)}
                </div>
            </div>
            <div class="review-content">
                <p>${review.comment}</p>
            </div>
            <div class="review-helpful">
                <span class="helpful-text">Was this helpful?</span>
                <button class="helpful-btn">👍 Yes (${review.helpful || 0})</button>
                <button class="helpful-btn">👎 No</button>
            </div>
        </div>
    `;
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

// Create shipping HTML
function createShippingHTML() {
    return `
        <div class="shipping-info">
            <h3>Shipping Information</h3>
            <p>We offer free standard shipping on all orders over $50. Orders are typically processed within 1-2 business days.</p>
            <ul>
                <li><strong>Standard Shipping:</strong> 5-7 business days - $10.00 (Free over $50)</li>
                <li><strong>Express Shipping:</strong> 2-3 business days - $20.00</li>
                <li><strong>Next Day Delivery:</strong> 1 business day - $35.00</li>
            </ul>

            <h3 style="margin-top: 2rem;">Return Policy</h3>
            <p>We accept returns within 30 days of purchase. Items must be in original condition with all tags attached.</p>
            <ul>
                <li>Free returns for defective or damaged items</li>
                <li>Return shipping costs may apply for non-defective returns</li>
                <li>Refunds processed within 5-7 business days of receiving the return</li>
            </ul>

            <h3 style="margin-top: 2rem;">Warranty</h3>
            <p>All products come with a 1-year manufacturer warranty covering defects in materials and workmanship.</p>
        </div>
    `;
}

// Attach event listeners
function attachDetailEventListeners() {
    // Quantity controls
    const qtyDecrease = document.getElementById('qty-decrease');
    const qtyIncrease = document.getElementById('qty-increase');
    const qtyInput = document.getElementById('quantity-input');

    if (qtyDecrease) {
        qtyDecrease.addEventListener('click', () => {
            if (currentQuantity > 1) {
                currentQuantity--;
                updateQuantityDisplay();
            }
        });
    }

    if (qtyIncrease) {
        qtyIncrease.addEventListener('click', () => {
            const maxQty = currentProduct.stock || 99;
            if (currentQuantity < maxQty) {
                currentQuantity++;
                updateQuantityDisplay();
            }
        });
    }

    // Add to cart
    const addToCartBtn = document.getElementById('add-to-cart-detail');
    if (addToCartBtn) {
        addToCartBtn.addEventListener('click', () => {
            if (currentProduct && currentProduct.stock > 0) {
                addToCart(currentProduct, currentQuantity);
                showNotification(`${currentProduct.name} (${currentQuantity}) added to cart!`);
            }
        });
    }

    // Wishlist
    const wishlistBtn = document.getElementById('wishlist-btn');
    if (wishlistBtn) {
        wishlistBtn.addEventListener('click', () => {
            wishlistBtn.classList.toggle('active');
            const isActive = wishlistBtn.classList.contains('active');
            showNotification(isActive ? 'Added to wishlist!' : 'Removed from wishlist!');
        });
    }

    // Thumbnail gallery
    const thumbnails = document.querySelectorAll('.thumbnail');
    thumbnails.forEach(thumb => {
        thumb.addEventListener('click', () => {
            const index = parseInt(thumb.dataset.index);
            changeMainImage(index);
        });
    });

    // Tab buttons
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;
            switchTab(tabName);
        });
    });
}

// Update quantity display
function updateQuantityDisplay() {
    const qtyInput = document.getElementById('quantity-input');
    const qtyDecrease = document.getElementById('qty-decrease');
    const qtyIncrease = document.getElementById('qty-increase');

    if (qtyInput) qtyInput.value = currentQuantity;
    if (qtyDecrease) qtyDecrease.disabled = currentQuantity <= 1;
    if (qtyIncrease) qtyIncrease.disabled = currentQuantity >= (currentProduct.stock || 99);
}

// Change main image
function changeMainImage(index) {
    const images = currentProduct.images || [currentProduct.image];
    const mainImage = document.getElementById('main-product-image');
    const thumbnails = document.querySelectorAll('.thumbnail');

    if (mainImage && images[index]) {
        mainImage.src = images[index];
        currentImageIndex = index;

        thumbnails.forEach((thumb, i) => {
            thumb.classList.toggle('active', i === index);
        });
    }
}

// Switch tab
function switchTab(tabName) {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    tabContents.forEach(content => {
        content.classList.toggle('active', content.id === `${tabName}-tab`);
    });
}

// Update breadcrumb
function updateBreadcrumb(product) {
    const categoryEl = document.getElementById('breadcrumb-category');
    const productEl = document.getElementById('breadcrumb-product');

    if (categoryEl) {
        categoryEl.textContent = product.category.charAt(0).toUpperCase() + product.category.slice(1);
    }
    if (productEl) {
        productEl.textContent = product.name;
    }

    // Update page title
    document.title = `${product.name} - E-Commerce Store`;
}

// Render related products
export function renderRelatedProducts(productId) {
    const product = getProductById(productId);
    if (!product) return;

    const relatedProducts = getProductsByCategory(product.category)
        .filter(p => p.id !== productId)
        .slice(0, 4);

    const container = document.getElementById('related-products-container');
    if (!container) return;

    if (relatedProducts.length === 0) {
        container.innerHTML = '<p class="no-products">No related products found.</p>';
        return;
    }

    import('./products.js').then(module => {
        container.innerHTML = relatedProducts.map(p => module.createProductCard(p)).join('');

        // Add event listeners for "Add to Cart" buttons
        document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = parseInt(e.target.dataset.productId);
                const product = getProductById(productId);
                if (product) {
                    addToCart(product);
                    showNotification(`${product.name} added to cart!`);
                }
            });
        });
    });
}

// Show notification
function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: #27ae60;
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
    `;
    notification.textContent = message;

    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(400px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(style);

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideIn 0.3s ease-out reverse';
        setTimeout(() => {
            if (notification.parentNode) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}
