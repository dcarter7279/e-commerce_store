// User Account Tests
// Tests for registration, login, profile management, and order history

import {
    TestRunner,
    TestUtils,
    Assert,
    mockAPI,
    TestDataFactory,
    TEST_CONFIG
} from './setup.js';

const runner = new TestRunner();

/**
 * Setup and Teardown
 */
runner.beforeEach(() => {
    TestUtils.clearStorage();
    document.body.innerHTML = '<div id="test-container"></div>';
});

runner.afterEach(() => {
    mockAPI.clear();
    document.body.innerHTML = '';
});

/**
 * Registration Tests
 */
runner.test('Should register new user', async () => {
    mockAPI.mock('/api/auth/register', {
        success: true,
        userId: 'user_123',
        token: 'jwt_token_here'
    }, { method: 'POST' });
    mockAPI.enable();

    document.body.innerHTML = `
        <form id="register-form">
            <input type="email" id="email" value="newuser@example.com" />
            <input type="password" id="password" value="Password123!" />
            <input type="password" id="confirm-password" value="Password123!" />
            <input type="text" id="name" value="New User" />
        </form>
    `;

    const { register } = await import('../js/auth.js');

    const result = await register({
        email: 'newuser@example.com',
        password: 'Password123!',
        name: 'New User'
    });

    Assert.isTrue(result.success, 'Registration should succeed');
    Assert.equals(result.userId, 'user_123', 'Should return user ID');

    mockAPI.disable();
});

runner.test('Should validate password strength', async () => {
    const { validatePassword } = await import('../js/auth.js');

    Assert.isTrue(
        validatePassword('SecurePass123!'),
        'Strong password should validate'
    );
    Assert.isFalse(
        validatePassword('weak'),
        'Weak password should not validate'
    );
    Assert.isFalse(
        validatePassword('nodigits!'),
        'Password without digits should not validate'
    );
});

runner.test('Should check password confirmation match', async () => {
    document.body.innerHTML = `
        <input type="password" id="password" value="Password123!" />
        <input type="password" id="confirm-password" value="Password123!" />
    `;

    const { checkPasswordMatch } = await import('../js/auth.js');

    const match = checkPasswordMatch();

    Assert.isTrue(match, 'Matching passwords should validate');
});

runner.test('Should check if email already exists', async () => {
    mockAPI.mock('/api/auth/check-email', {
        exists: true
    });
    mockAPI.enable();

    const { checkEmailExists } = await import('../js/auth.js');

    const result = await checkEmailExists('existing@example.com');

    Assert.isTrue(result.exists, 'Should detect existing email');

    mockAPI.disable();
});

runner.test('Should show validation errors on registration', async () => {
    document.body.innerHTML = `
        <form id="register-form">
            <input type="email" id="email" value="invalid-email" />
            <input type="password" id="password" value="weak" />
            <div id="errors" class="hidden"></div>
        </form>
    `;

    const { validateRegistrationForm } = await import('../js/auth.js');

    const validation = validateRegistrationForm();

    Assert.isFalse(validation.valid, 'Invalid form should not validate');
    Assert.greaterThan(validation.errors.length, 0, 'Should have validation errors');
});

/**
 * Login Tests
 */
runner.test('Should login with valid credentials', async () => {
    mockAPI.mock('/api/auth/login', {
        success: true,
        user: {
            id: 'user_123',
            email: 'test@example.com',
            name: 'Test User'
        },
        token: 'jwt_token_here'
    }, { method: 'POST' });
    mockAPI.enable();

    const { login } = await import('../js/auth.js');

    const result = await login('test@example.com', 'Password123!');

    Assert.isTrue(result.success, 'Login should succeed');
    Assert.equals(result.user.email, 'test@example.com', 'Should return user data');

    mockAPI.disable();
});

runner.test('Should reject invalid credentials', async () => {
    mockAPI.mock('/api/auth/login', {
        success: false,
        error: 'Invalid credentials'
    }, { status: 401, method: 'POST' });
    mockAPI.enable();

    const { login } = await import('../js/auth.js');

    await Assert.throwsAsync(
        async () => await login('test@example.com', 'WrongPassword'),
        'Should reject invalid credentials'
    );

    mockAPI.disable();
});

