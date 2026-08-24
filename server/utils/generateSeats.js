const ShowSeat = require('../models/ShowSeat');

const generateSeatsForEvent = async (event, venue) => {
  const seats = [];
  
  for (let r = 0; r < venue.rows; r++) {
    const rowLetter = String.fromCharCode(65 + r); // A, B, C...
    
    // Determine category based on venue definitions
    let seatCategory = 'Standard';
    let priceMultiplier = 1.0;
    
    if (venue.categories && venue.categories.length > 0) {
      const foundCategory = venue.categories.find(cat => cat.rows.includes(r));
      if (foundCategory) {
        seatCategory = foundCategory.name;
        priceMultiplier = foundCategory.priceMultiplier;
      }
    }
    
    const price = event.basePrice * priceMultiplier;
    
    for (let c = 0; c < venue.columns; c++) {
      seats.push({
        event: event._id,
        seatLabel: `${rowLetter}${c + 1}`,
        row: r,
        column: c,
        category: seatCategory,
        price: price,
        status: 'AVAILABLE'
      });
    }
  }
  
  // Insert all generated seats in bulk
  if (seats.length > 0) {
    await ShowSeat.insertMany(seats);
  }
  
  return seats;
};

module.exports = generateSeatsForEvent;
