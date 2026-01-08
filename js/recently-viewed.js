// Recently Viewed Products Module
// Tracks and displays products the user has recently viewed

const RECENT_STORAGE_KEY = 'e-store-recently-viewed';
const MAX_RECENT_PRODUCTS = 12; // Maximum number of products to track

/**
 * Get recently viewed product IDs from localStorage
 * @returns {Array<number>} - Array of product IDs (most recent first)
 */
export function getRecentlyViewed() {
    try {
        const recent = localStorage.getItem(RECENT_STORAGE_KEY);
        return recent ? JSON.parse(recent) : [];
    } catch (error) {
        console.error('Error reading recently viewed:', error);
        return [];
    }
}

/**
 * Save recently viewed to localStorage
 */
function saveRecentlyViewed(productIds) {
    try {
        localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(productIds));
        return true;
    } catch (error) {
        console.error('Error saving recently viewed:', error);
        return false;
    }
}

/**
 * Add product to recently viewed list
 * @param {number} productId - ID of product to add
 */
export function addToRecentlyViewed(productId) {
    let recentIds = getRecentlyViewed();

    // Remove if already exists (to move to front)
    recentIds = recentIds.filter(id => id !== productId);

    // Add to front
    recentIds.unshift(productId);

    // Limit to max products
    if (recentIds.length > MAX_RECENT_PRODUCTS) {
        recentIds = recentIds.slice(0, MAX_RECENT_PRODUCTS);
    }

    saveRecentlyViewed(recentIds);
    dispatchRecentlyViewedEvent();
}

/**
 * Clear all recently viewed products
 */
export function clearRecentlyViewed() {
    saveRecentlyViewed([]);
    dispatchRecentlyViewedEvent();
}

/**
 * Get recently viewed products with full details
 * @param {number} limit - Maximum number of products to return
 * @returns {Promise<Array>} - Array of product objects
 */
export async function getRecentlyViewedProducts(limit = MAX_RECENT_PRODUCTS) {
    const recentIds = getRecentlyViewed();

    if (recentIds.length === 0) {
        return [];
    }

    // Import products module
    const { getProductById } = await import('./products.js');

    // Get full product details
    const products = recentIds
        .slice(0, limit)
        .map(id => getProductById(id))
        .filter(product => product !== null);

    return products;
}

/**
 * Render recently viewed products section
 * @param {string} containerId - ID of container to render into
 * @param {number} limit - Maximum number of products to display
 * @param {string} title - Section title
 */
export async function renderRecentlyViewed(containerId, limit = 6, title = 'Recently Viewed') {
    const container = document.getElementById(containerId);
    if (!container) return;

    try {
        const products = await getRecentlyViewedProducts(limit);

        if (products.length === 0) {
            container.innerHTML = '';
            container.style.display = 'none';
            return;
        }

        // Import product card creator
        const { createProductCard } = await import('./products.js');

        // Show container
        container.style.display = 'block';

        // Render products
        container.innerHTML = `
            <div class="recently-viewed-section">
                <div class="section-header">
                    <h3>${title}</h3>
                    <button class="btn-text" id="clear-recent">Clear History</button>
                </div>
                <div class="recently-viewed-grid">
                    ${products.map(product => createProductCard(product)).join('')}
                </div>
            </div>
        `;

        // Add clear history handler
        const clearBtn = document.getElementById('clear-recent');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                if (confirm('Clear your viewing history?')) {
                    clearRecentlyViewed();
                    container.innerHTML = '';
                    container.style.display = 'none';
                }
            });
        }

    } catch (error) {
        console.error('Error rendering recently viewed:', error);
        container.innerHTML = '';
    }
}

/**
 * Render recently viewed carousel (horizontal scroll)
 * @param {string} containerId - ID of container to render into
 * @param {number} limit - Maximum number of products to display
 */
