// routes/billRoutes.js
// Express router for Bills / Invoices.
// Mounted in server.js at both:
//   app.use('/api/bills', billRoutes)      (canonical Step 5 URL)
//   app.use('/api/billing', billRoutes)    (alias — Billing.jsx calls /billing/*)
//
// Role rules (per Step 5 spec):
//   - ALL routes protected (logged-in users only — protect middleware).
//   - Create / update operations (generate bill, mark paid) restricted to
//     STAFF roles (admin / manager / receptionist).
//   - Read operations (get by id / get by reservation) are open to ANY
//     logged-in user — the controller applies an additional per-bill
//     privacy guard so guests can only read their own invoices.

const express = require('express');
const {
  generateBill,
  getAllBills,
  getBillById,
  getBillByReservation,
  getBillByBookingRef,
  markBillPaid,
} = require('../controllers/billController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// IMPORTANT: more-specific routes must be declared BEFORE parameter routes
// so Express does NOT match the word "reservation" / booking ref segment as :id.

// --- Generate + list (canonical base '/') ---------------------------------
// POST /  → Generate a NEW bill (or regenerate the unpaid one for a stay).
// GET  /  → List all bills (staff-only).
router
  .route('/')
  .post(protect, authorize('admin', 'manager', 'receptionist'), generateBill)
  .get(protect, authorize('admin', 'manager', 'receptionist'), getAllBills);

// --- /reservation/:ref — by reservation ref ------------------------------
// Exposed at /reservation/:ref per Step 5 spec.
// Also handled via the /:bookingRef alias route below.
router
  .route('/reservation/:ref')
  .get(protect, getBillByReservation);

// --- /billing/:bookingRef — frontend Billing.jsx calls this pattern ------
// Exposed as GET  /billing/:bookingRef (the alias mount means this
// resolves to GET /api/billing/:bookingRef from the frontend's point of view).
router
  .route('/billing/:bookingRef')
  .get(protect, getBillByBookingRef);

// --- Single-bill reads + mutations ---------------------------------------
// GET   /:id       → Get a single bill by Bill Mongo ID.
// PATCH /:id/pay   → Mark bill PAID.
router
  .route('/:id')
  .get(protect, getBillById);

router
  .route('/:id/pay')
  .patch(protect, authorize('admin', 'manager', 'receptionist'), markBillPaid);

// --- Wildcard convenience route: /:bookingRef (non-ObjectId path segment)
// If the :id pattern didn't match because the segment is a booking ref
// string (BK-...), re-route to the booking-ref handler so shorthand URLs
// like /api/bills/BK-2026-1001 work the same as /api/billing/BK-2026-1001.
router.route('/:bookingRef').get(protect, getBillByBookingRef);

module.exports = router;
