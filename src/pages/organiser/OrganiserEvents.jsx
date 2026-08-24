import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaCalendarAlt, FaPen, FaPlus, FaTrash, FaUsers } from 'react-icons/fa';
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
    <div className="container py-4 py-md-5 organiser-events-page">
      <div className="d-flex justify-content-between align-items-md-end align-items-start mb-4 flex-wrap gap-3">
        <div>
          <p className="section-kicker mb-2">Event management</p>
          <h2 className="section-title">My events</h2>
          <p className="section-description">Manage event details, bookings, and schedules from one place.</p>
        </div>
        <Link to="/organiser/events/create" className="btn btn-primary organiser-create-button">
          <FaPlus size={13} /> Create event
        </Link>
      </div>

      <div className="card organiser-events-card">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0 organiser-events-table">
            <thead>
              <tr>
                <th>Event</th>
                <th>Type</th>
                <th>Date &amp; time</th>
                <th>Venue</th>
                <th>Status</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-5 text-muted">You have not created any events yet.</td>
                </tr>
              ) : (
                events.map((event) => (
                  <tr key={event._id}>
                    <td>
                      <div className="organiser-event-title">{event.title}</div>
                    </td>
                    <td><span className="badge badge-standard">{event.type}</span></td>
                    <td>
                      <div className="organiser-event-date">
                        <FaCalendarAlt size={12} aria-hidden="true" />
                        <span>
                          <strong>{new Date(event.date).toLocaleDateString()}</strong>
                          <small>{event.startTime}</small>
                        </span>
                      </div>
                    </td>
                    <td>{event.venue?.name || 'Unknown'}</td>
                    <td>
                      <span className={`organiser-status status-${String(event.status || '').toLowerCase()}`}>
                        {event.status}
                      </span>
                    </td>
                    <td>
                      <div className="event-action-group justify-content-end">
                        <Link to={`/organiser/events/${event._id}/bookings`} className="event-action-button event-action-bookings" title="View bookings">
                          <FaUsers size={13} />
                          <span>Bookings</span>
                        </Link>
                        <Link to={`/organiser/events/edit/${event._id}`} className="event-action-button event-action-edit" title="Edit or reschedule">
                          <FaPen size={12} />
                          <span>Edit</span>
                        </Link>
                        <button type="button" onClick={() => handleDelete(event._id)} className="event-action-button event-action-delete" title="Delete event">
                          <FaTrash size={12} />
                          <span>Delete</span>
                        </button>
                      </div>
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
