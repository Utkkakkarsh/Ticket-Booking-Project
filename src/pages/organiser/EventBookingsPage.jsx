import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import Spinner from '../../components/Spinner';
import { toast } from 'react-toastify';

const EventBookingsPage = () => {
  const { id } = useParams();
  const [stats, setStats] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEventData = async () => {
      try {
        const [statsRes, bookingsRes] = await Promise.all([
          api.get(`/events/${id}/stats`),
          api.get(`/events/${id}/bookings`)
        ]);
        setStats(statsRes.data);
        setBookings(bookingsRes.data.bookings || bookingsRes.data || []);
      } catch (err) {
        toast.error('Failed to load event bookings');
      } finally {
        setLoading(false);
      }
    };
    fetchEventData();
  }, [id]);

  if (loading) return <div className="mt-5"><Spinner /></div>;

  return (
    <div className="container py-4">
      <div className="mb-3">
        <Link to="/organiser/events" className="text-decoration-none text-muted"><i className="bi bi-arrow-left me-2"></i>Back to Events</Link>
      </div>
      
      <h2 className="fw-bold mb-4">Event Bookings Overview</h2>

      {stats && (
        <div className="row g-4 mb-4">
          <div className="col-md-3">
            <div className="card shadow-sm border-0 h-100 bg-light">
              <div className="card-body text-center">
                <h6 className="text-muted text-uppercase fw-bold mb-2">Total Seats</h6>
                <h3 className="fw-bold mb-0 text-dark">{stats.totalSeats || 0}</h3>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card shadow-sm border-0 h-100 bg-light">
              <div className="card-body text-center">
                <h6 className="text-muted text-uppercase fw-bold mb-2">Booked</h6>
                <h3 className="fw-bold mb-0 text-primary">{stats.bookedSeats || 0}</h3>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card shadow-sm border-0 h-100 bg-light">
              <div className="card-body text-center">
                <h6 className="text-muted text-uppercase fw-bold mb-2">Available</h6>
                <h3 className="fw-bold mb-0 text-success">{stats.availableSeats || 0}</h3>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card shadow-sm border-0 h-100 bg-light">
              <div className="card-body text-center">
                <h6 className="text-muted text-uppercase fw-bold mb-2">Revenue</h6>
                <h3 className="fw-bold mb-0 text-info">₹{stats.revenue?.toFixed(2) || '0.00'}</h3>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="card shadow-sm border-0 rounded-4">
        <div className="card-header bg-white py-3 border-0">
          <h5 className="fw-bold mb-0">Bookings List</h5>
        </div>
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th className="px-4">Ref / ID</th>
                <th>Customer Name</th>
                <th>Seats</th>
                <th>Amount (₹)</th>
                <th>Status</th>
                <th className="px-4">Date Booked</th>
              </tr>
            </thead>
            <tbody>
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-5 text-muted">No bookings found for this event.</td>
                </tr>
              ) : (
                bookings.map(b => (
                  <tr key={b._id}>
                    <td className="text-muted small px-4">{b.reference || b._id.slice(-6).toUpperCase()}</td>
                    <td className="fw-semibold">{b.user?.name || 'Unknown'}</td>
                    <td>{b.seats?.map(s => s.label || s).join(', ')}</td>
                    <td className="fw-bold">₹{b.totalAmount?.toFixed(2)}</td>
                    <td>
                      <span className={`badge ${b.status === 'CONFIRMED' ? 'bg-success' : b.status === 'CANCELLED' ? 'bg-danger' : 'bg-secondary'}`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="px-4 text-muted small">{new Date(b.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EventBookingsPage;
