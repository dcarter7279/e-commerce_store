// Authentication Module
// Handles user registration, login, password reset, and session management

// Storage keys
const AUTH_STORAGE_KEY = 'ecommerce_user';
const SESSION_STORAGE_KEY = 'ecommerce_session';
const USERS_STORAGE_KEY = 'ecommerce_users'; // For demo - use backend in production

// Session expiry time (24 hours)
const SESSION_EXPIRY = 24 * 60 * 60 * 1000;

// ==================== User Management ====================

// Get current user from session
export function getCurrentUser() {
    try {
        const session = localStorage.getItem(SESSION_STORAGE_KEY);
        if (!session) return null;

        const sessionData = JSON.parse(session);

        // Check if session is expired
        if (Date.now() > sessionData.expiresAt) {
            logout();
            return null;
        }

        return sessionData.user;
    } catch (error) {
        console.error('Error getting current user:', error);
        return null;
    }
}

// Check if user is authenticated
export function isAuthenticated() {
    return getCurrentUser() !== null;
}

// Create user session
function createSession(user, rememberMe = false) {
    const expiresAt = Date.now() + SESSION_EXPIRY;

    const sessionData = {
        user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone || '',
            createdAt: user.createdAt
        },
        expiresAt: expiresAt,
        rememberMe: rememberMe
    };

    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));

    // Dispatch auth change event
    dispatchAuthEvent('login', sessionData.user);
}

// Destroy user session
export function logout() {
    const user = getCurrentUser();
    localStorage.removeItem(SESSION_STORAGE_KEY);
    dispatchAuthEvent('logout', user);
    window.location.href = 'index.html';
}

// Dispatch authentication events
function dispatchAuthEvent(type, user) {
    const event = new CustomEvent('authStateChanged', {
        detail: { type, user }
    });
    window.dispatchEvent(event);
}

// ==================== Registration ====================

export async function register(userData) {
    try {
        // Validate registration data
        const validation = validateRegistration(userData);
        if (!validation.isValid) {
            return {
                success: false,
                errors: validation.errors
            };
        }

        // Check if user already exists
        const users = getAllUsers();
        const existingUser = users.find(u => u.email.toLowerCase() === userData.email.toLowerCase());

        if (existingUser) {
            return {
                success: false,
                errors: { email: 'An account with this email already exists' }
            };
        }

        // Hash password (in production, do this on backend)
        const hashedPassword = await hashPassword(userData.password);

        // Create new user
        const newUser = {
            id: generateUserId(),
            email: userData.email.toLowerCase(),
            firstName: userData.firstName,
            lastName: userData.lastName,
            password: hashedPassword,
            phone: userData.phone || '',
            addresses: [],
            orders: [],
            createdAt: new Date().toISOString(),
            lastLogin: null,
            newsletter: userData.newsletter || false
        };

        // Save user
        users.push(newUser);
        saveAllUsers(users);

        // Create session
        createSession(newUser, false);

        return {
            success: true,
            user: newUser
        };

    } catch (error) {
        console.error('Registration error:', error);
        return {
            success: false,
            errors: { general: 'An error occurred during registration. Please try again.' }
        };
    }
}

// Validate registration data
function validateRegistration(data) {
    const errors = {};

    // First name
    if (!data.firstName || data.firstName.trim().length < 2) {
        errors.firstName = 'First name must be at least 2 characters';
    }

    // Last name
    if (!data.lastName || data.lastName.trim().length < 2) {
        errors.lastName = 'Last name must be at least 2 characters';
    }

    // Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!data.email || !emailRegex.test(data.email)) {
        errors.email = 'Please enter a valid email address';
    }

    // Password
    const passwordValidation = validatePassword(data.password);
    if (!passwordValidation.isValid) {
        errors.password = passwordValidation.message;
    }

    // Password confirmation
    if (data.password !== data.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
    }

    // Terms acceptance
    if (!data.acceptTerms) {
        errors.acceptTerms = 'You must accept the terms and conditions';
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
}

// ==================== Login ====================

export async function login(email, password, rememberMe = false) {
    try {
        // Validate inputs
        if (!email || !password) {
            return {
                success: false,
                error: 'Email and password are required'
            };
        }

        // Find user
        const users = getAllUsers();
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

        if (!user) {
            return {
                success: false,
                error: 'Invalid email or password'
            };
        }

        // Verify password
        const isValidPassword = await verifyPassword(password, user.password);

        if (!isValidPassword) {
            return {
                success: false,
                error: 'Invalid email or password'
            };
        }

        // Update last login
        user.lastLogin = new Date().toISOString();
        updateUser(user);

        // Create session
        createSession(user, rememberMe);

        return {
            success: true,
            user: user
        };

    } catch (error) {
        console.error('Login error:', error);
        return {
            success: false,
            error: 'An error occurred during login. Please try again.'
        };
    }
}

// ==================== Password Reset ====================

export async function requestPasswordReset(email) {
    try {
        const users = getAllUsers();
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

        // Always return success to prevent email enumeration
        // In production, send actual email here

        if (user) {
            // Generate reset token (in production, do this on backend)
            const resetToken = generateResetToken();
            const resetExpiry = Date.now() + (60 * 60 * 1000); // 1 hour

            user.resetToken = resetToken;
            user.resetExpiry = resetExpiry;
            updateUser(user);

            console.log('Password reset token:', resetToken); // For demo
            // In production: sendPasswordResetEmail(user.email, resetToken);
        }

        return {
            success: true,
            message: 'If an account exists with this email, a password reset link has been sent.'
        };

    } catch (error) {
        console.error('Password reset error:', error);
        return {
            success: false,
            error: 'An error occurred. Please try again.'
        };
    }
}

// Reset password with token
export async function resetPassword(token, newPassword) {
    try {
        const users = getAllUsers();
        const user = users.find(u => u.resetToken === token);

        if (!user || !user.resetExpiry || Date.now() > user.resetExpiry) {
            return {
                success: false,
                error: 'Invalid or expired reset token'
            };
        }

        // Validate new password
        const passwordValidation = validatePassword(newPassword);
        if (!passwordValidation.isValid) {
            return {
                success: false,
                error: passwordValidation.message
            };
        }

        // Hash and save new password
        user.password = await hashPassword(newPassword);
        user.resetToken = null;
        user.resetExpiry = null;
        updateUser(user);

        return {
            success: true,
            message: 'Password has been reset successfully'
        };

    } catch (error) {
        console.error('Password reset error:', error);
        return {
            success: false,
            error: 'An error occurred. Please try again.'
        };
    }
}

// ==================== Profile Management ====================

export function updateProfile(updates) {
    try {
        const currentUser = getCurrentUser();
        if (!currentUser) {
            return {
                success: false,
                error: 'Not authenticated'
            };
        }

        const users = getAllUsers();
        const user = users.find(u => u.id === currentUser.id);

        if (!user) {
            return {
                success: false,
                error: 'User not found'
            };
        }

        // Update allowed fields
        if (updates.firstName) user.firstName = updates.firstName;
        if (updates.lastName) user.lastName = updates.lastName;
        if (updates.email) user.email = updates.email;
        if (updates.phone !== undefined) user.phone = updates.phone;

        updateUser(user);

        // Update session
        createSession(user, true);

        return {
            success: true,
            user: user
        };

    } catch (error) {
        console.error('Profile update error:', error);
        return {
            success: false,
            error: 'An error occurred while updating your profile'
        };
    }
}

export async function changePassword(currentPassword, newPassword) {
    try {
        const currentUser = getCurrentUser();
        if (!currentUser) {
            return {
                success: false,
                error: 'Not authenticated'
            };
        }

        const users = getAllUsers();
        const user = users.find(u => u.id === currentUser.id);

        if (!user) {
            return {
                success: false,
                error: 'User not found'
            };
        }

        // Verify current password
        const isValid = await verifyPassword(currentPassword, user.password);
        if (!isValid) {
            return {
                success: false,
                error: 'Current password is incorrect'
            };
        }

        // Validate new password
        const passwordValidation = validatePassword(newPassword);
        if (!passwordValidation.isValid) {
            return {
                success: false,
                error: passwordValidation.message
            };
        }

        // Hash and save new password
        user.password = await hashPassword(newPassword);
        updateUser(user);

        return {
            success: true,
            message: 'Password changed successfully'
        };

    } catch (error) {
        console.error('Change password error:', error);
        return {
            success: false,
            error: 'An error occurred while changing your password'
        };
    }
}

// ==================== Password Validation ====================

