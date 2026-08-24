const express = require('express');
const {
  createBooking,
  getMyBookings,
  getBooking,
  verifyBooking,
  cancelBooking,
  getAllBookings
} = require('../controllers/bookingController');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

router.post('/', auth, authorize('customer'), createBooking);
router.get('/', auth, getMyBookings);
router.get('/admin/all', auth, authorize('admin'), getAllBookings);
router.get('/verify/:reference', verifyBooking);
router.get('/:id', auth, getBooking);
router.post('/:id/cancel', auth, authorize('customer'), cancelBooking);

module.exports = router;
