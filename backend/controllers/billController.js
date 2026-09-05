// controllers/billController.js
// Request handlers for Bills / Invoices.
// 3 exports:
//   generateBill        - POST  /api/bills                (staff only)
//   getBillByReservation - GET  /api/bills/reservation/:id (staff or guest)
//   markBillPaid         - PATCH /api/bills/:id/pay       (staff only)
//
// Plus two bonus helpers that the frontend Billing.jsx page relies on:
//   getAllBills          - GET  /api/bills                (staff only — list view)
//   getBillByBookingRef  - GET  /api/billing/:bookingRef  (alias for the page's
//                                                         existing /billing/:bookingId call)
//
// Role enforcement is in routes/billRoutes.js.

const Bill = require('../models/Bill');
const Reservation = require('../models/Reservation');
const Room = require('../models/Room');
const User = require('../models/User');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Consistent 404 response for missing bills.
 */
const billNotFound = (res, id) =>
  res.status(404).json({
    success: false,
    message: `Bill not found with id ${id}`,
  });

/**
 * Calcluate number of nights between two dates (min 1).
 * Used for roomCharge = pricePerNight × nights.
 */
const calcNights = (checkInDate, checkOutDate) => {
  const ms = new Date(checkOutDate) - new Date(checkInDate);
  const nights = Math.round(ms / (1000 * 60 * 60 * 24));
  return Math.max(1, nights);
};

/**
 * Generate a stable invoice number like INV-2026-<billSeq>.
 * Uses year + first 4 hex chars of the Bill Mongo _id.
 */
const generateInvoiceNumber = (billId) => {
  const year = new Date().getFullYear();
  const hex = String(billId).slice(0, 4);
  const seq = parseInt(hex, 16) % 9000 + 1000;
  return `INV-${year}-${seq}`;
};

/**
 * Match a free-form "booking identifier" (from URL /:bookingRef) to the
 * underlying Reservation document. Supports:
 *   (a) Mongo 24-char ObjectId of a Reservation
 *   (b) Booking reference string like "BK-2026-1234" — we reverse-engineer
 *       it by extracting the year+seq tail (<= last 8 chars encoded) and
 *       scanning the most recent 50 reservations for the matching prefix.
 *   (c) Synthetic demo IDs like "BK-IN-<roomId>" or "BK-OUT-<roomId>"
 *       (matching the scheme used in reservationController).
 *   (d) Room number string (e.g. "101") → returns the current/last booking.
 *
 * Returns Reservation doc (populated) or null.
 */
const resolveReservationFromRef = async (ref) => {
  if (!ref) return null;

  // (a) Mongo ObjectId for Reservation
  if (/^[a-f0-9]{24}$/i.test(ref)) {
    const r = await Reservation.findById(ref)
      .populate('guest', 'name email phone')
      .populate('room', 'roomNumber type pricePerNight status');
    return r;
  }

  // (c) Synthetic BK-IN- / BK-OUT- prefix (same as checkin/checkout)
  const synt = /^BK-(IN|OUT)-(.*)$/i.exec(ref);
  if (synt) {
    const status = synt[1].toUpperCase() === 'IN' ? 'booked' : 'checked-in';
    const roomPart = synt[2];
    let room = /^[a-f0-9]{24}$/i.test(roomPart)
      ? await Room.findById(roomPart)
      : await Room.findOne({ roomNumber: String(roomPart) });
    if (!room) return null;
    return await Reservation.findOne({ room: room._id, status })
      .sort({ createdAt: -1 })
      .populate('guest', 'name email phone')
      .populate('room', 'roomNumber type pricePerNight status');
  }

  // (d) Pure room number (e.g. "101")
  if (/^\d{2,5}$/.test(ref)) {
    const room = await Room.findOne({ roomNumber: ref });
    if (room) {
      return (
        (await Reservation.findOne({
          room: room._id,
          status: { $in: ['checked-in', 'booked'] },
        })
          .sort({ createdAt: -1 })
          .populate('guest', 'name email phone')
          .populate('room', 'roomNumber type pricePerNight status')) ||
        (await Reservation.findOne({ room: room._id })
          .sort({ createdAt: -1 })
          .populate('guest', 'name email phone')
          .populate('room', 'roomNumber type pricePerNight status'))
      );
    }
  }

  // (b) Booking reference like BK-2026-1234 — fallback: load recent
  // reservations and compute their toFrontend() reference until we find a match.
  const recent = await Reservation.find({})
    .sort({ createdAt: -1 })
    .limit(100)
    .populate('guest', 'name email phone')
    .populate('room', 'roomNumber type pricePerNight status');
  for (const r of recent) {
    const year = r.createdAt ? new Date(r.createdAt).getFullYear() : new Date().getFullYear();
    const hex = String(r._id).slice(0, 4);
    const seq = parseInt(hex, 16) % 9000 + 1000;
    const candidate = `BK-${year}-${seq}`;
    if (candidate === String(ref).toUpperCase()) return r;
  }
  return null;
};