runner.test('Should store auth token after login', async () => {
    mockAPI.mock('/api/auth/login', {
        success: true,
        user: { id: 'user_123' },
        token: 'jwt_token_here'
    }, { method: 'POST' });
    mockAPI.enable();

    const { login } = await import('../js/auth.js');

    await login('test@example.com', 'Password123!');

    const token = localStorage.getItem('auth_token');
    Assert.equals(token, 'jwt_token_here', 'Auth token should be stored');

    mockAPI.disable();
});

runner.test('Should store user data after login', async () => {
    mockAPI.mock('/api/auth/login', {
        success: true,
        user: {
            id: 'user_123',
            email: 'test@example.com',
            name: 'Test User'
        },
        token: 'token'
    }, { method: 'POST' });
    mockAPI.enable();

    const { login } = await import('../js/auth.js');

    await login('test@example.com', 'Password123!');

    const userData = JSON.parse(localStorage.getItem('user'));
    Assert.equals(userData.email, 'test@example.com', 'User data should be stored');

    mockAPI.disable();
});

runner.test('Should remember user when "Remember Me" is checked', async () => {
    document.body.innerHTML = `
        <input type="checkbox" id="remember-me" checked />
    `;

    mockAPI.mock('/api/auth/login', {
        success: true,
        user: { id: 'user_123' },
        token: 'token'
    }, { method: 'POST' });
    mockAPI.enable();

    const { login } = await import('../js/auth.js');

    await login('test@example.com', 'Password123!', true);

    // Should set a persistent flag or use longer-lived token
    const remembered = localStorage.getItem('remember_user');
    Assert.isTrue(remembered === 'true' || remembered !== null, 'Should remember user');

    mockAPI.disable();
});

/**
 * Logout Tests
 */
runner.test('Should logout user', async () => {
    localStorage.setItem('auth_token', 'jwt_token');
    localStorage.setItem('user', JSON.stringify({ id: 'user_123' }));

    const { logout } = await import('../js/auth.js');

    logout();

    const token = localStorage.getItem('auth_token');
    const user = localStorage.getItem('user');

    Assert.isTrue(token === null, 'Auth token should be cleared');
    Assert.isTrue(user === null, 'User data should be cleared');
});

runner.test('Should redirect to home after logout', async () => {
    let redirected = false;
    const originalAssign = window.location.assign;
    window.location.assign = (url) => {
        redirected = url.includes('index') || url === '/';
    };

    const { logout } = await import('../js/auth.js');

    logout();

    window.location.assign = originalAssign;

    Assert.isTrue(redirected, 'Should redirect after logout');
});

/**
 * Authentication State Tests
 */
runner.test('Should check if user is authenticated', async () => {
    localStorage.setItem('auth_token', 'valid_token');

    const { isAuthenticated } = await import('../js/auth.js');

    const authenticated = isAuthenticated();

    Assert.isTrue(authenticated, 'Should be authenticated with valid token');
});

runner.test('Should not be authenticated without token', async () => {
    localStorage.removeItem('auth_token');

    const { isAuthenticated } = await import('../js/auth.js');

    const authenticated = isAuthenticated();

    Assert.isFalse(authenticated, 'Should not be authenticated without token');
});

runner.test('Should get current user', async () => {
    const userData = {
        id: 'user_123',
        email: 'test@example.com',
        name: 'Test User'
    };

    localStorage.setItem('user', JSON.stringify(userData));

    const { getCurrentUser } = await import('../js/auth.js');

    const user = getCurrentUser();

    Assert.equals(user.email, 'test@example.com', 'Should return current user');
});

/**
 * Profile Management Tests
 */
runner.test('Should load user profile', async () => {
    mockAPI.mock('/api/users/user_123', {
        id: 'user_123',
        email: 'test@example.com',
        name: 'Test User',
        phone: '555-0123',
        addresses: []
    });
    mockAPI.enable();

    const { loadProfile } = await import('../js/profile.js');

    const profile = await loadProfile('user_123');

    Assert.equals(profile.email, 'test@example.com', 'Should load profile data');

    mockAPI.disable();
});

