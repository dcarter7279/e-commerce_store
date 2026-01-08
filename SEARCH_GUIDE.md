# Search Functionality Guide

This guide explains how to use and customize the search functionality in the E-Commerce site.

## Overview

The search system provides:
- **Keyword-based search** - Find products by name, description, category, and features
- **Auto-suggestions** - Real-time suggestions as users type
- **Advanced filtering** - Category, price range, stock status, and sale filters
- **Relevance scoring** - Results ranked by relevance to search query
- **Multiple sort options** - Sort by relevance, price, rating, or name

## Files

### JavaScript Modules

- **[js/search.js](js/search.js)** - Core search functionality and algorithms
- **[js/search-results.js](js/search-results.js)** - Search results page logic
- **[js/app.js](js/app.js)** - Search integration on main pages

### HTML Pages

- **[search-results.html](search-results.html)** - Dedicated search results page

### Stylesheets

- **[css/search.css](css/search.css)** - Search UI styling

## Features

### 1. Keyword Search

The search algorithm searches across multiple product fields:

- **Product name** (highest priority)
- **Product description**
- **Category**
- **Features**

#### Relevance Scoring

Products are scored based on match quality:

| Match Type | Score |
|------------|-------|
| Exact name match | +100 points |
| Name starts with query | +50 points |
| Name contains query | +30 points |
| Category exact match | +40 points |
| Category contains query | +15 points |
| Feature match | +10 points per feature |
| Featured product | +5 points |
| High rating (4.5+) | +3 points |
| Has reviews | +2 points |
| Out of stock | -20 points |

### 2. Auto-Suggestions

Real-time suggestions appear as users type (minimum 2 characters).

**Features:**
- Debounced input (300ms delay)
- Displays up to 5 suggestions
- Shows product names (max 3) and categories (max 2)
- Click or Enter to select
- Escape to close
- Click outside to close

**Usage Example:**

```javascript
import { initSearchAutocomplete } from './search.js';

// Initialize on a search input
initSearchAutocomplete('search-input', 'search-suggestions');
```

### 3. Filters

#### Category Filter
Filter by product category (electronics, clothing, home, sports, books, toys, beauty, food).

#### Price Range Filter
Set minimum and maximum price bounds.

#### Availability Filter
Show only in-stock products.

#### Special Offers Filter
Show only products on sale.

### 4. Sorting

Sort results by:
- **Relevance** (default) - Based on relevance score
- **Price: Low to High**
- **Price: High to Low**
- **Customer Rating** - Highest rated first
- **Name: A to Z** - Alphabetical order

## Usage

### Basic Search

Navigate users to the search results page with a query:

```javascript
// From any page
const query = 'wireless headphones';
window.location.href = `search-results.html?q=${encodeURIComponent(query)}`;
```

### Search with Filters

Add URL parameters for filters:

```javascript
const params = new URLSearchParams({
    q: 'laptop',
    category: 'electronics',
    minPrice: '500',
    maxPrice: '1500',
    inStock: 'true',
    sort: 'price-low'
});

window.location.href = `search-results.html?${params.toString()}`;
```

### Programmatic Search

Use the search function directly:

```javascript
import { searchProducts } from './search.js';

const results = searchProducts('wireless mouse', {
    category: 'electronics',
    minPrice: 10,
    maxPrice: 50,
    inStock: true,
    onSale: true
}, 'price-low');

console.log(results); // Array of matching products
```

### Get Suggestions

```javascript
import { getSearchSuggestions } from './search.js';

const suggestions = getSearchSuggestions('head');
// Returns: [
//   { text: 'Premium Wireless Headphones', type: 'product' },
//   { text: 'Noise-Canceling Headphones', type: 'product' },
//   { text: 'Audio', type: 'category' }
// ]
```

## API Reference

### `searchProducts(query, filters, sortBy)`

Searches products with optional filters and sorting.

**Parameters:**
- `query` (string) - Search query
- `filters` (object, optional) - Filter criteria
  - `category` (string) - Category name
  - `minPrice` (number) - Minimum price
  - `maxPrice` (number) - Maximum price
  - `inStock` (boolean) - Only in-stock items
  - `onSale` (boolean) - Only sale items
- `sortBy` (string, optional) - Sort method
  - `'relevance'` (default)
  - `'price-low'`
  - `'price-high'`
  - `'rating'`
  - `'name'`

