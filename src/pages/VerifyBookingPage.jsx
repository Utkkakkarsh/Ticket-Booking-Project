import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import Spinner from '../components/Spinner';

const VerifyBookingPage = () => {
  const { reference } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verify = async () => {
      try {
        const response = await api.get(`/bookings/verify/${encodeURIComponent(reference)}`);
        setResult(response.data);
      } catch (error) {
        setResult({ valid: false, message: error.response?.data?.message || 'Booking could not be verified' });
      } finally {
        setLoading(false);
      }
    };
    verify();
  }, [reference]);

  if (loading) return <div className="mt-5"><Spinner /></div>;
  const event = result?.event;
  return (
    <div className="container py-5"><div className="row justify-content-center"><div className="col-md-7 col-lg-6">
      <div className={`card border-0 shadow-sm rounded-4 ${result?.valid ? 'border-start border-success border-4' : 'border-start border-danger border-4'}`}>
        <div className="card-body p-4 p-md-5">
          <h2 className="fw-bold mb-3">Ticket Verification</h2>
          <p className={`fw-semibold ${result?.valid ? 'text-success' : 'text-danger'}`}>{result?.valid ? 'Valid confirmed booking' : result?.message || 'Invalid booking'}</p>
          {result?.bookingReference && <p><span className="text-muted">Reference:</span> <strong>{result.bookingReference}</strong></p>}
          {event && <><hr /><h5 className="fw-bold">{event.title}</h5><p className="text-muted mb-2">{event.date ? new Date(event.date).toLocaleDateString() : ''} at {event.startTime || 'TBA'}</p><p className="text-muted">{event.venue?.name || 'Venue unavailable'}</p><p><strong>Seats:</strong> {result.seats?.map((seat) => seat.seatLabel).join(', ') || 'N/A'}</p></>}
          <Link to="/events" className="btn btn-primary rounded-pill mt-3">Browse events</Link>
        </div>
      </div>
    </div></div></div>
  );
};

export default VerifyBookingPage;
