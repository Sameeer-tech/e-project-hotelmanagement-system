// models/Reservation.js
// Mongoose schema/model for hotel room reservations / bookings.
// Links a guest (User) to a specific Room over a date range and tracks
// the booking lifecycle: booked -> checked-in -> checked-out / cancelled.

const mongoose = require('mongoose');

/**
 * Reservation Schema
 *
 * Fields:
 *   guest         - Reference to the User (guest) who made the booking (required).
 *   room          - Reference to the Room being reserved (required).
 *   checkInDate   - Guest's planned arrival date (required, must be before checkOutDate).
 *   checkOutDate  - Guest's planned departure date (required).
 *   status        - Booking lifecycle status. Enum:
 *                   'booked'     — reservation confirmed, guest not yet arrived
 *                   'checked-in' — guest is currently staying in the room
 *                   'checked-out'— guest has left, room is ready for / awaiting cleaning
 *                   'cancelled'  — booking was cancelled before check-in
 *                   Defaults to 'booked' when a new reservation is created.
 *   createdAt     - Timestamp set automatically when the reservation is made.
 */
const ReservationSchema = new mongoose.Schema({
  guest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Please provide a guest (User reference)'],
  },
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: [true, 'Please provide a room (Room reference)'],
  },
  checkInDate: {
    type: Date,
    required: [true, 'Please add a check-in date'],
  },
  checkOutDate: {
    type: Date,
    required: [true, 'Please add a check-out date'],
  },
  status: {
    type: String,
    enum: ['booked', 'checked-in', 'checked-out', 'cancelled'],
    default: 'booked',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// --- Indexes --------------------------------------------------------------
// Speed up date-overlap checks (availability) and lookups by guest / room.
ReservationSchema.index({ room: 1, checkInDate: 1, checkOutDate: 1 });
ReservationSchema.index({ guest: 1 });
ReservationSchema.index({ status: 1 });

module.exports = mongoose.model('Reservation', ReservationSchema);
