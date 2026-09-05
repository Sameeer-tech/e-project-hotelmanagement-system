// controllers/reservationController.js
// Request handlers for Reservations (bookings) and check-in / check-out.
// 7 exports:
//   createReservation   - POST   /api/reservations            (any logged-in user)
//   getAllReservations  - GET    /api/reservations            (any logged-in user)
//   getReservationsToday- GET    /api/reservations/today      (staff only — arrivals + departures)
//   getReservationById  - GET    /api/reservations/:id        (any logged-in user)
//   cancelReservation   - PATCH  /api/reservations/:id/cancel (staff: admin/manager/receptionist)
//   checkIn             - PATCH  /api/reservations/:id/checkin  (staff)
//   checkOut            - PATCH  /api/reservations/:id/checkout (staff)
//
// Role enforcement happens in routes/reservationRoutes.js via protect + authorize.
//
// COMPATIBILITY NOTE:
//   The frontend (Booking.jsx + CheckInOut.jsx) was built against the legacy
//   planned URL `/api/bookings/*` and uses a slightly different field naming
//   convention:
//     - Payload sends `roomId` / `checkIn` / `checkOut` + nested `guest` object
//       instead of `room` / `checkInDate` / `checkOutDate` + `guest` as an ObjectId.
//     - Frontend expects responses with `reference`, `guestName`, `id` (not _id),
//       and human-readable status labels `Pending | Checked In | Checked Out`.
//     - CheckInOut.jsx calls PATCH `/bookings/<frontend-id>/checkin` where the
//       ID is a string like `BK-IN-<roomId>` — we extract the Room Mongo ID
//       from that prefix and look up the active booking for it.
//
//   To avoid breaking the frontend while the backend uses the canonical
//   `Reservation` model names, every handler below:
//     (a) accepts BOTH payload conventions on input, and
//     (b) maps its output shape via toFrontend(reservation) so the existing
//         React page code works with real backend data without changes.

const Reservation = require('../models/Reservation');
const Room = require('../models/Room');
const User = require('../models/User');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Consistent 404 response for missing reservations.
 */
const reservationNotFound = (res, id) =>
  res.status(404).json({
    success: false,
    message: `Reservation not found with id ${id}`,
  });

/**
 * Date-overlap check — is the room already booked during [start, end]?
 *
 * Two date ranges [A1,A2] and [B1,B2] overlap when:
 *   A1 < B2  AND  A2 > B1
 *
 * We only count ACTIVE reservations (booked / checked-in) because cancelled
 * or checked-out bookings don't block the room.
 */
const roomIsOccupied = async (roomId, start, end, excludeId = null) => {
  const query = {
    room: roomId,
    status: { $in: ['booked', 'checked-in'] },
    checkInDate: { $lt: end },
    checkOutDate: { $gt: start },
  };
  if (excludeId) query._id = { $ne: excludeId };
  const count = await Reservation.countDocuments(query);
  return count > 0;
};

/**
 * Map backend canonical status → frontend human-readable status label.
 *   booked      → Pending
 *   checked-in  → Checked In
 *   checked-out → Checked Out
 *   cancelled   → Cancelled
 */
const statusToFrontend = (s) =>
  ({
    booked: 'Pending',
    'checked-in': 'Checked In',
    'checked-out': 'Checked Out',
    cancelled: 'Cancelled',
  }[s] || s);

/**
 * Generate a stable, human-readable booking reference like BK-2026-1234.
 * Uses year + first 4 digits of the Mongo ObjectId's timestamp portion.
 * Deterministic from _id so repeated calls return the same value.
 */
const generateReference = (reservationId) => {
  const year = new Date().getFullYear();
  const hex = String(reservationId).slice(0, 4);
  const seq = parseInt(hex, 16) % 9000 + 1000;
  return `BK-${year}-${seq}`;
};

/**
 * Map a (populated) Reservation document to the shape the existing frontend
 * components (Booking.jsx / CheckInOut.jsx) already work with.
 *
 * Fields:
 *   id, reference, guestName, email, phone,
 *   room: { id, number (==roomNumber), type, floor, price, status },
 *   checkIn, checkOut, status, nights, guest (raw sub-object for future use)
 */
