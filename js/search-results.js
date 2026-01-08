// Search Results Page Module
import { initSearchResultsPage, initSearchAutocomplete, searchProducts, getActiveFilters, clearAllFilters } from './search.js';
import { createProductCard } from './products.js';
import { updateCartCount, getCurrentUser } from './auth.js';

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    // Update cart count
    updateCartCount();

    // Update auth link
    updateAuthLink();

    // Initialize search functionality
    initSearchPage();
});

/**
 * Initialize the search results page
 */
function initSearchPage() {
    // Get URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('q') || '';

    // Update search input
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.value = query;
    }

    // Initialize auto-complete for search bar
    initSearchAutocomplete('search-input', 'search-suggestions');

    // Initialize search button
    const searchButton = document.getElementById('search-button');
    if (searchButton) {
        searchButton.addEventListener('click', handleSearchSubmit);
    }

    // Initialize enter key on search input
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleSearchSubmit();
            }
        });
    }

    // Initialize filters
    initFilters();

    // Initialize sort
    initSort();

    // Perform initial search
    performSearch();
}

/**
 * Handle search submission
 */
function handleSearchSubmit() {
    const searchInput = document.getElementById('search-input');
    const query = searchInput.value.trim();

    if (query) {
        // Update URL
        const url = new URL(window.location);
        url.searchParams.set('q', query);
        window.history.pushState({}, '', url);

        // Perform search
        performSearch();
    }
}

/**
 * Initialize filter controls
 */
function initFilters() {
    // Get URL parameters for initial state
    const urlParams = new URLSearchParams(window.location.search);

    // Populate category filters
    populateCategoryFilters();

    // Set initial filter states from URL
    const category = urlParams.get('category');
    if (category) {
        const checkbox = document.querySelector(`input[data-category="${category}"]`);
        if (checkbox) checkbox.checked = true;
    }

    const minPrice = urlParams.get('minPrice');
    const maxPrice = urlParams.get('maxPrice');
    if (minPrice) document.getElementById('min-price').value = minPrice;
    if (maxPrice) document.getElementById('max-price').value = maxPrice;

    const inStock = urlParams.get('inStock');
    if (inStock === 'true') document.getElementById('in-stock-filter').checked = true;

    const onSale = urlParams.get('onSale');
    if (onSale === 'true') document.getElementById('on-sale-filter').checked = true;

    // Category filter changes
    document.getElementById('category-filters').addEventListener('change', (e) => {
        if (e.target.type === 'checkbox') {
            updateFiltersInURL();
            performSearch();
        }
    });

    // Price filter
    document.getElementById('apply-price').addEventListener('click', () => {
        updateFiltersInURL();
        performSearch();
    });

    // Stock filter
    document.getElementById('in-stock-filter').addEventListener('change', () => {
        updateFiltersInURL();
        performSearch();
    });

    // Sale filter
    document.getElementById('on-sale-filter').addEventListener('change', () => {
        updateFiltersInURL();
        performSearch();
    });

    // Clear all filters
    document.getElementById('clear-filters').addEventListener('click', () => {
        clearAllFilters();

        // Clear form inputs
        document.querySelectorAll('.filter-checkbox input').forEach(cb => cb.checked = false);
        document.getElementById('min-price').value = '';
        document.getElementById('max-price').value = '';

        // Update URL
        const url = new URL(window.location);
        const query = url.searchParams.get('q');
        url.search = query ? `?q=${encodeURIComponent(query)}` : '';
        window.history.pushState({}, '', url);

        // Perform search
        performSearch();
    });
}

/**
 * Populate category filter options
 */
function populateCategoryFilters() {
    const categories = [
        { value: 'electronics', label: 'Electronics' },
        { value: 'clothing', label: 'Clothing' },
        { value: 'home', label: 'Home & Garden' },
        { value: 'sports', label: 'Sports & Outdoors' },
        { value: 'books', label: 'Books' },
        { value: 'toys', label: 'Toys & Games' },
        { value: 'beauty', label: 'Beauty & Personal Care' },
        { value: 'food', label: 'Food & Grocery' }
    ];

    const container = document.getElementById('category-filters');
    container.innerHTML = categories.map(cat => `
        <label class="filter-checkbox">
            <input type="checkbox" data-category="${cat.value}">
            <span>${cat.label}</span>
        </label>
    `).join('');
}

/**
 * Update filters in URL
 */
