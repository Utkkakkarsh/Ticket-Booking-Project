const Event = require('../models/Event');
const Booking = require('../models/Booking');

exports.getMyEvents = async (req, res) => {
  try {
    const events = await Event.find({ organiser: req.user.id })
      .populate('venue')
      .sort({ date: -1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const events = await Event.find({ organiser: req.user.id }).sort({ date: -1 });
    const eventIds = events.map((event) => event._id);
    const bookings = await Booking.find({ event: { $in: eventIds }, status: 'CONFIRMED' })
      .populate('customer', 'name email')
      .populate('event', 'title date startTime')
      .sort({ createdAt: -1 });

    const eventsWithStats = events.map((event) => {
      const eventBookings = bookings.filter((booking) => String(booking.event?._id || booking.event) === String(event._id));
      return {
        _id: event._id,
        title: event.title,
        date: event.date,
        ticketsSold: eventBookings.reduce((sum, booking) => sum + booking.seats.length, 0),
        bookingsCount: eventBookings.length,
        revenue: eventBookings.reduce((sum, booking) => sum + Number(booking.totalAmount || 0), 0)
      };
    });

    const recentBookings = bookings.slice(0, 10).map((booking) => ({
      ...booking.toObject(),
      user: booking.customer,
      reference: booking.bookingReference
    }));
    const totalRevenue = bookings.reduce((sum, booking) => sum + Number(booking.totalAmount || 0), 0);

    res.json({
      totalEvents: events.length,
      totalBookings: bookings.length,
      totalRevenue,
      events: eventsWithStats,
      eventsRevenue: eventsWithStats,
      recentBookings
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
