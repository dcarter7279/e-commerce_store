// Search Module
// Handles product search with auto-suggestions and filtering

import { products, getProductById, createProductCard } from './products.js';

// Search configuration
const SEARCH_CONFIG = {
    MIN_QUERY_LENGTH: 2,
    DEBOUNCE_DELAY: 300,
    MAX_SUGGESTIONS: 5,
    MAX_RESULTS: 50
};

// Search state
let searchDebounceTimer = null;
let currentQuery = '';
let searchResults = [];

// ==================== Search Functions ====================

// Main search function
export function searchProducts(query, filters = {}) {
    if (!query || query.trim().length < SEARCH_CONFIG.MIN_QUERY_LENGTH) {
        return [];
    }

    const searchQuery = query.toLowerCase().trim();
    currentQuery = searchQuery;

    // Search in product name, description, category, and features
    let results = products.filter(product => {
        const matchesQuery =
            product.name.toLowerCase().includes(searchQuery) ||
            product.description.toLowerCase().includes(searchQuery) ||
            (product.longDescription && product.longDescription.toLowerCase().includes(searchQuery)) ||
            product.category.toLowerCase().includes(searchQuery) ||
            (product.features && product.features.some(f => f.toLowerCase().includes(searchQuery))) ||
            (product.specifications && Object.values(product.specifications).some(
                v => v.toString().toLowerCase().includes(searchQuery)
            ));

        // Apply filters
        if (filters.category && product.category !== filters.category) {
            return false;
        }

        if (filters.minPrice && product.price < filters.minPrice) {
            return false;
        }

        if (filters.maxPrice && product.price > filters.maxPrice) {
            return false;
        }

        if (filters.inStock && product.stock === 0) {
            return false;
        }

        if (filters.onSale && (!product.originalPrice || product.originalPrice <= product.price)) {
            return false;
        }

        if (filters.minRating && product.rating < filters.minRating) {
            return false;
        }

        return matchesQuery;
    });

    // Calculate relevance score
    results = results.map(product => ({
        ...product,
        relevanceScore: calculateRelevanceScore(product, searchQuery)
    }));

    // Sort by relevance
    results.sort((a, b) => b.relevanceScore - a.relevanceScore);

    // Limit results
    results = results.slice(0, SEARCH_CONFIG.MAX_RESULTS);

    searchResults = results;
    return results;
}

// Calculate relevance score for search results
function calculateRelevanceScore(product, query) {
    let score = 0;

    const nameLower = product.name.toLowerCase();
    const descLower = product.description.toLowerCase();
    const categoryLower = product.category.toLowerCase();

    // Exact match in name (highest priority)
    if (nameLower === query) {
        score += 100;
    } else if (nameLower.startsWith(query)) {
        score += 50;
    } else if (nameLower.includes(query)) {
        score += 30;
    }

    // Match in description
    if (descLower.includes(query)) {
        score += 20;
    }

    // Match in category
    if (categoryLower === query) {
        score += 40;
    } else if (categoryLower.includes(query)) {
        score += 15;
    }

    // Match in features
    if (product.features && product.features.some(f => f.toLowerCase().includes(query))) {
        score += 10;
    }

    // Boost for featured products
    if (product.featured) {
        score += 5;
    }

    // Boost for highly rated products
    if (product.rating) {
        score += product.rating;
    }

    // Boost for products with reviews
    if (product.reviewCount) {
        score += Math.min(product.reviewCount / 10, 5);
    }

    // Penalize out of stock
    if (product.stock === 0) {
        score -= 20;
    }

    return score;
}

