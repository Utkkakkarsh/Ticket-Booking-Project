import React, { useEffect, useRef } from 'react';
import { useCountdown } from '../hooks/useCountdown';

const CountdownTimer = ({ expiresAt, targetDate, onExpire }) => {
  const timestamp = expiresAt || targetDate;
  const { minutes, seconds, isExpired } = useCountdown(timestamp);
  const hasNotified = useRef(false);
  const previousTimestamp = useRef(timestamp);
  if (previousTimestamp.current !== timestamp) {
    previousTimestamp.current = timestamp;
    hasNotified.current = false;
  }

  useEffect(() => {
    if (isExpired && timestamp && !hasNotified.current) {
      hasNotified.current = true;
      onExpire?.();
    }
  }, [isExpired, timestamp, onExpire]);

  if (!timestamp) return null;
  if (isExpired) return <span className="badge bg-danger p-2 fs-6">Expired</span>;

  return (
    <div className="countdown-timer badge bg-warning text-dark p-2 fs-6">
      Time remaining: {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
    </div>
  );
};

export default CountdownTimer;
