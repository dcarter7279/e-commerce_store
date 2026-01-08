// Authentication Server with JWT and Secure Password Hashing
// Handles registration, login, password reset, and session management

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Rate limiting to prevent brute force attacks
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per windowMs
    message: 'Too many login attempts, please try again later'
});

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRY = '24h';

// In-memory user storage (use database in production)
// Example structure: MongoDB, PostgreSQL, etc.
let users = [];
let sessions = [];
let resetTokens = [];

// ==================== Helper Functions ====================

// Generate JWT token
function generateToken(user) {
    return jwt.sign(
        {
            id: user.id,
            email: user.email
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRY }
    );
}

// Verify JWT token middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }

        req.user = user;
        next();
    });
}

// Validate email format
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Validate password strength
function validatePasswordStrength(password) {
    if (password.length < 8) {
        return { valid: false, message: 'Password must be at least 8 characters long' };
    }

    if (!/[A-Z]/.test(password)) {
        return { valid: false, message: 'Password must contain at least one uppercase letter' };
    }

    if (!/[a-z]/.test(password)) {
        return { valid: false, message: 'Password must contain at least one lowercase letter' };
    }

    if (!/[0-9]/.test(password)) {
        return { valid: false, message: 'Password must contain at least one number' };
    }

    return { valid: true };
}

// Find user by email
function findUserByEmail(email) {
    return users.find(u => u.email.toLowerCase() === email.toLowerCase());
}

// Find user by ID
function findUserById(id) {
    return users.find(u => u.id === id);
}

// ==================== Authentication Endpoints ====================

// Health check
app.get('/api/auth/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        users: users.length
    });
});

// Register new user
app.post('/api/auth/register', async (req, res) => {
    try {
        const { firstName, lastName, email, password } = req.body;

        // Validation
        if (!firstName || !lastName || !email || !password) {
            return res.status(400).json({
                error: 'All fields are required',
                errors: {
                    firstName: !firstName ? 'First name is required' : null,
                    lastName: !lastName ? 'Last name is required' : null,
                    email: !email ? 'Email is required' : null,
                    password: !password ? 'Password is required' : null
                }
            });
        }

        // Validate email
        if (!isValidEmail(email)) {
            return res.status(400).json({
                error: 'Invalid email format',
                errors: { email: 'Please enter a valid email address' }
            });
        }

        // Validate password
        const passwordValidation = validatePasswordStrength(password);
        if (!passwordValidation.valid) {
            return res.status(400).json({
                error: passwordValidation.message,
                errors: { password: passwordValidation.message }
            });
        }

        // Check if user exists
        if (findUserByEmail(email)) {
            return res.status(400).json({
                error: 'Email already registered',
                errors: { email: 'An account with this email already exists' }
            });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const user = {
            id: crypto.randomUUID(),
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            phone: '',
            addresses: [],
            createdAt: new Date().toISOString(),
            lastLogin: null,
            emailVerified: false
        };

        users.push(user);

        // Generate token
        const token = generateToken(user);

        // Return user data (without password)
        const { password: _, ...userWithoutPassword } = user;

        console.log('✅ User registered:', user.email);

        res.status(201).json({
            success: true,
            message: 'Registration successful',
            user: userWithoutPassword,
            token: token
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            error: 'Registration failed',
            message: 'An error occurred during registration'
        });
    }
});

// Login user
app.post('/api/auth/login', authLimiter, async (req, res) => {
    try {
        const { email, password, rememberMe } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({
                error: 'Email and password are required'
            });
        }

        // Find user
        const user = findUserByEmail(email);

        if (!user) {
            // Don't reveal if email exists or not
            return res.status(401).json({
                error: 'Invalid email or password'
            });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
            return res.status(401).json({
                error: 'Invalid email or password'
            });
        }

        // Update last login
        user.lastLogin = new Date().toISOString();

        // Generate token
        const tokenExpiry = rememberMe ? '30d' : '24h';
        const token = jwt.sign(
            { id: user.id, email: user.email },
            JWT_SECRET,
            { expiresIn: tokenExpiry }
        );

        // Store session
        sessions.push({
            userId: user.id,
            token: token,
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + (rememberMe ? 30 : 1) * 24 * 60 * 60 * 1000).toISOString()
        });

        // Return user data (without password)
        const { password: _, ...userWithoutPassword } = user;

        console.log('✅ User logged in:', user.email);

        res.json({
            success: true,
            message: 'Login successful',
            user: userWithoutPassword,
            token: token
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            error: 'Login failed',
            message: 'An error occurred during login'
        });
    }
});

// Logout user
app.post('/api/auth/logout', authenticateToken, (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        // Remove session
        sessions = sessions.filter(s => s.token !== token);

        console.log('✅ User logged out:', req.user.email);

        res.json({
            success: true,
            message: 'Logout successful'
        });

    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            error: 'Logout failed'
        });
    }
});

// Get current user
app.get('/api/auth/me', authenticateToken, (req, res) => {
    try {
        const user = findUserById(req.user.id);

        if (!user) {
            return res.status(404).json({
                error: 'User not found'
            });
        }

        // Return user data (without password)
        const { password, ...userWithoutPassword } = user;

        res.json({
            success: true,
            user: userWithoutPassword
        });

    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            error: 'Failed to get user data'
        });
    }
});

