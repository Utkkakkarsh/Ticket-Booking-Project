const express = require('express');
const { getSeats, holdSeats, releaseSeats } = require('../controllers/seatController');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/event/:eventId', auth, getSeats);
router.post('/hold', auth, authorize('customer'), holdSeats);
router.post('/release', auth, authorize('customer'), releaseSeats);

module.exports = router;