// Get search suggestions
export function getSearchSuggestions(query) {
    if (!query || query.trim().length < SEARCH_CONFIG.MIN_QUERY_LENGTH) {
        return [];
    }

    const searchQuery = query.toLowerCase().trim();

    // Get unique suggestions from product names
    const nameSuggestions = products
        .filter(p => p.name.toLowerCase().includes(searchQuery))
        .map(p => ({
            type: 'product',
            text: p.name,
            product: p
        }))
        .slice(0, 3);

    // Get category suggestions
    const categories = [...new Set(products.map(p => p.category))];
    const categorySuggestions = categories
        .filter(c => c.toLowerCase().includes(searchQuery))
        .map(c => ({
            type: 'category',
            text: c,
            category: c
        }))
        .slice(0, 2);

    // Combine suggestions
    const suggestions = [...nameSuggestions, ...categorySuggestions]
        .slice(0, SEARCH_CONFIG.MAX_SUGGESTIONS);

    return suggestions;
}

// ==================== Auto-Suggestion UI ====================

export function initSearchAutocomplete(inputId, suggestionsId) {
    const input = document.getElementById(inputId);
    const suggestionsContainer = document.getElementById(suggestionsId);

    if (!input || !suggestionsContainer) {
        console.error('Search input or suggestions container not found');
        return;
    }

    // Input event for auto-suggestions
    input.addEventListener('input', (e) => {
        const query = e.target.value;

        // Clear previous timer
        if (searchDebounceTimer) {
            clearTimeout(searchDebounceTimer);
        }

        // Debounce search
        searchDebounceTimer = setTimeout(() => {
            if (query.length >= SEARCH_CONFIG.MIN_QUERY_LENGTH) {
                const suggestions = getSearchSuggestions(query);
                displaySuggestions(suggestions, suggestionsContainer, input);
            } else {
                hideSuggestions(suggestionsContainer);
            }
        }, SEARCH_CONFIG.DEBOUNCE_DELAY);
    });

    // Handle Enter key
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            performSearch(input.value);
            hideSuggestions(suggestionsContainer);
        } else if (e.key === 'Escape') {
            hideSuggestions(suggestionsContainer);
        }
    });

    // Hide suggestions when clicking outside
    document.addEventListener('click', (e) => {
        if (!input.contains(e.target) && !suggestionsContainer.contains(e.target)) {
            hideSuggestions(suggestionsContainer);
        }
    });

    // Focus event
    input.addEventListener('focus', () => {
        if (input.value.length >= SEARCH_CONFIG.MIN_QUERY_LENGTH) {
            const suggestions = getSearchSuggestions(input.value);
            displaySuggestions(suggestions, suggestionsContainer, input);
        }
    });
}

function displaySuggestions(suggestions, container, input) {
    if (suggestions.length === 0) {
        hideSuggestions(container);
        return;
    }

    container.innerHTML = suggestions.map((suggestion, index) => {
        if (suggestion.type === 'product') {
            return `
                <div class="suggestion-item" data-index="${index}" data-type="product" data-text="${suggestion.text}">
                    <svg class="suggestion-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="9" cy="21" r="1"></circle>
                        <circle cx="20" cy="21" r="1"></circle>
                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                    </svg>
                    <span class="suggestion-text">${highlightMatch(suggestion.text, input.value)}</span>
                    ${suggestion.product.price ? `<span class="suggestion-price">$${suggestion.product.price.toFixed(2)}</span>` : ''}
                </div>
            `;
        } else if (suggestion.type === 'category') {
            return `
                <div class="suggestion-item" data-index="${index}" data-type="category" data-text="${suggestion.text}">
                    <svg class="suggestion-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                        <polyline points="22,6 12,13 2,6"></polyline>
                    </svg>
                    <span class="suggestion-text">in <strong>${suggestion.text}</strong></span>
                </div>
            `;
        }
    }).join('');

    container.style.display = 'block';

    // Add click handlers
    container.querySelectorAll('.suggestion-item').forEach(item => {
        item.addEventListener('click', () => {
            const text = item.dataset.text;
            const type = item.dataset.type;

            if (type === 'product') {
                input.value = text;
                performSearch(text);
            } else if (type === 'category') {
                performSearch(text, { category: text });
            }

            hideSuggestions(container);
        });
    });
}

function hideSuggestions(container) {
    container.style.display = 'none';
    container.innerHTML = '';
}

