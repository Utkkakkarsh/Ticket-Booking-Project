const ShowSeat = require('../models/ShowSeat');
const Waitlist = require('../models/Waitlist');
const waitlistService = require('./waitlistService');

let running = false;

const cleanupExpiredState = async () => {
  if (running) return;
  running = true;

  try {
    const now = new Date();
    const expiredHolds = await ShowSeat.find({
      status: 'HELD',
      holdExpiresAt: { $lte: now }
    }).select('event category seatLabel heldBy');

    if (expiredHolds.length) {
      const result = await ShowSeat.updateMany(
        { _id: { $in: expiredHolds.map((seat) => seat._id) }, status: 'HELD', holdExpiresAt: { $lte: now } },
        {
          $set: { status: 'AVAILABLE' },
          $unset: { heldBy: 1, holdExpiresAt: 1, booking: 1 }
        }
      );
      console.log(`Released ${result.modifiedCount} expired seat holds.`);

      for (const seat of expiredHolds) {
        try {
          await waitlistService.offerSeatToNextInLine(seat.event, seat.category, seat.seatLabel);
        } catch (error) {
          console.error(`Waitlist assignment failed for ${seat.seatLabel}:`, error);
        }
      }
    }

    const expiredOffers = await Waitlist.find({
      status: 'OFFERED',
      offerExpiresAt: { $lte: now }
    }).select('_id');

    for (const offer of expiredOffers) {
      await waitlistService.processExpiredOffer(offer);
    }
  } catch (error) {
    console.error('Error in expiry cleanup:', error);
  } finally {
    running = false;
  }
};

const startScheduler = () => {
  const intervalMs = Math.max(Number(process.env.CLEANUP_INTERVAL_MS) || 30000, 10000);
  cleanupExpiredState();
  setInterval(cleanupExpiredState, intervalMs);
  console.log(`Expiry cleanup started (every ${intervalMs}ms).`);
};

module.exports = {
  startScheduler,
  cleanupExpiredState
};
