// Wishlist Page Script
import { renderWishlistPage, updateWishlistCount, initWishlistIcons } from './wishlist.js';
import { updateCartCount, getCurrentUser } from './auth.js';

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    // Update cart count
    updateCartCount();

    // Update wishlist count
    updateWishlistCount();

    // Update auth link
    updateAuthLink();

    // Render wishlist
    renderWishlistPage('wishlist-container');

    // Initialize wishlist button handlers
    initWishlistIcons();

    // Listen for wishlist changes
    window.addEventListener('wishlistChanged', () => {
        renderWishlistPage('wishlist-container');
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