export function validatePassword(password) {
    if (!password || password.length < 8) {
        return {
            isValid: false,
            message: 'Password must be at least 8 characters long',
            strength: 0
        };
    }

    let strength = 0;
    const checks = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /[0-9]/.test(password),
        special: /[^A-Za-z0-9]/.test(password)
    };

    if (checks.length) strength++;
    if (checks.uppercase) strength++;
    if (checks.lowercase) strength++;
    if (checks.number) strength++;
    if (checks.special) strength++;

    const requiredChecks = checks.length && checks.uppercase && checks.lowercase && checks.number;

    if (!requiredChecks) {
        return {
            isValid: false,
            message: 'Password must contain uppercase, lowercase, and numbers',
            strength: strength,
            checks: checks
        };
    }

    return {
        isValid: true,
        message: 'Password is strong',
        strength: strength,
        checks: checks
    };
}

// ==================== Password Hashing (Simple - Use bcrypt in production) ====================

async function hashPassword(password) {
    // This is a simple hash for demo purposes
    // In production, use bcrypt or similar on the backend
    const encoder = new TextEncoder();
    const data = encoder.encode(password + 'salt_' + password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function verifyPassword(password, hash) {
    const passwordHash = await hashPassword(password);
    return passwordHash === hash;
}

// ==================== User Storage (Demo - Use Backend in Production) ====================

function getAllUsers() {
    try {
        const users = localStorage.getItem(USERS_STORAGE_KEY);
        return users ? JSON.parse(users) : [];
    } catch (error) {
        console.error('Error loading users:', error);
        return [];
    }
}

function saveAllUsers(users) {
    try {
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    } catch (error) {
        console.error('Error saving users:', error);
    }
}

function updateUser(user) {
    const users = getAllUsers();
    const index = users.findIndex(u => u.id === user.id);
    if (index !== -1) {
        users[index] = user;
        saveAllUsers(users);
    }
}

// ==================== Utility Functions ====================

function generateUserId() {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function generateResetToken() {
    return Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

// ==================== UI Initialization ====================

export function initLoginPage() {
    const form = document.getElementById('login-form');
    const submitBtn = document.getElementById('login-btn');

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const rememberMe = document.getElementById('remember-me')?.checked || false;

            // Show loading state
            submitBtn.classList.add('loading');
            submitBtn.disabled = true;

            const result = await login(email, password, rememberMe);

            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;

            if (result.success) {
                showNotification('Welcome back!', 'success');
                setTimeout(() => {
                    // Redirect to previous page or home
                    const returnUrl = new URLSearchParams(window.location.search).get('return') || 'index.html';
                    window.location.href = returnUrl;
                }, 500);
            } else {
                showNotification(result.error, 'error');
            }
        });

        // Password toggle
        initPasswordToggles();
    }
}

export function initRegisterPage() {
    const form = document.getElementById('register-form');
    const submitBtn = document.getElementById('register-btn');
    const passwordInput = document.getElementById('password');

    if (form) {
        // Password strength indicator
        if (passwordInput) {
            passwordInput.addEventListener('input', () => {
                updatePasswordStrength(passwordInput.value);
            });
        }

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = {
                firstName: document.getElementById('first-name').value,
                lastName: document.getElementById('last-name').value,
                email: document.getElementById('email').value,
                password: document.getElementById('password').value,
                confirmPassword: document.getElementById('confirm-password').value,
                acceptTerms: document.getElementById('accept-terms').checked,
                newsletter: document.getElementById('newsletter')?.checked || false
            };

            // Show loading state
            submitBtn.classList.add('loading');
            submitBtn.disabled = true;

            const result = await register(formData);

            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;

            if (result.success) {
                showNotification('Account created successfully!', 'success');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1000);
            } else {
                // Show errors
                if (result.errors) {
                    Object.keys(result.errors).forEach(field => {
                        const input = document.getElementById(field) ||
                                      document.getElementById(field.replace(/([A-Z])/g, '-$1').toLowerCase());
                        if (input) {
                            showFieldError(input, result.errors[field]);
                        }
                    });
                }
                showNotification('Please correct the errors and try again', 'error');
            }
        });

        // Password toggle
        initPasswordToggles();
    }
}

export function initForgotPasswordPage() {
    const form = document.getElementById('forgot-password-form');
    const submitBtn = document.getElementById('reset-btn');

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('email').value;

            // Show loading state
            submitBtn.classList.add('loading');
            submitBtn.disabled = true;

            const result = await requestPasswordReset(email);

            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;

            if (result.success) {
                // Show success message
                form.style.display = 'none';
                const successMessage = document.getElementById('success-message');
                document.getElementById('email-sent').textContent = email;
                successMessage.style.display = 'block';
            } else {
                showNotification(result.error, 'error');
            }
        });
    }
}