function highlightMatch(text, query) {
    if (!query) return text;

    const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
    return text.replace(regex, '<strong>$1</strong>');
}

function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ==================== Search Execution ====================

function performSearch(query, filters = {}) {
    if (!query || query.trim().length === 0) {
        return;
    }

    // Navigate to search results page
    const params = new URLSearchParams({
        q: query,
        ...filters
    });

    window.location.href = `search-results.html?${params.toString()}`;
}

// ==================== Search Results Page ====================

export function initSearchResultsPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('q');
    const category = urlParams.get('category');
    const minPrice = urlParams.get('minPrice');
    const maxPrice = urlParams.get('maxPrice');
    const inStock = urlParams.get('inStock') === 'true';
    const onSale = urlParams.get('onSale') === 'true';
    const sort = urlParams.get('sort') || 'relevance';

    if (!query) {
        displayNoQuery();
        return;
    }

    // Build filters
    const filters = {};
    if (category) filters.category = category;
    if (minPrice) filters.minPrice = parseFloat(minPrice);
    if (maxPrice) filters.maxPrice = parseFloat(maxPrice);
    if (inStock) filters.inStock = true;
    if (onSale) filters.onSale = true;

    // Perform search
    const results = searchProducts(query, filters);

    // Apply sorting
    sortResults(results, sort);

    // Display results
    displaySearchResults(query, results, filters);

    // Initialize filters
    initSearchFilters(query);
}

function sortResults(results, sortBy) {
    switch (sortBy) {
        case 'price-asc':
            results.sort((a, b) => a.price - b.price);
            break;
        case 'price-desc':
            results.sort((a, b) => b.price - a.price);
            break;
        case 'rating':
            results.sort((a, b) => (b.rating || 0) - (a.rating || 0));
            break;
        case 'name':
            results.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'relevance':
        default:
            // Already sorted by relevance
            break;
    }
}

function displaySearchResults(query, results, filters) {
    // Update search input
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.value = query;
    }

    // Update page title
    document.title = `Search Results for "${query}" - E-Store`;

    // Update search query display
    const queryDisplay = document.getElementById('search-query');
    if (queryDisplay) {
        queryDisplay.textContent = query;
    }

    // Update results count
    const countDisplay = document.getElementById('results-count');
    if (countDisplay) {
        countDisplay.textContent = `${results.length} ${results.length === 1 ? 'result' : 'results'}`;
    }

    // Display active filters
    displayActiveFilters(filters);

    // Display results
    const resultsContainer = document.getElementById('search-results');
    if (!resultsContainer) return;

    if (results.length === 0) {
        resultsContainer.innerHTML = `
            <div class="no-results">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                </svg>
                <h2>No products found</h2>
                <p>We couldn't find any products matching "${query}"</p>
                <p class="search-suggestions">Try different keywords or browse our categories</p>
                <a href="index.html" class="btn btn-primary">Back to Home</a>
            </div>
        `;
    } else {
        resultsContainer.innerHTML = results.map(product => createProductCard(product)).join('');
    }
}

function displayActiveFilters(filters) {
    const container = document.getElementById('active-filters');
    if (!container) return;

    const filterTags = [];

    if (filters.category) {
        filterTags.push(`
            <span class="filter-tag">
                Category: ${filters.category}
                <button class="remove-filter" data-filter="category">×</button>
            </span>
        `);
    }

    if (filters.minPrice || filters.maxPrice) {
        const priceText = filters.minPrice && filters.maxPrice
            ? `$${filters.minPrice} - $${filters.maxPrice}`
            : filters.minPrice
            ? `Over $${filters.minPrice}`
            : `Under $${filters.maxPrice}`;

        filterTags.push(`
            <span class="filter-tag">
                Price: ${priceText}
                <button class="remove-filter" data-filter="price">×</button>
            </span>
        `);
    }

    if (filters.inStock) {
        filterTags.push(`
            <span class="filter-tag">
                In Stock
                <button class="remove-filter" data-filter="inStock">×</button>
            </span>
        `);
    }

    if (filters.onSale) {
        filterTags.push(`
            <span class="filter-tag">
                On Sale
                <button class="remove-filter" data-filter="onSale">×</button>
            </span>
        `);
    }

    if (filterTags.length > 0) {
        container.innerHTML = filterTags.join('');
        container.style.display = 'flex';

        // Add remove filter handlers
        container.querySelectorAll('.remove-filter').forEach(btn => {
            btn.addEventListener('click', () => {
                removeFilter(btn.dataset.filter);
            });
        });
    } else {
        container.style.display = 'none';
    }
}

