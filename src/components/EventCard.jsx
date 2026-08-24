import React from 'react';
import { Link } from 'react-router-dom';
import { FaArrowRight, FaCalendarAlt, FaMapMarkerAlt } from 'react-icons/fa';
import EventPoster from './EventPoster';

const EventCard = ({ event }) => {
  const eventDate = event.date ? new Date(event.date).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }) : 'Date TBA';

  return (
    <article className="card event-card h-100">
      <div className="event-poster-wrap">
        <EventPoster event={event} className="event-poster" fallbackClassName="event-poster-card-fallback" />
        <span className={`badge event-card-type ${event.type === 'Movie' ? 'badge-standard' : 'badge-premium'}`}>
          {event.type || 'Event'}
        </span>
      </div>

      <div className="event-card-body">
        <h3 className="event-card-title">{event.title}</h3>

        <div className="event-card-meta">
          <FaCalendarAlt size={13} aria-hidden="true" />
          <span><strong>{eventDate}</strong> · {event.startTime || 'Time TBA'}</span>
        </div>

        <div className="event-card-meta">
          <FaMapMarkerAlt size={14} aria-hidden="true" />
          <span>
            <strong>{event.venue?.name || 'Venue TBA'}</strong>
            {event.distanceKm !== null && event.distanceKm !== undefined && ` · ${event.distanceKm} km away`}
          </span>
        </div>

        <div className="event-card-footer">
          <div>
            <span className="event-card-price-label">Tickets from</span>
            <span className="event-card-price">₹{Number(event.basePrice || 0).toFixed(2)}</span>
          </div>
          <Link to={`/events/${event._id}`} className="event-card-link" aria-label={`View ${event.title || 'event'} details`}>
            <FaArrowRight size={15} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
};

export default EventCard;