/**
 * Map a (populated) Bill document to the shape Billing.jsx expects.
 * Includes booking reference, invoice number, guest info, stay details,
 * nights, tax (at 12% by default — matches AppContext default sysConfig),
 * and a structured extras array usable by the printable invoice.
 */
const toFrontend = async (bill) => {
  // Ensure populated
  if (!bill.reservation || typeof bill.reservation === 'string') {
    bill = await Bill.populate(bill, [
      {
        path: 'reservation',
        populate: [
          { path: 'guest', select: 'name email phone' },
          { path: 'room', select: 'roomNumber type pricePerNight status' },
        ],
      },
    ]);
  }
  const res = bill.reservation;
  const nights = calcNights(res.checkInDate, res.checkOutDate);
  const roomDoc = res.room || {};
  const guestDoc = res.guest || {};

  const extrasTotal = (bill.extraServices || []).reduce(
    (sum, e) => sum + Number(e.cost || 0),
    0
  );
  const subTotal = Number(bill.roomCharge || 0) + extrasTotal;
  // Default tax rate is 12% (matches AppContext sysConfig default).
  // The backend stores totals pre-tax; tax is applied on output here so
  // the frontend "totals sidebar" and the generated invoice are in sync.
  const taxRate = 0.12;
  const tax = Math.round(subTotal * taxRate * 100) / 100;
  const grandTotal = Math.round((subTotal + tax) * 100) / 100;

  const invoiceNumber = generateInvoiceNumber(bill._id);
  // Compute the booking reference from the reservation id
  const bookingYear = res.createdAt
    ? new Date(res.createdAt).getFullYear()
    : new Date().getFullYear();
  const bookingHex = String(res._id).slice(0, 4);
  const bookingSeq = parseInt(bookingHex, 16) % 9000 + 1000;
  const bookingRef = `BK-${bookingYear}-${bookingSeq}`;

  // Map extraServices ({name, cost}) → frontend extras shape with qty=1
  // and unit = cost. The frontend's invoice renderer will loop over these.
  const extrasFrontend = (bill.extraServices || []).map((e, idx) => ({
    id: `e${idx}`,
    name: e.name,
    qty: 1,
    price: Number(e.cost || 0),
    enabled: true,
  }));

  return {
    id: String(bill._id),
    invoiceNumber,
    bookingRef,
    reference: bookingRef,
    reservationId: String(res._id),
    status: bill.status === 'paid' ? 'PAID' : 'UNPAID',
    statusLabel: bill.status === 'paid' ? 'Paid' : 'Unpaid',
    issuedAt: bill.createdAt ? new Date(bill.createdAt).toISOString() : null,

    guest: {
      id: guestDoc._id ? String(guestDoc._id) : null,
      name: guestDoc.name || 'Guest',
      email: guestDoc.email || '',
      phone: guestDoc.phone || '',
    },
    guestName: guestDoc.name || 'Guest',

    stay: {
      roomId: roomDoc._id ? String(roomDoc._id) : null,
      roomNumber: roomDoc.roomNumber || '?',
      roomType: roomDoc.type || 'Standard',
      roomPricePerNight: Number(roomDoc.pricePerNight || 0),
      checkIn: new Date(res.checkInDate).toISOString().slice(0, 10),
      checkOut: new Date(res.checkOutDate).toISOString().slice(0, 10),
      nights,
      reservationStatus: res.status || 'booked',
    },
    checkIn: new Date(res.checkInDate).toISOString().slice(0, 10),
    checkOut: new Date(res.checkOutDate).toISOString().slice(0, 10),
    nights,

    roomCharge: Number(bill.roomCharge || 0),
    extraServices: (bill.extraServices || []).map((e) => ({
      name: e.name,
      cost: Number(e.cost || 0),
    })),
    extrasFrontend,
    extrasTotal,

    subTotal,
    taxRate: Math.round(taxRate * 1000) / 10, // 12
    tax,
    totalAmount: Number(bill.totalAmount || 0), // pre-tax DB total
    grandTotal, // with tax (matches Billing.jsx sidebar final number)
  };
};

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

