import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';
import EventCard from '../components/EventCard';
import Spinner from '../components/Spinner';
import { toast } from 'react-toastify';

const isValidDateString = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value) && parseInt(value.slice(0, 4), 10) >= 1900;

const EventsPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', type: '', date: '' });
  const [userLocation, setUserLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState('idle');
  const [locationError, setLocationError] = useState('');
  const debounceTimer = useRef(null);

  const fetchEvents = useCallback(async (currentFilters, coordinates = userLocation) => {
    setLoading(true);
    try {
      const params = {};
      if (currentFilters.search) params.search = currentFilters.search;
      if (currentFilters.type && currentFilters.type !== 'All') params.type = currentFilters.type;
      if (currentFilters.date && isValidDateString(currentFilters.date)) params.date = currentFilters.date;
      if (coordinates) {
        params.latitude = coordinates.latitude;
        params.longitude = coordinates.longitude;
        params.radiusKm = 100;
      }
      const response = await api.get('/events', { params });
      setEvents(response.data.events || response.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load events');
    } finally {
      setLoading(false);
    }
  }, [userLocation]);

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => fetchEvents(filters), 350);
    return () => clearTimeout(debounceTimer.current);
  }, [filters, userLocation, fetchEvents]);

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('denied');
      setLocationError('Location is not supported by this browser.');
      return;
    }
    setLocationStatus('requesting');
    setLocationError('');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude });
        setLocationStatus('granted');
      },
      (error) => {
        setLocationStatus('denied');
        setLocationError(error.code === error.PERMISSION_DENIED ? 'Location permission was denied. You can continue browsing all events.' : 'Unable to determine your location.');
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  };

  const clearLocation = () => {
    setUserLocation(null);
    setLocationStatus('idle');
    setLocationError('');
  };

  const handleFilterChange = (event) => setFilters((previous) => ({ ...previous, [event.target.name]: event.target.value }));

  return (
    <div className="container py-5">
      <h2 className="mb-4 fw-bold">Explore Events</h2>
      <div className="card shadow-sm mb-4 border-0 bg-light"><div className="card-body">
        <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
          <button type="button" className="btn btn-outline-primary" onClick={requestLocation} disabled={locationStatus === 'requesting'}>
            <i className="bi bi-geo-alt me-2"></i>{locationStatus === 'requesting' ? 'Requesting location...' : userLocation ? 'Location enabled' : 'Use my location'}
          </button>
          {userLocation && <button type="button" className="btn btn-link text-decoration-none" onClick={clearLocation}>Show all events</button>}
          {locationStatus === 'granted' && <span className="small text-success">Showing events near you.</span>}
        </div>
        {locationError && <div className="alert alert-warning py-2 mb-3">{locationError}</div>}
        <div className="row g-3">
          <div className="col-md-5"><input type="text" name="search" className="form-control form-control-lg" placeholder="Search events..." value={filters.search} onChange={handleFilterChange} /></div>
          <div className="col-md-4"><select name="type" className="form-select form-select-lg" value={filters.type} onChange={handleFilterChange}><option value="All">All Types</option><option value="movie">Movies</option><option value="concert">Concerts</option></select></div>
          <div className="col-md-3"><input type="date" name="date" className="form-control form-control-lg" value={filters.date} onChange={handleFilterChange} /></div>
        </div>
      </div></div>
      {loading ? <Spinner /> : events.length === 0 ? <div className="text-center py-5"><h4 className="text-muted">No events found matching your criteria.</h4>{userLocation && <button className="btn btn-outline-primary mt-2" onClick={clearLocation}>Show all events</button>}</div> : <div className="row g-4">{events.map((event) => <div key={event._id} className="col-12 col-md-6 col-lg-4"><EventCard event={event} /></div>)}</div>}
    </div>
  );
};

export default EventsPage;