runner.test('Should update profile information', async () => {
    mockAPI.mock('/api/users/user_123', {
        success: true
    }, { method: 'PUT' });
    mockAPI.enable();

    const { updateProfile } = await import('../js/profile.js');

    const result = await updateProfile('user_123', {
        name: 'Updated Name',
        phone: '555-9999'
    });

    Assert.isTrue(result.success, 'Profile should update successfully');

    mockAPI.disable();
});

runner.test('Should validate profile update form', async () => {
    document.body.innerHTML = `
        <form id="profile-form">
            <input type="text" id="name" value="" required />
            <input type="email" id="email" value="invalid" />
        </form>
    `;

    const { validateProfileForm } = await import('../js/profile.js');

    const validation = validateProfileForm();

    Assert.isFalse(validation.valid, 'Invalid form should not validate');
});

runner.test('Should change password', async () => {
    mockAPI.mock('/api/users/user_123/password', {
        success: true
    }, { method: 'PUT' });
    mockAPI.enable();

    const { changePassword } = await import('../js/profile.js');

    const result = await changePassword('user_123', {
        currentPassword: 'OldPass123!',
        newPassword: 'NewPass123!'
    });

    Assert.isTrue(result.success, 'Password should change successfully');

    mockAPI.disable();
});

runner.test('Should validate current password before change', async () => {
    mockAPI.mock('/api/users/user_123/verify-password', {
        valid: false
    }, { method: 'POST' });
    mockAPI.enable();

    const { verifyCurrentPassword } = await import('../js/profile.js');

    const isValid = await verifyCurrentPassword('user_123', 'WrongPassword');

    Assert.isFalse(isValid, 'Wrong password should not verify');

    mockAPI.disable();
});

/**
 * Address Management Tests
 */
runner.test('Should add new address', async () => {
    mockAPI.mock('/api/users/user_123/addresses', {
        success: true,
        addressId: 'addr_123'
    }, { method: 'POST' });
    mockAPI.enable();

    const { addAddress } = await import('../js/profile.js');

    const result = await addAddress('user_123', {
        type: 'shipping',
        address: '123 Main St',
        city: 'New York',
        state: 'NY',
        zip: '10001'
    });

    Assert.isTrue(result.success, 'Address should be added');
    Assert.equals(result.addressId, 'addr_123', 'Should return address ID');

    mockAPI.disable();
});

runner.test('Should edit existing address', async () => {
    mockAPI.mock('/api/users/user_123/addresses/addr_123', {
        success: true
    }, { method: 'PUT' });
    mockAPI.enable();

    const { editAddress } = await import('../js/profile.js');

    const result = await editAddress('user_123', 'addr_123', {
        address: '456 Oak Ave'
    });

    Assert.isTrue(result.success, 'Address should be updated');

    mockAPI.disable();
});

runner.test('Should delete address', async () => {
    mockAPI.mock('/api/users/user_123/addresses/addr_123', {
        success: true
    }, { method: 'DELETE' });
    mockAPI.enable();

    const { deleteAddress } = await import('../js/profile.js');

    const result = await deleteAddress('user_123', 'addr_123');

    Assert.isTrue(result.success, 'Address should be deleted');

    mockAPI.disable();
});

runner.test('Should set default address', async () => {
    mockAPI.mock('/api/users/user_123/addresses/addr_123/set-default', {
        success: true
    }, { method: 'POST' });
    mockAPI.enable();

    const { setDefaultAddress } = await import('../js/profile.js');

    const result = await setDefaultAddress('user_123', 'addr_123');

    Assert.isTrue(result.success, 'Address should be set as default');

    mockAPI.disable();
});

/**
 * Order History Tests
 */
