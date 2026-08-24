const mongoose = require('mongoose');
const User = require('../models/User');
const Venue = require('../models/Venue');
const Event = require('../models/Event');
const Booking = require('../models/Booking');

const ROLES = ['customer', 'organiser', 'admin'];

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid user ID' });
    const { role, name, email } = req.body;
    if (role && !ROLES.includes(String(role).toLowerCase())) return res.status(400).json({ message: 'Invalid role' });
    if (req.params.id === String(req.user.id) && role && String(role).toLowerCase() !== 'admin') {
      return res.status(400).json({ message: 'You cannot remove your own admin role' });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (name !== undefined) user.name = String(name).trim();
    if (email !== undefined) user.email = String(email).trim().toLowerCase();
    if (role) user.role = String(role).toLowerCase();
    await user.save();

    res.json({ id: user._id, name: user.name, email: user.email, role: user.role });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'Email is already in use' });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    if (String(req.params.id) === String(req.user.id)) return res.status(400).json({ message: 'You cannot delete your own admin account' });
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getStats = async (req, res) => {
  try {
    const [totalUsers, totalOrganisers, totalAdmins, totalVenues, totalEvents, totalBookings, bookings] = await Promise.all([
      User.countDocuments({ role: 'customer' }),
      User.countDocuments({ role: 'organiser' }),
      User.countDocuments({ role: 'admin' }),
      Venue.countDocuments(),
      Event.countDocuments(),
      Booking.countDocuments({ status: 'CONFIRMED' }),
      Booking.find({ status: 'CONFIRMED' }).select('totalAmount')
    ]);
    const totalRevenue = bookings.reduce((sum, booking) => sum + Number(booking.totalAmount || 0), 0);
    res.json({ totalUsers, totalOrganisers, totalAdmins, totalVenues, totalEvents, totalBookings, totalRevenue });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