// ==================== Password Reset ====================

// Request password reset
app.post('/api/auth/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                error: 'Email is required'
            });
        }

        const user = findUserByEmail(email);

        // Always return success to prevent email enumeration
        if (user) {
            // Generate reset token
            const resetToken = crypto.randomBytes(32).toString('hex');
            const resetTokenHash = crypto
                .createHash('sha256')
                .update(resetToken)
                .digest('hex');

            // Store reset token
            resetTokens.push({
                userId: user.id,
                token: resetTokenHash,
                expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour
            });

            // In production, send email with reset link
            // await sendPasswordResetEmail(user.email, resetToken);

            console.log(`📧 Password reset token for ${user.email}: ${resetToken}`);
        }

        res.json({
            success: true,
            message: 'If an account exists with this email, a password reset link has been sent'
        });

    } catch (error) {
        console.error('Password reset request error:', error);
        res.status(500).json({
            error: 'Failed to process password reset request'
        });
    }
});

// Reset password with token
app.post('/api/auth/reset-password', async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({
                error: 'Token and new password are required'
            });
        }

        // Validate password
        const passwordValidation = validatePasswordStrength(newPassword);
        if (!passwordValidation.valid) {
            return res.status(400).json({
                error: passwordValidation.message
            });
        }

        // Hash token
        const tokenHash = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');

        // Find valid reset token
        const resetToken = resetTokens.find(
            rt => rt.token === tokenHash && new Date(rt.expiresAt) > new Date()
        );

        if (!resetToken) {
            return res.status(400).json({
                error: 'Invalid or expired reset token'
            });
        }

        // Find user
        const user = findUserById(resetToken.userId);

        if (!user) {
            return res.status(404).json({
                error: 'User not found'
            });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);

        // Remove used token
        resetTokens = resetTokens.filter(rt => rt.token !== tokenHash);

        console.log('✅ Password reset for:', user.email);

        res.json({
            success: true,
            message: 'Password has been reset successfully'
        });

    } catch (error) {
        console.error('Password reset error:', error);
        res.status(500).json({
            error: 'Failed to reset password'
        });
    }
});

// ==================== Profile Management ====================

// Update profile
app.put('/api/auth/profile', authenticateToken, async (req, res) => {
    try {
        const { firstName, lastName, email, phone } = req.body;

        const user = findUserById(req.user.id);

        if (!user) {
            return res.status(404).json({
                error: 'User not found'
            });
        }

        // Validate email if changed
        if (email && email !== user.email) {
            if (!isValidEmail(email)) {
                return res.status(400).json({
                    error: 'Invalid email format'
                });
            }

            if (findUserByEmail(email)) {
                return res.status(400).json({
                    error: 'Email already in use'
                });
            }

            user.email = email.toLowerCase().trim();
        }

        // Update fields
        if (firstName) user.firstName = firstName.trim();
        if (lastName) user.lastName = lastName.trim();
        if (phone !== undefined) user.phone = phone.trim();

        // Return user data (without password)
        const { password, ...userWithoutPassword } = user;

        console.log('✅ Profile updated:', user.email);

        res.json({
            success: true,
            message: 'Profile updated successfully',
            user: userWithoutPassword
        });

    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({
            error: 'Failed to update profile'
        });
    }
});

// Change password
app.post('/api/auth/change-password', authenticateToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                error: 'Current password and new password are required'
            });
        }

        const user = findUserById(req.user.id);

        if (!user) {
            return res.status(404).json({
                error: 'User not found'
            });
        }

        // Verify current password
        const isValid = await bcrypt.compare(currentPassword, user.password);

        if (!isValid) {
            return res.status(401).json({
                error: 'Current password is incorrect'
            });
        }

        // Validate new password
        const passwordValidation = validatePasswordStrength(newPassword);
        if (!passwordValidation.valid) {
            return res.status(400).json({
                error: passwordValidation.message
            });
        }

        // Hash and save new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);

        console.log('✅ Password changed for:', user.email);

        res.json({
            success: true,
            message: 'Password changed successfully'
        });

    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            error: 'Failed to change password'
        });
    }
});

// ==================== Error Handling ====================

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not found',
        path: req.path
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: err.message
    });
});

// ==================== Start Server ====================

const PORT = process.env.AUTH_PORT || 3001;

app.listen(PORT, () => {
    console.log('\n🔐 Authentication Server Started!');
    console.log(`📡 Listening on port ${PORT}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/api/auth/health`);
    console.log(`📝 Register: POST http://localhost:${PORT}/api/auth/register`);
    console.log(`🔑 Login: POST http://localhost:${PORT}/api/auth/login`);

    // Configuration warnings
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'your-secret-key-change-in-production') {
        console.log('\n⚠️  WARNING: JWT secret not configured!');
        console.log('Set JWT_SECRET in .env for production');
    }

    console.log('\n✅ Authentication server ready!\n');
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing server');
    process.exit(0);
});