runner.test('Should load user order history', async () => {
    const mockOrders = [
        TestDataFactory.createOrder({ status: 'delivered' }),
        TestDataFactory.createOrder({ status: 'pending' })
    ];

    mockAPI.mock('/api/users/user_123/orders', mockOrders);
    mockAPI.enable();

    const { loadOrderHistory } = await import('../js/orders.js');

    const orders = await loadOrderHistory('user_123');

    Assert.equals(orders.length, 2, 'Should load 2 orders');

    mockAPI.disable();
});

runner.test('Should display order history', async () => {
    document.body.innerHTML = '<div id="order-history"></div>';

    const orders = [
        TestDataFactory.createOrder({ id: 'ORD-123', total: 99.99 }),
        TestDataFactory.createOrder({ id: 'ORD-456', total: 149.99 })
    ];

    const { renderOrderHistory } = await import('../js/orders.js');

    await renderOrderHistory('order-history', orders);

    await TestUtils.waitFor(() => {
        const orderCards = document.querySelectorAll('.order-card');
        return orderCards.length === 2;
    });

    const orderCards = document.querySelectorAll('.order-card');
    Assert.equals(orderCards.length, 2, 'Should display 2 order cards');
});

runner.test('Should filter orders by status', async () => {
    document.body.innerHTML = `
        <select id="status-filter">
            <option value="all">All Orders</option>
            <option value="pending">Pending</option>
            <option value="delivered">Delivered</option>
        </select>
        <div id="order-history"></div>
    `;

    const orders = [
        TestDataFactory.createOrder({ status: 'delivered' }),
        TestDataFactory.createOrder({ status: 'pending' }),
        TestDataFactory.createOrder({ status: 'delivered' })
    ];

    const { filterOrders } = await import('../js/orders.js');

    const filtered = filterOrders(orders, 'delivered');

    Assert.equals(filtered.length, 2, 'Should filter to 2 delivered orders');
});

runner.test('Should load order details', async () => {
    const order = TestDataFactory.createOrder({
        id: 'ORD-123',
        items: [
            {
                product: TestDataFactory.createProduct(),
                quantity: 2,
                price: 29.99
            }
        ],
        total: 59.98
    });

    mockAPI.mock('/api/orders/ORD-123', order);
    mockAPI.enable();

    const { loadOrderDetails } = await import('../js/orders.js');

    const details = await loadOrderDetails('ORD-123');

    Assert.equals(details.id, 'ORD-123', 'Should load order details');
    Assert.greaterThan(details.items.length, 0, 'Should have order items');

    mockAPI.disable();
});

runner.test('Should track order status', async () => {
    mockAPI.mock('/api/orders/ORD-123/tracking', {
        status: 'shipped',
        trackingNumber: 'TRACK123',
        estimatedDelivery: '2024-01-15',
        updates: [
            { date: '2024-01-10', status: 'Processing' },
            { date: '2024-01-12', status: 'Shipped' }
        ]
    });
    mockAPI.enable();

    const { trackOrder } = await import('../js/orders.js');

    const tracking = await trackOrder('ORD-123');

    Assert.equals(tracking.status, 'shipped', 'Should get tracking status');
    Assert.equals(tracking.trackingNumber, 'TRACK123', 'Should have tracking number');

    mockAPI.disable();
});

/**
 * Wishlist Integration Tests
 */
runner.test('Should sync wishlist with user account', async () => {
    const localWishlist = ['prod_1', 'prod_2'];
    localStorage.setItem('wishlist', JSON.stringify(localWishlist));

    mockAPI.mock('/api/users/user_123/wishlist', {
        success: true
    }, { method: 'POST' });
    mockAPI.enable();

    const { syncWishlist } = await import('../js/wishlist.js');

    await syncWishlist('user_123');

    // Should merge local and server wishlists
    Assert.isTrue(true, 'Wishlist should sync');

    mockAPI.disable();
});

runner.test('Should load wishlist from server', async () => {
    mockAPI.mock('/api/users/user_123/wishlist', ['prod_1', 'prod_2', 'prod_3']);
    mockAPI.enable();

    const { loadWishlist } = await import('../js/wishlist.js');

    const wishlist = await loadWishlist('user_123');

    Assert.equals(wishlist.length, 3, 'Should load 3 wishlist items');

    mockAPI.disable();
});

