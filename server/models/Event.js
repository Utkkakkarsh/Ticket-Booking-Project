const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  type: {
    type: String,
    enum: ['movie', 'concert'],
    required: true
  },
  posterUrl: {
    type: String,
    default: 'placeholder.jpg'
  },
  venue: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Venue',
    required: true
  },
  organiser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  basePrice: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
    default: 'upcoming'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Virtual for pricing based on venue categories
eventSchema.virtual('pricing').get(function() {
  if (this.populated('venue') && this.venue.categories) {
    return this.venue.categories.map(cat => ({
      categoryName: cat.name,
      price: this.basePrice * cat.priceMultiplier
    }));
  }
  return [];
});

eventSchema.set('toJSON', { virtuals: true });
eventSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Event', eventSchema);
