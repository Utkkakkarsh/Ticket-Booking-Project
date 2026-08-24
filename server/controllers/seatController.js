const mongoose = require('mongoose');
const ShowSeat = require('../models/ShowSeat');
const config = require('../config');

const MAX_SEATS_PER_ORDER = 10;

const normalizeSeatLabels = (seatLabels) => {
  if (!Array.isArray(seatLabels)) return [];
  return seatLabels
    .map((label) => String(label || '').trim().toUpperCase())
    .filter(Boolean);
};

const errorWithStatus = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

exports.getSeats = async (req, res) => {
  try {
    const { eventId } = req.params;
    if (!mongoose.isValidObjectId(eventId)) {
      return res.status(400).json({ message: 'Invalid event ID' });
    }

    const now = new Date();
    await ShowSeat.updateMany(
      { event: eventId, status: 'HELD', holdExpiresAt: { $lte: now } },
      {
        $set: { status: 'AVAILABLE' },
        $unset: { heldBy: 1, holdExpiresAt: 1, booking: 1 }
      }
    );

    const seats = await ShowSeat.find({ event: eventId }).sort({ row: 1, column: 1 });
    res.json(seats.map((seat) => ({ ...seat.toObject(), label: seat.seatLabel })));
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.holdSeats = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { eventId } = req.body;
    const userId = req.user.id;
    const seatLabels = normalizeSeatLabels(req.body.seatLabels);

    if (!mongoose.isValidObjectId(eventId)) {
      return res.status(400).json({ message: 'A valid event ID is required' });
    }
    if (!seatLabels.length) {
      return res.status(400).json({ message: 'At least one seat label is required' });
    }
    if (seatLabels.length > MAX_SEATS_PER_ORDER) {
      return res.status(400).json({ message: `You can hold at most ${MAX_SEATS_PER_ORDER} seats` });
    }
    if (new Set(seatLabels).size !== seatLabels.length) {
      return res.status(400).json({ message: 'Duplicate seat labels are not allowed' });
    }

    const holdExpiresAt = new Date(Date.now() + config.seatHoldMinutes * 60 * 1000);
    let heldSeats;

    await session.withTransaction(async () => {
      const now = new Date();
      const seats = await ShowSeat.find({
        event: eventId,
        seatLabel: { $in: seatLabels }
      }).session(session);

      if (seats.length !== seatLabels.length) {
        throw errorWithStatus('One or more requested seats do not exist', 400);
      }

      const seatByLabel = new Map(seats.map((seat) => [seat.seatLabel, seat]));
      const unavailable = seatLabels.find((label) => {
        const seat = seatByLabel.get(label);
        if (!seat) return true;
        const expired = seat.status === 'HELD' && (!seat.holdExpiresAt || seat.holdExpiresAt <= now);
        const owned = seat.status === 'HELD' && String(seat.heldBy) === String(userId) && seat.holdExpiresAt > now;
        return seat.status !== 'AVAILABLE' && !expired && !owned;
      });

      if (unavailable) {
        throw errorWithStatus(`Seat ${unavailable} is not available`, 409);
      }

      const updateResult = await ShowSeat.updateMany(
        {
          event: eventId,
          seatLabel: { $in: seatLabels },
          $or: [
            { status: 'AVAILABLE' },
            { status: 'HELD', holdExpiresAt: { $lte: now } },
            { status: 'HELD', heldBy: userId, holdExpiresAt: { $gt: now } }
          ]
        },
        {
          $set: {
            status: 'HELD',
            heldBy: userId,
            holdExpiresAt
          },
          $unset: { booking: 1 }
        },
        { session }
      );

      if (updateResult.modifiedCount !== seatLabels.length) {
        throw errorWithStatus('One or more seats were taken while creating the hold. Please refresh and try again.', 409);
      }

      heldSeats = await ShowSeat.find({
        event: eventId,
        seatLabel: { $in: seatLabels },
        heldBy: userId,
        status: 'HELD'
      }).session(session);
    });

    res.json({
      seats: seatLabels.map((label) => {
        const seat = heldSeats.find((item) => item.seatLabel === label);
        return { ...seat.toObject(), label: seat.seatLabel };
      }),
      holdExpiresAt
    });
  } catch (error) {
    const status = error.statusCode || 500;
    res.status(status).json({ message: status === 500 ? 'Server error' : error.message, ...(status === 500 ? { error: error.message } : {}) });
  } finally {
    await session.endSession();
  }
};

exports.releaseSeats = async (req, res) => {
  try {
    const { eventId } = req.body;
    const seatLabels = normalizeSeatLabels(req.body.seatLabels);

    if (!mongoose.isValidObjectId(eventId) || !seatLabels.length) {
      return res.status(400).json({ message: 'A valid event ID and seat labels are required' });
    }

    const result = await ShowSeat.updateMany(
      {
        event: eventId,
        seatLabel: { $in: seatLabels },
        status: 'HELD',
        heldBy: req.user.id
      },
      {
        $set: { status: 'AVAILABLE' },
        $unset: { heldBy: 1, holdExpiresAt: 1, booking: 1 }
      }
    );

    res.json({ message: 'Seats released successfully', released: result.modifiedCount });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.normalizeSeatLabels = normalizeSeatLabels;
exports.MAX_SEATS_PER_ORDER = MAX_SEATS_PER_ORDER;