export function initProfilePage() {
    // Check if user is authenticated
    const user = getCurrentUser();
    if (!user) {
        window.location.href = 'login.html?return=profile.html';
        return;
    }

    // Populate user info
    populateUserInfo(user);

    // Tab navigation
    initProfileTabs();

    // Profile form
    initProfileForm(user);

    // Change password form
    initChangePasswordForm();

    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    // Load orders
    loadOrderHistory();

    // Load addresses
    loadSavedAddresses();

    // Password toggles
    initPasswordToggles();
}

// ==================== UI Helper Functions ====================

function populateUserInfo(user) {
    // User display info
    const initials = (user.firstName[0] + user.lastName[0]).toUpperCase();
    document.getElementById('user-initials').textContent = initials;
    document.getElementById('user-display-name').textContent = `${user.firstName} ${user.lastName}`;
    document.getElementById('user-display-email').textContent = user.email;

    // Profile form
    document.getElementById('profile-first-name').value = user.firstName;
    document.getElementById('profile-last-name').value = user.lastName;
    document.getElementById('profile-email').value = user.email;
    document.getElementById('profile-phone').value = user.phone || '';

    // Security info
    if (user.lastLogin) {
        const lastLoginDate = new Date(user.lastLogin);
        document.getElementById('last-login').textContent = formatDate(lastLoginDate);
    }

    if (user.createdAt) {
        const createdDate = new Date(user.createdAt);
        document.getElementById('account-created').textContent = formatDate(createdDate);
    }
}

function initProfileTabs() {
    const navItems = document.querySelectorAll('.profile-nav-item');
    const tabs = document.querySelectorAll('.profile-tab');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();

            const tabId = item.dataset.tab;

            // Update active nav item
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            // Show corresponding tab
            tabs.forEach(tab => tab.classList.remove('active'));
            const targetTab = document.getElementById(`${tabId}-tab`);
            if (targetTab) {
                targetTab.classList.add('active');
            }
        });
    });
}

function initProfileForm(user) {
    const form = document.getElementById('profile-form');

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const updates = {
                firstName: document.getElementById('profile-first-name').value,
                lastName: document.getElementById('profile-last-name').value,
                email: document.getElementById('profile-email').value,
                phone: document.getElementById('profile-phone').value
            };

            const result = updateProfile(updates);

            if (result.success) {
                showNotification('Profile updated successfully', 'success');
                populateUserInfo(result.user);
            } else {
                showNotification(result.error, 'error');
            }
        });
    }
}

function initChangePasswordForm() {
    const form = document.getElementById('change-password-form');

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const currentPassword = document.getElementById('current-password').value;
            const newPassword = document.getElementById('new-password').value;
            const confirmPassword = document.getElementById('confirm-new-password').value;

            if (newPassword !== confirmPassword) {
                showNotification('New passwords do not match', 'error');
                return;
            }

            const result = await changePassword(currentPassword, newPassword);

            if (result.success) {
                showNotification(result.message, 'success');
                form.reset();
            } else {
                showNotification(result.error, 'error');
            }
        });
    }
}

async function loadOrderHistory() {
    const user = getCurrentUser();
    const ordersList = document.getElementById('orders-list');

    if (!ordersList) return;

    // Import orders module dynamically
    try {
        const { getOrdersByEmail, renderOrderHistory, getOrdersFromLocalStorage } = await import('./orders.js');

        // Try to get orders from API first
        const result = await getOrdersByEmail(user.email);

        if (result.success && result.orders.length > 0) {
            renderOrderHistory(result.orders, 'orders-list');
        } else {
            // Fallback to localStorage
            const localOrders = getOrdersFromLocalStorage(user.email);
            if (localOrders.length > 0) {
                renderOrderHistory(localOrders, 'orders-list');
            } else {
                ordersList.innerHTML = `
                    <div class="empty-state">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                            <line x1="3" y1="6" x2="21" y2="6"></line>
                            <path d="M16 10a4 4 0 0 1-8 0"></path>
                        </svg>
                        <h3>No orders yet</h3>
                        <p>Start shopping to see your order history here</p>
                        <a href="index.html" class="btn btn-primary">Start Shopping</a>
                    </div>
                `;
            }
        }
    } catch (error) {
        console.error('Error loading orders:', error);
        // Fallback to localStorage
        const orders = JSON.parse(localStorage.getItem('orders') || '[]');
        const userOrders = orders.filter(order => order.shipping?.email === user.email);

        if (userOrders.length === 0) {
            ordersList.innerHTML = `
                <div class="empty-state">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                        <line x1="3" y1="6" x2="21" y2="6"></line>
                        <path d="M16 10a4 4 0 0 1-8 0"></path>
                    </svg>
                    <h3>No orders yet</h3>
                    <p>Start shopping to see your order history here</p>
                    <a href="index.html" class="btn btn-primary">Start Shopping</a>
                </div>
            `;
        }
    }
}

