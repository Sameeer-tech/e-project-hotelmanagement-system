// routes/authRoutes.js
// Express router for authentication endpoints.
// Mounted in server.js at:  app.use('/api/auth', authRoutes)
//
// Public routes (no JWT required):  POST /register,  POST /login
// Protected route (JWT required):   GET  /me

const express = require('express');
const { register, login, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// --- Public endpoints -------------------------------------------------------
// Anyone can call these (login page, registration page).
router.post('/register', register);
router.post('/login', login);

// --- Protected endpoint ------------------------------------------------------
// Only callable with a valid "Authorization: Bearer <token>" header.
// Used by the frontend on page load to rehydrate the current user.
router.get('/me', protect, getMe);

module.exports = router;
