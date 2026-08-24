import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FaArrowLeft, FaCalendarAlt, FaCheck, FaClock, FaLocationArrow, FaSave, FaTimes } from 'react-icons/fa';
import api from '../../services/api';
import Spinner from '../../components/Spinner';
import { toast } from 'react-toastify';

const EditEventPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [locationStatus, setLocationStatus] = useState('idle');
  const [locationError, setLocationError] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [formData, setFormData] = useState({ title: '', description: '', type: 'movie', posterUrl: '', venueId: '', date: '', startTime: '', endTime: '', basePrice: '', status: 'upcoming' });

  const loadVenues = async (coordinates = userLocation) => {
    try {
      const params = coordinates ? { latitude: coordinates.latitude, longitude: coordinates.longitude, radiusKm: 500 } : undefined;
      const response = await api.get('/venues', { params });
      setVenues(response.data.venues || response.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load venues');
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [venuesResponse, eventResponse] = await Promise.all([api.get('/venues'), api.get(`/events/${id}`)]);
        setVenues(venuesResponse.data.venues || venuesResponse.data || []);
        const event = eventResponse.data.event || eventResponse.data;
        setFormData({
          title: event.title || '',
          description: event.description || '',
          type: event.type || 'movie',
          posterUrl: event.posterUrl || '',
          venueId: event.venue?._id || event.venue || '',
          date: event.date ? new Date(event.date).toISOString().split('T')[0] : '',
          startTime: event.startTime || '',
          endTime: event.endTime || '',
          basePrice: event.basePrice ?? '',
          status: event.status || 'upcoming'
        });
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to load event data');
        navigate('/organiser/events');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, navigate]);

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('denied');
      setLocationError('Location is not supported by this browser.');
      return;
    }
    setLocationStatus('requesting');
    setLocationError('');
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const coordinates = { latitude: position.coords.latitude, longitude: position.coords.longitude };
        setUserLocation(coordinates);
        setLocationStatus('granted');
        await loadVenues(coordinates);
      },
      () => {
        setLocationStatus('denied');
        setLocationError('Location permission was denied. You can continue using the full venue list.');
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  };

  const handleChange = (event) => setFormData((previous) => ({ ...previous, [event.target.name]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await api.put(`/events/${id}`, { ...formData, venue: formData.venueId });
      toast.success('Event updated successfully!');
      navigate('/organiser/events');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update event');
    } finally {
      setSaving(false);
    }
  };

  const handleReschedule = async () => {
    if (!formData.date || !formData.startTime || !formData.endTime) {
      toast.error('Choose an event date, start time, and end time before rescheduling.');
      return;
    }

    if (formData.endTime <= formData.startTime) {
      toast.error('The end time must be later than the start time.');
      return;
    }

    if (!window.confirm('Reschedule this event to the selected date and time?')) return;

    setSaving(true);
    try {
      await api.patch(`/events/${id}/reschedule`, {
        date: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime
      });
      toast.success('Event rescheduled successfully!');
      navigate('/organiser/events');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reschedule event');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="mt-5"><Spinner /></div>;

  return (
    <div className="container py-4 py-md-5 event-editor-page">
      <Link to="/organiser/events" className="editor-back-link">
        <FaArrowLeft size={12} /> Back to events
      </Link>

      <div className="event-editor-card">
        <div className="event-editor-header">
          <div>
            <p className="section-kicker mb-2">Event management</p>
            <h1 className="section-title">Edit event</h1>
            <p className="section-description">Update details or select a new date and time to reschedule.</p>
          </div>
          <span className="event-editor-id">ID · {id.slice(-6).toUpperCase()}</span>
        </div>

        <form onSubmit={handleSubmit} className="event-editor-form">
          <div className="row g-3">
            <div className="col-md-8">
              <label className="form-label fw-semibold" htmlFor="event-title">Event title</label>
              <input id="event-title" type="text" name="title" className="form-control" value={formData.title} onChange={handleChange} required />
            </div>
            <div className="col-md-4">
              <label className="form-label fw-semibold" htmlFor="event-status">Status</label>
              <select id="event-status" name="status" className="form-select" value={formData.status} onChange={handleChange} required>
                <option value="upcoming">Upcoming</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label fw-semibold" htmlFor="event-type">Event type</label>
              <select id="event-type" name="type" className="form-select" value={formData.type} onChange={handleChange} required>
                <option value="movie">Movie</option>
                <option value="concert">Concert</option>
              </select>
            </div>
            <div className="col-md-8">
              <div className="d-flex justify-content-between align-items-center gap-3">
                <label className="form-label fw-semibold" htmlFor="event-venue">Venue</label>
                <button type="button" className="btn btn-sm btn-outline-primary mb-2" onClick={requestLocation} disabled={locationStatus === 'requesting'}>
                  <FaLocationArrow size={12} /> {locationStatus === 'requesting' ? 'Requesting…' : userLocation ? 'Nearby venues enabled' : 'Use my location'}
                </button>
              </div>
              <select id="event-venue" name="venueId" className="form-select" value={formData.venueId} onChange={handleChange} required>
                <option value="">Select venue…</option>
                {venues.map((venue) => <option key={venue._id} value={venue._id}>{venue.name} ({venue.location}){venue.distanceKm !== undefined ? ` - ${venue.distanceKm} km` : ''}</option>)}
              </select>
              {locationError && <div className="form-text text-warning">{locationError}</div>}
            </div>
            <div className="col-12">
              <label className="form-label fw-semibold" htmlFor="event-description">Description</label>
              <textarea id="event-description" name="description" className="form-control" rows="4" value={formData.description} onChange={handleChange} required />
            </div>
            <div className="col-12">
              <label className="form-label fw-semibold" htmlFor="event-poster">Poster URL</label>
              <input id="event-poster" type="url" name="posterUrl" className="form-control" value={formData.posterUrl} onChange={handleChange} placeholder="https://…" />
            </div>

            <div className="col-12">
              <div className="reschedule-panel">
                <div className="reschedule-panel-heading">
                  <span className="reschedule-panel-icon"><FaCalendarAlt /></span>
                  <div>
                    <h2>Schedule</h2>
                    <p>Update the date and time, then use the reschedule button below.</p>
                  </div>
                </div>
                <div className="row g-3">
                  <div className="col-md-4">
                    <label className="form-label fw-semibold" htmlFor="event-date">Date</label>
                    <input id="event-date" type="date" name="date" className="form-control" value={formData.date} onChange={handleChange} required />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-semibold" htmlFor="event-start-time">Start time</label>
                    <input id="event-start-time" type="time" name="startTime" className="form-control" value={formData.startTime} onChange={handleChange} required />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-semibold" htmlFor="event-end-time">End time</label>
                    <input id="event-end-time" type="time" name="endTime" className="form-control" value={formData.endTime} onChange={handleChange} required />
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-6">
              <label className="form-label fw-semibold" htmlFor="event-price">Base price (₹)</label>
              <input id="event-price" type="number" name="basePrice" className="form-control" min="0" step="0.01" value={formData.basePrice} onChange={handleChange} required />
            </div>
          </div>

          <div className="event-editor-actions">
            <Link to="/organiser/events" className="editor-action editor-action-cancel">
              <FaTimes size={13} /> Cancel
            </Link>
            <button type="button" className="editor-action editor-action-reschedule" onClick={handleReschedule} disabled={saving}>
              {saving ? <><FaClock size={13} /> Updating…</> : <><FaCalendarAlt size={13} /> Reschedule</>}
            </button>
            <button type="submit" className="editor-action editor-action-save" disabled={saving}>
              {saving ? <><FaClock size={13} /> Saving…</> : <><FaSave size={13} /> Save changes</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditEventPage;