function loadSavedAddresses() {
    const user = getCurrentUser();
    const addressesList = document.getElementById('addresses-list');

    if (!addressesList) return;

    if (!user.addresses || user.addresses.length === 0) {
        addressesList.innerHTML = `
            <div class="empty-state">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                </svg>
                <h3>No saved addresses</h3>
                <p>Add an address for faster checkout</p>
            </div>
        `;
        return;
    }

    // Load saved addresses (implement as needed)
}

function initPasswordToggles() {
    const toggleButtons = document.querySelectorAll('.toggle-password');

    toggleButtons.forEach(button => {
        button.addEventListener('click', () => {
            const wrapper = button.closest('.password-input-wrapper');
            const input = wrapper.querySelector('input');

            if (input.type === 'password') {
                input.type = 'text';
            } else {
                input.type = 'password';
            }
        });
    });
}

function updatePasswordStrength(password) {
    const validation = validatePassword(password);
    const strengthFill = document.querySelector('.strength-fill');
    const strengthText = document.querySelector('.strength-text');

    if (!strengthFill || !strengthText) return;

    // Update strength bar
    strengthFill.className = 'strength-fill';
    strengthText.className = 'strength-text';

    if (password.length === 0) {
        strengthFill.style.width = '0%';
        strengthText.textContent = 'Password strength';
        return;
    }

    const strength = validation.strength;

    if (strength <= 2) {
        strengthFill.classList.add('weak');
        strengthText.classList.add('weak');
        strengthText.textContent = 'Weak password';
    } else if (strength <= 4) {
        strengthFill.classList.add('medium');
        strengthText.classList.add('medium');
        strengthText.textContent = 'Medium strength';
    } else {
        strengthFill.classList.add('strong');
        strengthText.classList.add('strong');
        strengthText.textContent = 'Strong password';
    }

    // Update requirements checkmarks
    if (validation.checks) {
        updateRequirement('req-length', validation.checks.length);
        updateRequirement('req-uppercase', validation.checks.uppercase);
        updateRequirement('req-lowercase', validation.checks.lowercase);
        updateRequirement('req-number', validation.checks.number);
    }
}

function updateRequirement(id, met) {
    const element = document.getElementById(id);
    if (element) {
        if (met) {
            element.classList.add('met');
        } else {
            element.classList.remove('met');
        }
    }
}

function showFieldError(input, message) {
    input.classList.add('error');
    const errorElement = input.parentElement.querySelector('.error-message');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }

    // Clear error on input
    input.addEventListener('input', () => {
        input.classList.remove('error');
        if (errorElement) {
            errorElement.style.display = 'none';
        }
    }, { once: true });
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `auth-notification ${type}`;
    notification.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            ${type === 'success'
                ? '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>'
                : '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>'
            }
        </svg>
        <div class="notification-content">
            <h4>${type === 'success' ? 'Success' : 'Error'}</h4>
            <p>${message}</p>
        </div>
    `;

    document.body.appendChild(notification);

    setTimeout(() => notification.classList.add('show'), 10);

    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function formatDate(date) {
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
        return 'Today at ' + date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } else if (days === 1) {
        return 'Yesterday at ' + date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } else if (days < 7) {
        return `${days} days ago`;
    } else {
        return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    }
}

// ==================== Auth State Observer ====================

// Update UI based on auth state
export function updateAuthUI() {
    const user = getCurrentUser();

    // Update cart count with user badge if logged in
    if (user) {
        // Could add user-specific UI updates here
        console.log('User logged in:', user.email);
    }
}

// Listen for auth state changes
window.addEventListener('authStateChanged', (e) => {
    updateAuthUI();
});

// Initialize auth UI on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateAuthUI);
} else {
    updateAuthUI();
}
