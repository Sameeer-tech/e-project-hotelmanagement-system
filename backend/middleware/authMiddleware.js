// middleware/authMiddleware.js
// Route guards for authenticated and role-restricted endpoints.
// Use as:
//   router.get('/admin-only', protect, authorize('admin'), handler)
//   router.get('/any-user', protect, handler)

const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * protect — Authentication guard.
 *
 * Reads the JWT from the "Authorization: Bearer <token>" request header,
 * verifies its signature using JWT_SECRET from .env, decodes the {id} payload,
 * looks up the matching user document in MongoDB, and ATTACHES it as req.user
 * so downstream handlers/controllers can read the current user directly.
 *
 * If anything fails (missing header, malformed token, expired token, user
 * deleted from DB since token was issued) we return a 401 immediately.
 */
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Standard header format: "Authorization: Bearer eyJhbGciOi..."
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized — no token provided',
      });
    }

    // Verify the token signature and decode payload { id, iat, exp }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Load the user document from the DB so req.user reflects the current
    // state (e.g. role may have been changed after the token was issued).
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized — user no longer exists',
      });
    }

    // Attach the full user object to the request. Handlers downstream can
    // read req.user.id, req.user.role, req.user.name, etc.
    req.user = user;
    next();
  } catch (error) {
    // Common failures: JsonWebTokenError (bad signature), TokenExpiredError.
    // We don't leak the exact reason to the client, but log it for debugging.
    console.error('Protect middleware error:', error.message);
    return res.status(401).json({
      success: false,
      message: 'Not authorized — invalid or expired token',
    });
  }
};

/**
 * authorize(...roles) — Authorization (role) guard.
 *
 * Higher-order function: call it with one or more allowed roles to get a
 * middleware that checks whether req.user.role is in that list.
 * Usage: authorize('admin', 'manager')  →  only those two roles may pass.
 *
 * MUST be used AFTER protect(), because protect() is what sets req.user.
 * If req.user is missing or has a non-allowed role → 403 Forbidden.
 */
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized — please log in first',
      });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden — role '${req.user.role}' is not allowed to access this resource`,
      });
    }
    next();
  };
};
