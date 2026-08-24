const express = require('express');
const { getUsers, updateUser, deleteUser, getStats } = require('../controllers/adminController');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/users', auth, authorize('admin'), getUsers);
router.put('/users/:id', auth, authorize('admin'), updateUser);
router.delete('/users/:id', auth, authorize('admin'), deleteUser);
router.get('/stats', auth, authorize('admin'), getStats);

module.exports = router;
