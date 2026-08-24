import React from 'react';

const getLabel = (seat) => seat.seatLabel || seat.label || '';
const getStatus = (seat) => String(seat.status || 'AVAILABLE').toUpperCase();

const SeatMap = ({ seats = [], selectedSeats = [], onSeatClick, disabled }) => {
  const selectedLabels = new Set(selectedSeats.map((seat) => typeof seat === 'string' ? seat : getLabel(seat)));
  const rows = seats.reduce((acc, seat) => {
    const label = getLabel(seat);
    const row = label.replace(/[0-9]/g, '') || String(seat.row || '');
    if (!acc[row]) acc[row] = [];
    acc[row].push(seat);
    return acc;
  }, {});

  const getSeatClass = (seat) => {
    const label = getLabel(seat);
    const status = getStatus(seat);
    if (selectedLabels.has(label)) return 'seat selected';
    if (status === 'BOOKED') return 'seat booked';
    if (status === 'HELD') return 'seat held';
    return 'seat available';
  };

  const isSelectable = (seat) => getStatus(seat) === 'AVAILABLE' || selectedLabels.has(getLabel(seat));

  return (
    <div className="seat-map-container">
      <div className="screen">SCREEN</div>
      <div className="seat-grid">
        {Object.keys(rows).sort().map((rowName) => (
          <div key={rowName} className="seat-row">
            <div className="row-label">{rowName}</div>
            {rows[rowName].sort((a, b) => {
              const numA = parseInt(getLabel(a).replace(/[^0-9]/g, ''), 10) || 0;
              const numB = parseInt(getLabel(b).replace(/[^0-9]/g, ''), 10) || 0;
              return numA - numB;
            }).map((seat) => {
              const label = getLabel(seat);
              return (
                <button
                  type="button"
                  key={seat._id || label}
                  className={getSeatClass(seat)}
                  disabled={disabled || !isSelectable(seat)}
                  onClick={() => onSeatClick(seat)}
                  title={`${label} - ${seat.category || 'General'} (₹${Number(seat.price || 0).toFixed(2)})`}
                  aria-label={`${label}, ${getStatus(seat).toLowerCase()}`}
                >
                  {label.replace(/[^0-9]/g, '')}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div className="seat-legend">
        <div className="legend-item"><div className="seat available" style={{ width: 20, height: 20, fontSize: 0 }}></div><span>Available</span></div>
        <div className="legend-item"><div className="seat selected" style={{ width: 20, height: 20, fontSize: 0 }}></div><span>Selected</span></div>
        <div className="legend-item"><div className="seat held" style={{ width: 20, height: 20, fontSize: 0 }}></div><span>Held</span></div>
        <div className="legend-item"><div className="seat booked" style={{ width: 20, height: 20, fontSize: 0 }}></div><span>Booked</span></div>
      </div>
    </div>
  );
};

export default SeatMap;