function removeFilter(filterName) {
    const urlParams = new URLSearchParams(window.location.search);

    if (filterName === 'category') {
        urlParams.delete('category');
    } else if (filterName === 'price') {
        urlParams.delete('minPrice');
        urlParams.delete('maxPrice');
    } else if (filterName === 'inStock') {
        urlParams.delete('inStock');
    } else if (filterName === 'onSale') {
        urlParams.delete('onSale');
    }

    window.location.search = urlParams.toString();
}

function displayNoQuery() {
    const resultsContainer = document.getElementById('search-results');
    if (resultsContainer) {
        resultsContainer.innerHTML = `
            <div class="no-results">
                <h2>Enter a search query</h2>
                <p>Please enter keywords to search for products</p>
                <a href="index.html" class="btn btn-primary">Back to Home</a>
            </div>
        `;
    }
}

// ==================== Search Filters ====================

function initSearchFilters(query) {
    // Category filter
    const categorySelect = document.getElementById('filter-category');
    if (categorySelect) {
        categorySelect.addEventListener('change', () => {
            updateSearchFilter('category', categorySelect.value);
        });
    }

    // Price filter
    const minPriceInput = document.getElementById('filter-min-price');
    const maxPriceInput = document.getElementById('filter-max-price');
    const applyPriceBtn = document.getElementById('apply-price-filter');

    if (applyPriceBtn) {
        applyPriceBtn.addEventListener('click', () => {
            const minPrice = minPriceInput?.value;
            const maxPrice = maxPriceInput?.value;

            const urlParams = new URLSearchParams(window.location.search);

            if (minPrice) urlParams.set('minPrice', minPrice);
            else urlParams.delete('minPrice');

            if (maxPrice) urlParams.set('maxPrice', maxPrice);
            else urlParams.delete('maxPrice');

            window.location.search = urlParams.toString();
        });
    }

    // Stock filter
    const inStockCheck = document.getElementById('filter-in-stock');
    if (inStockCheck) {
        inStockCheck.addEventListener('change', () => {
            updateSearchFilter('inStock', inStockCheck.checked);
        });
    }

    // Sale filter
    const onSaleCheck = document.getElementById('filter-on-sale');
    if (onSaleCheck) {
        onSaleCheck.addEventListener('change', () => {
            updateSearchFilter('onSale', onSaleCheck.checked);
        });
    }

    // Sort filter
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
        sortSelect.addEventListener('change', () => {
            updateSearchFilter('sort', sortSelect.value);
        });
    }

    // Clear filters
    const clearFiltersBtn = document.getElementById('clear-filters');
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', () => {
            window.location.href = `search-results.html?q=${encodeURIComponent(query)}`;
        });
    }
}

function updateSearchFilter(filterName, value) {
    const urlParams = new URLSearchParams(window.location.search);

    if (value && value !== '' && value !== 'all') {
        urlParams.set(filterName, value);
    } else {
        urlParams.delete(filterName);
    }

    window.location.search = urlParams.toString();
}

// ==================== Quick Search (Homepage) ====================

export function performQuickSearch(query) {
    if (!query || query.trim().length === 0) {
        return;
    }

    performSearch(query);
}

// Export current results for other modules
export function getCurrentSearchResults() {
    return searchResults;
}

export function getCurrentQuery() {
    return currentQuery;
}