/**
 * POST /api/bills
 * Generate a bill for a given reservation.
 *
 * Body: {
 *   reservationId: <Mongo ID or booking ref string>,  // required
 *   extraServices: [ { name, cost } ],                // optional extras
 * }
 *
 * Behavior:
 *   - If an UNPAID bill already exists for this reservation, it is
 *     regenerated (re-sums room + new extras list and saves over it) so the
 *     same /bills endpoint acts as both create + refresh.
 *   - roomCharge is auto-computed from Room.pricePerNight × nights.
 *   - totalAmount = roomCharge + sum(extras[*].cost).
 */
exports.generateBill = async (req, res) => {
  try {
    const { reservationId, extraServices = [] } = req.body;
    if (!reservationId) {
      return res.status(400).json({
        success: false,
        message: 'reservationId is required to generate a bill',
      });
    }

    // Resolve the reservation (accepts Mongo ID / booking ref / room number)
    const reservation = await resolveReservationFromRef(reservationId);
    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: `Reservation not found for ref ${reservationId}`,
      });
    }

    // Validate extra services array
    if (!Array.isArray(extraServices)) {
      return res.status(400).json({
        success: false,
        message: 'extraServices must be an array of {name, cost}',
      });
    }
    for (const e of extraServices) {
      if (!e.name || typeof e.cost !== 'number' || e.cost < 0) {
        return res.status(400).json({
          success: false,
          message: `Invalid extra service (name + non-negative cost required): ${JSON.stringify(
            e
          )}`,
        });
      }
    }

    // Calculate room charge from the Room price × nights
    const nights = calcNights(reservation.checkInDate, reservation.checkOutDate);
    const roomPricePerNight = Number(reservation.room?.pricePerNight || 0);
    const roomCharge = Math.round(roomPricePerNight * nights * 100) / 100;
    const extrasSum = extraServices.reduce(
      (sum, e) => sum + Number(e.cost || 0),
      0
    );
    const totalAmount = Math.round((roomCharge + extrasSum) * 100) / 100;

    // Re-use an existing UNPAID bill if present (so bill can be regenerated
    // multiple times without duplicates). Otherwise create a new one.
    let bill = await Bill.findOne({
      reservation: reservation._id,
      status: 'unpaid',
    });
    if (bill) {
      bill.roomCharge = roomCharge;
      bill.extraServices = extraServices;
      bill.totalAmount = totalAmount;
      await bill.save();
    } else {
      bill = await Bill.create({
        reservation: reservation._id,
        roomCharge,
        extraServices,
        totalAmount,
        status: 'unpaid',
      });
    }

    const frontend = await toFrontend(bill);
    res.status(201).json({
      success: true,
      message: 'Bill generated',
      data: frontend,
      // Also emit legacy fields Billing.jsx may rely on (invoiceNumber, bookingRef)
      invoiceNumber: frontend.invoiceNumber,
      bookingRef: frontend.bookingRef,
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const msgs = Object.values(error.errors).map((v) => v.message);
      return res.status(400).json({ success: false, message: msgs.join(', ') });
    }
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid reservation id/reference format',
      });
    }
    console.error('generateBill error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

/**
 * GET /api/bills
 * List all bills (staff only, paginated-friendly). Optional filters:
 *   ?status=unpaid|paid
 *   ?reservation=<ref>
 */
exports.getAllBills = async (req, res) => {
  try {
    const query = {};
    if (req.query.status && ['unpaid', 'paid'].includes(req.query.status)) {
      query.status = req.query.status;
    }
    if (req.query.reservation) {
      const r = await resolveReservationFromRef(req.query.reservation);
      if (r) query.reservation = r._id;
    }

    const bills = await Bill.find(query)
      .populate({
        path: 'reservation',
        populate: [
          { path: 'guest', select: 'name email phone' },
          { path: 'room', select: 'roomNumber type pricePerNight status' },
        ],
      })
      .sort({ createdAt: -1 });

    const data = await Promise.all(bills.map(toFrontend));
    res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    console.error('getAllBills error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * GET /api/bills/:id
 * Get a single bill by Bill Mongo ID.
 * Privacy: guests can only read bills that belong to their own bookings.
 */
exports.getBillById = async (req, res) => {
  try {
    let bill = await Bill.findById(req.params.id).populate({
      path: 'reservation',
      populate: [
        { path: 'guest', select: 'name email phone' },
        { path: 'room', select: 'roomNumber type pricePerNight status' },
      ],
    });
    if (!bill) return billNotFound(res, req.params.id);

    // Privacy: non-staff only see bills for their OWN stay
    const staffRoles = ['admin', 'manager', 'receptionist', 'housekeeping'];
    const guestId = bill.reservation?.guest?._id || bill.reservation?.guest;
    if (
      !staffRoles.includes(req.user.role) &&
      String(guestId || '') !== String(req.user.id)
    ) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden — you may only view your own bills',
      });
    }

    const frontend = await toFrontend(bill);
    res.status(200).json({ success: true, data: frontend });
  } catch (error) {
    if (error.name === 'CastError') return billNotFound(res, req.params.id);
    console.error('getBillById error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * GET /api/bills/reservation/:ref
 * Get bill(s) associated with a given reservation (booking ref / Mongo id /
 * room number / demo synthetic ID).
 *
 * Same privacy guard as above (guests only own).
 */
exports.getBillByReservation = async (req, res) => {
  try {
    const reservation = await resolveReservationFromRef(req.params.ref);
    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: `Reservation not found for ref ${req.params.ref}`,
      });
    }

    // Privacy: non-staff can only request a bill for their OWN reservation
    const staffRoles = ['admin', 'manager', 'receptionist', 'housekeeping'];
    if (
      !staffRoles.includes(req.user.role) &&
      String(reservation.guest?._id ?? reservation.guest) !== String(req.user.id)
    ) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden — you may only view your own bills',
      });
    }

    const bills = await Bill.find({ reservation: reservation._id })
      .populate({
        path: 'reservation',
        populate: [
          { path: 'guest', select: 'name email phone' },
          { path: 'room', select: 'roomNumber type pricePerNight status' },
        ],
      })
      .sort({ createdAt: -1 });

    const data = await Promise.all(bills.map(toFrontend));

    // Billing.jsx calls /billing/:bookingId and uses single-bill response shape
    // → if exactly one bill found, also return it as `data[0]` + alias fields.
    const latest = data[0] || null;
    res.status(200).json({
      success: true,
      count: data.length,
      data: latest || data, // single bill when 1, array otherwise (matches both callers)
      all: data,
      invoiceNumber: latest?.invoiceNumber || null,
      bookingRef: latest?.bookingRef || req.params.ref,
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: `Reservation not found for ref ${req.params.ref}`,
      });
    }
    console.error('getBillByReservation error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * GET /api/billing/:bookingRef   (alias for frontend Billing.jsx page)
 *
 * Convenience wrapper around getBillByReservation. If NO bill exists yet,
 * it auto-generates one on-the-fly (with no extras) so the Billing.jsx page
 * always has a bill to render when called with any valid booking ref.
 */
exports.getBillByBookingRef = async (req, res) => {
  try {
    const reservation = await resolveReservationFromRef(req.params.bookingRef);
    if (!reservation) {
      // 404 for unknown bookingRef — the frontend does `.catch(() => {})`
      // and then falls back to mock data.
      return res.status(404).json({
        success: false,
        message: `No reservation found for ref ${req.params.bookingRef}`,
      });
    }

    // Privacy guard (same as getBillByReservation)
    const staffRoles = ['admin', 'manager', 'receptionist', 'housekeeping'];
    if (
      !staffRoles.includes(req.user.role) &&
      String(reservation.guest?._id ?? reservation.guest) !== String(req.user.id)
    ) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden — you may only view your own bills',
      });
    }

    // Try to find an existing bill for this stay (any status)
    let bill = await Bill.findOne({ reservation: reservation._id })
      .populate({
        path: 'reservation',
        populate: [
          { path: 'guest', select: 'name email phone' },
          { path: 'room', select: 'roomNumber type pricePerNight status' },
        ],
      })
      .sort({ createdAt: -1 });

    // Auto-generate one (no extras) if no bill has been created yet — this
    // makes the Billing.jsx page "just work" on first view.
    if (!bill) {
      const nights = calcNights(reservation.checkInDate, reservation.checkOutDate);
      const roomCharge =
        Math.round(Number(reservation.room?.pricePerNight || 0) * nights * 100) / 100;
      bill = await Bill.create({
        reservation: reservation._id,
        roomCharge,
        extraServices: [],
        totalAmount: roomCharge,
        status: 'unpaid',
      });
      bill = await Bill.populate(bill, [
        {
          path: 'reservation',
          populate: [
            { path: 'guest', select: 'name email phone' },
            { path: 'room', select: 'roomNumber type pricePerNight status' },
          ],
        },
      ]);
    }

    const frontend = await toFrontend(bill);
    res.status(200).json({
      success: true,
      data: frontend,
      invoiceNumber: frontend.invoiceNumber,
      bookingRef: frontend.bookingRef,
    });
  } catch (error) {
    console.error('getBillByBookingRef error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

/**
 * PATCH /api/bills/:id/pay
 * Mark a bill PAID. Only staff can take payment actions.
 * Bills already paid are idempotent (200 OK, no-op).
 */
exports.markBillPaid = async (req, res) => {
  try {
    let bill = await Bill.findById(req.params.id).populate({
      path: 'reservation',
      populate: [
        { path: 'guest', select: 'name email phone' },
        { path: 'room', select: 'roomNumber type pricePerNight status' },
      ],
    });
    if (!bill) return billNotFound(res, req.params.id);

    if (bill.status === 'paid') {
      // Idempotent
      const frontend = await toFrontend(bill);
      return res.status(200).json({
        success: true,
        message: 'Bill is already marked as paid',
        data: frontend,
      });
    }

    bill.status = 'paid';
    await bill.save();

    const frontend = await toFrontend(bill);
    res.status(200).json({
      success: true,
      message: 'Bill marked as paid',
      data: frontend,
    });
  } catch (error) {
    if (error.name === 'CastError') return billNotFound(res, req.params.id);
    console.error('markBillPaid error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