export async function renderRecentlyViewedCarousel(containerId, limit = 8) {
    const container = document.getElementById(containerId);
    if (!container) return;

    try {
        const products = await getRecentlyViewedProducts(limit);

        if (products.length === 0) {
            container.innerHTML = '';
            container.style.display = 'none';
            return;
        }

        // Import product card creator
        const { createProductCard } = await import('./products.js');

        // Show container
        container.style.display = 'block';

        // Render carousel
        container.innerHTML = `
            <div class="recently-viewed-carousel">
                <div class="carousel-header">
                    <h3>Recently Viewed</h3>
                    <div class="carousel-controls">
                        <button class="carousel-btn carousel-prev" aria-label="Previous">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="15 18 9 12 15 6"></polyline>
                            </svg>
                        </button>
                        <button class="carousel-btn carousel-next" aria-label="Next">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="9 18 15 12 9 6"></polyline>
                            </svg>
                        </button>
                    </div>
                </div>
                <div class="carousel-container">
                    <div class="carousel-track">
                        ${products.map(product => `
                            <div class="carousel-item">
                                ${createProductCard(product)}
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;

        // Initialize carousel controls
        initCarouselControls(container);

    } catch (error) {
        console.error('Error rendering recently viewed carousel:', error);
        container.innerHTML = '';
    }
}

/**
 * Initialize carousel scroll controls
 */
function initCarouselControls(container) {
    const track = container.querySelector('.carousel-track');
    const prevBtn = container.querySelector('.carousel-prev');
    const nextBtn = container.querySelector('.carousel-next');

    if (!track || !prevBtn || !nextBtn) return;

    const scrollAmount = 300;

    prevBtn.addEventListener('click', () => {
        track.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    });

    nextBtn.addEventListener('click', () => {
        track.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    });

    // Update button states based on scroll position
    const updateButtonStates = () => {
        const { scrollLeft, scrollWidth, clientWidth } = track;

        prevBtn.disabled = scrollLeft <= 0;
        nextBtn.disabled = scrollLeft + clientWidth >= scrollWidth - 10;
    };

    track.addEventListener('scroll', updateButtonStates);
    updateButtonStates();
}

/**
 * Track product view (call this on product detail pages)
 * @param {number} productId - ID of product being viewed
 */
export function trackProductView(productId) {
    if (!productId) return;

    // Add to recently viewed
    addToRecentlyViewed(productId);

    // Track in analytics (placeholder)
    trackViewEvent(productId);
}

/**
 * Track view event for analytics
 */
function trackViewEvent(productId) {
    // Placeholder for analytics integration
    console.log(`Product ${productId} viewed`);

    // Example: Google Analytics
    // if (window.gtag) {
    //     gtag('event', 'view_item', {
    //         items: [{ id: productId }]
    //     });
    // }
}

/**
 * Dispatch custom recently viewed event
 */
function dispatchRecentlyViewedEvent() {
    const event = new CustomEvent('recentlyViewedChanged', {
        detail: { count: getRecentlyViewed().length }
    });
    window.dispatchEvent(event);
}

/**
 * Get recently viewed count
 * @returns {number}
 */
export function getRecentlyViewedCount() {
    return getRecentlyViewed().length;
}

/**
 * Check if product was recently viewed
 * @param {number} productId - Product ID to check
 * @returns {boolean}
 */
export function wasRecentlyViewed(productId) {
    const recent = getRecentlyViewed();
    return recent.includes(productId);
}

/**
 * Get recently viewed except current product
 * Useful for "You May Also Like" sections on product pages
 * @param {number} excludeId - Product ID to exclude (current product)
 * @param {number} limit - Maximum number to return
 * @returns {Promise<Array>}
 */
export async function getRecentlyViewedExcept(excludeId, limit = 4) {
    let recentIds = getRecentlyViewed();

    // Remove the excluded ID
    recentIds = recentIds.filter(id => id !== excludeId);

    // Limit results
    recentIds = recentIds.slice(0, limit);

    if (recentIds.length === 0) {
        return [];
    }

    // Get full product details
    const { getProductById } = await import('./products.js');

    const products = recentIds
        .map(id => getProductById(id))
        .filter(product => product !== null);

    return products;
}

/**
 * Initialize recently viewed tracking on product pages
 * Call this on product detail pages
 */
export function initProductViewTracking() {
    // Get product ID from URL or data attribute
    const productId = getProductIdFromPage();

    if (productId) {
        trackProductView(productId);
    }
}

/**
 * Get product ID from current page
 * Checks URL parameter or data attribute
 */
function getProductIdFromPage() {
    // Check URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const urlId = urlParams.get('id');

    if (urlId) {
        return parseInt(urlId);
    }

    // Check data attribute on main container
    const container = document.querySelector('[data-product-id]');
    if (container) {
        return parseInt(container.dataset.productId);
    }

    return null;
}
