// models/User.js
// Mongoose schema/model for all system users (admin, manager, receptionist,
// housekeeping, guest). Password is auto-hashed via a pre('save') hook using
// bcryptjs before the document is written to MongoDB.

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * User Schema
 *
 * Fields:
 *   name      - Full display name of the user (required)
 *   email     - Login identifier; must be unique across the collection (required)
 *   password  - Bcrypt-hashed password string (required, never sent in responses)
 *   role      - Authorization role; restricts which routes the user may access
 *               One of: 'admin' | 'manager' | 'receptionist' | 'housekeeping' | 'guest'
 *               Defaults to 'guest' so self-service sign-ups get the least privilege.
 *   phone     - Optional contact phone number
 *   createdAt - Timestamp set automatically when the document is created
 */
const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email',
    ],
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: [6, 'Password must be at least 6 characters'],
    // Hide the password by default when converting documents to JSON (e.g. res.json)
    select: false,
  },
  role: {
    type: String,
    enum: ['admin', 'manager', 'receptionist', 'housekeeping', 'guest'],
    default: 'guest',
  },
  phone: {
    type: String,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

/**
 * Pre-save hook — runs automatically before User.save().
 * If the `password` field has been modified (new user or password change),
 * we hash it with bcrypt (cost factor 10) before writing to the database.
 *
 * Mongoose 7+ note: async pre-hooks do NOT receive a `next` callback —
 * the hook just returns a Promise (from the async function) and Mongoose
 * waits for it to resolve/reject. So we simply `return` instead of
 * calling `next()` when there's nothing to do.
 */
UserSchema.pre('save', async function () {
  // Only run if password was modified (otherwise re-hashing would break logins)
  if (!this.isModified('password')) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

/**
 * Instance method: compare a candidate password (from login form) against
 * the bcrypt hash stored in the database. Returns true/false.
 */
UserSchema.methods.matchPassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
