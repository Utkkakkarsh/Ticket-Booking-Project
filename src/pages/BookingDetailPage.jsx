import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Spinner from '../components/Spinner';
import { toast } from 'react-toastify';

const eventStart = (event) => {
  if (!event?.date) return 0;
  const date = new Date(event.date);
  if (event.startTime && /^\d{2}:\d{2}$/.test(event.startTime)) {
    const [hours, minutes] = event.startTime.split(':').map(Number);
    date.setHours(hours, minutes, 0, 0);
  }
  return date.getTime();
};

const BookingDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchBooking = async () => {
    try {
      const response = await api.get(`/bookings/${id}`);
      setBooking(response.data.booking || response.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load booking details');
      navigate('/bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBooking(); }, [id]);

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this booking? This action cannot be undone.')) return;
    try {
      await api.post(`/bookings/${id}/cancel`);
      toast.success('Booking cancelled successfully');
      await fetchBooking();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel booking');
    }
  };

  if (loading) return <div className="mt-5"><Spinner /></div>;
  if (!booking) return null;

  const event = booking.event || {};
  const venue = event.venue || {};
  const isUpcoming = eventStart(event) >= Date.now();
  return (
    <div className="container py-5">
      <div className="mb-4"><Link to="/bookings" className="text-decoration-none text-muted"><i className="bi bi-arrow-left me-2"></i>Back to My Bookings</Link></div>
      <div className="row justify-content-center"><div className="col-md-8 col-lg-6">
        <div className="ticket-card card shadow border-0 rounded-4 overflow-hidden mb-4">
          <div className={`p-4 text-center position-relative ${booking.status === 'CONFIRMED' ? 'bg-primary text-white' : 'bg-secondary text-white'}`}><span className={`badge position-absolute top-0 end-0 m-3 ${booking.status === 'CONFIRMED' ? 'bg-success' : 'bg-danger'}`}>{booking.status}</span><h4 className="fw-bold mt-2 mb-0">{event.title}</h4></div>
          <div className="card-body p-4 p-md-5">
            <div className="row mb-4"><div className="col-6"><p className="text-muted mb-1 small">Date & Time</p><p className="fw-bold mb-0">{new Date(event.date).toLocaleDateString()}</p><p className="fw-bold">{event.startTime}</p></div><div className="col-6 text-end"><p className="text-muted mb-1 small">Venue</p><p className="fw-bold mb-0">{venue.name}</p><p className="fw-bold text-muted small">{venue.location}</p></div></div>
            <div className="bg-light p-3 rounded mb-4 d-flex justify-content-between align-items-center"><div><p className="text-muted mb-1 small">Seats</p><h5 className="fw-bold text-primary mb-0">{booking.seats?.map((seat) => seat.seatLabel || seat.label || seat).join(', ')}</h5></div><div className="text-end"><p className="text-muted mb-1 small">Amount Paid</p><h5 className="fw-bold mb-0">₹{Number(booking.totalAmount || 0).toFixed(2)}</h5></div></div>
            {booking.status === 'CONFIRMED' && <div className="text-center mb-2">{booking.qrCode ? <img src={booking.qrCode} alt="QR Code ticket" className="img-fluid border p-2 bg-white rounded" style={{ maxWidth: '180px' }} /> : <div className="p-4 bg-light text-muted border rounded">QR Code unavailable</div>}<p className="text-muted mt-2 small mb-0">Booking Ref: <span className="fw-bold text-dark">{booking.bookingReference || booking._id}</span></p></div>}
          </div>
        </div>
        {booking.status === 'CONFIRMED' && isUpcoming && <div className="text-center mt-4"><button onClick={handleCancel} className="btn btn-outline-danger px-4 rounded-pill">Cancel Booking</button></div>}
      </div></div>
    </div>
  );
};

export default BookingDetailPage;
