import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Spinner from '../../components/Spinner';
import { toast } from 'react-toastify';

const AdminBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await api.get('/bookings/admin/all');
        setBookings(res.data.bookings || res.data || []);
      } catch (err) {
        toast.error('Failed to load all bookings');
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, []);

  if (loading) return <div className="mt-5"><Spinner /></div>;

  return (
    <div className="container py-4">
      <h2 className="fw-bold mb-4">All System Bookings</h2>

      <div className="card shadow-sm border-0 rounded-4 overflow-hidden">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th className="px-4">Booking Ref</th>
                <th>Customer</th>
                <th>Event</th>
                <th>Seats</th>
                <th>Amount</th>
                <th>Status</th>
                <th className="px-4">Date</th>
              </tr>
            </thead>
            <tbody>
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-5 text-muted">No bookings found in the system.</td>
                </tr>
              ) : (
                bookings.map(b => (
                  <tr key={b._id}>
                    <td className="text-muted small px-4 fw-semibold">{b.reference || b._id.slice(-6).toUpperCase()}</td>
                    <td>{b.user?.name || 'Unknown User'}</td>
                    <td><div className="text-truncate" style={{ maxWidth: '150px' }} title={b.event?.title}>{b.event?.title || 'Unknown Event'}</div></td>
                    <td><span className="small">{b.seats?.map(s => s.label || s).join(', ')}</span></td>
                    <td className="fw-bold">₹{b.totalAmount?.toFixed(2)}</td>
                    <td>
                      <span className={`badge ${b.status === 'CONFIRMED' ? 'bg-success' : b.status === 'CANCELLED' ? 'bg-danger' : 'bg-secondary'}`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="text-muted small px-4">{new Date(b.createdAt).toLocaleDateString()}</td>
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

export default AdminBookings;
