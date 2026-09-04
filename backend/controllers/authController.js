// controllers/authController.js
// Authentication request handlers for register + login.
// Both endpoints return a signed JSON Web Token (7-day expiry) on success.
// Password hashing is handled by the User model's pre('save') hook — we just
// call .save() here and bcrypt runs automatically.

const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * signToken(id) — small helper to avoid repeating jwt.sign() in both handlers.
 * Payload: { id: userId }  — keeps the token slim; we look up the rest in protect().
 * Expiry: 7 days (per project spec — no refresh tokens needed).
 */
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
};

/**
 * POST /api/auth/register
 *
 * Body: { name, email, password, role?, phone? }
 * - Creates a new user document.
 * - Duplicate email is caught by Mongoose unique index (11000 code) → 400.
 * - Returns a JWT + the new user object (password is excluded by schema select:false).
 */
exports.register = async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;

    // Basic manual validation so the response is friendly before Mongoose runs.
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ success: false, message: 'Please provide name, email, and password' });
    }

    // Create the user. The pre('save') hook on the User schema hashes the password.
    const user = await User.create({
      name,
      email,
      password,
      role, // if undefined, schema defaults to 'guest'
      phone,
    });

    // Create a JWT for the new user so they are immediately logged in.
    const token = signToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    // E11000 = MongoDB duplicate key error (email is already taken).
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ success: false, message: 'Email is already registered' });
    }
    // Mongoose validation errors (password too short, invalid email format, etc.)
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    // Any other unexpected failure — log server-side, send generic message.
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * POST /api/auth/login
 *
 * Body: { email, password }
 * - Looks up the user by email (explicitly selects the password field because
 *   the schema has select:false on it).
 * - Compares the submitted password against the stored hash via matchPassword().
 * - Returns a JWT + user info (password is stripped from the response).
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: 'Please provide email and password' });
    }

    // Look up user by email; we need +password so we can compare hashes.
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: 'Invalid credentials' });
    }

    const token = signToken(user._id);

    // Send back user info WITHOUT the password field.
    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * GET /api/auth/me  (protected — requires a valid JWT)
 *
 * Bonus helper endpoint the frontend can hit after page refresh to rehydrate
 * AuthContext. The `protect` middleware runs first, decodes the token, and
 * attaches req.user — so here we just return what's already on req.user.
 * (Not strictly required by the step spec, but cheap and very useful for the
 * frontend to avoid keeping full user data only in localStorage.)
 */
exports.getMe = async (req, res) => {
  try {
    // req.user is populated by the protect() middleware in authMiddleware.js.
    const user = await User.findById(req.user.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: 'User not found' });
    }
    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('getMe error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
