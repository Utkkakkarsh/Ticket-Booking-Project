import { useState, useEffect } from 'react';

export const useCountdown = (targetTimestamp) => {
  const [timeLeft, setTimeLeft] = useState({
    minutes: 0,
    seconds: 0,
    isExpired: false
  });

  useEffect(() => {
    if (!targetTimestamp) return;

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const targetDate = new Date(targetTimestamp).getTime();
      const difference = targetDate - now;

      if (difference <= 0) {
        return {
          minutes: 0,
          seconds: 0,
          isExpired: true
        };
      }

      return {
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000),
        isExpired: false
      };
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);
      
      if (remaining.isExpired) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetTimestamp]);

  return timeLeft;
};
