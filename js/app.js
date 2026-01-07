// Main Application File
// Handles initialization and page-specific logic

import { renderProducts, getProductById, searchProducts } from './products.js';
import { addToCart, updateCartCount } from './cart.js';

// State management
let currentCategory = 'all';
let currentSort = 'featured';

// Initialize app
function init() {
    // Update cart count on page load
    updateCartCount();

    // Check if we're on the home page
    const productsContainer = document.getElementById('products-container');
    if (productsContainer) {
        initHomePage();
    }
}

// Initialize home page
function initHomePage() {
    // Render products
    renderProducts('products-container', currentCategory, currentSort);

    // Setup filter and sort functionality
    setupFilters();

    // Setup search functionality
    setupSearch();

    // Setup mobile menu
    setupMobileMenu();

    // Setup category cards
    setupCategoryCards();

    // Add event listeners to "Add to Cart" buttons
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('add-to-cart-btn')) {
            const productId = parseInt(e.target.dataset.productId);
            const product = getProductById(productId);

            if (product) {
                addToCart(product);
                showNotification(`${product.name} added to cart!`);
            }
        }

        // Hero add to cart button
        if (e.target.id === 'hero-add-to-cart') {
            const productId = parseInt(e.target.dataset.productId);
            const product = getProductById(productId);

            if (product) {
                addToCart(product);
                showNotification(`${product.name} added to cart!`);
            }
        }
    });
}

// Setup filter and sort functionality
function setupFilters() {
    const categoryFilter = document.getElementById('category-filter');
    const sortFilter = document.getElementById('sort-filter');

    if (categoryFilter) {
        categoryFilter.addEventListener('change', (e) => {
            currentCategory = e.target.value;
            renderProducts('products-container', currentCategory, currentSort);
        });
    }

    if (sortFilter) {
        sortFilter.addEventListener('change', (e) => {
            currentSort = e.target.value;
            renderProducts('products-container', currentCategory, currentSort);
        });
    }
}

// Setup search functionality
function setupSearch() {
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.querySelector('.search-btn');

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();

            if (query.length > 0) {
                const results = searchProducts(query);
                displaySearchResults(results);
            } else {
                renderProducts('products-container', currentCategory, currentSort);
            }
        });
    }

    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            const query = searchInput.value.trim();
            if (query.length > 0) {
                const results = searchProducts(query);
                displaySearchResults(results);
            }
        });
    }
}

// Display search results
function displaySearchResults(products) {
    const container = document.getElementById('products-container');
    if (!container) return;

    if (products.length === 0) {
        container.innerHTML = '<p class="no-products">No products found matching your search.</p>';
        return;
    }

    import('./products.js').then(module => {
        container.innerHTML = products.map(product => module.createProductCard(product)).join('');
    });
}

// Setup mobile menu toggle
function setupMobileMenu() {
    const menuToggle = document.getElementById('mobile-menu-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });

        // Close menu when clicking a link
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
            });
        });
    }
}

// Setup category cards
function setupCategoryCards() {
    const categoryCards = document.querySelectorAll('.category-card');

    categoryCards.forEach(card => {
        card.addEventListener('click', (e) => {
            e.preventDefault();
            const category = card.dataset.category;

            // Update filter dropdown
            const categoryFilter = document.getElementById('category-filter');
            if (categoryFilter) {
                categoryFilter.value = category;
                currentCategory = category;
            }

            // Scroll to products section
            const productsSection = document.getElementById('featured');
            if (productsSection) {
                productsSection.scrollIntoView({ behavior: 'smooth' });
            }

            // Render filtered products
            renderProducts('products-container', category, currentSort);
        });
    });
}

// Show notification
function showNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: #27ae60;
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 5px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
    `;
    notification.textContent = message;

    // Add animation
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

    // Add to page
    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideIn 0.3s ease-out reverse';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Start the app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
