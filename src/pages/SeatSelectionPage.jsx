import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import SeatMap from '../components/SeatMap';
import Spinner from '../components/Spinner';
import { toast } from 'react-toastify';

const seatLabel = (seat) => seat.seatLabel || seat.label || '';
const seatStatus = (seat) => String(seat.status || 'AVAILABLE').toUpperCase();

const SeatSelectionPage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [seats, setSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [holding, setHolding] = useState(false);

  const fetchSeats = useCallback(async () => {
    try {
      const res = await api.get(`/seats/event/${eventId}`);
      setSeats(res.data.seats || res.data || []);
    } catch (error) {
      if (error.response?.status !== 401) toast.error('Failed to refresh seat availability');
    }
  }, [eventId]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [eventResponse] = await Promise.all([
          api.get(`/events/${eventId}`),
          fetchSeats()
        ]);
        setEvent(eventResponse.data.event || eventResponse.data);
      } catch (error) {
        toast.error('Failed to load seat map');
        navigate('/events');
      } finally {
        setLoading(false);
      }
    };
    loadData();
    const interval = setInterval(fetchSeats, 10000);
    return () => clearInterval(interval);
  }, [eventId, fetchSeats, navigate]);

  const handleSeatClick = (seat) => {
    const status = seatStatus(seat);
    if (status !== 'AVAILABLE' && !selectedSeats.some((item) => seatLabel(item) === seatLabel(seat))) {
      toast.error(`Seat ${seatLabel(seat)} is not available.`);
      return;
    }
    setSelectedSeats((previous) => {
      const label = seatLabel(seat);
      if (previous.some((item) => seatLabel(item) === label)) {
        return previous.filter((item) => seatLabel(item) !== label);
      }
      if (previous.length >= 10) {
        toast.warning('You can select a maximum of 10 seats');
        return previous;
      }
      return [...previous, seat];
    });
  };

  const calculateTotal = () => selectedSeats.reduce((total, seat) => total + Number(seat.price || 0), 0);

  const handleProceed = async () => {
    if (!selectedSeats.length) return toast.warning('Please select at least one seat');
    setHolding(true);
    try {
      const labels = selectedSeats.map(seatLabel);
      const response = await api.post('/seats/hold', { eventId, seatLabels: labels });
      navigate(`/payment/${eventId}`, {
        state: {
          seatLabels: labels,
          holdExpiresAt: response.data.holdExpiresAt,
          totalAmount: calculateTotal()
        }
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to hold seats. They might have been taken.');
      setSelectedSeats([]);
      await fetchSeats();
    } finally {
      setHolding(false);
    }
  };

  const handleJoinWaitlist = async (category) => {
    try {
      await api.post('/waitlist', { eventId, category });
      toast.success(`Joined waitlist for ${category}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to join waitlist');
    }
  };

  if (loading) return <div className="mt-5"><Spinner /></div>;
  if (!event) return null;

  return (
    <div className="container-fluid py-4 bg-light min-vh-100">
      <div className="row h-100">
        <div className="col-lg-8 mb-4">
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body">
              <h2 className="fw-bold">{event.title}</h2>
              <p className="text-muted mb-0">
                {new Date(event.date).toLocaleDateString()} | {event.startTime} | {event.venue?.name}
              </p>
            </div>
          </div>
          <div className="card border-0 shadow-sm p-4">
            <h4 className="mb-4 text-center">Select Your Seats</h4>
            <div className="d-flex justify-content-center mb-4">
              <div className="w-75 bg-dark text-white text-center py-2 rounded-pill shadow-sm" style={{ transform: 'perspective(200px) rotateX(-5deg)' }}>STAGE</div>
            </div>
            <div className="overflow-auto pb-4">
              <SeatMap seats={seats} selectedSeats={selectedSeats} onSeatClick={handleSeatClick} disabled={holding} />
            </div>
            <p className="small text-muted text-center mb-0">Seat availability refreshes automatically. Held seats are reserved for a short time during checkout.</p>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card border-0 shadow-sm sticky-top" style={{ top: '20px' }}>
            <div className="card-body p-4">
              <h4 className="fw-bold mb-4">Booking Summary</h4>
              {!selectedSeats.length ? (
                <div className="alert alert-light text-center py-5">No seats selected yet.</div>
              ) : (
                <>
                  <div className="mb-4">
                    <h6 className="text-muted">Selected Seats ({selectedSeats.length})</h6>
                    <div className="d-flex flex-wrap gap-2 mt-2">
                      {selectedSeats.map((seat) => <span key={seatLabel(seat)} className="badge bg-primary fs-6">{seatLabel(seat)}</span>)}
                    </div>
                  </div>
                  <hr />
                  <div className="d-flex justify-content-between mb-4 fs-5 fw-bold text-success">
                    <span>Total Price</span><span>₹{calculateTotal().toFixed(2)}</span>
                  </div>
                  <button onClick={handleProceed} disabled={holding} className="btn btn-success btn-lg w-100 fw-bold rounded-pill shadow-sm py-3">
                    {holding ? 'Holding Seats...' : 'Proceed to Checkout'}
                  </button>
                </>
              )}
              <hr className="my-4" />
              <h6 className="fw-bold mb-3">Waitlist Options</h6>
              <p className="small text-muted mb-3">Join a category queue if you cannot find an available seat.</p>
              <div className="d-grid gap-2">
                {event.venue?.categories?.map((category) => (
                  <button key={category._id || category.name} onClick={() => handleJoinWaitlist(category.name)} className="btn btn-outline-secondary btn-sm">Join Waitlist: {category.name}</button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeatSelectionPage;