function updateFiltersInURL() {
    const url = new URL(window.location);

    // Get selected category (only one for now, can be extended to multiple)
    const selectedCategory = document.querySelector('input[data-category]:checked');
    if (selectedCategory) {
        url.searchParams.set('category', selectedCategory.dataset.category);
    } else {
        url.searchParams.delete('category');
    }

    // Price range
    const minPrice = document.getElementById('min-price').value;
    const maxPrice = document.getElementById('max-price').value;
    if (minPrice) {
        url.searchParams.set('minPrice', minPrice);
    } else {
        url.searchParams.delete('minPrice');
    }
    if (maxPrice) {
        url.searchParams.set('maxPrice', maxPrice);
    } else {
        url.searchParams.delete('maxPrice');
    }

    // Stock filter
    const inStock = document.getElementById('in-stock-filter').checked;
    if (inStock) {
        url.searchParams.set('inStock', 'true');
    } else {
        url.searchParams.delete('inStock');
    }

    // Sale filter
    const onSale = document.getElementById('on-sale-filter').checked;
    if (onSale) {
        url.searchParams.set('onSale', 'true');
    } else {
        url.searchParams.delete('onSale');
    }

    window.history.pushState({}, '', url);
}

/**
 * Initialize sort controls
 */
function initSort() {
    const sortSelect = document.getElementById('sort-select');

    // Set initial value from URL
    const urlParams = new URLSearchParams(window.location.search);
    const sort = urlParams.get('sort');
    if (sort) {
        sortSelect.value = sort;
    }

    // Handle sort changes
    sortSelect.addEventListener('change', () => {
        const url = new URL(window.location);
        url.searchParams.set('sort', sortSelect.value);
        window.history.pushState({}, '', url);

        performSearch();
    });
}

/**
 * Perform search with current filters
 */
function performSearch() {
    // Show loading state
    const loadingState = document.getElementById('loading-state');
    const resultsGrid = document.getElementById('search-results');
    const noResults = document.getElementById('no-results');

    loadingState.style.display = 'block';
    resultsGrid.style.display = 'none';
    noResults.style.display = 'none';

    // Get search parameters
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('q') || '';
    const category = urlParams.get('category');
    const minPrice = urlParams.get('minPrice');
    const maxPrice = urlParams.get('maxPrice');
    const inStock = urlParams.get('inStock') === 'true';
    const onSale = urlParams.get('onSale') === 'true';
    const sort = urlParams.get('sort') || 'relevance';

    // Build filters object
    const filters = {};
    if (category) filters.category = category;
    if (minPrice) filters.minPrice = parseFloat(minPrice);
    if (maxPrice) filters.maxPrice = parseFloat(maxPrice);
    if (inStock) filters.inStock = true;
    if (onSale) filters.onSale = true;

    // Perform search
    setTimeout(() => {
        const results = searchProducts(query, filters, sort);

        // Hide loading state
        loadingState.style.display = 'none';

        // Update search title
        const titleElement = document.getElementById('search-query-title');
        if (query) {
            titleElement.textContent = `Search results for "${query}"`;
        } else {
            titleElement.textContent = 'All Products';
        }

        // Display results
        if (results.length > 0) {
            displayResults(results);
            resultsGrid.style.display = 'grid';
        } else {
            noResults.style.display = 'block';
        }

        // Update results count
        updateResultsCount(results.length, query);

        // Display active filters
        displayActiveFilters();
    }, 300); // Simulate loading delay
}

/**
 * Display search results
 */
function displayResults(results) {
    const resultsGrid = document.getElementById('search-results');

    resultsGrid.innerHTML = results.map(product =>
        createProductCard(product)
    ).join('');
}

/**
 * Update results count
 */
function updateResultsCount(count, query) {
    const countElement = document.getElementById('results-count');

    if (count === 0) {
        countElement.textContent = 'No products found';
    } else if (count === 1) {
        countElement.textContent = '1 product found';
    } else {
        countElement.textContent = `${count} products found`;
    }
}

/**
 * Display active filters as chips
 */
function displayActiveFilters() {
    const activeFilters = getActiveFilters();
    const container = document.getElementById('active-filters');

    if (activeFilters.length === 0) {
        container.style.display = 'none';
        return;
    }

    container.style.display = 'flex';
    container.innerHTML = activeFilters.map(filter => `
        <div class="filter-chip" data-filter="${filter.key}">
            <span>${filter.label}: ${filter.value}</span>
            <button type="button" class="remove-filter" data-filter="${filter.key}">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        </div>
    `).join('');

    // Add remove filter handlers
    container.querySelectorAll('.remove-filter').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const filterKey = e.currentTarget.dataset.filter;
            removeFilter(filterKey);
        });
    });
}

/**
 * Remove a specific filter
 */
function removeFilter(filterKey) {
    const url = new URL(window.location);

    // Remove from URL
    url.searchParams.delete(filterKey);

    // Update form controls
    switch (filterKey) {
        case 'category':
            document.querySelectorAll('input[data-category]').forEach(cb => cb.checked = false);
            break;
        case 'minPrice':
            document.getElementById('min-price').value = '';
            break;
        case 'maxPrice':
            document.getElementById('max-price').value = '';
            break;
        case 'inStock':
            document.getElementById('in-stock-filter').checked = false;
            break;
        case 'onSale':
            document.getElementById('on-sale-filter').checked = false;
            break;
    }

    window.history.pushState({}, '', url);
    performSearch();
}

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
