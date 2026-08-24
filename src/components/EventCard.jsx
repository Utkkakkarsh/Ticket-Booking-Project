import React from 'react';
import { Link } from 'react-router-dom';

const EventCard = ({ event }) => {
  return (
    <div className="card event-card h-100">
      <img 
        src={event.posterUrl || 'https://via.placeholder.com/400x200?text=Event+Poster'} 
        className="card-img-top event-poster" 
        alt={event.title} 
      />
      <div className="card-body d-flex flex-column">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <h5 className="card-title mb-0">{event.title}</h5>
          <span className={`badge ${event.type === 'Movie' ? 'badge-standard' : 'badge-premium'}`}>
            {event.type}
          </span>
        </div>
        <p className="card-text text-muted small mb-2">
          {event.date ? new Date(event.date).toLocaleDateString() : 'Date TBA'} at {event.startTime || 'Time TBA'}
        </p>
        <p className="card-text small mb-3">
          <strong>Venue:</strong> {event.venue?.name || 'TBA'}
          {event.distanceKm !== null && event.distanceKm !== undefined && <span className="text-muted d-block mt-1"><i className="bi bi-geo-alt me-1"></i>{event.distanceKm} km away</span>}
        </p>
        <div className="mt-auto">
          <p className="text-primary fw-bold mb-2">
            Starting from ₹{Number(event.basePrice || 0).toFixed(2)}
          </p>
          <Link to={`/events/${event._id}`} className="btn btn-outline-primary w-100">
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
};

export default EventCard;
