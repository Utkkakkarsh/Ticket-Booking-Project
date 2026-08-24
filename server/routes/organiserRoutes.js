const express = require('express');
const { getMyEvents, getDashboardStats } = require('../controllers/organiserController');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/events', auth, authorize('organiser'), getMyEvents);
router.get('/dashboard', auth, authorize('organiser'), getDashboardStats);

module.exports = router;
