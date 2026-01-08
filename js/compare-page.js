// Compare Page Script
import { renderComparePage, updateCompareCount, initCompareButtons } from './compare.js';
import { updateCartCount, getCurrentUser } from './auth.js';
import { updateWishlistCount, initWishlistIcons } from './wishlist.js';

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    // Update counts
    updateCartCount();
    updateWishlistCount();
    updateCompareCount();

    // Update auth link
    updateAuthLink();

    // Render comparison
    renderComparePage('compare-container');

    // Initialize button handlers
    initCompareButtons();
    initWishlistIcons();

    // Listen for comparison changes
    window.addEventListener('compareChanged', () => {
        renderComparePage('compare-container');
    });
});

/**
 * Update auth link based on user state
 */
function updateAuthLink() {
    const authLink = document.getElementById('auth-link');
    const user = getCurrentUser();

    if (user) {
        authLink.textContent = 'Profile';
        authLink.href = 'profile.html';
    } else {
        authLink.textContent = 'Login';
        authLink.href = 'login.html';
    }
}