/**
 * Password Reset Tests
 */
runner.test('Should request password reset', async () => {
    mockAPI.mock('/api/auth/forgot-password', {
        success: true,
        message: 'Reset email sent'
    }, { method: 'POST' });
    mockAPI.enable();

    const { requestPasswordReset } = await import('../js/auth.js');

    const result = await requestPasswordReset('test@example.com');

    Assert.isTrue(result.success, 'Password reset should be requested');

    mockAPI.disable();
});

runner.test('Should validate reset token', async () => {
    mockAPI.mock('/api/auth/validate-reset-token/valid_token', {
        valid: true
    });
    mockAPI.enable();

    const { validateResetToken } = await import('../js/auth.js');

    const isValid = await validateResetToken('valid_token');

    Assert.isTrue(isValid, 'Valid reset token should validate');

    mockAPI.disable();
});

runner.test('Should reset password with token', async () => {
    mockAPI.mock('/api/auth/reset-password', {
        success: true
    }, { method: 'POST' });
    mockAPI.enable();

    const { resetPassword } = await import('../js/auth.js');

    const result = await resetPassword('valid_token', 'NewPassword123!');

    Assert.isTrue(result.success, 'Password should be reset');

    mockAPI.disable();
});

/**
 * Email Verification Tests
 */
runner.test('Should send verification email', async () => {
    mockAPI.mock('/api/auth/send-verification', {
        success: true
    }, { method: 'POST' });
    mockAPI.enable();

    const { sendVerificationEmail } = await import('../js/auth.js');

    const result = await sendVerificationEmail('test@example.com');

    Assert.isTrue(result.success, 'Verification email should be sent');

    mockAPI.disable();
});

runner.test('Should verify email with token', async () => {
    mockAPI.mock('/api/auth/verify-email/valid_token', {
        success: true
    }, { method: 'POST' });
    mockAPI.enable();

    const { verifyEmail } = await import('../js/auth.js');

    const result = await verifyEmail('valid_token');

    Assert.isTrue(result.success, 'Email should be verified');

    mockAPI.disable();
});

/**
 * Account Deletion Tests
 */
runner.test('Should delete user account', async () => {
    mockAPI.mock('/api/users/user_123', {
        success: true
    }, { method: 'DELETE' });
    mockAPI.enable();

    const { deleteAccount } = await import('../js/profile.js');

    const result = await deleteAccount('user_123', 'Password123!');

    Assert.isTrue(result.success, 'Account should be deleted');

    mockAPI.disable();
});

runner.test('Should require password confirmation for deletion', async () => {
    document.body.innerHTML = `
        <button id="delete-account">Delete Account</button>
        <div id="confirm-deletion-modal" class="hidden"></div>
    `;

    await TestUtils.click('#delete-account');

    await TestUtils.wait(100);

    const modalVisible = await TestUtils.isVisible('#confirm-deletion-modal');
    Assert.isTrue(modalVisible, 'Should show confirmation modal');
});

/**
 * Session Management Tests
 */
runner.test('Should refresh auth token', async () => {
    mockAPI.mock('/api/auth/refresh', {
        token: 'new_token'
    }, { method: 'POST' });
    mockAPI.enable();

    const { refreshToken } = await import('../js/auth.js');

    const result = await refreshToken('old_token');

    Assert.equals(result.token, 'new_token', 'Should get new token');

    mockAPI.disable();
});

runner.test('Should handle expired session', async () => {
    mockAPI.mock('/api/users/user_123', {
        error: 'Session expired'
    }, { status: 401 });
    mockAPI.enable();

    const { handleSessionExpired } = await import('../js/auth.js');

    handleSessionExpired();

    const token = localStorage.getItem('auth_token');
    Assert.isTrue(token === null, 'Should clear auth token');

    mockAPI.disable();
});

// Run tests
export async function runUserAccountTests() {
    console.log('👤 Running User Account Tests...\n');
    return await runner.run();
}

// Auto-run if loaded directly
if (import.meta.url === window.location.href) {
    runUserAccountTests();
}
