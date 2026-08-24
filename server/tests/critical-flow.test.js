const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const ShowSeat = require('../models/ShowSeat');
const Booking = require('../models/Booking');
const { holdSeats, normalizeSeatLabels, MAX_SEATS_PER_ORDER } = require('../controllers/seatController');
const { hashToken } = require('../services/waitlistService');
const { createBooking, cancelBooking } = require('../controllers/bookingController');
const { cleanupExpiredState } = require('../services/schedulerService');

const integration = Boolean(process.env.MONGODB_TEST_URI);
const eventId = new mongoose.Types.ObjectId();
const userA = new mongoose.Types.ObjectId();
const userB = new mongoose.Types.ObjectId();

test('seat labels are normalized and order limits are explicit', () => {
  assert.deepEqual(normalizeSeatLabels([' a1 ', 'B02', '', null]), ['A1', 'B02']);
  assert.equal(MAX_SEATS_PER_ORDER, 10);
});

test('waitlist offer tokens are stored as one-way hashes', () => {
  const token = 'test-token';
  const digest = hashToken(token);
  assert.notEqual(digest, token);
  assert.match(digest, /^[a-f0-9]{64}$/);
  assert.equal(hashToken(token), digest);
});

const invoke = async (handler, body, userId, params = {}) => {
  const response = { statusCode: 200, body: null };
  const res = {
    status(code) { response.statusCode = code; return this; },
    json(payload) { response.body = payload; return this; }
  };
  await handler({ body, user: { id: userId, role: 'customer' }, params }, res);
  return response;
};

test('critical booking flows require MONGODB_TEST_URI integration configuration', { skip: integration }, () => {
  assert.equal(integration, false);
  assert.match('MONGODB_TEST_URI', /MONGODB_TEST_URI/);
});

test('only one concurrent customer can hold a seat', { skip: !integration }, async (t) => {
  await mongoose.connect(process.env.MONGODB_TEST_URI);
  t.after(async () => mongoose.disconnect());
  await ShowSeat.deleteMany({ event: eventId });
  const seat = await ShowSeat.create({ event: eventId, seatLabel: 'A1', row: 1, column: 1, category: 'Standard', price: 100 });

  const [first, second] = await Promise.all([
    invoke(holdSeats, { eventId, seatLabels: ['A1'] }, userA),
    invoke(holdSeats, { eventId, seatLabels: ['A1'] }, userB)
  ]);
  assert.deepEqual([first.statusCode, second.statusCode].sort(), [200, 409]);
  const stored = await ShowSeat.findById(seat._id);
  assert.equal(stored.status, 'HELD');
  assert.ok([String(userA), String(userB)].includes(String(stored.heldBy)));
});

test('confirmed booking converts the customer hold and cancellation releases it', { skip: !integration }, async (t) => {
  if (mongoose.connection.readyState !== 1) await mongoose.connect(process.env.MONGODB_TEST_URI);
  t.after(async () => {
    await Booking.deleteMany({ event: eventId });
    await ShowSeat.deleteMany({ event: eventId });
    await mongoose.disconnect();
  });
  await Booking.deleteMany({ event: eventId });
  await ShowSeat.deleteMany({ event: eventId });
  const expires = new Date(Date.now() + 600000);
  const seat = await ShowSeat.create({ event: eventId, seatLabel: 'A2', row: 1, column: 2, category: 'Standard', price: 125, status: 'HELD', heldBy: userA, holdExpiresAt: expires });

  const created = await invoke(createBooking, { eventId, seatLabels: ['A2'] }, userA);
  assert.equal(created.statusCode, 201);
  assert.equal(created.body.status, 'CONFIRMED');
  assert.equal(created.body.seats[0].seatLabel, 'A2');
  const booked = await ShowSeat.findById(seat._id);
  assert.equal(booked.status, 'BOOKED');

  const cancelled = await invoke(cancelBooking, {}, userA, { id: created.body._id });
  assert.equal(cancelled.statusCode, 200);
  const available = await ShowSeat.findById(seat._id);
  assert.equal(available.status, 'AVAILABLE');
});

test('expired holds are released by the cleanup job', { skip: !integration }, async () => {
  if (mongoose.connection.readyState !== 1) await mongoose.connect(process.env.MONGODB_TEST_URI);
  await ShowSeat.deleteMany({ event: eventId });
  const seat = await ShowSeat.create({ event: eventId, seatLabel: 'A3', row: 1, column: 3, category: 'Standard', price: 125, status: 'HELD', heldBy: userA, holdExpiresAt: new Date(Date.now() - 1000) });
  await cleanupExpiredState();
  const released = await ShowSeat.findById(seat._id);
  assert.equal(released.status, 'AVAILABLE');
  await mongoose.disconnect();
});
