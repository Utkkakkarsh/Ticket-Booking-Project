require('dotenv').config();

const positiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

module.exports = {
  port: positiveInt(process.env.PORT, 5000),
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/ticket-booking',
  jwtSecret: process.env.JWT_SECRET || 'secret123',
  email: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  seatHoldMinutes: positiveInt(process.env.SEAT_HOLD_MINUTES, 10),
  waitlistOfferMinutes: positiveInt(process.env.WAITLIST_OFFER_MINUTES, 5),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173'
};

module.exports.isEmailConfigured = Boolean(
  module.exports.email.user && module.exports.email.pass
);

module.exports.isProduction = process.env.NODE_ENV === 'production';
