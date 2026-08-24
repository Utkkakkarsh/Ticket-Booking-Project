import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import Spinner from '../components/Spinner';
import CountdownTimer from '../components/CountdownTimer';
import { toast } from 'react-toastify';

const WaitlistPage = () => {
  const [waitlists, setWaitlists] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const claimedFromLink = useRef(false);

  const acceptOffer = useCallback(async (entry, token) => {
    const eventId = entry.event?._id || entry.event;
    const response = await api.post(`/waitlist/${entry._id}/accept`, token ? { token } : {});
    toast.success('Offer accepted! Proceeding to checkout.');
    navigate(`/checkout/${eventId}`, {
      state: {
        seatLabels: response.data.seatLabels || [response.data.seat?.seatLabel || response.data.seat?.label],
        holdExpiresAt: response.data.holdExpiresAt,
        totalAmount: Number(response.data.totalAmount || response.data.seat?.price || 0)
      }
    });
  }, [navigate]);

  const fetchWaitlist = useCallback(async () => {
    try {
      const response = await api.get('/waitlist');
      const entries = response.data.waitlist || response.data || [];
      setWaitlists(entries);

      const claimId = searchParams.get('entry');
      const claimToken = searchParams.get('token');
      if (!claimedFromLink.current && claimId && claimToken) {
        const claimEntry = entries.find((entry) => entry._id === claimId);
        if (claimEntry?.status === 'OFFERED') {
          claimedFromLink.current = true;
          await acceptOffer(claimEntry, claimToken);
        }
        navigate('/waitlist', { replace: true });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load waitlist');
    } finally {
      setLoading(false);
    }
  }, [acceptOffer, navigate, searchParams]);

  useEffect(() => {
    fetchWaitlist();
  }, [fetchWaitlist]);

  const handleAcceptOffer = async (entry) => {
    try {
      await acceptOffer(entry);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to accept offer');
      await fetchWaitlist();
    }
  };

  if (loading) return <div className="mt-5"><Spinner /></div>;

  return (
    <div className="container py-5">
      <h2 className="fw-bold mb-4">My Waitlist Entries</h2>
      {!waitlists.length ? (
        <div className="alert alert-info text-center py-4">You have no waitlist entries.</div>
      ) : (
        <div className="row g-4">
          {waitlists.map((entry) => {
            const isOffered = entry.status === 'OFFERED';
            const isWaiting = entry.status === 'WAITING';
            const event = entry.event || {};
            return (
              <div key={entry._id} className="col-md-6 col-lg-4">
                <div className={`card h-100 shadow-sm border-0 ${isWaiting ? '' : (isOffered ? 'border-success border-2' : 'bg-light opacity-75')}`}>
                  <div className="card-body p-4">
                    <div className="d-flex justify-content-between mb-3">
                      <span className={`badge ${isOffered ? 'bg-success' : isWaiting ? 'bg-warning text-dark' : 'bg-secondary'}`}>{entry.status}</span>
                      {isWaiting && <span className="text-muted small fw-bold">Queue Pos: #{entry.position || '-'}</span>}
                    </div>
                    <h5 className="fw-bold">{event.title || 'Unknown Event'}</h5>
                    <p className="text-muted mb-1 small">{event.date ? new Date(event.date).toLocaleDateString() : ''}</p>
                    <p className="fw-bold text-primary mb-3">Category: {entry.category}</p>
                    {isOffered && entry.offerExpiresAt && (
                      <div className="alert alert-success p-3 text-center mb-3">
                        <p className="mb-2 fw-bold text-success">Seat {entry.offeredSeat} offered</p>
                        <p className="small mb-1">Offer expires in:</p>
                        <h5 className="mb-0 text-danger fw-bold"><CountdownTimer expiresAt={entry.offerExpiresAt} onExpire={fetchWaitlist} /></h5>
                      </div>
                    )}
                    {isOffered && <button onClick={() => handleAcceptOffer(entry)} className="btn btn-success w-100 fw-bold rounded-pill shadow-sm">Accept & Checkout</button>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default WaitlistPage;
