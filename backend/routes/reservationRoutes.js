// routes/reservationRoutes.js
// Express router for Reservations / Bookings + check-in/check-out.
// Mounted in server.js at:  app.use('/api/reservations', reservationRoutes)
//
// Role rules (per Step 4 spec):
//   - All routes require authentication (protect middleware).
//   - Reading (GET /, GET /:id, POST /) is open to ANY logged-in user
//     (guests can book their own stay, staff can view everything).
//   - Mutating the booking lifecycle (cancel / checkIn / checkOut) is
//     restricted to STAFF roles: admin, manager, receptionist.

const express = require('express');
const {
  createReservation,
  getAllReservations,
  getReservationsToday,
  getReservationById,
  cancelReservation,
  checkIn,
  checkOut,
} = require('../controllers/reservationController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// IMPORTANT: `/today` must be declared BEFORE `/:id` so Express does NOT
// match the word "today" as a value for the :id URL parameter.

// --- Read + Create (any authenticated user: guest or staff) ---------------
router
  .route('/')
  .get(protect, getAllReservations)
  .post(protect, createReservation);

// Today's arrivals + departures (CheckInOut.jsx page). Staff only.
router
  .route('/today')
  .get(protect, authorize('admin', 'manager', 'receptionist'), getReservationsToday);

router.route('/:id').get(protect, getReservationById);

// --- Lifecycle transitions (STAFF ONLY: admin / manager / receptionist) ---
// Cancels a booked reservation (cannot cancel once checked-in).
router
  .route('/:id/cancel')
  .patch(protect, authorize('admin', 'manager', 'receptionist'), cancelReservation);

// Flips booking to checked-in + room to 'occupied'.
router
  .route('/:id/checkin')
  .patch(protect, authorize('admin', 'manager', 'receptionist'), checkIn);

// Flips booking to checked-out + room to 'cleaning' (housekeeping queue).
router
  .route('/:id/checkout')
  .patch(protect, authorize('admin', 'manager', 'receptionist'), checkOut);

module.exports = router;