const toFrontend = (r) => {
  const start = new Date(r.checkInDate);
  const end = new Date(r.checkOutDate);
  const nights = Math.max(
    1,
    Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  );
  const guestName = r.guest?.name || '(Guest)';
  const email = r.guest?.email || '';
  const phone = r.guest?.phone || '';
  const reference = generateReference(r._id);
  return {
    id: String(r._id),
    reference,
    guestName,
    email,
    phone,
    guest: r.guest
      ? {
          id: String(r.guest._id),
          name: r.guest.name,
          email: r.guest.email,
          phone: r.guest.phone,
        }
      : null,
    room: {
      id: String(r.room?._id ?? r.room),
      number: r.room?.roomNumber ?? '?',
      type: r.room?.type ?? 'Standard',
      floor: r.room?.roomNumber
        ? String(r.room.roomNumber).length > 2
          ? `${String(r.room.roomNumber).slice(0, -2)}F`
          : 'GF'
        : 'GF',
      pricePerNight: r.room?.pricePerNight ?? 0,
      price: r.room?.pricePerNight ?? 0,
      status:
        {
          available: 'Available',
          occupied: 'Occupied',
          cleaning: 'Needs Cleaning',
          maintenance: 'Maintenance',
        }[r.room?.status] || r.room?.status || 'Available',
    },
    checkIn: start.toISOString().slice(0, 10),
    checkOut: end.toISOString().slice(0, 10),
    status: statusToFrontend(r.status),
    nights,
    totalPrice: (r.room?.pricePerNight ?? 0) * nights,
  };
};

/**
 * Normalize incoming POST body to the canonical Reservation fields.
 *
 * Handles TWO shapes:
 *
 *   Shape A — Backend convention (direct):
 *     { guest, room, checkInDate, checkOutDate, status? }
 *
 *   Shape B — Frontend Booking.jsx convention:
 *     { roomId, checkIn, checkOut, guestCount, totalPrice,
 *       guest: { name, email, phone, specialRequests } }
 *
 * For Shape B we need the guest to exist as a User document. If no such user
 * exists (the form was filled out anonymously), we create a minimal guest
 * User document on the fly so the reservation has a valid ref.
 */
const normalizePayload = async (body) => {
  // Already in backend convention
  if (body.guest && body.room && body.checkInDate && body.checkOutDate) {
    return {
      guest: body.guest,
      room: body.room,
      checkInDate: new Date(body.checkInDate),
      checkOutDate: new Date(body.checkOutDate),
      status: body.status,
    };
  }

  // Frontend convention — resolve roomId -> room ObjectId
  const roomId = body.roomId || body.room;
  const rawCheckIn = body.checkIn || body.checkInDate;
  const rawCheckOut = body.checkOut || body.checkOutDate;
  const guestObj = body.guest || {};

  // Find / create a User for the guest (the form provides name/email/phone).
  // Prefer an existing user by email so repeat guests accumulate history.
  let guestUserId = null;
  if (guestObj.email) {
    let u = await User.findOne({ email: String(guestObj.email).toLowerCase() });
    if (!u) {
      u = await User.create({
        name: guestObj.name || `Guest ${Date.now()}`,
        email: String(guestObj.email).toLowerCase(),
        password: `guest-${Date.now()}`, // auto-generated; guests can reset later
        role: 'guest',
        phone: guestObj.phone || '',
      });
    }
    guestUserId = u._id;
  } else if (typeof body.guest === 'string') {
    // Backend-style guest ObjectId passed via guest field without rest of fields
    guestUserId = body.guest;
  } else {
    throw new Error('Guest email or guest User ID is required');
  }

  return {
    guest: guestUserId,
    room: roomId,
    checkInDate: new Date(rawCheckIn),
    checkOutDate: new Date(rawCheckOut),
  };
};

/**
 * Resolve a "flexible" reservation ID parameter to a real Reservation doc.
 *
 * The frontend uses two different ID schemes:
 *   (1) Real Mongo ObjectId — e.g. `66d9f8c1a2b3c4d5e6f7a8b9`
 *   (2) Synthetic demo IDs from CheckInOut.jsx:
 *         `BK-IN-<roomId>`   (mock arrivals)
 *         `BK-OUT-<roomId>`  (mock departures)
 *       where `<roomId>` is a string like the frontend's mock room UUID or
 *       (when roomId is a 24-char hex) a real Mongo Room _id.
 *
 * Case 1 → normal findById.
 * Case 2 → find the active booking (booked for IN, checked-in for OUT)
 *          that belongs to the matching room. If the demo ID's room part isn't
 *          a valid Mongo ObjectId, we fall back to looking up the room by
 *          roomNumber (since mock rooms use numeric IDs like "101").
 *
 * Returns a Reservation document OR null if nothing resolves.
 */
