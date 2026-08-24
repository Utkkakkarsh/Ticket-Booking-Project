const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const config = require('./config');
const authRoutes = require('./routes/authRoutes');
const venueRoutes = require('./routes/venueRoutes');
const eventRoutes = require('./routes/eventRoutes');
const seatRoutes = require('./routes/seatRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const waitlistRoutes = require('./routes/waitlistRoutes');
const adminRoutes = require('./routes/adminRoutes');
const organiserRoutes = require('./routes/organiserRoutes');
const User = require('./models/User');
const schedulerService = require('./services/schedulerService');

const app = express();
app.disable('x-powered-by');
app.use(cors({ origin: config.clientUrl }));
app.use(express.json({ limit: '10mb' }));

app.get('/api/health', (req, res) => res.json({ status: 'ok', database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' }));
app.use('/api/auth', authRoutes);
app.use('/api/venues', venueRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/seats', seatRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/waitlist', waitlistRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/organiser', organiserRoutes);

app.use((req, res) => res.status(404).json({ message: 'Route not found' }));
app.use((err, req, res, next) => {
  console.error(err.stack || err);
  res.status(err.statusCode || 500).json({ message: err.statusCode ? err.message : 'Internal Server Error' });
});

const seedAdmin = async () => {
  const adminExists = await User.exists({ email: 'admin@ticketbooking.com' });
  if (!adminExists) {
    await User.create({ name: 'Admin', email: 'admin@ticketbooking.com', password: 'admin123', role: 'admin' });
    console.log('Admin user seeded. Change the default password before production use.');
  }
};

const startServer = async () => {
  await mongoose.connect(config.mongoUri);
  console.log('MongoDB connected');
  await seedAdmin();
  schedulerService.startScheduler();
  return app.listen(config.port, () => console.log(`Server running on port ${config.port}`));
};

if (require.main === module) {
  startServer().catch((error) => {
    console.error('Server startup failed:', error);
    process.exitCode = 1;
  });
}

module.exports = { app, startServer };
