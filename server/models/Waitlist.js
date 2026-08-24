const mongoose = require('mongoose');

const waitlistSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
    index: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  position: {
    type: Number,
    required: true,
    min: 1
  },
  status: {
    type: String,
    enum: ['WAITING', 'OFFERED', 'ACCEPTED', 'EXPIRED', 'CANCELLED'],
    default: 'WAITING',
    index: true
  },
  offeredSeat: {
    type: String,
    trim: true
  },
  offerExpiresAt: {
    type: Date,
    index: true
  },
  offerTokenHash: {
    type: String,
    select: false
  },
  offeredAt: Date,
  acceptedAt: Date,
  expiredAt: Date,
  cancelledAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

waitlistSchema.index({ event: 1, category: 1, status: 1, position: 1 });
waitlistSchema.index({ event: 1, category: 1, customer: 1, status: 1 });

module.exports = mongoose.model('Waitlist', waitlistSchema);
