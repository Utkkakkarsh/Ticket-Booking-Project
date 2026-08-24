const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  bookingReference: {
    type: String,
    required: true,
    unique: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  seats: [{
    seatLabel: String,
    category: String,
    price: Number
  }],
  totalAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['CONFIRMED', 'CANCELLED'],
    default: 'CONFIRMED'
  },
  qrCode: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  cancelledAt: {
    type: Date
  }
});

module.exports = mongoose.model('Booking', bookingSchema);
