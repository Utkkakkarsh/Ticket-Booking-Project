import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { toast } from 'react-toastify';

const CreateEventPage = () => {
  const navigate = useNavigate();
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [locationStatus, setLocationStatus] = useState('idle');
  const [locationError, setLocationError] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [formData, setFormData] = useState({ title: '', description: '', type: 'movie', posterUrl: '', venueId: '', date: '', startTime: '', endTime: '', basePrice: '' });

  const fetchVenues = async (coordinates = null) => {
    try {
      const params = coordinates ? { latitude: coordinates.latitude, longitude: coordinates.longitude, radiusKm: 500 } : undefined;
      const response = await api.get('/venues', { params });
      setVenues(response.data.venues || response.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load venues');
    }
  };

  useEffect(() => { fetchVenues(); }, []);

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
        const params = { latitude: coordinates.latitude, longitude: coordinates.longitude, radiusKm: 500 };
        try {
          const response = await api.get('/venues', { params });
          const nearbyVenues = response.data.venues || response.data || [];
          if (nearbyVenues.length > 0) {
            setVenues(nearbyVenues);
          } else {
            toast.info('No nearby venues found within 500 km. Showing all venues.');
            setLocationError('No nearby venues found. Showing all venues instead.');
            await fetchVenues();
          }
        } catch (error) {
          toast.error('Failed to fetch nearby venues. Showing all venues.');
          await fetchVenues();
        }
      },
      () => {
        setLocationStatus('denied');
        setLocationError('Location permission was denied. You can continue using the full venue list.');
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  };

  const clearLocation = () => {
    setUserLocation(null);
    setLocationStatus('idle');
    setLocationError('');
    fetchVenues();
  };

  const handleChange = (event) => setFormData((previous) => ({ ...previous, [event.target.name]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      await api.post('/events', { ...formData, venue: formData.venueId });
      toast.success('Event created successfully!');
      navigate('/organiser/events');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-4">
      <div className="mb-3"><Link to="/organiser/events" className="text-decoration-none text-muted"><i className="bi bi-arrow-left me-2"></i>Back to Events</Link></div>
      <div className="card shadow-sm border-0 rounded-4"><div className="card-body p-4 p-md-5">
        <h3 className="fw-bold mb-4">Create New Event</h3>
        <form onSubmit={handleSubmit}>
          <div className="row g-3">
            <div className="col-md-8"><label className="form-label fw-semibold">Event Title</label><input type="text" name="title" className="form-control" value={formData.title} onChange={handleChange} required /></div>
            <div className="col-md-4"><label className="form-label fw-semibold">Event Type</label><select name="type" className="form-select" value={formData.type} onChange={handleChange} required><option value="movie">Movie</option><option value="concert">Concert</option></select></div>
            <div className="col-12"><label className="form-label fw-semibold">Description</label><textarea name="description" className="form-control" rows="3" value={formData.description} onChange={handleChange} required></textarea></div>
            <div className="col-md-6"><label className="form-label fw-semibold">Poster URL</label><input type="url" name="posterUrl" className="form-control" value={formData.posterUrl} onChange={handleChange} placeholder="https://..." /></div>
            <div className="col-md-6"><div className="d-flex justify-content-between align-items-center flex-wrap gap-1"><label className="form-label fw-semibold">Venue</label><div className="d-flex gap-2 mb-2">{userLocation && <button type="button" className="btn btn-sm btn-outline-secondary" onClick={clearLocation}>Show all venues</button>}<button type="button" className="btn btn-sm btn-outline-primary" onClick={requestLocation} disabled={locationStatus === 'requesting'}><i className="bi bi-geo-alt me-1"></i>{locationStatus === 'requesting' ? 'Requesting...' : userLocation ? 'Nearby venues enabled' : 'Use my location'}</button></div></div><select name="venueId" className="form-select" value={formData.venueId} onChange={handleChange} required><option value="">Select Venue...</option>{venues.map((venue) => <option key={venue._id} value={venue._id}>{venue.name} ({venue.location}){venue.distanceKm !== undefined ? ` - ${venue.distanceKm} km` : ''}</option>)}</select>{locationError && <div className="form-text text-warning">{locationError}</div>}{venues.length === 0 && <div className="form-text text-danger">No venues available. Please create a venue first or check your connection.</div>}</div>
            <div className="col-md-4"><label className="form-label fw-semibold">Date</label><input type="date" name="date" className="form-control" value={formData.date} onChange={handleChange} required /></div>
            <div className="col-md-4"><label className="form-label fw-semibold">Start Time (HH:MM)</label><input type="time" name="startTime" className="form-control" value={formData.startTime} onChange={handleChange} required /></div>
            <div className="col-md-4"><label className="form-label fw-semibold">End Time (HH:MM)</label><input type="time" name="endTime" className="form-control" value={formData.endTime} onChange={handleChange} required /></div>
            <div className="col-md-6"><label className="form-label fw-semibold">Base Price (₹)</label><input type="number" name="basePrice" className="form-control" min="0" step="0.01" value={formData.basePrice} onChange={handleChange} required /><div className="form-text">Actual prices use venue category multipliers.</div></div>
          </div>
          <div className="mt-5 text-end"><Link to="/organiser/events" className="btn btn-light me-3 px-4">Cancel</Link><button type="submit" className="btn btn-primary px-5 fw-bold" disabled={loading}>{loading ? 'Creating...' : 'Create Event'}</button></div>
        </form>
      </div></div>
    </div>
  );
};

export default CreateEventPage;
