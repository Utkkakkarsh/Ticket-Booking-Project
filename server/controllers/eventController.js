const mongoose = require('mongoose');
const Event = require('../models/Event');
const ShowSeat = require('../models/ShowSeat');
const Booking = require('../models/Booking');
const Venue = require('../models/Venue');
const generateSeatsForEvent = require('../utils/generateSeats');

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const distanceInKm = (latitude1, longitude1, latitude2, longitude2) => {
  const radians = (value) => value * Math.PI / 180;
  const a = Math.sin(radians(latitude2 - latitude1) / 2) ** 2 + Math.cos(radians(latitude1)) * Math.cos(radians(latitude2)) * Math.sin(radians(longitude2 - longitude1) / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const validateSchedule = (date, startTime, endTime) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date || '')) || !/^\d{2}:\d{2}$/.test(String(startTime || '')) || !/^\d{2}:\d{2}$/.test(String(endTime || ''))) return 'Date and times must use YYYY-MM-DD and HH:MM formats';
  const start = new Date(`${date}T${startTime}:00`);
  const end = new Date(`${date}T${endTime}:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) return 'End time must be later than start time';
  if (start <= new Date()) return 'The event must be scheduled in the future';
  return null;
};

exports.getEvents = async (req, res) => {
  try {
    const { type, status, search, date } = req.query;
    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 10, 1), 50);
    const query = {};
    if (type) query.type = String(type).toLowerCase();
    if (status) query.status = String(status).toLowerCase();
    if (search) query.title = { $regex: escapeRegex(search), $options: 'i' };
    if (date) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return res.status(400).json({ message: 'Invalid date format. Use YYYY-MM-DD.' });
      const startDate = new Date(`${date}T00:00:00.000Z`);
      const endDate = new Date(`${date}T23:59:59.999Z`);
      if (Number.isNaN(startDate.getTime())) return res.status(400).json({ message: 'Invalid date value.' });
      query.date = { $gte: startDate, $lte: endDate };
    }

    const hasCoordinates = req.query.latitude !== undefined || req.query.longitude !== undefined;
    let events;
    let total;
    if (hasCoordinates) {
      const latitude = Number(req.query.latitude);
      const longitude = Number(req.query.longitude);
      const radiusKm = Math.min(Math.max(Number(req.query.radiusKm) || 100, 1), 500);
      if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
        return res.status(400).json({ message: 'Valid latitude and longitude are required' });
      }
      const allEvents = await Event.find(query).populate('venue').populate('organiser', 'name email').sort({ date: 1 });
      const nearby = allEvents.map((event) => {
        const data = event.toObject();
        const coordinates = data.venue?.coordinates;
        if (coordinates?.latitude === undefined || coordinates?.longitude === undefined) return { ...data, distanceKm: null };
        return { ...data, distanceKm: Number(distanceInKm(latitude, longitude, coordinates.latitude, coordinates.longitude).toFixed(1)) };
      }).filter((event) => event.distanceKm !== null && event.distanceKm <= radiusKm).sort((a, b) => a.distanceKm - b.distanceKm);
      total = nearby.length;
      events = nearby.slice((page - 1) * limit, page * limit);
    } else {
      [events, total] = await Promise.all([
        Event.find(query).populate('venue').populate('organiser', 'name email').skip((page - 1) * limit).limit(limit).sort({ date: 1 }),
        Event.countDocuments(query)
      ]);
    }
    res.json({ events, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getEvent = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid event ID' });
    const event = await Event.findById(req.params.id).populate('venue').populate('organiser', 'name email');
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.json(event);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.createEvent = async (req, res) => {
  try {
    const { title, description, type, posterUrl, venue, venueId, date, startTime, endTime, basePrice } = req.body;
    const selectedVenueId = venue || venueId;
    if (!title || !['movie', 'concert'].includes(String(type).toLowerCase()) || !mongoose.isValidObjectId(selectedVenueId) || !date || !startTime || !endTime || Number(basePrice) < 0 || !Number.isFinite(Number(basePrice))) {
      return res.status(400).json({ message: 'Title, type, venue, date, times, and a valid non-negative base price are required' });
    }
    const selectedVenue = await Venue.findById(selectedVenueId);
    if (!selectedVenue) return res.status(404).json({ message: 'Venue not found' });
    const event = await Event.create({ title: String(title).trim(), description, type: String(type).toLowerCase(), posterUrl, venue: selectedVenue._id, organiser: req.user.id, date, startTime, endTime, basePrice: Number(basePrice) });
    try {
      await generateSeatsForEvent(event, selectedVenue);
    } catch (seatError) {
      await Event.findByIdAndDelete(event._id);
      throw seatError;
    }
    res.status(201).json(await Event.findById(event._id).populate('venue').populate('organiser', 'name email'));
  } catch (error) {
    res.status(400).json({ message: 'Unable to create event', error: error.message });
  }
};

exports.updateEvent = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid event ID' });
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (String(event.organiser) !== String(req.user.id) && req.user.role !== 'admin') return res.status(403).json({ message: 'Not authorized to update this event' });
    const update = { ...req.body };
    delete update.organiser;
    delete update.venueId;
    if (req.body.venueId) update.venue = req.body.venueId;
    if (update.type) update.type = String(update.type).toLowerCase();
    if (update.date || update.startTime || update.endTime) {
      const scheduleError = validateSchedule(update.date || event.date.toISOString().slice(0, 10), update.startTime || event.startTime, update.endTime || event.endTime);
      if (scheduleError) return res.status(400).json({ message: scheduleError });
      update.date = new Date(`${String(update.date || event.date.toISOString().slice(0, 10))}T00:00:00.000Z`);
    }
    if (update.venue && String(update.venue) !== String(event.venue)) {
      const bookingCount = await Booking.countDocuments({ event: event._id, status: 'CONFIRMED' });
      if (bookingCount) return res.status(409).json({ message: 'Venue cannot be changed after confirmed bookings exist' });
      const newVenue = await Venue.findById(update.venue);
      if (!newVenue) return res.status(404).json({ message: 'New venue not found' });
      await ShowSeat.deleteMany({ event: event._id });
      await generateSeatsForEvent({ ...event.toObject(), ...update, _id: event._id }, newVenue);
    }
    const updatedEvent = await Event.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true }).populate('venue');
    res.json(updatedEvent);
  } catch (error) {
    res.status(400).json({ message: 'Unable to update event', error: error.message });
  }
};

exports.rescheduleEvent = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid event ID' });
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (String(event.organiser) !== String(req.user.id) && req.user.role !== 'admin') return res.status(403).json({ message: 'Not authorized to reschedule this event' });
    const { date, startTime, endTime } = req.body;
    const scheduleError = validateSchedule(date, startTime, endTime);
    if (scheduleError) return res.status(400).json({ message: scheduleError });
    const updated = await Event.findByIdAndUpdate(req.params.id, { date: new Date(`${date}T00:00:00.000Z`), startTime, endTime }, { new: true, runValidators: true }).populate('venue');
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: 'Unable to reschedule event', error: error.message });
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid event ID' });
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (String(event.organiser) !== String(req.user.id) && req.user.role !== 'admin') return res.status(403).json({ message: 'Not authorized to delete this event' });
    if (await Booking.exists({ event: event._id, status: 'CONFIRMED' })) return res.status(409).json({ message: 'Events with confirmed bookings cannot be deleted' });
    await Promise.all([Event.findByIdAndDelete(req.params.id), ShowSeat.deleteMany({ event: req.params.id })]);
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getEventBookings = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (String(event.organiser) !== String(req.user.id) && req.user.role !== 'admin') return res.status(403).json({ message: 'Not authorized to view these bookings' });
    res.json(await Booking.find({ event: req.params.id }).populate('customer', 'name email').sort({ createdAt: -1 }));
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getEventStats = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (String(event.organiser) !== String(req.user.id) && req.user.role !== 'admin') return res.status(403).json({ message: 'Not authorized to view these stats' });
    const [seats, bookings] = await Promise.all([ShowSeat.find({ event: req.params.id }), Booking.find({ event: req.params.id, status: 'CONFIRMED' })]);
    const counts = seats.reduce((summary, seat) => {
      if (seat.status === 'BOOKED') summary.bookedSeats += 1;
      else if (seat.status === 'HELD' && seat.holdExpiresAt > new Date()) summary.heldSeats += 1;
      else summary.availableSeats += 1;
      return summary;
    }, { bookedSeats: 0, heldSeats: 0, availableSeats: 0 });
    res.json({ totalSeats: seats.length, ...counts, revenue: bookings.reduce((sum, booking) => sum + Number(booking.totalAmount || 0), 0), bookingsCount: bookings.length });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
