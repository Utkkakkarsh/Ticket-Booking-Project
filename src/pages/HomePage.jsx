import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaArrowRight, FaCompass, FaTicketAlt } from 'react-icons/fa';
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
    <div className="home-page">
      <section className="home-hero">
        <div className="container">
          <div className="hero-grid">
            <div className="hero-content">
              <div className="hero-eyebrow">
                <span className="hero-eyebrow-dot" />
                FIND WHAT MOVES YOU
              </div>
              <h1 className="hero-title">
                Your next great <em>night out</em> starts here.
              </h1>
              <p className="hero-copy">
                Discover memorable movies, concerts, and live events — then secure your seat in just a few simple steps.
              </p>
              <div className="hero-actions">
                <Link to="/events" className="btn btn-hero-primary">
                  Explore events <FaArrowRight size={14} />
                </Link>
                <Link to="/events" className="btn btn-hero-secondary">
                  <FaCompass size={14} /> Browse by interest
                </Link>
              </div>
            </div>
            <div className="hero-stamp" aria-label="Book your next experience">
              <div>
                <strong>01</strong>
                <span>choose • book • go</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container home-content">
        <div className="featured-panel">
          <div className="d-flex justify-content-between align-items-end mb-4 mb-md-5 flex-wrap gap-3">
            <div>
              <p className="section-kicker">Curated for your calendar</p>
              <h2 className="section-title">Featured events</h2>
              <p className="section-description">Fresh picks, ready when you are.</p>
            </div>
            <Link to="/events" className="btn btn-outline-primary">
              See all events <FaArrowRight size={13} />
            </Link>
          </div>

          {loading ? (
            <div className="py-5">
              <Spinner />
            </div>
          ) : events.length === 0 ? (
            <div className="empty-events">
              <div className="empty-events-icon"><FaTicketAlt /></div>
              <h3 className="h5 fw-bold mb-2">Nothing is listed just yet.</h3>
              <p className="mb-0">Check back soon for fresh experiences to book.</p>
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
      </section>
    </div>
  );
};

export default HomePage;
