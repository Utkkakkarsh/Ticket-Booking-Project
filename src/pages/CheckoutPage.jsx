import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import CountdownTimer from '../components/CountdownTimer';
import { toast } from 'react-toastify';
import Spinner from '../components/Spinner';

const CheckoutPage = ({ paymentMode = false }) => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { seatLabels = [], holdExpiresAt, totalAmount = 0 } = location.state || {};
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const expiryHandled = useRef(false);

  useEffect(() => {
    if (!seatLabels.length || !holdExpiresAt) {
      navigate(`/seats/${eventId}`);
      return;
    }
    const fetchEvent = async () => {
      try {
        const response = await api.get(`/events/${eventId}`);
        setEvent(response.data.event || response.data);
      } catch (error) {
        toast.error('Failed to load event details');
        navigate('/events');
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [eventId, holdExpiresAt, navigate, seatLabels.length]);

  const handleExpire = async () => {
    if (expiryHandled.current) return;
    expiryHandled.current = true;
    try {
      await api.post('/seats/release', { eventId, seatLabels });
    } catch (error) {
      // The cleanup worker may already have released the hold.
    }
    toast.error('Seat hold expired. Please select seats again.');
    navigate(`/seats/${eventId}`, { replace: true });
  };

  const handleCancel = async () => {
    try {
      await api.post('/seats/release', { eventId, seatLabels });
    } catch (error) {
      // The hold may have expired already; returning to the seat map is safe.
    } finally {
      navigate(`/seats/${eventId}`);
    }
  };

  const handleConfirm = async () => {
    setProcessing(true);
    try {
      const response = await api.post('/bookings', { eventId, seatLabels });
      const bookingId = response.data.booking?._id || response.data._id;
      toast.success('Booking successful!');
      navigate(`/booking-success/${bookingId}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Booking failed');
      setProcessing(false);
    }
  };

  if (loading) return <div className="mt-5"><Spinner /></div>;
  if (!event) return null;

  const subtotal = Number(totalAmount || 0);
  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6">
          <div className="card shadow-lg border-0 rounded-4 overflow-hidden">
            <div className="bg-primary text-white p-4 text-center">
              <h3 className="fw-bold mb-1">{paymentMode ? 'Payment' : 'Checkout'}</h3>
              <p className="mb-0">{paymentMode ? 'Complete payment before your seat hold expires' : 'Complete your booking in'}</p>
              <h4 className="fw-bold text-warning mt-2"><CountdownTimer expiresAt={holdExpiresAt} onExpire={handleExpire} /></h4>
            </div>
            <div className="card-body p-4 p-md-5">
              <h5 className="fw-bold text-primary mb-3">{event.title}</h5>
              <p className="text-muted mb-4">
                <i className="bi bi-calendar-event me-2"></i> {new Date(event.date).toLocaleDateString()} at {event.startTime}<br />
                <i className="bi bi-geo-alt me-2"></i> {event.venue?.name}, {event.venue?.location}
              </p>
              <div className="bg-light rounded p-3 mb-4">
                <h6 className="fw-bold mb-3">Selected Seats</h6>
                <div className="d-flex flex-wrap gap-2">{seatLabels.map((label) => <span key={label} className="badge bg-secondary fs-6">{label}</span>)}</div>
              </div>
              <div className="border-bottom pb-3 mb-3 d-flex justify-content-between">
                <span className="text-muted">Tickets Subtotal</span><span className="fw-semibold">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="d-flex justify-content-between align-items-center mb-5">
                <span className="fs-5 fw-bold">Total Amount</span><span className="fs-4 fw-bold text-success">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="d-flex gap-3">
                <button onClick={handleCancel} disabled={processing} className="btn btn-light btn-lg w-100 fw-bold">Cancel</button>
                <button onClick={handleConfirm} disabled={processing} className="btn btn-primary btn-lg w-100 fw-bold shadow-sm">{processing ? 'Processing...' : paymentMode ? 'Pay & Confirm Booking' : 'Confirm Booking'}</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
