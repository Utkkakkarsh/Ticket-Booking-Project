const express = require('express');
const { getVenues, getVenue, createVenue, updateVenue, deleteVenue } = require('../controllers/venueController');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, getVenues);
router.get('/:id', auth, getVenue);
router.post('/', auth, authorize('admin', 'organiser'), createVenue);
router.put('/:id', auth, authorize('admin'), updateVenue);
router.delete('/:id', auth, authorize('admin'), deleteVenue);

module.exports = router;
