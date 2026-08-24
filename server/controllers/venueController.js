const mongoose = require('mongoose');
const Venue = require('../models/Venue');
const Event = require('../models/Event');

const validateVenueInput = ({ name, location, rows, columns, categories, coordinates }) => {
  if (!String(name || '').trim() || !String(location || '').trim() || !Number.isInteger(Number(rows)) || Number(rows) < 1 || !Number.isInteger(Number(columns)) || Number(columns) < 1 || !Array.isArray(categories) || !categories.length) {
    return 'Name, location, positive row/column counts, and categories are required';
  }
  if (categories.some((category) => !String(category.name || '').trim() || !Array.isArray(category.rows) || !category.rows.length || !Number.isFinite(Number(category.priceMultiplier)) || Number(category.priceMultiplier) <= 0)) {
    return 'Each category needs a name, at least one row, and a positive price multiplier';
  }
  const hasLatitude = coordinates?.latitude !== undefined && coordinates?.latitude !== '';
  const hasLongitude = coordinates?.longitude !== undefined && coordinates?.longitude !== '';
  if (hasLatitude !== hasLongitude) return 'Latitude and longitude must be provided together';
  if (hasLatitude && (!Number.isFinite(Number(coordinates.latitude)) || Number(coordinates.latitude) < -90 || Number(coordinates.latitude) > 90 || !Number.isFinite(Number(coordinates.longitude)) || Number(coordinates.longitude) < -180 || Number(coordinates.longitude) > 180)) return 'Latitude or longitude is outside the valid range';
  const categoryRows = categories.flatMap((category) => category.rows.map(Number));
  if (categoryRows.some((row) => !Number.isInteger(row) || row < 1 || row > Number(rows))) return 'Category rows must be within the venue row range';
  return null;
};

const distanceInKm = (latitude1, longitude1, latitude2, longitude2) => {
  const radians = (value) => value * Math.PI / 180;
  const latitudeDelta = radians(latitude2 - latitude1);
  const longitudeDelta = radians(longitude2 - longitude1);
  const a = Math.sin(latitudeDelta / 2) ** 2 + Math.cos(radians(latitude1)) * Math.cos(radians(latitude2)) * Math.sin(longitudeDelta / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

exports.getVenues = async (req, res) => {
  try {
    const hasCoordinates = req.query.latitude !== undefined || req.query.longitude !== undefined;
    if (!hasCoordinates) return res.json(await Venue.find().sort({ name: 1 }));

    const latitude = Number(req.query.latitude);
    const longitude = Number(req.query.longitude);
    const radiusKm = Math.min(Math.max(Number(req.query.radiusKm) || 100, 1), 500);
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      return res.status(400).json({ message: 'Valid latitude and longitude are required' });
    }

    const venues = await Venue.find({ 'coordinates.latitude': { $exists: true }, 'coordinates.longitude': { $exists: true } }).sort({ name: 1 });
    const nearby = venues.map((venue) => {
      const data = venue.toObject();
      data.distanceKm = Number(distanceInKm(latitude, longitude, data.coordinates.latitude, data.coordinates.longitude).toFixed(1));
      return data;
    }).filter((venue) => venue.distanceKm <= radiusKm).sort((a, b) => a.distanceKm - b.distanceKm);
    res.json(nearby);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getVenue = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid venue ID' });
    const venue = await Venue.findById(req.params.id);
    if (!venue) return res.status(404).json({ message: 'Venue not found' });
    res.json(venue);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.createVenue = async (req, res) => {
  try {
    const errorMessage = validateVenueInput(req.body);
    if (errorMessage) return res.status(400).json({ message: errorMessage });
    const venue = await Venue.create({
      name: String(req.body.name).trim(),
      location: String(req.body.location).trim(),
      rows: Number(req.body.rows),
      columns: Number(req.body.columns),
      categories: req.body.categories,
      coordinates: req.body.coordinates,
      createdBy: req.user.id
    });
    res.status(201).json(venue);
  } catch (error) {
    res.status(400).json({ message: 'Unable to create venue', error: error.message });
  }
};

exports.updateVenue = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid venue ID' });
    const venue = await Venue.findById(req.params.id);
    if (!venue) return res.status(404).json({ message: 'Venue not found' });
    const candidate = { ...venue.toObject(), ...req.body };
    const errorMessage = validateVenueInput(candidate);
    if (errorMessage) return res.status(400).json({ message: errorMessage });
    const venueIsInUse = await Event.exists({ venue: venue._id });
    const normalizeCategories = (categories) => (categories || []).map((category) => ({ name: category.name, rows: (category.rows || []).map(Number), priceMultiplier: Number(category.priceMultiplier) }));
    const layoutChanged = Number(candidate.rows) !== venue.rows || Number(candidate.columns) !== venue.columns || JSON.stringify(normalizeCategories(candidate.categories)) !== JSON.stringify(normalizeCategories(venue.categories));
    if (venueIsInUse && layoutChanged) return res.status(409).json({ message: 'Venue layout cannot be edited while events use it; create a new venue for a different layout' });

    const updated = await Venue.findByIdAndUpdate(req.params.id, {
      name: String(candidate.name).trim(), location: String(candidate.location).trim(), rows: Number(candidate.rows), columns: Number(candidate.columns), categories: candidate.categories, coordinates: candidate.coordinates
    }, { new: true, runValidators: true });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: 'Unable to update venue', error: error.message });
  }
};

exports.deleteVenue = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid venue ID' });
    const venue = await Venue.findById(req.params.id);
    if (!venue) return res.status(404).json({ message: 'Venue not found' });
    if (await Event.exists({ venue: venue._id })) return res.status(409).json({ message: 'Venue cannot be deleted while events use it' });
    await venue.deleteOne();
    res.json({ message: 'Venue deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