**Returns:** Array of product objects matching criteria (max 50 results)

**Example:**

```javascript
const results = searchProducts('laptop', {
    category: 'electronics',
    minPrice: 500,
    maxPrice: 2000,
    inStock: true
}, 'price-low');
```

### `getSearchSuggestions(query)`

Gets auto-complete suggestions for a query.

**Parameters:**
- `query` (string) - Partial search query (min 2 characters)

**Returns:** Array of suggestion objects (max 5)
- `text` (string) - Suggestion text
- `type` (string) - 'product' or 'category'

**Example:**

```javascript
const suggestions = getSearchSuggestions('wire');
// [
//   { text: 'Wireless Mouse', type: 'product' },
//   { text: 'Wireless Keyboard', type: 'product' },
//   { text: 'Accessories', type: 'category' }
// ]
```

### `initSearchAutocomplete(inputId, suggestionsId)`

Initializes auto-complete functionality on a search input.

**Parameters:**
- `inputId` (string) - ID of the search input element
- `suggestionsId` (string) - ID of the suggestions dropdown container

**Example:**

```javascript
initSearchAutocomplete('search-input', 'search-suggestions');
```

### `getActiveFilters()`

Gets currently active filters from URL parameters.

**Returns:** Array of active filter objects
- `key` (string) - Filter parameter name
- `label` (string) - Display label
- `value` (string) - Filter value

**Example:**

```javascript
const activeFilters = getActiveFilters();
// [
//   { key: 'category', label: 'Category', value: 'electronics' },
//   { key: 'minPrice', label: 'Min Price', value: '$500' }
// ]
```

### `clearAllFilters()`

Clears all active filters and resets to default search.

**Example:**

```javascript
clearAllFilters();
```

## Search Results Page

### URL Parameters

The search results page accepts these URL parameters:

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `q` | string | Search query | `?q=laptop` |
| `category` | string | Category filter | `&category=electronics` |
| `minPrice` | number | Minimum price | `&minPrice=100` |
| `maxPrice` | number | Maximum price | `&maxPrice=500` |
| `inStock` | boolean | Only in-stock | `&inStock=true` |
| `onSale` | boolean | Only on sale | `&onSale=true` |
| `sort` | string | Sort method | `&sort=price-low` |

### Example URLs

```
# Basic search
search-results.html?q=wireless+headphones

# Search with category filter
search-results.html?q=laptop&category=electronics

# Search with price range
search-results.html?q=mouse&minPrice=20&maxPrice=100

# Search with multiple filters
search-results.html?q=keyboard&category=electronics&inStock=true&sort=price-low
```

## Customization

### Adjust Relevance Scoring

Edit the `calculateRelevanceScore()` function in [js/search.js](js/search.js:63):

```javascript
function calculateRelevanceScore(product, query) {
    let score = 0;
    const lowerQuery = query.toLowerCase();
    const lowerName = product.name.toLowerCase();

    // Customize scoring weights
    if (lowerName === lowerQuery) score += 100;  // Exact match
    else if (lowerName.startsWith(lowerQuery)) score += 50;  // Starts with
    else if (lowerName.includes(lowerQuery)) score += 30;  // Contains

    // Add custom scoring logic here

    return score;
}
```

### Change Suggestion Limits

Edit the `getSearchSuggestions()` function in [js/search.js](js/search.js:132):

```javascript
export function getSearchSuggestions(query) {
    // ... existing code ...

    const maxProductSuggestions = 3;  // Change this
    const maxCategorySuggestions = 2;  // Change this
    const maxTotalSuggestions = 5;    // Change this

    // ... rest of function ...
}
```

### Modify Debounce Delay

Edit the `initSearchAutocomplete()` function in [js/search.js](js/search.js:170):

```javascript
const debouncedSearch = debounce(() => {
    // ... suggestion logic ...
}, 300);  // Change delay in milliseconds
```

### Add Custom Filters

1. Add filter UI to [search-results.html](search-results.html)
2. Update `updateFiltersInURL()` in [js/search-results.js](js/search-results.js:133)
3. Update `searchProducts()` in [js/search.js](js/search.js:18) to handle new filter

**Example - Add Brand Filter:**

