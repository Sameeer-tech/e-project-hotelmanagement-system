// models/Room.js
// Mongoose schema/model for hotel rooms used in room management,
// booking, housekeeping, and billing flows.

const mongoose = require('mongoose');

/**
 * Room Schema
 *
 * Fields:
 *   roomNumber     - Unique identifier printed on the door, e.g. "101" or "S-203"
 *                    (string because leading zeros / prefixes are allowed).
 *   type           - Room category used for pricing + display. Enum:
 *                    'single' | 'double' | 'suite' | 'deluxe'.
 *   pricePerNight  - Cost per night in USD (Number, required, min 0).
 *   status         - Operational status used across modules:
 *                    'available'    — guest can book it (booking search, check-in)
 *                    'occupied'     — guest currently checked in
 *                    'cleaning'     — checked-out, waiting for housekeeping
 *                    'maintenance'  — out of order for repairs
 *   description    - Optional human-readable blurb (beds, size, view, etc.)
 *   createdAt      - Timestamp set automatically when the room is added.
 */
const RoomSchema = new mongoose.Schema({
  roomNumber: {
    type: String,
    required: [true, 'Please add a room number'],
    unique: true,
    trim: true,
  },
  type: {
    type: String,
    required: [true, 'Please add a room type'],
    enum: ['single', 'double', 'suite', 'deluxe'],
  },
  pricePerNight: {
    type: Number,
    required: [true, 'Please add a price per night'],
    min: [0, 'Price cannot be negative'],
  },
  status: {
    type: String,
    enum: ['available', 'occupied', 'cleaning', 'maintenance'],
    default: 'available',
  },
  description: {
    type: String,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Room', RoomSchema);
