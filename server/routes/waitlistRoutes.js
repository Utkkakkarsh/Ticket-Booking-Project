const express = require('express');
const { joinWaitlist, getMyWaitlist, acceptOffer, cancelWaitlist } = require('../controllers/waitlistController');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

router.post('/', auth, authorize('customer'), joinWaitlist);
router.get('/', auth, getMyWaitlist);
router.post('/:id/accept', auth, authorize('customer'), acceptOffer);
router.post('/:id/cancel', auth, cancelWaitlist);

module.exports = router;
