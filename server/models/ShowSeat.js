const mongoose = require('mongoose');

const showSeatSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  seatLabel: {
    type: String,
    required: true
  },
  row: {
    type: Number,
    required: true
  },
  column: {
    type: Number,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['AVAILABLE', 'HELD', 'BOOKED'],
    default: 'AVAILABLE'
  },
  heldBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  holdExpiresAt: {
    type: Date
  },
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  }
});

// Indexes
showSeatSchema.index({ event: 1, seatLabel: 1 }, { unique: true });
showSeatSchema.index({ event: 1, status: 1 });
showSeatSchema.index({ status: 1, holdExpiresAt: 1 });

module.exports = mongoose.model('ShowSeat', showSeatSchema);
