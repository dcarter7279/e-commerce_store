// Wishlist Module
// Manages user wishlist functionality

const WISHLIST_STORAGE_KEY = 'e-store-wishlist';

/**
 * Get user's wishlist from localStorage
 * Returns array of product IDs
 */
export function getWishlist() {
    try {
        const wishlist = localStorage.getItem(WISHLIST_STORAGE_KEY);
        return wishlist ? JSON.parse(wishlist) : [];
    } catch (error) {
        console.error('Error reading wishlist:', error);
        return [];
    }
}

/**
 * Save wishlist to localStorage
 */
function saveWishlist(wishlist) {
    try {
        localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlist));
        return true;
    } catch (error) {
        console.error('Error saving wishlist:', error);
        return false;
    }
}

/**
 * Add product to wishlist
 * @param {number} productId - ID of product to add
 * @returns {boolean} - Success status
 */
export function addToWishlist(productId) {
    const wishlist = getWishlist();

    if (!wishlist.includes(productId)) {
        wishlist.push(productId);
        const success = saveWishlist(wishlist);

        if (success) {
            updateWishlistCount();
            dispatchWishlistEvent('added', productId);
        }

        return success;
    }

    return false; // Already in wishlist
}

/**
 * Remove product from wishlist
 * @param {number} productId - ID of product to remove
 * @returns {boolean} - Success status
 */
export function removeFromWishlist(productId) {
    const wishlist = getWishlist();
    const index = wishlist.indexOf(productId);

    if (index > -1) {
        wishlist.splice(index, 1);
        const success = saveWishlist(wishlist);

        if (success) {
            updateWishlistCount();
            dispatchWishlistEvent('removed', productId);
        }

        return success;
    }

    return false;
}

/**
 * Toggle product in wishlist
 * @param {number} productId - ID of product to toggle
 * @returns {boolean} - True if added, false if removed
 */
export function toggleWishlist(productId) {
    const wishlist = getWishlist();

    if (wishlist.includes(productId)) {
        removeFromWishlist(productId);
        return false;
    } else {
        addToWishlist(productId);
        return true;
    }
}

/**
 * Check if product is in wishlist
 * @param {number} productId - ID of product to check
 * @returns {boolean}
 */
export function isInWishlist(productId) {
    const wishlist = getWishlist();
    return wishlist.includes(productId);
}

/**
 * Get wishlist count
 * @returns {number}
 */
export function getWishlistCount() {
    return getWishlist().length;
}

/**
 * Update wishlist count in UI
 */
export function updateWishlistCount() {
    const count = getWishlistCount();
    const badges = document.querySelectorAll('.wishlist-count');

    badges.forEach(badge => {
        badge.textContent = count;
        badge.style.display = count > 0 ? 'inline-block' : 'none';
    });
}

/**
 * Clear entire wishlist
 * @returns {boolean} - Success status
 */
export function clearWishlist() {
    const success = saveWishlist([]);

    if (success) {
        updateWishlistCount();
        dispatchWishlistEvent('cleared');
    }

    return success;
}

/**
 * Get wishlist products with full details
 * @returns {Promise<Array>} - Array of product objects
 */
export async function getWishlistProducts() {
    const wishlistIds = getWishlist();

    if (wishlistIds.length === 0) {
        return [];
    }

    // Import products module
    const { getProductById } = await import('./products.js');

    // Get full product details
    const products = wishlistIds
        .map(id => getProductById(id))
        .filter(product => product !== null);

    return products;
}

/**
 * Render wishlist page content
 * @param {string} containerId - ID of container to render into
 */
