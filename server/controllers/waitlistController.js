const mongoose = require('mongoose');
const crypto = require('crypto');
const Waitlist = require('../models/Waitlist');
const ShowSeat = require('../models/ShowSeat');
const Event = require('../models/Event');
const config = require('../config');
const waitlistService = require('../services/waitlistService');

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

exports.joinWaitlist = async (req, res) => {
  try {
    const { eventId, category } = req.body;
    const normalizedCategory = String(category || '').trim();
    if (!mongoose.isValidObjectId(eventId) || !normalizedCategory) {
      return res.status(400).json({ message: 'A valid event ID and category are required' });
    }

    const event = await Event.findById(eventId).populate('venue');
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (!event.venue.categories.some((item) => item.name === normalizedCategory)) {
      return res.status(400).json({ message: 'Unknown seat category for this event' });
    }

    const existingEntry = await Waitlist.findOne({
      customer: req.user.id,
      event: eventId,
      category: normalizedCategory,
      status: { $in: ['WAITING', 'OFFERED', 'ACCEPTED'] }
    });
    if (existingEntry) {
      return res.status(409).json({ message: 'You are already active on this waitlist' });
    }

    const lastEntry = await Waitlist.findOne({ event: eventId, category: normalizedCategory })
      .sort({ position: -1, createdAt: -1 });
    const entry = await Waitlist.create({
      customer: req.user.id,
      event: eventId,
      category: normalizedCategory,
      position: (lastEntry?.position || 0) + 1
    });
    res.status(201).json(entry);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getMyWaitlist = async (req, res) => {
  try {
    const entries = await Waitlist.find({ customer: req.user.id })
      .populate({ path: 'event', populate: { path: 'venue' } })
      .sort({ createdAt: -1 });
    res.json(entries);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.acceptOffer = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const suppliedToken = String(req.body?.token || req.query?.token || '').trim();
    await session.withTransaction(async () => {
      const now = new Date();
      const entry = await Waitlist.findById(req.params.id).select('+offerTokenHash').session(session);
      if (!entry) {
        const error = new Error('Waitlist entry not found');
        error.statusCode = 404;
        throw error;
      }
      if (String(entry.customer) !== String(req.user.id)) {
        const error = new Error('Not authorized');
        error.statusCode = 403;
        throw error;
      }
      if (entry.status !== 'OFFERED' || !entry.offerExpiresAt || entry.offerExpiresAt <= now) {
        const error = new Error('No valid offer available');
        error.statusCode = 400;
        throw error;
      }
      if (entry.offerTokenHash && (!suppliedToken || hashToken(suppliedToken) !== entry.offerTokenHash)) {
        const error = new Error('Invalid or expired offer token');
        error.statusCode = 400;
        throw error;
      }
      if (!entry.offeredSeat) {
        const error = new Error('No seat offered');
        error.statusCode = 400;
        throw error;
      }

      const holdExpiresAt = new Date(now.getTime() + config.seatHoldMinutes * 60 * 1000);
      const seat = await ShowSeat.findOneAndUpdate(
        {
          event: entry.event,
          seatLabel: entry.offeredSeat,
          status: 'HELD',
          heldBy: entry.customer,
          holdExpiresAt: { $gt: now }
        },
        { $set: { holdExpiresAt } },
        { new: true, session }
      );
      if (!seat) {
        const error = new Error('The offered seat is no longer available');
        error.statusCode = 409;
        throw error;
      }

      await Waitlist.updateOne(
        { _id: entry._id, status: 'OFFERED', offerExpiresAt: { $gt: now } },
        {
          $set: { status: 'ACCEPTED', acceptedAt: now },
          $unset: { offerTokenHash: 1, offerExpiresAt: 1 }
        },
        { session }
      );

      res.locals.waitlistAcceptance = {
        entry: entry.toObject(),
        seat: { ...seat.toObject(), label: seat.seatLabel },
        seatLabels: [seat.seatLabel],
        totalAmount: seat.price,
        holdExpiresAt
      };
    });

    return res.json(res.locals.waitlistAcceptance);
  } catch (error) {
    const status = error.statusCode || 500;
    res.status(status).json({ message: status === 500 ? 'Server error' : error.message, ...(status === 500 ? { error: error.message } : {}) });
  } finally {
    await session.endSession();
  }
};

exports.cancelWaitlist = async (req, res) => {
  try {
    const entry = await Waitlist.findById(req.params.id);
    if (!entry) return res.status(404).json({ message: 'Waitlist entry not found' });
    if (String(entry.customer) !== String(req.user.id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (['CANCELLED', 'EXPIRED'].includes(entry.status)) {
      return res.status(400).json({ message: 'Waitlist entry is already inactive' });
    }

    const offeredSeat = entry.status === 'OFFERED' ? entry.offeredSeat : null;
    entry.status = 'CANCELLED';
    entry.cancelledAt = new Date();
    await entry.save();

    if (offeredSeat) {
      await ShowSeat.updateOne(
        { event: entry.event, seatLabel: offeredSeat, status: 'HELD', heldBy: entry.customer },
        { $set: { status: 'AVAILABLE' }, $unset: { heldBy: 1, holdExpiresAt: 1, booking: 1 } }
      );
      await waitlistService.offerSeatToNextInLine(entry.event, entry.category, offeredSeat);
    }

    res.json(entry);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
