import React, { useState, useEffect, useRef } from "react";
import { adsAPI } from "../services/api";
import "./AdsBanner.css";

const AdsBanner = ({ position = "sidebar" }) => {
  const [ads,     setAds]     = useState([]);
  const [current, setCurrent] = useState(0);
  const [mediaError, setMediaError] = useState(false);
  const timerRef = useRef(null);

  const resolveMediaUrl = (url) => {
    if (!url) return "";
    if (/^https?:\/\//i.test(url)) return url;
    return `${window.location.origin}${url.startsWith("/") ? url : `/${url}`}`;
  };

  useEffect(() => {
    adsAPI.getActive()
      .then(d => {
        const filtered = (d.ads || []).filter(a => a.position === position || a.position === "all");
        setAds(filtered);
      })
      .catch(() => {});
  }, [position]);

  // Auto-rotate based on each ad duration
  useEffect(() => {
    if (!ads.length) return;
    setMediaError(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    const duration = (ads[current]?.duration_sec || 10) * 1000;
    timerRef.current = setTimeout(() => {
      setCurrent(c => (c + 1) % ads.length);
    }, duration);
    return () => clearTimeout(timerRef.current);
  }, [ads, current]);

  if (!ads.length) return null;

  const ad = ads[current];
  const isVideo = ad.media_type === "video";
  const mediaUrl = resolveMediaUrl(ad.media_url);

  const handleMediaError = () => {
    if (ads.length > 1) {
      setCurrent(c => (c + 1) % ads.length);
    } else {
      setMediaError(true);
    }
  };

  const handleClick = () => {
    if (ad.link_url) window.open(ad.link_url, "_blank", "noopener noreferrer");
  };

  return (
    <div className="ads-banner">
      <div className="ads-banner-label">ADVERTISEMENT</div>

      <div
        className={`ads-media-wrap ${ad.link_url ? "clickable" : ""}`}
        onClick={handleClick}
      >
        {mediaError ? (
          <div className="ads-media-error">Advertisement unavailable</div>
        ) : isVideo ? (
          <video
            key={ad.id}
            src={mediaUrl}
            autoPlay
            muted
            loop={ads.length === 1}
            playsInline
            className="ads-media"
            onEnded={() => setCurrent(c => (c + 1) % ads.length)}
            onError={handleMediaError}
          />
        ) : (
          <img
            key={ad.id}
            src={mediaUrl}
            alt={ad.title || "Advertisement"}
            className="ads-media"
            onError={handleMediaError}
          />
        )}

        {ad.title && <div className="ads-title-overlay">{ad.title}</div>}
      </div>

      {/* Dot indicators */}
      {ads.length > 1 && (
        <div className="ads-dots">
          {ads.map((_, i) => (
            <button
              key={i}
              className={`ads-dot ${i === current ? "active" : ""}`}
              onClick={() => setCurrent(i)}
              aria-label={`Ad ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AdsBanner;