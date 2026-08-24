import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import EventCard from '../components/EventCard';
import Spinner from '../components/Spinner';
import { toast } from 'react-toastify';

const HomePage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await api.get('/events?limit=6');
        setEvents(res.data.events || res.data || []);
      } catch (err) {
        toast.error('Failed to load events');
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  return (
    <div className="home-page" style={{ background: '#f7f8fc', minHeight: '100vh' }}>
      <div
        className="text-white text-center position-relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '5.5rem 1.5rem 7rem',
        }}
      >
        {/* decorative blobs */}
        <div
          style={{
            position: 'absolute',
            top: '-60px',
            left: '-60px',
            width: '220px',
            height: '220px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-80px',
            right: '-40px',
            width: '260px',
            height: '260px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)',
          }}
        />

        <div className="position-relative">
          <span
            className="badge rounded-pill px-3 py-2 mb-3"
            style={{ background: 'rgba(255,255,255,0.15)', fontWeight: 600, letterSpacing: '0.03em' }}
          >
            🎟️ NOW BOOKING
          </span>
          <h1 className="display-4 fw-bold mb-3">Book Your Experience</h1>
          <p className="lead mb-4" style={{ opacity: 0.9, maxWidth: '560px', margin: '0 auto' }}>
            Find and book the best movies, concerts, and events near you.
          </p>
          <Link
            to="/events"
            className="btn btn-lg px-5 rounded-pill fw-bold shadow"
            style={{ background: '#fff', color: '#667eea', border: 'none' }}
          >
            Explore Now
          </Link>
        </div>
      </div>

      <div className="container" style={{ marginTop: '-3.5rem', paddingBottom: '4rem' }}>
        <div
          className="bg-white rounded-4 shadow-sm p-4 p-md-5"
          style={{ border: '1px solid #eee' }}
        >
          <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
            <div>
              <h2 className="fw-bold mb-1">Featured Events</h2>
              <p className="text-muted mb-0 small">Hand-picked events you shouldn't miss</p>
            </div>
            <Link
              to="/events"
              className="btn fw-semibold rounded-pill px-4"
              style={{ border: '1.5px solid #667eea', color: '#667eea', background: 'transparent' }}
            >
              View All Events →
            </Link>
          </div>

          {loading ? (
            <div className="py-5">
              <Spinner />
            </div>
          ) : events.length === 0 ? (
            <div
              className="text-center py-5 rounded-4"
              style={{ background: '#f7f8fc', border: '1px dashed #ddd' }}
            >
              <div style={{ fontSize: '2.5rem' }} className="mb-2">📭</div>
              <h5 className="text-muted fw-semibold mb-0">No featured events available right now.</h5>
            </div>
          ) : (
            <div className="row g-4">
              {events.map((event) => (
                <div key={event._id} className="col-12 col-md-6 col-lg-4">
                  <EventCard event={event} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;