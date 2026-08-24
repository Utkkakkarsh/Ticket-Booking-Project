import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import Spinner from '../components/Spinner';
import { toast } from 'react-toastify';

const BookingSuccessPage = () => {
  const { bookingId } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const response = await api.get(`/bookings/${bookingId}`);
        setBooking(response.data.booking || response.data);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to load booking details');
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, [bookingId]);

  if (loading) return <div className="mt-5"><Spinner /></div>;
  if (!booking) return <div className="text-center mt-5">Booking not found.</div>;

  const event = booking.event || {};
  const venue = event.venue || {};
  return (
    <div className="container py-5">
      <div className="text-center mb-5"><div className="display-1 text-success mb-3"><i className="bi bi-check-circle-fill"></i></div><h2 className="fw-bold">Booking Confirmed!</h2><p className="text-muted lead">Your tickets have been successfully booked.</p></div>
      <div className="row justify-content-center"><div className="col-md-8 col-lg-6">
        <div className="ticket-card card shadow-lg border-0 rounded-4 overflow-hidden" style={{ background: '#fff', border: '2px dashed #ccc' }}>
          <div className="bg-primary text-white p-4 text-center position-relative"><h4 className="fw-bold mb-0">{event.title}</h4><div className="position-absolute top-50 start-0 translate-middle rounded-circle bg-light" style={{ width: '30px', height: '30px' }}></div><div className="position-absolute top-50 start-100 translate-middle rounded-circle bg-light" style={{ width: '30px', height: '30px' }}></div></div>
          <div className="card-body p-4">
            <div className="row mb-4"><div className="col-6"><p className="text-muted mb-1 small">Date & Time</p><p className="fw-bold mb-0">{new Date(event.date).toLocaleDateString()}</p><p className="fw-bold">{event.startTime}</p></div><div className="col-6 text-end"><p className="text-muted mb-1 small">Venue</p><p className="fw-bold mb-0">{venue.name}</p><p className="fw-bold text-muted small">{venue.location}</p></div></div>
            <div className="bg-light p-3 rounded mb-4 text-center"><p className="text-muted mb-1 small">Seats</p><h5 className="fw-bold text-primary mb-0">{booking.seats?.map((seat) => seat.seatLabel || seat.label || seat).join(', ')}</h5></div>
            <div className="text-center mb-4">{booking.qrCode ? <img src={booking.qrCode} alt="QR Code ticket" className="img-fluid border p-2 bg-white rounded" style={{ maxWidth: '180px' }} /> : <div className="p-4 bg-light text-muted border rounded">QR Code unavailable</div>}<p className="text-muted mt-2 small">Booking Ref: <span className="fw-bold text-dark">{booking.bookingReference || booking._id}</span></p></div>
          </div>
        </div>
        <div className="d-flex gap-3 mt-5 justify-content-center"><Link to="/bookings" className="btn btn-outline-primary btn-lg px-4 rounded-pill">View My Bookings</Link><Link to="/" className="btn btn-primary btn-lg px-4 rounded-pill shadow-sm">Back to Home</Link></div>
      </div></div>
    </div>
  );
};

export default BookingSuccessPage;