export async function renderWishlistPage(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Show loading state
    container.innerHTML = '<div class="loading"><div class="spinner"></div><p>Loading wishlist...</p></div>';

    try {
        const products = await getWishlistProducts();

        if (products.length === 0) {
            container.innerHTML = `
                <div class="empty-wishlist">
                    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                    </svg>
                    <h3>Your Wishlist is Empty</h3>
                    <p>Start adding products you love to your wishlist!</p>
                    <a href="index.html" class="btn btn-primary">Browse Products</a>
                </div>
            `;
            return;
        }

        // Import product card creator
        const { createProductCard } = await import('./products.js');

        // Render products
        container.innerHTML = `
            <div class="wishlist-header">
                <h2>My Wishlist (${products.length})</h2>
                <button class="btn btn-outline btn-small" id="clear-wishlist">Clear All</button>
            </div>
            <div class="wishlist-grid">
                ${products.map(product => createProductCard(product)).join('')}
            </div>
        `;

        // Add clear wishlist handler
        const clearBtn = document.getElementById('clear-wishlist');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to clear your entire wishlist?')) {
                    clearWishlist();
                    renderWishlistPage(containerId);
                }
            });
        }

    } catch (error) {
        console.error('Error rendering wishlist:', error);
        container.innerHTML = `
            <div class="error-state">
                <h3>Oops! Something went wrong</h3>
                <p>We couldn't load your wishlist. Please try again.</p>
                <button class="btn btn-primary" onclick="location.reload()">Retry</button>
            </div>
        `;
    }
}

/**
 * Initialize wishlist icons on product cards
 */
export function initWishlistIcons() {
    // Add click handlers to all wishlist buttons
    document.addEventListener('click', (e) => {
        const wishlistBtn = e.target.closest('.wishlist-btn');
        if (!wishlistBtn) return;

        e.preventDefault();
        e.stopPropagation();

        const productId = parseInt(wishlistBtn.dataset.productId);
        if (!productId) return;

        const isAdded = toggleWishlist(productId);

        // Update button appearance
        updateWishlistButton(wishlistBtn, isAdded);

        // Show notification
        showWishlistNotification(isAdded);
    });

    // Update initial button states
    updateAllWishlistButtons();
}

/**
 * Update wishlist button appearance
 */
export function updateWishlistButton(button, isInWishlist) {
    if (isInWishlist) {
        button.classList.add('active');
        button.setAttribute('aria-label', 'Remove from wishlist');
        button.title = 'Remove from wishlist';
    } else {
        button.classList.remove('active');
        button.setAttribute('aria-label', 'Add to wishlist');
        button.title = 'Add to wishlist';
    }
}

/**
 * Update all wishlist buttons on the page
 */
export function updateAllWishlistButtons() {
    const buttons = document.querySelectorAll('.wishlist-btn');

    buttons.forEach(button => {
        const productId = parseInt(button.dataset.productId);
        if (productId) {
            const inWishlist = isInWishlist(productId);
            updateWishlistButton(button, inWishlist);
        }
    });
}

/**
 * Show wishlist notification
 */
function showWishlistNotification(added) {
    const message = added
        ? 'Added to wishlist!'
        : 'Removed from wishlist';

    // Create notification
    const notification = document.createElement('div');
    notification.className = 'wishlist-notification';
    notification.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
        </svg>
        <span>${message}</span>
    `;

    document.body.appendChild(notification);

    // Trigger animation
    setTimeout(() => notification.classList.add('show'), 10);

    // Remove after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => document.body.removeChild(notification), 300);
    }, 3000);
}

/**
 * Dispatch custom wishlist event
 */
function dispatchWishlistEvent(action, productId = null) {
    const event = new CustomEvent('wishlistChanged', {
        detail: { action, productId, count: getWishlistCount() }
    });
    window.dispatchEvent(event);
}

/**
 * Create wishlist button HTML
 * @param {number} productId - Product ID
 * @returns {string} - HTML string
 */
export function createWishlistButton(productId) {
    const inWishlist = isInWishlist(productId);
    const activeClass = inWishlist ? 'active' : '';
    const ariaLabel = inWishlist ? 'Remove from wishlist' : 'Add to wishlist';

    return `
        <button
            class="wishlist-btn ${activeClass}"
            data-product-id="${productId}"
            aria-label="${ariaLabel}"
            title="${ariaLabel}"
        >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
        </button>
    `;
}

/**
 * Sync wishlist with server (for authenticated users)
 * This is a placeholder for future server integration
 */
export async function syncWishlistWithServer() {
    // Check if user is authenticated
    const { getCurrentUser } = await import('./auth.js');
    const user = getCurrentUser();

    if (!user) return;

    // TODO: Implement server sync
    console.log('Wishlist sync with server - to be implemented');

    // Example implementation:
    // const localWishlist = getWishlist();
    // const response = await fetch(`/api/users/${user.id}/wishlist`, {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({ productIds: localWishlist })
    // });
}

// Initialize wishlist count on module load
if (typeof document !== 'undefined') {
    updateWishlistCount();
}
