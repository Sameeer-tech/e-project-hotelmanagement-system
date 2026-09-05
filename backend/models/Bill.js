// models/Bill.js
// Mongoose schema/model for hotel Bills / Invoices generated against a stay.
// Each bill is linked to one Reservation and aggregates the room charge
// (room price × nights) plus any extra services (breakfast, transfers,
// room service, spa, late check-out, etc.) into a single totalAmount.

const mongoose = require('mongoose');

/**
 * Bill Schema
 *
 * Fields:
 *   reservation    - Reference to the Reservation / booking this bill is
 *                    generated for (required). One reservation may have at
 *                    most one unpaid bill and one paid bill (although the
 *                    model doesn't enforce 1:1 — the controller re-uses any
 *                    existing unpaid bill on generateBill).
 *   roomCharge     - Accommodation total in USD:
 *                    Room.pricePerNight × nightsBetween(checkInDate, checkOutDate)
 *   extraServices  - Array of line-item charges beyond the room rate.
 *                    Each entry: { name, cost } where:
 *                      name - Short description (e.g. "Breakfast × 2 days")
 *                      cost - Total line-item cost in USD (qty × unit, precomputed)
 *   totalAmount    - roomCharge + sum(extraServices[*].cost). This is the
 *                    final amount the guest owes (tax is applied at the
 *                    frontend; the backend stores pre-tax totals for
 *                    simplicity in this student project).
 *   status         - unpaid (invoice has been issued, awaiting payment)
 *                    paid  (payment confirmed / settled)
 *                    Defaults to 'unpaid' when a new bill is generated.
 *   createdAt      - Timestamp set automatically when the bill is issued.
 */
const BillSchema = new mongoose.Schema({
  reservation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Reservation',
    required: [true, 'Please link this bill to a reservation'],
  },
  roomCharge: {
    type: Number,
    required: [true, 'Please add a room charge'],
    min: [0, 'Room charge cannot be negative'],
    default: 0,
  },
  extraServices: {
    type: [
      {
        name: {
          type: String,
          required: [true, 'Extra service item requires a name'],
          trim: true,
        },
        cost: {
          type: Number,
          required: [true, 'Extra service item requires a cost'],
          min: [0, 'Service cost cannot be negative'],
        },
      },
    ],
    default: [],
  },
  totalAmount: {
    type: Number,
    required: [true, 'Please add a total amount'],
    min: [0, 'Total amount cannot be negative'],
    default: 0,
  },
  status: {
    type: String,
    enum: ['unpaid', 'paid'],
    default: 'unpaid',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// --- Indexes --------------------------------------------------------------
// Speeds up lookups by reservation (the primary way bills are fetched)
BillSchema.index({ reservation: 1 });
BillSchema.index({ status: 1 });

module.exports = mongoose.model('Bill', BillSchema);
