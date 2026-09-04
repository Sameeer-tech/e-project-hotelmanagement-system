// controllers/roomController.js
// CRUD request handlers for the Room resource.
// 6 exports:
//   createRoom        - POST   /api/rooms                (admin/manager only)
//   getAllRooms       - GET    /api/rooms                (any logged-in user)
//   getRoomById       - GET    /api/rooms/:id            (any logged-in user)
//   updateRoom        - PUT    /api/rooms/:id            (admin/manager only)
//   deleteRoom        - DELETE /api/rooms/:id            (admin/manager only)
//   updateRoomStatus  - PATCH  /api/rooms/:id/status     (admin/manager only)
//
// Role enforcement happens in routes/roomRoutes.js via protect + authorize middleware.

const Room = require('../models/Room');

/**
 * Helper: sends a consistent 404 response when a room ID isn't found.
 * Used by getRoomById / updateRoom / deleteRoom / updateRoomStatus.
 */
const roomNotFound = (res, id) =>
  res.status(404).json({
    success: false,
    message: `Room not found with id ${id}`,
  });

/**
 * POST /api/rooms
 * Creates a new room document. Rejects duplicate roomNumber (400 from Mongo 11000).
 * Body: { roomNumber, type, pricePerNight, status?, description? }
 */
exports.createRoom = async (req, res) => {
  try {
    const room = await Room.create(req.body);
    res.status(201).json({ success: true, data: room });
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ success: false, message: 'Room number already exists' });
    }
    if (error.name === 'ValidationError') {
      const msgs = Object.values(error.errors).map((v) => v.message);
      return res.status(400).json({ success: false, message: msgs.join(', ') });
    }
    console.error('createRoom error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * GET /api/rooms
 * Returns ALL rooms (small dataset — no pagination needed for student project).
 * Optional query filters: ?type=suite  ?status=available
 */
exports.getAllRooms = async (req, res) => {
  try {
    const query = {};
    if (req.query.type) query.type = req.query.type;
    if (req.query.status) query.status = req.query.status;

    const rooms = await Room.find(query).sort({ roomNumber: 1 });
    res.status(200).json({ success: true, count: rooms.length, data: rooms });
  } catch (error) {
    console.error('getAllRooms error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * GET /api/rooms/:id
 * Returns a single room by its MongoDB _id, or 404.
 */
exports.getRoomById = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return roomNotFound(res, req.params.id);
    res.status(200).json({ success: true, data: room });
  } catch (error) {
    // CastError = req.params.id is not a valid Mongo ObjectId format → treat as 404.
    if (error.name === 'CastError') {
      return roomNotFound(res, req.params.id);
    }
    console.error('getRoomById error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * PUT /api/rooms/:id
 * Full / partial update of any room field(s). Same validation rules as creation.
 * Uses findByIdAndUpdate with {new:true, runValidators:true} so the updated doc
 * is returned AND Mongoose re-runs the schema validators on the incoming patch.
 */
exports.updateRoom = async (req, res) => {
  try {
    // Mongoose 7+ note: `new: true` is deprecated in favor of
    // `returnDocument: 'after'`. Both work for now, but we use the
    // modern form here to avoid deprecation warnings. `runValidators`
    // ensures the schema validators (enum, min, required) still run.
    const room = await Room.findByIdAndUpdate(req.params.id, req.body, {
      returnDocument: 'after',
      runValidators: true,
    });
    if (!room) return roomNotFound(res, req.params.id);
    res.status(200).json({ success: true, data: room });
  } catch (error) {
    if (error.name === 'CastError') return roomNotFound(res, req.params.id);
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ success: false, message: 'Room number already exists' });
    }
    if (error.name === 'ValidationError') {
      const msgs = Object.values(error.errors).map((v) => v.message);
      return res.status(400).json({ success: false, message: msgs.join(', ') });
    }
    console.error('updateRoom error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * DELETE /api/rooms/:id
 * Removes a room from the system entirely. Returns 404 if the ID is missing.
 */
exports.deleteRoom = async (req, res) => {
  try {
    const room = await Room.findByIdAndDelete(req.params.id);
    if (!room) return roomNotFound(res, req.params.id);
    res.status(200).json({ success: true, message: 'Room deleted', data: {} });
  } catch (error) {
    if (error.name === 'CastError') return roomNotFound(res, req.params.id);
    console.error('deleteRoom error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * PATCH /api/rooms/:id/status
 * Dedicated micro-endpoint to flip the room status. Used by:
 *   - Housekeeping after cleaning:   "cleaning"   -> "available"
 *   - Receptionist on check-in:      "available"  -> "occupied"
 *   - Receptionist on check-out:     "occupied"   -> "cleaning"
 *   - Manager when a room breaks:    any          -> "maintenance"
 *
 * Keeping this separate from PUT /:id makes the client code simpler and gives
 * us a single place to validate the incoming status against the enum
 * (runValidators:true below ensures the schema enum list is enforced).
 */
exports.updateRoomStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res
        .status(400)
        .json({ success: false, message: 'Please provide a status' });
    }

    const room = await Room.findByIdAndUpdate(
      req.params.id,
      { status },
      { returnDocument: 'after', runValidators: true }
    );
    if (!room) return roomNotFound(res, req.params.id);
    res.status(200).json({ success: true, data: room });
  } catch (error) {
    if (error.name === 'CastError') return roomNotFound(res, req.params.id);
    if (error.name === 'ValidationError') {
      const msgs = Object.values(error.errors).map((v) => v.message);
      return res.status(400).json({ success: false, message: msgs.join(', ') });
    }
    console.error('updateRoomStatus error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
