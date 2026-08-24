const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const ShowSeat = require('../models/ShowSeat');
const Event = require('../models/Event');
const generateBookingRef = require('../utils/generateBookingRef');
const emailService = require('../services/emailService');
const waitlistService = require('../services/waitlistService');
const QRCode = require('qrcode');

const conflict = (message) => {
  const error = new Error(message);
  error.statusCode = 409;
  return error;
};

exports.createBooking = async (req, res) => {
  const { eventId, seatLabels } = req.body;
  const userId = req.user.id;

  if (!mongoose.isValidObjectId(eventId) || !Array.isArray(seatLabels) || !seatLabels.length) {
    return res.status(400).json({ message: 'A valid event ID and seat labels are required' });
  }

  const uniqueSeatLabels = [...new Set(seatLabels.map((label) => String(label || '').trim().toUpperCase()).filter(Boolean))];
  if (uniqueSeatLabels.length !== seatLabels.length) {
    return res.status(400).json({ message: 'Seat labels must be unique and non-empty' });
  }
  if (uniqueSeatLabels.length > 10) {
    return res.status(400).json({ message: 'You can book at most 10 seats per order' });
  }

  const session = await mongoose.startSession();
  let bookingId;

  try {
    await session.withTransaction(async () => {
      const now = new Date();
      const seats = await ShowSeat.find({
        event: eventId,
        seatLabel: { $in: uniqueSeatLabels }
      }).session(session);

      if (seats.length !== uniqueSeatLabels.length) {
        throw conflict('One or more requested seats do not exist');
      }

      const seatByLabel = new Map(seats.map((seat) => [seat.seatLabel, seat]));
      const invalidSeat = uniqueSeatLabels.find((label) => {
        const seat = seatByLabel.get(label);
        return !seat || seat.status !== 'HELD' || String(seat.heldBy) !== String(userId) || !seat.holdExpiresAt || seat.holdExpiresAt <= now;
      });
      if (invalidSeat) {
        throw conflict(`Seat ${invalidSeat} is not held by you or its hold has expired`);
      }

      const totalAmount = seats.reduce((sum, seat) => sum + Number(seat.price || 0), 0);
      const seatDetails = uniqueSeatLabels.map((label) => {
        const seat = seatByLabel.get(label);
        return { seatLabel: seat.seatLabel, category: seat.category, price: seat.price };
      });
      const bookingReference = generateBookingRef();
      const qrCodeDataUrl = await QRCode.toDataURL(bookingReference, { errorCorrectionLevel: 'M' });

      const [booking] = await Booking.create([{
        customer: userId,
        event: eventId,
        seats: seatDetails,
        totalAmount,
        bookingReference,
        qrCode: qrCodeDataUrl
      }], { session });

      const updateResult = await ShowSeat.updateMany(
        {
          event: eventId,
          seatLabel: { $in: uniqueSeatLabels },
          status: 'HELD',
          heldBy: userId,
          holdExpiresAt: { $gt: now }
        },
        {
          $set: { status: 'BOOKED', booking: booking._id },
          $unset: { heldBy: 1, holdExpiresAt: 1 }
        },
        { session }
      );

      if (updateResult.modifiedCount !== uniqueSeatLabels.length) {
        throw conflict('One or more seats are no longer available for booking');
      }

      bookingId = booking._id;
    });

    const populatedBooking = await Booking.findById(bookingId)
      .populate({ path: 'event', populate: { path: 'venue' } })
      .populate('customer', 'name email');

    try {
      if (emailService.sendBookingConfirmation) {
        await emailService.sendBookingConfirmation(populatedBooking, populatedBooking.event, populatedBooking.customer || req.user);
      }
    } catch (emailError) {
      console.error('Booking confirmation email failed:', emailError);
    }

    return res.status(201).json(populatedBooking);
  } catch (error) {
    console.error('Booking creation error:', error);
    if (error.statusCode) return res.status(error.statusCode).json({ message: error.message });
    if (error.code === 11000) return res.status(409).json({ message: 'Booking reference collision; please retry' });
    return res.status(500).json({ message: 'Server error', error: error.message });
  } finally {
    await session.endSession();
  }
};

exports.getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ customer: req.user.id })
      .populate({ path: 'event', populate: { path: 'venue' } })
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate({ path: 'event', populate: { path: 'venue' } })
      .populate('customer', 'name email');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (String(booking.customer?._id || booking.customer) !== String(req.user.id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view this booking' });
    }
    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.verifyBooking = async (req, res) => {
  try {
    const booking = await Booking.findOne({ bookingReference: String(req.params.reference || '').trim().toUpperCase() })
      .populate({ path: 'event', populate: { path: 'venue' } });
    if (!booking) return res.status(404).json({ valid: false, message: 'Booking not found' });
    res.json({
      valid: booking.status === 'CONFIRMED',
      bookingReference: booking.bookingReference,
      status: booking.status,
      event: booking.event,
      seats: booking.seats,
      totalAmount: booking.totalAmount,
      createdAt: booking.createdAt
    });
  } catch (error) {
    res.status(500).json({ valid: false, message: 'Server error', error: error.message });
  }
};

exports.cancelBooking = async (req, res) => {
  const session = await mongoose.startSession();
  let releasedSeats = [];
  let eventId;

  try {
    await session.withTransaction(async () => {
      const query = { _id: req.params.id, status: 'CONFIRMED' };
      if (req.user.role !== 'admin') query.customer = req.user.id;

      const booking = await Booking.findOne(query).session(session);
      if (!booking) {
        const existing = await Booking.findById(req.params.id).session(session);
        if (!existing) {
          const error = new Error('Booking not found');
          error.statusCode = 404;
          throw error;
        }
        if (String(existing.customer) !== String(req.user.id) && req.user.role !== 'admin') {
          const error = new Error('Not authorized to cancel this booking');
          error.statusCode = 403;
          throw error;
        }
        const error = new Error(existing.status === 'CANCELLED' ? 'Booking is already cancelled' : 'Booking cannot be cancelled');
        error.statusCode = 400;
        throw error;
      }

      const seats = await ShowSeat.find({ booking: booking._id }).session(session);
      await Booking.updateOne(
        { _id: booking._id, status: 'CONFIRMED' },
        { $set: { status: 'CANCELLED', cancelledAt: new Date() } },
        { session }
      );
      await ShowSeat.updateMany(
        { booking: booking._id, status: 'BOOKED' },
        { $set: { status: 'AVAILABLE' }, $unset: { booking: 1, heldBy: 1, holdExpiresAt: 1 } },
        { session }
      );

      releasedSeats = seats.map((seat) => ({ category: seat.category, seatLabel: seat.seatLabel }));
      eventId = booking.event;
    });

    for (const seat of releasedSeats) {
      try {
        await waitlistService.offerSeatToNextInLine(eventId, seat.category, seat.seatLabel);
      } catch (error) {
        console.error('Waitlist offer failed:', error);
      }
    }

    const cancelledBooking = await Booking.findById(req.params.id)
      .populate({ path: 'event', populate: { path: 'venue' } });
    res.json(cancelledBooking);
  } catch (error) {
    const status = error.statusCode || 500;
    res.status(status).json({ message: status === 500 ? 'Server error' : error.message, ...(status === 500 ? { error: error.message } : {}) });
  } finally {
    await session.endSession();
  }
};

exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('customer', 'name email')
      .populate({ path: 'event', populate: { path: 'venue' } })
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
