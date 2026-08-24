import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import Spinner from '../../components/Spinner';
import { toast } from 'react-toastify';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/admin/stats');
        setStats(res.data);
      } catch (err) {
        toast.error('Failed to load admin statistics');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="mt-5"><Spinner /></div>;
  if (!stats) return <div className="container mt-5">Data not available</div>;

  return (
    <div className="container py-4">
      <h2 className="fw-bold mb-4">Admin Dashboard</h2>
      
      <div className="row g-4 mb-5">
        <div className="col-md-4 col-lg-2">
          <div className="card bg-primary text-white shadow-sm border-0 h-100 rounded-3">
            <div className="card-body text-center p-4">
              <h6 className="text-uppercase fw-bold text-white-50">Total Users</h6>
              <h3 className="display-6 fw-bold mb-0">{stats.totalUsers || 0}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-4 col-lg-2">
          <div className="card bg-info text-white shadow-sm border-0 h-100 rounded-3">
            <div className="card-body text-center p-4">
              <h6 className="text-uppercase fw-bold text-white-50">Organisers</h6>
              <h3 className="display-6 fw-bold mb-0">{stats.totalOrganisers || 0}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-4 col-lg-2">
          <div className="card bg-warning text-dark shadow-sm border-0 h-100 rounded-3">
            <div className="card-body text-center p-4">
              <h6 className="text-uppercase fw-bold text-black-50">Venues</h6>
              <h3 className="display-6 fw-bold mb-0">{stats.totalVenues || 0}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-4 col-lg-3">
          <div className="card bg-success text-white shadow-sm border-0 h-100 rounded-3">
            <div className="card-body text-center p-4">
              <h6 className="text-uppercase fw-bold text-white-50">Events</h6>
              <h3 className="display-6 fw-bold mb-0">{stats.totalEvents || 0}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-8 col-lg-3">
          <div className="card bg-dark text-white shadow-sm border-0 h-100 rounded-3">
            <div className="card-body text-center p-4">
              <h6 className="text-uppercase fw-bold text-white-50">Platform Revenue</h6>
              <h3 className="display-6 fw-bold mb-0 text-success">₹{stats.totalRevenue?.toFixed(2) || '0.00'}</h3>
            </div>
          </div>
        </div>
      </div>

      <h4 className="fw-bold mb-3">Quick Management Links</h4>
      <div className="row g-4">
        <div className="col-md-3">
          <Link to="/admin/users" className="text-decoration-none">
            <div className="card shadow-sm border-0 hover-card p-4 text-center">
              <i className="bi bi-people display-4 text-primary mb-3"></i>
              <h5 className="fw-bold text-dark mb-0">Manage Users</h5>
            </div>
          </Link>
        </div>
        <div className="col-md-3">
          <Link to="/admin/venues" className="text-decoration-none">
            <div className="card shadow-sm border-0 hover-card p-4 text-center">
              <i className="bi bi-building display-4 text-info mb-3"></i>
              <h5 className="fw-bold text-dark mb-0">Manage Venues</h5>
            </div>
          </Link>
        </div>
        <div className="col-md-3">
          <Link to="/admin/events" className="text-decoration-none">
            <div className="card shadow-sm border-0 hover-card p-4 text-center">
              <i className="bi bi-calendar-event display-4 text-success mb-3"></i>
              <h5 className="fw-bold text-dark mb-0">Manage Events</h5>
            </div>
          </Link>
        </div>
        <div className="col-md-3">
          <Link to="/admin/bookings" className="text-decoration-none">
            <div className="card shadow-sm border-0 hover-card p-4 text-center">
              <i className="bi bi-ticket-detailed display-4 text-warning mb-3"></i>
              <h5 className="fw-bold text-dark mb-0">All Bookings</h5>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
