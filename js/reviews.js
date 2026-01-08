// Customer Reviews Module
// Manages product reviews and ratings

const REVIEWS_STORAGE_KEY = 'e-store-reviews';

/**
 * Get all reviews from localStorage
 * @returns {Array} - Array of review objects
 */
export function getAllReviews() {
    try {
        const reviews = localStorage.getItem(REVIEWS_STORAGE_KEY);
        return reviews ? JSON.parse(reviews) : [];
    } catch (error) {
        console.error('Error reading reviews:', error);
        return [];
    }
}

/**
 * Save reviews to localStorage
 */
function saveReviews(reviews) {
    try {
        localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(reviews));
        return true;
    } catch (error) {
        console.error('Error saving reviews:', error);
        return false;
    }
}

/**
 * Get reviews for a specific product
 * @param {number} productId - Product ID
 * @returns {Array} - Array of review objects
 */
export function getProductReviews(productId) {
    const allReviews = getAllReviews();
    return allReviews.filter(review => review.productId === productId);
}

/**
 * Add a new review
 * @param {Object} reviewData - Review data
 * @returns {Object} - Result with success status
 */
export async function addReview(reviewData) {
    const { getCurrentUser } = await import('./auth.js');
    const user = getCurrentUser();

    if (!user) {
        return {
            success: false,
            message: 'You must be logged in to write a review'
        };
    }

    // Validate review data
    const validation = validateReview(reviewData);
    if (!validation.valid) {
        return {
            success: false,
            message: validation.message
        };
    }

    const allReviews = getAllReviews();

    // Check if user already reviewed this product
    const existingReview = allReviews.find(
        r => r.productId === reviewData.productId && r.userId === user.id
    );

    if (existingReview) {
        return {
            success: false,
            message: 'You have already reviewed this product. You can edit your existing review.'
        };
    }

    // Create review object
    const review = {
        id: Date.now(),
        productId: reviewData.productId,
        userId: user.id,
        userName: user.name || user.email.split('@')[0],
        rating: reviewData.rating,
        title: reviewData.title || '',
        comment: reviewData.comment,
        helpful: 0,
        verified: false, // Set to true if user purchased the product
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    allReviews.push(review);
    const saved = saveReviews(allReviews);

    if (saved) {
        dispatchReviewEvent('added', review);
        return {
            success: true,
            message: 'Review submitted successfully!',
            review
        };
    }

    return {
        success: false,
        message: 'Failed to save review'
    };
}

/**
 * Update an existing review
 * @param {number} reviewId - Review ID
 * @param {Object} updateData - Data to update
 * @returns {Object} - Result object
 */
export async function updateReview(reviewId, updateData) {
    const { getCurrentUser } = await import('./auth.js');
    const user = getCurrentUser();

    if (!user) {
        return {
            success: false,
            message: 'You must be logged in to edit reviews'
        };
    }

    const allReviews = getAllReviews();
    const reviewIndex = allReviews.findIndex(r => r.id === reviewId);

    if (reviewIndex === -1) {
        return {
            success: false,
            message: 'Review not found'
        };
    }

    const review = allReviews[reviewIndex];

    // Check ownership
    if (review.userId !== user.id) {
        return {
            success: false,
            message: 'You can only edit your own reviews'
        };
    }

    // Update review
    allReviews[reviewIndex] = {
        ...review,
        ...updateData,
        updatedAt: new Date().toISOString()
    };

    const saved = saveReviews(allReviews);

    if (saved) {
        dispatchReviewEvent('updated', allReviews[reviewIndex]);
        return {
            success: true,
            message: 'Review updated successfully',
            review: allReviews[reviewIndex]
        };
    }

    return {
        success: false,
        message: 'Failed to update review'
    };
}

/**
 * Delete a review
 * @param {number} reviewId - Review ID
 * @returns {Object} - Result object
 */
export async function deleteReview(reviewId) {
    const { getCurrentUser } = await import('./auth.js');
    const user = getCurrentUser();

    if (!user) {
        return {
            success: false,
            message: 'You must be logged in to delete reviews'
        };
    }

    const allReviews = getAllReviews();
    const reviewIndex = allReviews.findIndex(r => r.id === reviewId);

    if (reviewIndex === -1) {
        return {
            success: false,
            message: 'Review not found'
        };
    }

    const review = allReviews[reviewIndex];

    // Check ownership
    if (review.userId !== user.id) {
        return {
            success: false,
            message: 'You can only delete your own reviews'
        };
    }

    allReviews.splice(reviewIndex, 1);
    const saved = saveReviews(allReviews);

    if (saved) {
        dispatchReviewEvent('deleted', review);
        return {
            success: true,
            message: 'Review deleted successfully'
        };
    }

    return {
        success: false,
        message: 'Failed to delete review'
    };
}

/**
 * Mark review as helpful
 * @param {number} reviewId - Review ID
 * @returns {boolean} - Success status
 */
export function markReviewHelpful(reviewId) {
    const allReviews = getAllReviews();
    const reviewIndex = allReviews.findIndex(r => r.id === reviewId);

    if (reviewIndex === -1) return false;

    allReviews[reviewIndex].helpful = (allReviews[reviewIndex].helpful || 0) + 1;

    return saveReviews(allReviews);
}

/**
 * Get average rating for a product
 * @param {number} productId - Product ID
 * @returns {number} - Average rating (0-5)
 */
export function getAverageRating(productId) {
    const reviews = getProductReviews(productId);

    if (reviews.length === 0) return 0;

    const sum = reviews.reduce((total, review) => total + review.rating, 0);
    return sum / reviews.length;
}

/**
 * Get rating distribution for a product
 * @param {number} productId - Product ID
 * @returns {Object} - Distribution object
 */
export function getRatingDistribution(productId) {
    const reviews = getProductReviews(productId);
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

    reviews.forEach(review => {
        distribution[review.rating]++;
    });

    return distribution;
}

/**
 * Validate review data
 */
function validateReview(reviewData) {
    if (!reviewData.productId) {
        return { valid: false, message: 'Product ID is required' };
    }

    if (!reviewData.rating || reviewData.rating < 1 || reviewData.rating > 5) {
        return { valid: false, message: 'Rating must be between 1 and 5' };
    }

    if (!reviewData.comment || reviewData.comment.trim().length < 10) {
        return { valid: false, message: 'Review must be at least 10 characters long' };
    }

    if (reviewData.comment.length > 1000) {
        return { valid: false, message: 'Review must be less than 1000 characters' };
    }

    return { valid: true };
}

/**
 * Render reviews section on product page
 * @param {number} productId - Product ID
 * @param {string} containerId - Container element ID
 */
export async function renderProductReviews(productId, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const reviews = getProductReviews(productId);
    const avgRating = getAverageRating(productId);
    const distribution = getRatingDistribution(productId);

    const { getCurrentUser } = await import('./auth.js');
    const user = getCurrentUser();

    // Check if user already reviewed
    const userReview = user ? reviews.find(r => r.userId === user.id) : null;

    container.innerHTML = `
        <div class="reviews-section">
            <h3 class="reviews-title">Customer Reviews</h3>

            <!-- Rating Summary -->
            <div class="rating-summary">
                <div class="rating-overview">
                    <div class="average-rating">
                        <span class="rating-number">${avgRating.toFixed(1)}</span>
                        <div class="stars">${renderStars(avgRating)}</div>
                        <p class="review-count">${reviews.length} ${reviews.length === 1 ? 'review' : 'reviews'}</p>
                    </div>
                </div>

                <div class="rating-distribution">
                    ${[5, 4, 3, 2, 1].map(star => {
                        const count = distribution[star];
                        const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                        return `
                            <div class="distribution-bar">
                                <span class="star-label">${star} ★</span>
                                <div class="bar-container">
                                    <div class="bar-fill" style="width: ${percentage}%"></div>
                                </div>
                                <span class="count">${count}</span>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>

            <!-- Write Review Button -->
            ${user && !userReview ? `
                <button class="btn btn-primary" id="write-review-btn">
                    Write a Review
                </button>
            ` : user && userReview ? `
                <p class="user-review-notice">You have already reviewed this product</p>
            ` : `
                <p class="login-notice">
                    <a href="login.html">Log in</a> to write a review
                </p>
            `}

            <!-- Review Form (hidden by default) -->
            <div id="review-form-container" style="display: none;">
                ${renderReviewForm(productId)}
            </div>

            <!-- Reviews List -->
            <div class="reviews-list">
                ${reviews.length === 0 ? `
                    <p class="no-reviews">No reviews yet. Be the first to review this product!</p>
                ` : renderReviewsList(reviews, user)}
            </div>
        </div>
    `;

    // Initialize event handlers
    initReviewHandlers(productId, containerId);
}

/**
 * Render review form
 */
function renderReviewForm(productId) {
    return `
        <form class="review-form" id="review-form">
            <h4>Write Your Review</h4>

            <div class="form-group">
                <label for="review-rating">Rating *</label>
                <div class="star-rating-input" id="star-rating-input">
                    ${[5, 4, 3, 2, 1].map(star => `
                        <input type="radio" name="rating" id="star-${star}" value="${star}" required>
                        <label for="star-${star}" title="${star} stars">★</label>
                    `).join('')}
                </div>
            </div>

            <div class="form-group">
                <label for="review-title">Title (optional)</label>
                <input type="text" id="review-title" maxlength="100" placeholder="Summarize your experience">
            </div>

            <div class="form-group">
                <label for="review-comment">Your Review *</label>
                <textarea
                    id="review-comment"
                    rows="5"
                    minlength="10"
                    maxlength="1000"
                    placeholder="Tell us what you think about this product..."
                    required
                ></textarea>
                <small class="char-count"><span id="char-count">0</span>/1000</small>
            </div>

            <div class="form-actions">
                <button type="submit" class="btn btn-primary">Submit Review</button>
                <button type="button" class="btn btn-outline" id="cancel-review">Cancel</button>
            </div>
        </form>
    `;
}

/**
 * Render reviews list
 */
function renderReviewsList(reviews, currentUser) {
    // Sort by most recent first
    const sortedReviews = [...reviews].sort((a, b) =>
        new Date(b.createdAt) - new Date(a.createdAt)
    );

    return sortedReviews.map(review => {
        const isOwnReview = currentUser && review.userId === currentUser.id;
        const reviewDate = new Date(review.createdAt);
        const formattedDate = reviewDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        return `
            <div class="review-card" data-review-id="${review.id}">
                <div class="review-header">
                    <div class="reviewer-info">
                        <div class="reviewer-avatar">${review.userName.charAt(0).toUpperCase()}</div>
                        <div>
                            <p class="reviewer-name">
                                ${review.userName}
                                ${review.verified ? '<span class="verified-badge">Verified Purchase</span>' : ''}
                            </p>
                            <p class="review-date">${formattedDate}</p>
                        </div>
                    </div>
                    ${isOwnReview ? `
                        <div class="review-actions">
                            <button class="btn-icon edit-review" title="Edit review">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                </svg>
                            </button>
                            <button class="btn-icon delete-review" title="Delete review">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="3 6 5 6 21 6"></polyline>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                </svg>
                            </button>
                        </div>
                    ` : ''}
                </div>

                <div class="review-rating">
                    ${renderStars(review.rating)}
                </div>

                ${review.title ? `<h5 class="review-title">${review.title}</h5>` : ''}

                <p class="review-comment">${review.comment}</p>

                <div class="review-footer">
                    <button class="helpful-btn" data-review-id="${review.id}">
                        Helpful (${review.helpful || 0})
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Render star rating
 */
function renderStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return `
        ${'<span class="star filled">★</span>'.repeat(fullStars)}
        ${hasHalfStar ? '<span class="star half">★</span>' : ''}
        ${'<span class="star empty">☆</span>'.repeat(emptyStars)}
    `;
}

/**
 * Initialize review event handlers
 */
function initReviewHandlers(productId, containerId) {
    // Write review button
    const writeBtn = document.getElementById('write-review-btn');
    if (writeBtn) {
        writeBtn.addEventListener('click', () => {
            document.getElementById('review-form-container').style.display = 'block';
            writeBtn.style.display = 'none';
        });
    }

    // Cancel review
    const cancelBtn = document.getElementById('cancel-review');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            document.getElementById('review-form-container').style.display = 'none';
            if (writeBtn) writeBtn.style.display = 'block';
        });
    }

    // Character count
    const commentField = document.getElementById('review-comment');
    if (commentField) {
        commentField.addEventListener('input', () => {
            document.getElementById('char-count').textContent = commentField.value.length;
        });
    }

    // Submit review form
    const form = document.getElementById('review-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const rating = parseInt(document.querySelector('input[name="rating"]:checked')?.value);
            const title = document.getElementById('review-title').value.trim();
            const comment = document.getElementById('review-comment').value.trim();

            const result = await addReview({
                productId,
                rating,
                title,
                comment
            });

            if (result.success) {
                alert(result.message);
                renderProductReviews(productId, containerId);
            } else {
                alert(result.message);
            }
        });
    }

    // Helpful buttons
    document.querySelectorAll('.helpful-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const reviewId = parseInt(btn.dataset.reviewId);
            if (markReviewHelpful(reviewId)) {
                renderProductReviews(productId, containerId);
            }
        });
    });

    // Delete review
    document.querySelectorAll('.delete-review').forEach(btn => {
        btn.addEventListener('click', async () => {
            if (confirm('Are you sure you want to delete this review?')) {
                const reviewCard = btn.closest('.review-card');
                const reviewId = parseInt(reviewCard.dataset.reviewId);

                const result = await deleteReview(reviewId);

                if (result.success) {
                    renderProductReviews(productId, containerId);
                } else {
                    alert(result.message);
                }
            }
        });
    });
}

/**
 * Dispatch review event
 */
function dispatchReviewEvent(action, review) {
    const event = new CustomEvent('reviewChanged', {
        detail: { action, review }
    });
    window.dispatchEvent(event);
}
