import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Spinner from '../../components/Spinner';
import { toast } from 'react-toastify';

const OrganiserDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/organiser/dashboard');
        setStats(res.data);
      } catch (err) {
        toast.error('Failed to load dashboard stats');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="mt-5"><Spinner /></div>;
  if (!stats) return <div className="container mt-5 text-center">Data not available</div>;

  return (
    <div className="container py-4">
      <h2 className="fw-bold mb-4">Organiser Dashboard</h2>
      
      <div className="row g-4 mb-5">
        <div className="col-md-4">
          <div className="card text-white bg-primary shadow-sm border-0 h-100 rounded-3">
            <div className="card-body p-4 d-flex flex-column justify-content-center align-items-center">
              <h6 className="text-uppercase fw-bold text-white-50 mb-2">Total Events</h6>
              <h2 className="display-4 fw-bold mb-0">{stats.totalEvents || 0}</h2>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card text-white bg-success shadow-sm border-0 h-100 rounded-3">
            <div className="card-body p-4 d-flex flex-column justify-content-center align-items-center">
              <h6 className="text-uppercase fw-bold text-white-50 mb-2">Total Bookings</h6>
              <h2 className="display-4 fw-bold mb-0">{stats.totalBookings || 0}</h2>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card text-white bg-info shadow-sm border-0 h-100 rounded-3">
            <div className="card-body p-4 d-flex flex-column justify-content-center align-items-center">
              <h6 className="text-uppercase fw-bold text-white-50 mb-2">Total Revenue</h6>
              <h2 className="display-4 fw-bold mb-0">₹{stats.totalRevenue?.toFixed(2) || '0.00'}</h2>
            </div>
          </div>
        </div>
      </div>

      <div className="card shadow-sm border-0 mb-4 rounded-3">
        <div className="card-body p-4">
          <h5 className="fw-bold mb-4">Revenue by Event</h5>
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead className="table-light">
                <tr>
                  <th>Event Name</th>
                  <th>Date</th>
                  <th>Tickets Sold</th>
                  <th>Revenue (₹)</th>
                </tr>
              </thead>
              <tbody>
                {stats.eventsRevenue?.length > 0 ? (
                  stats.eventsRevenue.map(ev => (
                    <tr key={ev._id}>
                      <td className="fw-semibold">{ev.title}</td>
                      <td>{new Date(ev.date).toLocaleDateString()}</td>
                      <td>{ev.ticketsSold || 0}</td>
                      <td className="text-success fw-bold">₹{ev.revenue?.toFixed(2) || '0.00'}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="4" className="text-center py-3 text-muted">No events data available</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      <div className="card shadow-sm border-0 rounded-3">
        <div className="card-body p-4">
          <h5 className="fw-bold mb-4">Recent Bookings</h5>
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead className="table-light">
                <tr>
                  <th>Ref</th>
                  <th>Customer</th>
                  <th>Event</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentBookings?.length > 0 ? (
                  stats.recentBookings.map(b => (
                    <tr key={b._id}>
                      <td className="text-muted small">{b.reference || b._id.slice(-6)}</td>
                      <td>{b.user?.name || 'Unknown'}</td>
                      <td>{b.event?.title || 'Unknown'}</td>
                      <td className="fw-semibold">₹{b.totalAmount?.toFixed(2)}</td>
                      <td><span className={`badge ${b.status === 'CONFIRMED' ? 'bg-success' : 'bg-secondary'}`}>{b.status}</span></td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="5" className="text-center py-3 text-muted">No recent bookings</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganiserDashboard;
