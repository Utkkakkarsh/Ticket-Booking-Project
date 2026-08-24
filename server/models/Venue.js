const mongoose = require('mongoose');

const coordinateSchema = new mongoose.Schema({
  latitude: { type: Number, min: -90, max: 90 },
  longitude: { type: Number, min: -180, max: 180 }
}, { _id: false });

const venueSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  location: { type: String, required: true, trim: true },
  coordinates: coordinateSchema,
  rows: { type: Number, required: true, min: 1 },
  columns: { type: Number, required: true, min: 1 },
  categories: [{
    name: { type: String, required: true, trim: true },
    rows: { type: [Number], required: true },
    priceMultiplier: { type: Number, required: true, min: 0.01 }
  }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

venueSchema.index({ 'coordinates.latitude': 1, 'coordinates.longitude': 1 });

module.exports = mongoose.model('Venue', venueSchema);
