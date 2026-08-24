const crypto = require('crypto');
const mongoose = require('mongoose');
const Waitlist = require('../models/Waitlist');
const ShowSeat = require('../models/ShowSeat');
const User = require('../models/User');
const Event = require('../models/Event');
const emailService = require('./emailService');
const config = require('../config');

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const offerSeatToNextInLine = async (eventId, category, seatLabel) => {
  const session = await mongoose.startSession();
  let claimedEntry;
  let rawToken;
  let event;
  let user;

  try {
    await session.withTransaction(async () => {
      const now = new Date();
      const offerExpiresAt = new Date(now.getTime() + config.waitlistOfferMinutes * 60 * 1000);
      const nextInLine = await Waitlist.findOne({ event: eventId, category, status: 'WAITING' })
        .sort({ position: 1, createdAt: 1 })
        .session(session);
      if (!nextInLine) return;

      const seat = await ShowSeat.findOneAndUpdate(
        {
          event: eventId,
          seatLabel,
          $or: [
            { status: 'AVAILABLE' },
            { status: 'HELD', holdExpiresAt: { $lte: now } }
          ]
        },
        {
          $set: { status: 'HELD', heldBy: nextInLine.customer, holdExpiresAt: offerExpiresAt },
          $unset: { booking: 1 }
        },
        { new: true, session }
      );
      if (!seat) return;

      rawToken = crypto.randomBytes(32).toString('hex');
      claimedEntry = await Waitlist.findOneAndUpdate(
        { _id: nextInLine._id, status: 'WAITING' },
        {
          $set: {
            status: 'OFFERED',
            offeredSeat: seatLabel,
            offerExpiresAt,
            offerTokenHash: hashToken(rawToken),
            offeredAt: now
          }
        },
        { new: true, session }
      ).select('+offerTokenHash');
      if (!claimedEntry) throw new Error('Waitlist entry was claimed by another request');

      event = await Event.findById(eventId).populate('venue').session(session);
      user = await User.findById(nextInLine.customer).session(session);
    });

    if (!claimedEntry) return null;
    try {
      if (emailService.sendWaitlistOffer) {
        await emailService.sendWaitlistOffer(claimedEntry, event, user, rawToken);
      }
    } catch (emailError) {
      console.error('Waitlist offer email failed:', emailError);
    }
    return claimedEntry;
  } finally {
    await session.endSession();
  }
};

const processExpiredOffer = async (waitlistEntry) => {
  const session = await mongoose.startSession();
  let seatLabel;
  let eventId;
  let category;
  let expiredEntry;
  let event;
  let user;

  try {
    await session.withTransaction(async () => {
      const now = new Date();
      const entry = await Waitlist.findOne({
        _id: waitlistEntry._id,
        status: 'OFFERED',
        offerExpiresAt: { $lte: now }
      }).session(session);
      if (!entry) return;

      seatLabel = entry.offeredSeat;
      eventId = entry.event;
      category = entry.category;
      expiredEntry = entry;
      event = await Event.findById(entry.event).session(session);
      user = await User.findById(entry.customer).session(session);

      await Waitlist.updateOne(
        { _id: entry._id, status: 'OFFERED' },
        {
          $set: { status: 'EXPIRED', expiredAt: now },
          $unset: { offerTokenHash: 1, offerExpiresAt: 1 }
        },
        { session }
      );

      if (seatLabel) {
        await ShowSeat.updateOne(
          { event: entry.event, seatLabel, status: 'HELD', heldBy: entry.customer, holdExpiresAt: { $lte: now } },
          {
            $set: { status: 'AVAILABLE' },
            $unset: { heldBy: 1, holdExpiresAt: 1, booking: 1 }
          },
          { session }
        );
      }
    });

    if (!expiredEntry) return waitlistEntry;
    try {
      if (emailService.sendWaitlistOfferExpired) {
        await emailService.sendWaitlistOfferExpired(expiredEntry, event, user);
      }
    } catch (emailError) {
      console.error('Waitlist expiry email failed:', emailError);
    }
    if (seatLabel) await offerSeatToNextInLine(eventId, category, seatLabel);
    return expiredEntry;
  } finally {
    await session.endSession();
  }
};

module.exports = {
  offerSeatToNextInLine,
  processExpiredOffer,
  hashToken
};
