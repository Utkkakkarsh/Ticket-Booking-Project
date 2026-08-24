import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import Spinner from '../../components/Spinner';
import { toast } from 'react-toastify';

const OrganiserEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = async () => {
    try {
      const res = await api.get('/organiser/events');
      setEvents(res.data.events || res.data || []);
    } catch (err) {
      toast.error('Failed to load organiser events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this event? Events with confirmed bookings cannot be deleted.')) {
      try {
        await api.delete(`/events/${id}`);
        toast.success('Event deleted successfully');
        fetchEvents();
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to delete event');
      }
    }
  };

  if (loading) return <div className="mt-5"><Spinner /></div>;

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold mb-0">My Events</h2>
        <Link to="/organiser/events/create" className="btn btn-primary fw-bold rounded-pill px-4 shadow-sm">
          <i className="bi bi-plus-lg me-2"></i> Create New Event
        </Link>
      </div>

      <div className="card shadow-sm border-0 rounded-4 overflow-hidden">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th className="py-3 px-4">Event Title</th>
                <th>Type</th>
                <th>Date & Time</th>
                <th>Venue</th>
                <th>Status</th>
                <th className="text-end px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-5 text-muted">You haven't created any events yet.</td>
                </tr>
              ) : (
                events.map(event => (
                  <tr key={event._id}>
                    <td className="fw-semibold px-4">{event.title}</td>
                    <td><span className="badge bg-secondary">{event.type}</span></td>
                    <td>
                      <div className="small">
                        <div className="fw-bold">{new Date(event.date).toLocaleDateString()}</div>
                        <div className="text-muted">{event.startTime}</div>
                      </div>
                    </td>
                    <td>{event.venue?.name || 'Unknown'}</td>
                    <td>
                      <span className={`badge ${event.status === 'PUBLISHED' ? 'bg-success' : 'bg-warning text-dark'}`}>
                        {event.status}
                      </span>
                    </td>
                    <td className="text-end px-4">
                      <Link to={`/organiser/events/${event._id}/bookings`} className="btn btn-sm btn-outline-info me-2" title="View Bookings">
                        <i className="bi bi-people"></i>
                      </Link>
                      <Link to={`/organiser/events/${event._id}/edit`} className="btn btn-sm btn-outline-primary me-2" title="Edit or reschedule">
                        <i className="bi bi-pencil"></i>
                      </Link>
                      <button onClick={() => handleDelete(event._id)} className="btn btn-sm btn-outline-danger" title="Delete">
                        <i className="bi bi-trash"></i>
                      </button>
                    </td>
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

export default OrganiserEvents;
