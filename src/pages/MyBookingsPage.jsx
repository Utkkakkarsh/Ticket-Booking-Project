import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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

const MyBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('upcoming');

  const fetchBookings = async () => {
    try {
      const response = await api.get('/bookings');
      setBookings(response.data.bookings || response.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBookings(); }, []);

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this booking? This action cannot be undone.')) return;
    try {
      await api.post(`/bookings/${id}/cancel`);
      toast.success('Booking cancelled successfully');
      await fetchBookings();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel booking');
    }
  };

  if (loading) return <div className="mt-5"><Spinner /></div>;

  const now = Date.now();
  const upcoming = bookings.filter((booking) => eventStart(booking.event) >= now);
  const past = bookings.filter((booking) => eventStart(booking.event) < now);
  const displayBookings = tab === 'upcoming' ? upcoming : past;

  return (
    <div style={{ background: '#f7f8fc', minHeight: '100vh' }}>
      <div
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '3rem 0 4.5rem',
          color: '#fff',
        }}
      >
        <div className="container">
          <h2 className="fw-bold mb-1">My Bookings</h2>
          <p className="mb-0" style={{ opacity: 0.85 }}>
            Keep track of everything you've booked, past and upcoming
          </p>
        </div>
      </div>

      <div className="container" style={{ marginTop: '-3rem', paddingBottom: '3rem' }}>
        <div
          className="bg-white shadow-sm rounded-4 p-2 d-inline-flex gap-2 mb-4"
          style={{ border: '1px solid #eee' }}
        >
          <button
            className="btn fw-semibold px-4 rounded-pill"
            style={
              tab === 'upcoming'
                ? { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#fff', border: 'none' }
                : { background: 'transparent', color: '#555', border: 'none' }
            }
            onClick={() => setTab('upcoming')}
          >
            Upcoming Events
            <span
              className="ms-2 badge rounded-pill"
              style={{
                background: tab === 'upcoming' ? 'rgba(255,255,255,0.25)' : '#eee',
                color: tab === 'upcoming' ? '#fff' : '#555',
              }}
            >
              {upcoming.length}
            </span>
          </button>
          <button
            className="btn fw-semibold px-4 rounded-pill"
            style={
              tab === 'past'
                ? { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#fff', border: 'none' }
                : { background: 'transparent', color: '#555', border: 'none' }
            }
            onClick={() => setTab('past')}
          >
            Past Events
            <span
              className="ms-2 badge rounded-pill"
              style={{
                background: tab === 'past' ? 'rgba(255,255,255,0.25)' : '#eee',
                color: tab === 'past' ? '#fff' : '#555',
              }}
            >
              {past.length}
            </span>
          </button>
        </div>

        {!displayBookings.length ? (
          <div className="card border-0 shadow-sm rounded-4 py-5 text-center">
            <div className="card-body">
              <div style={{ fontSize: '2.5rem' }} className="mb-2">🎫</div>
              <h4 className="text-muted fw-semibold">No {tab} bookings found.</h4>
              <p className="text-muted mb-3">Find something exciting and grab your seat.</p>
              <Link
                to="/events"
                className="btn fw-bold rounded-pill px-4 text-white"
                style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none' }}
              >
                Explore Events
              </Link>
            </div>
          </div>
        ) : (
          <div className="row g-4">
            {displayBookings.map((booking) => (
              <div key={booking._id} className="col-md-6 col-lg-4">
                <div
                  className="card border-0 h-100 rounded-4 overflow-hidden"
                  style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.06)', transition: 'transform 0.15s' }}
                >
                  <div
                    style={{
                      height: '6px',
                      background:
                        booking.status === 'CONFIRMED'
                          ? 'linear-gradient(90deg, #22c55e, #16a34a)'
                          : 'linear-gradient(90deg, #ef4444, #dc2626)',
                    }}
                  />
                  <div className="card-body p-4 d-flex flex-column">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <span
                        className="badge rounded-pill px-3 py-2"
                        style={{
                          background: booking.status === 'CONFIRMED' ? '#dcfce7' : '#fee2e2',
                          color: booking.status === 'CONFIRMED' ? '#16a34a' : '#dc2626',
                          fontWeight: 600,
                        }}
                      >
                        {booking.status}
                      </span>
                      <span className="text-muted small">
                        Ref: {booking.bookingReference || booking._id?.slice(-6).toUpperCase()}
                      </span>
                    </div>

                    <h5 className="fw-bold text-truncate mb-2" title={booking.event?.title}>
                      {booking.event?.title || 'Unknown Event'}
                    </h5>

                    <div className="d-flex align-items-center text-muted small mb-1">
                      <span className="me-2">📅</span>
                      {booking.event ? new Date(booking.event.date).toLocaleDateString() : 'N/A'} at{' '}
                      {booking.event?.startTime || 'TBA'}
                    </div>
                    <div className="d-flex align-items-center text-muted small mb-3">
                      <span className="me-2">📍</span>
                      {booking.event?.venue?.name || 'Unknown Venue'}
                    </div>

                    <div
                      className="p-3 rounded-3 mb-3"
                      style={{ background: '#f7f8fc', border: '1px dashed #ddd' }}
                    >
                      <span className="small text-muted d-block mb-1">Seats</span>
                      <span className="fw-bold">
                        {booking.seats?.map((seat) => seat.seatLabel || seat.label || seat).join(', ') || 'N/A'}
                      </span>
                    </div>

                    <div className="d-flex justify-content-between align-items-center mt-auto gap-2">
                      <Link
                        to={`/bookings/${booking._id}`}
                        className="btn btn-sm rounded-pill px-3 flex-grow-1 fw-semibold"
                        style={{ border: '1.5px solid #667eea', color: '#667eea', background: 'transparent' }}
                      >
                        View Ticket
                      </Link>
                      {booking.status === 'CONFIRMED' && tab === 'upcoming' && (
                        <button
                          onClick={() => handleCancel(booking._id)}
                          className="btn btn-sm rounded-pill px-3 fw-semibold"
                          style={{ border: '1.5px solid #ef4444', color: '#ef4444', background: 'transparent' }}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyBookingsPage;