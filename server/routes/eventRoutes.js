const express = require('express');
const { 
  getEvents, 
  getEvent, 
  createEvent, 
  updateEvent, 
  deleteEvent,
  getEventBookings,
  getEventStats,
  rescheduleEvent
} = require('../controllers/eventController');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', getEvents);
router.get('/:id', getEvent);
router.post('/', auth, authorize('organiser', 'admin'), createEvent);
router.put('/:id', auth, authorize('organiser', 'admin'), updateEvent);
router.patch('/:id/reschedule', auth, authorize('organiser', 'admin'), rescheduleEvent);
router.delete('/:id', auth, authorize('organiser', 'admin'), deleteEvent);
router.get('/:id/bookings', auth, authorize('organiser', 'admin'), getEventBookings);
router.get('/:id/stats', auth, authorize('organiser', 'admin'), getEventStats);

module.exports = router;