const resolveReservationById = async (flexId, modeHint = null) => {
  // --- Case 1: real Mongo ObjectId (24 hex chars, no hyphens) ---
  if (/^[a-f0-9]{24}$/i.test(flexId)) {
    return await Reservation.findById(flexId);
  }

  // --- Case 2: synthetic frontend ID like BK-IN-<roomId> or BK-OUT-<roomId> ---
  const match = /^BK-(IN|OUT)-(.*)$/i.exec(flexId);
  if (match) {
    const [, prefix, roomPart] = match;
    // Determine what status we want based on the prefix
    const desiredStatus = prefix.toUpperCase() === 'IN' ? 'booked' : 'checked-in';
    const status = modeHint || desiredStatus;

    let room = null;
    // Try Mongo ObjectId first
    if (/^[a-f0-9]{24}$/i.test(roomPart)) {
      room = await Room.findById(roomPart);
    }
    // Fall back to roomNumber lookup (mock rooms use roomNumber as "id" field)
    if (!room) {
      room = await Room.findOne({ roomNumber: String(roomPart) });
    }
    if (!room) return null;

    // Find the most recent active reservation for that room with the expected status.
    return await Reservation.findOne({ room: room._id, status })
      .sort({ createdAt: -1 })
      .populate('guest', 'name email phone')
      .populate('room', 'roomNumber type pricePerNight status');
  }

  // --- Case 3: just a room number string (e.g. "101") ---
  //    Some frontend flows treat room numbers as booking keys; try to
  //    find any active booking for that room (prefer checked-in, then booked).
  if (flexId && !flexId.includes(' ')) {
    const room = await Room.findOne({ roomNumber: String(flexId) });
    if (room) {
      return (
        (await Reservation.findOne({ room: room._id, status: 'checked-in' }).sort({
          createdAt: -1,
        })) ||
        (await Reservation.findOne({ room: room._id, status: 'booked' }).sort({
          createdAt: -1,
        }))
      );
    }
  }

  return null;
};

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

/**
 * POST /api/reservations   (same as POST /api/bookings)
 *
 * Accepts BOTH the backend canonical shape AND the frontend Booking.jsx
 * shape (see normalizePayload above). Returns the reservation in the
 * frontend-compatible shape with booking reference etc.
 */
