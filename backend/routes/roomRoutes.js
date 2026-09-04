// routes/roomRoutes.js
// Express router for Room Management endpoints.
// Mounted in server.js at:  app.use('/api/rooms', roomRoutes)
//
// Role rules (per Step 3 spec):
//   - Any LOGGED-IN user (protect) can read rooms (GET /api/rooms, GET /api/rooms/:id)
//   - Only admin / manager (protect + authorize) can create, update, delete, or change status.

const express = require('express');
const {
  createRoom,
  getAllRooms,
  getRoomById,
  updateRoom,
  deleteRoom,
  updateRoomStatus,
} = require('../controllers/roomController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// --- Read routes (any authenticated user: admin/manager/receptionist/housekeeping/guest)
router.route('/').get(protect, getAllRooms);
router.route('/:id').get(protect, getRoomById);

// --- Write routes (admin + manager only)
router
  .route('/')
  .post(protect, authorize('admin', 'manager'), createRoom);

router
  .route('/:id')
  .put(protect, authorize('admin', 'manager'), updateRoom)
  .delete(protect, authorize('admin', 'manager'), deleteRoom);

router
  .route('/:id/status')
  .patch(protect, authorize('admin', 'manager'), updateRoomStatus);

module.exports = router;
