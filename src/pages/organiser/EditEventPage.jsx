import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
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
        setFormData({ title: event.title || '', description: event.description || '', type: event.type || 'movie', posterUrl: event.posterUrl || '', venueId: event.venue?._id || event.venue || '', date: event.date ? new Date(event.date).toISOString().split('T')[0] : '', startTime: event.startTime || '', endTime: event.endTime || '', basePrice: event.basePrice ?? '', status: event.status || 'upcoming' });
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
    if (!window.confirm('Reschedule this event to the selected date and time?')) return;
    setSaving(true);
    try {
      await api.patch(`/events/${id}/reschedule`, { date: formData.date, startTime: formData.startTime, endTime: formData.endTime });
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
    <div className="container py-4">
      <div className="mb-3"><Link to="/organiser/events" className="text-decoration-none text-muted"><i className="bi bi-arrow-left me-2"></i>Back to Events</Link></div>
      <div className="card shadow-sm border-0 rounded-4"><div className="card-body p-4 p-md-5">
        <h3 className="fw-bold mb-4">Edit or Reschedule Event</h3>
        <form onSubmit={handleSubmit}>
          <div className="row g-3">
            <div className="col-md-8"><label className="form-label fw-semibold">Event Title</label><input type="text" name="title" className="form-control" value={formData.title} onChange={handleChange} required /></div>
            <div className="col-md-4"><label className="form-label fw-semibold">Status</label><select name="status" className="form-select" value={formData.status} onChange={handleChange} required><option value="upcoming">Upcoming</option><option value="ongoing">Ongoing</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></div>
            <div className="col-md-4"><label className="form-label fw-semibold">Event Type</label><select name="type" className="form-select" value={formData.type} onChange={handleChange} required><option value="movie">Movie</option><option value="concert">Concert</option></select></div>
            <div className="col-md-8"><div className="d-flex justify-content-between align-items-center"><label className="form-label fw-semibold">Venue</label><button type="button" className="btn btn-sm btn-outline-primary mb-2" onClick={requestLocation} disabled={locationStatus === 'requesting'}><i className="bi bi-geo-alt me-1"></i>{locationStatus === 'requesting' ? 'Requesting...' : userLocation ? 'Nearby venues enabled' : 'Use my location'}</button></div><select name="venueId" className="form-select" value={formData.venueId} onChange={handleChange} required><option value="">Select Venue...</option>{venues.map((venue) => <option key={venue._id} value={venue._id}>{venue.name} ({venue.location}){venue.distanceKm !== undefined ? ` - ${venue.distanceKm} km` : ''}</option>)}</select>{locationError && <div className="form-text text-warning">{locationError}</div>}</div>
            <div className="col-12"><label className="form-label fw-semibold">Description</label><textarea name="description" className="form-control" rows="3" value={formData.description} onChange={handleChange} required></textarea></div>
            <div className="col-12"><label className="form-label fw-semibold">Poster URL</label><input type="url" name="posterUrl" className="form-control" value={formData.posterUrl} onChange={handleChange} placeholder="https://..." /></div>
            <div className="col-md-4"><label className="form-label fw-semibold">Date</label><input type="date" name="date" className="form-control" value={formData.date} onChange={handleChange} required /></div>
            <div className="col-md-4"><label className="form-label fw-semibold">Start Time</label><input type="time" name="startTime" className="form-control" value={formData.startTime} onChange={handleChange} required /></div>
            <div className="col-md-4"><label className="form-label fw-semibold">End Time</label><input type="time" name="endTime" className="form-control" value={formData.endTime} onChange={handleChange} required /></div>
            <div className="col-md-6"><label className="form-label fw-semibold">Base Price (₹)</label><input type="number" name="basePrice" className="form-control" min="0" step="0.01" value={formData.basePrice} onChange={handleChange} required /></div>
          </div>
          <div className="mt-5 d-flex justify-content-end gap-2"><Link to="/organiser/events" className="btn btn-light px-4">Cancel</Link><button type="button" className="btn btn-outline-warning px-4" onClick={handleReschedule} disabled={saving}>Reschedule Event</button><button type="submit" className="btn btn-primary px-5 fw-bold" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button></div>
        </form>
      </div></div>
    </div>
  );
};

export default EditEventPage;
