import React, { useEffect, useMemo, useState } from 'react';
import { FaExternalLinkAlt, FaImage } from 'react-icons/fa';

const getDirectPosterUrl = (posterUrl) => {
  if (typeof posterUrl !== 'string' || !posterUrl.trim()) return null;

  try {
    const parsedUrl = new URL(posterUrl.trim(), window.location.origin);

    // Google Image result links are HTML result pages, not image files. Use their imgurl value instead.
    if (/(^|\.)google\.[a-z.]+$/i.test(parsedUrl.hostname)) {
      const embeddedImageUrl = parsedUrl.searchParams.get('imgurl');
      if (embeddedImageUrl) {
        const directImageUrl = new URL(embeddedImageUrl);
        return ['http:', 'https:'].includes(directImageUrl.protocol) ? directImageUrl.href : null;
      }
    }

    return ['http:', 'https:', 'data:'].includes(parsedUrl.protocol) ? parsedUrl.href : null;
  } catch {
    return null;
  }
};

const EventPoster = ({ event, className = '', fallbackClassName = '' }) => {
  const directPosterUrl = useMemo(() => getDirectPosterUrl(event?.posterUrl), [event?.posterUrl]);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [directPosterUrl]);

  if (!directPosterUrl || imageFailed) {
    return (
      <div className={`event-poster-fallback ${fallbackClassName}`} role="img" aria-label={`${event?.title || 'Event'} poster unavailable`}>
        <span className="event-poster-fallback-icon"><FaImage /></span>
        <span className="event-poster-fallback-copy">
          <strong>Poster unavailable</strong>
          {directPosterUrl && (
            <a href={directPosterUrl} target="_blank" rel="noreferrer">
              Open original <FaExternalLinkAlt size={10} />
            </a>
          )}
        </span>
      </div>
    );
  }

  return (
    <img
      src={directPosterUrl}
      className={className}
      alt={event?.title ? `${event.title} event poster` : 'Event poster'}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setImageFailed(true)}
    />
  );
};

export default EventPoster;
