import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/Spinner';
import { toast } from 'react-toastify';

const getEventStart = (event) => {
  if (!event?.date || !event?.startTime) return null;
  const date = new Date(event.date);
  const [hours, minutes] = String(event.startTime).split(':').map(Number);
  if (Number.isNaN(date.getTime()) || Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  date.setHours(hours, minutes, 0, 0);
  return date;
};

const EventDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await api.get(`/events/${id}`);
        setEvent(response.data.event || response.data);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to load event details');
        navigate('/events');
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [id, navigate]);

  const handleBookNow = () => {
    if (!user) {
      toast.info('Please log in to book tickets');
      navigate('/login', { state: { from: `/events/${id}` } });
    } else if (user.role !== 'customer') {
      toast.info('Only customer accounts can book tickets. Please use a customer account.');
    } else {
      navigate(`/seats/${id}`);
    }
  };

  if (loading) return <div className="mt-5"><Spinner /></div>;
  if (!event) return null;

  const status = String(event.status || 'upcoming').toLowerCase();
  const eventStart = getEventStart(event);
  const canBook = ['upcoming', 'published'].includes(status) && (!eventStart || eventStart > new Date());
  return (
    <div className="container py-5">
      <div className="row g-5">
        <div className="col-md-4"><img src={event.posterUrl || 'https://via.placeholder.com/400x600?text=No+Poster'} alt={event.title} className="img-fluid rounded shadow w-100" style={{ objectFit: 'cover' }} /></div>
        <div className="col-md-8">
          <div className="d-flex align-items-center mb-2"><span className={`badge ${status === 'upcoming' || status === 'published' ? 'bg-primary' : 'bg-secondary'} me-2 fs-6`}>{event.type}</span><span className={`badge ${canBook ? 'bg-info' : 'bg-secondary'} fs-6`}>{status}</span></div>
          <h1 className="display-4 fw-bold mb-3">{event.title}</h1>
          <p className="lead text-muted mb-4">{event.description}</p>
          <div className="card border-0 bg-light mb-4"><div className="card-body p-4"><h5 className="fw-bold mb-3">Event Information</h5><div className="row mb-2"><div className="col-4 text-muted">Date</div><div className="col-8 fw-semibold">{new Date(event.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div></div><div className="row mb-2"><div className="col-4 text-muted">Time</div><div className="col-8 fw-semibold">{event.startTime} - {event.endTime}</div></div><div className="row mb-2"><div className="col-4 text-muted">Venue</div><div className="col-8 fw-semibold">{event.venue?.name}<br /><small className="text-muted">{event.venue?.location}</small></div></div></div></div>
          <div className="card border-0 bg-light mb-4"><div className="card-body p-4"><h5 className="fw-bold mb-3">Ticket Pricing</h5><ul className="list-group list-group-flush rounded">{event.venue?.categories?.map((category) => <li key={category._id || category.name} className="list-group-item d-flex justify-content-between align-items-center bg-transparent px-0 border-bottom"><span>{category.name}</span><span className="fw-bold text-primary">₹{(event.basePrice * (category.priceMultiplier || 1)).toFixed(2)}</span></li>)}</ul></div></div>
          <button onClick={handleBookNow} className="btn btn-primary btn-lg w-100 py-3 fw-bold rounded-pill shadow" disabled={!canBook}>{canBook ? 'Book Now' : status === 'upcoming' && eventStart && eventStart <= new Date() ? 'Event Started' : 'Currently Unavailable'}</button>
        </div>
      </div>
    </div>
  );
};

export default EventDetailPage;