```javascript
// In search.js - searchProducts function
export function searchProducts(query = '', filters = {}, sortBy = 'relevance') {
    let results = products;

    // Add brand filter
    if (filters.brand) {
        results = results.filter(p => p.brand === filters.brand);
    }

    // ... rest of function ...
}
```

### Style Customization

Edit [css/search.css](css/search.css) to customize appearance:

```css
/* Search suggestions styling */
.search-suggestions {
    max-height: 400px;  /* Adjust dropdown height */
    /* ... other styles ... */
}

/* Results grid columns */
.results-grid {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));  /* Adjust card size */
}

/* Filter sidebar width */
.search-layout {
    grid-template-columns: 280px 1fr;  /* Adjust sidebar width */
}
```

## Performance Optimization

### Limiting Results

The search is limited to 50 results by default. Adjust in [js/search.js](js/search.js:46):

```javascript
// Return top 50 results
return sortedResults.slice(0, 50);  // Change this number
```

### Caching Results

For better performance with large product catalogs, consider implementing caching:

```javascript
const searchCache = new Map();

export function searchProducts(query, filters, sortBy) {
    const cacheKey = JSON.stringify({ query, filters, sortBy });

    if (searchCache.has(cacheKey)) {
        return searchCache.get(cacheKey);
    }

    const results = performSearch(query, filters, sortBy);
    searchCache.set(cacheKey, results);

    return results;
}
```

## Accessibility

The search interface includes:
- **Keyboard navigation** - Tab, Enter, Escape keys
- **ARIA labels** - For screen readers
- **Focus management** - Proper focus states
- **Semantic HTML** - Proper heading hierarchy

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Enter | Submit search or select suggestion |
| Escape | Close suggestions dropdown |
| Tab | Navigate through suggestions |

## Troubleshooting

### No Suggestions Appearing

1. Check that search.css is included in the page
2. Verify the suggestions container exists: `<div id="search-suggestions"></div>`
3. Check browser console for JavaScript errors
4. Ensure minimum query length is met (2 characters)

### Search Returns No Results

1. Verify product data is loaded (check browser console)
2. Check that query matches product names/descriptions
3. Try clearing filters
4. Check that `products` array is imported correctly

### Filters Not Working

1. Verify URL parameters are set correctly
2. Check that filter values match product properties
3. Ensure filter UI elements have correct IDs
4. Check browser console for JavaScript errors

### Styling Issues

1. Ensure search.css is included: `<link rel="stylesheet" href="css/search.css">`
2. Check CSS variable definitions in styles.css
3. Verify no CSS conflicts with other stylesheets
4. Check responsive breakpoints for mobile devices

## Integration with Other Features

### Authentication

The search results page shows different navigation based on user authentication status:

```javascript
import { getCurrentUser } from './auth.js';

const user = getCurrentUser();
if (user) {
    // Show personalized search results
    // Display "Profile" link
} else {
    // Show "Login" link
}
```

### Shopping Cart

Add to cart directly from search results:

```javascript
import { addToCart } from './cart.js';

// Products in search results have "Add to Cart" buttons
// Clicking triggers the cart functionality
```

### Analytics (Future Enhancement)

Track search queries for insights:

```javascript
function trackSearchQuery(query, resultCount) {
    // Send to analytics service
    console.log(`Search: "${query}" - ${resultCount} results`);
}
```

## Future Enhancements

Potential improvements to consider:

1. **Search History** - Save recent searches per user
2. **Popular Searches** - Display trending search terms
3. **Faceted Search** - Dynamic filter options based on results
4. **Search Analytics** - Track and analyze search behavior
5. **Fuzzy Matching** - Handle typos and misspellings
6. **Search Highlighting** - Highlight matching terms in results
7. **Voice Search** - Speech-to-text search input
8. **Image Search** - Search by product images
9. **Advanced Operators** - Support for AND, OR, NOT operators
10. **Saved Searches** - Allow users to save and reuse searches

## Support

For issues or questions about the search functionality:

1. Check this guide first
2. Review the code comments in search.js
3. Check browser console for errors
4. Verify all files are included correctly

## Summary

The search system provides a robust, user-friendly way to find products. Key features include:

✓ Keyword search with relevance scoring
✓ Real-time auto-suggestions
✓ Advanced filtering and sorting
✓ Responsive design
✓ Easy customization
✓ Accessible interface

The modular design allows for easy extension and customization to meet specific needs.
