import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Spinner from '../../components/Spinner';
import { toast } from 'react-toastify';

const AdminEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = async () => {
    try {
      const res = await api.get('/events'); // maybe a dedicated admin route is better, assuming all events are fetched here
      setEvents(res.data.events || res.data || []);
    } catch (err) {
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this event across the system?')) {
      try {
        await api.delete(`/events/${id}`);
        toast.success('Event deleted successfully');
        fetchEvents();
      } catch (err) {
        toast.error('Failed to delete event');
      }
    }
  };

  if (loading) return <div className="mt-5"><Spinner /></div>;

  return (
    <div className="container py-4">
      <h2 className="fw-bold mb-4">All System Events</h2>

      <div className="card shadow-sm border-0 rounded-4 overflow-hidden">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th className="px-4">Title</th>
                <th>Type</th>
                <th>Organiser</th>
                <th>Venue</th>
                <th>Date</th>
                <th>Status</th>
                <th className="text-end px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.map(event => (
                <tr key={event._id}>
                  <td className="fw-semibold px-4">{event.title}</td>
                  <td><span className="badge bg-secondary">{event.type}</span></td>
                  <td className="small">{event.organiser?.name || 'Unknown'}</td>
                  <td className="small">{event.venue?.name || 'Unknown'}</td>
                  <td className="small">{new Date(event.date).toLocaleDateString()}</td>
                  <td>
                    <span className={`badge ${event.status === 'PUBLISHED' ? 'bg-success' : 'bg-warning text-dark'}`}>
                      {event.status}
                    </span>
                  </td>
                  <td className="text-end px-4">
                    <button onClick={() => handleDelete(event._id)} className="btn btn-sm btn-outline-danger">
                      <i className="bi bi-trash"></i> Delete
                    </button>
                  </td>
                </tr>
              ))}
              {events.length === 0 && (
                <tr>
                  <td colSpan="7" className="text-center py-4 text-muted">No events found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminEvents;