exports.createReservation = async (req, res) => {
  try {
    const payload = await normalizePayload(req.body);
    const { guest, room, checkInDate: start, checkOutDate: end } = payload;

    // Validate date order + parseability
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format — use ISO strings (e.g. 2026-09-15)',
      });
    }
    if (end <= start) {
      return res.status(400).json({
        success: false,
        message: 'Check-out date must be AFTER check-in date',
      });
    }

    // Room must exist and not be in maintenance
    const roomDoc = await Room.findById(room);
    if (!roomDoc) {
      return res.status(404).json({
        success: false,
        message: `Room not found with id ${room}`,
      });
    }
    if (roomDoc.status === 'maintenance') {
      return res.status(400).json({
        success: false,
        message: 'Room is under maintenance and cannot be booked',
      });
    }

    // Double-book guard — overlapping active reservation blocks this
    const occupied = await roomIsOccupied(room, start, end);
    if (occupied) {
      return res.status(409).json({
        success: false,
        message: 'Room is not available for the requested dates',
      });
    }

    // Insert the doc + populate related refs for response
    const reservation = await Reservation.create({
      guest,
      room,
      checkInDate: start,
      checkOutDate: end,
      status: payload.status || 'booked',
    });
    await reservation.populate('guest', 'name email phone');
    await reservation.populate('room', 'roomNumber type pricePerNight status');

    const fe = toFrontend(reservation);
    // Return shape matches Booking.jsx expectation: data.reference
    res.status(201).json({ success: true, data: fe, reference: fe.reference });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const msgs = Object.values(error.errors).map((v) => v.message);
      return res.status(400).json({ success: false, message: msgs.join(', ') });
    }
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid guest or room reference ID format',
      });
    }
    console.error('createReservation error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

/**
 * GET /api/reservations
 * List all reservations. Optional query filters: ?guest / ?room / ?status.
 * Guests are auto-scoped to their own reservations; staff see everything.
 *
 * Response data[] is in frontend-compatible shape (see toFrontend).
 */
exports.getAllReservations = async (req, res) => {
  try {
    const query = {};

    const staffRoles = ['admin', 'manager', 'receptionist', 'housekeeping'];
    if (!staffRoles.includes(req.user.role)) {
      query.guest = req.user.id;
    } else if (req.query.guest) {
      query.guest = req.query.guest;
    }

    if (req.query.room) query.room = req.query.room;
    if (req.query.status) query.status = req.query.status;

    const reservations = await Reservation.find(query)
      .populate('guest', 'name email phone role')
      .populate('room', 'roomNumber type pricePerNight status')
      .sort({ createdAt: -1 });

    const data = reservations.map(toFrontend);
    res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    console.error('getAllReservations error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * GET /api/reservations/today    (same as GET /api/bookings/today)
 *
 * Returns today's arrivals + departures (for the CheckInOut.jsx page).
 *   - Arrivals   = status === 'booked'   AND checkInDate  is today
 *   - Departures = status === 'checked-in' AND checkOutDate is today
 *
 * (We also return currently-checked-in guests as "departures candidates"
 *  so the page isn't empty on demo — otherwise there's nothing to check out
 *  until someone first does check-in.)
 *
 * Staff-only (receptionists etc.).
 */
exports.getReservationsToday = async (req, res) => {
  try {
    // Build a start-of-day / end-of-day window for "today" in server-local time.
    const now = new Date();
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

    const arrivalsPromise = Reservation.find({
      status: 'booked',
      checkInDate: { $gte: dayStart, $lt: dayEnd },
    })
      .populate('guest', 'name email phone')
      .populate('room', 'roomNumber type pricePerNight status')
      .sort({ checkInDate: 1 });

    const departuresPromise = Reservation.find({
      status: 'checked-in',
      checkOutDate: { $gte: dayStart, $lt: dayEnd },
    })
      .populate('guest', 'name email phone')
      .populate('room', 'roomNumber type pricePerNight status')
      .sort({ checkOutDate: 1 });

    // Fallback: any in-house currently-checked-in guest shows as a departure
    // candidate so the page has demo content even without a scheduled checkout today.
    const inHousePromise = Reservation.find({ status: 'checked-in' })
      .populate('guest', 'name email phone')
      .populate('room', 'roomNumber type pricePerNight status')
      .sort({ checkOutDate: 1 })
      .limit(5);

    const [arrivals, departures, inHouse] = await Promise.all([
      arrivalsPromise,
      departuresPromise,
      inHousePromise,
    ]);

    // Deduplicate departures vs in-house fallback by _id
    const depIds = new Set(departures.map((d) => String(d._id)));
    const inHouseUnique = inHouse.filter((d) => !depIds.has(String(d._id)));
    const allDepartures = [...departures, ...inHouseUnique].slice(0, 10);

    const arrivalList = arrivals.map(toFrontend);
    const departureList = allDepartures.map(toFrontend);

    // Combined list matches the "initialBookings" union that CheckInOut.jsx
    // expected from its mock so the existing filter logic (by status string)
    // keeps working without frontend changes.
    const data = [...arrivalList, ...departureList];

    res.status(200).json({
      success: true,
      count: data.length,
      arrivals: arrivalList.length,
      departures: departureList.length,
      inHouse: inHouse.length,
      data,
    });
  } catch (error) {
    console.error('getReservationsToday error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * GET /api/reservations/:id
 * Fetch one reservation by ID. Supports flexible ID resolution (see helper).
 */
exports.getReservationById = async (req, res) => {
  try {
    let reservation = await resolveReservationById(req.params.id);
    if (!reservation) return reservationNotFound(res, req.params.id);

    // Ensure it's populated
    if (!reservation.guest || !reservation.guest.name) {
      reservation = await Reservation.populate(reservation, [
        { path: 'guest', select: 'name email phone role' },
        { path: 'room', select: 'roomNumber type pricePerNight status' },
      ]);
    }

    // Privacy guard — non-staff only see their own
    const staffRoles = ['admin', 'manager', 'receptionist', 'housekeeping'];
    if (
      !staffRoles.includes(req.user.role) &&
      String(reservation.guest?._id ?? reservation.guest) !== String(req.user.id)
    ) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden — you may only view your own reservations',
      });
    }

    res.status(200).json({ success: true, data: toFrontend(reservation) });
  } catch (error) {
    if (error.name === 'CastError') return reservationNotFound(res, req.params.id);
    console.error('getReservationById error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * PATCH /api/reservations/:id/cancel
 * Cancel a 'booked' reservation (cannot cancel once checked in/out).
 * Supports flexible IDs (demo BK-IN-xxx / roomNumber / Mongo ID).
 */
exports.cancelReservation = async (req, res) => {
  try {
    let reservation = await resolveReservationById(req.params.id, 'booked');
    if (!reservation) return reservationNotFound(res, req.params.id);

    if (reservation.status !== 'booked') {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel a reservation with status '${reservation.status}' (only 'booked' can be cancelled)`,
      });
    }

    reservation.status = 'cancelled';
    await reservation.save();
    reservation = await Reservation.populate(reservation, [
      { path: 'guest', select: 'name email phone' },
      { path: 'room', select: 'roomNumber type pricePerNight status' },
    ]);

    res.status(200).json({
      success: true,
      message: 'Reservation cancelled',
      data: toFrontend(reservation),
    });
  } catch (error) {
    if (error.name === 'CastError') return reservationNotFound(res, req.params.id);
    console.error('cancelReservation error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * PATCH /api/reservations/:id/checkin
 *   status: booked → checked-in
 *   room.status:   → occupied
 *
 * Accepts flexible IDs (demo BK-IN-xxx / room number / Mongo _id).
 */
exports.checkIn = async (req, res) => {
  try {
    let reservation = await resolveReservationById(req.params.id, 'booked');
    if (!reservation) return reservationNotFound(res, req.params.id);

    if (reservation.status !== 'booked') {
      return res.status(400).json({
        success: false,
        message: `Cannot check in — reservation status is '${reservation.status}' (must be 'booked')`,
      });
    }

    reservation.status = 'checked-in';
    await reservation.save();

    await Room.findByIdAndUpdate(
      reservation.room,
      { status: 'occupied' },
      { returnDocument: 'after', runValidators: true }
    );

    reservation = await Reservation.populate(reservation, [
      { path: 'guest', select: 'name email phone' },
      { path: 'room', select: 'roomNumber type pricePerNight status' },
    ]);

    res.status(200).json({
      success: true,
      message: 'Guest checked in',
      data: toFrontend(reservation),
    });
  } catch (error) {
    if (error.name === 'CastError') return reservationNotFound(res, req.params.id);
    console.error('checkIn error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * PATCH /api/reservations/:id/checkout
 *   status: checked-in → checked-out
 *   room.status:        → cleaning
 *
 * Accepts flexible IDs (demo BK-OUT-xxx / room number / Mongo _id).
 */
exports.checkOut = async (req, res) => {
  try {
    let reservation = await resolveReservationById(req.params.id, 'checked-in');
    if (!reservation) return reservationNotFound(res, req.params.id);

    if (reservation.status !== 'checked-in') {
      return res.status(400).json({
        success: false,
        message: `Cannot check out — reservation status is '${reservation.status}' (must be 'checked-in')`,
      });
    }

    reservation.status = 'checked-out';
    await reservation.save();

    await Room.findByIdAndUpdate(
      reservation.room,
      { status: 'cleaning' },
      { returnDocument: 'after', runValidators: true }
    );

    reservation = await Reservation.populate(reservation, [
      { path: 'guest', select: 'name email phone' },
      { path: 'room', select: 'roomNumber type pricePerNight status' },
    ]);

    res.status(200).json({
      success: true,
      message: 'Guest checked out',
      data: toFrontend(reservation),
    });
  } catch (error) {
    if (error.name === 'CastError') return reservationNotFound(res, req.params.id);
    console.error('checkOut error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
