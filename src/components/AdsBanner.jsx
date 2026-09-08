import React, { useState, useEffect, useRef } from "react";
import { adsAPI } from "../services/api";
import "./AdsBanner.css";

const AdsBanner = ({ position = "sidebar" }) => {
  const [ads,     setAds]     = useState([]);
  const [current, setCurrent] = useState(0);
  const timerRef = useRef(null);

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
        {isVideo ? (
          <video
            key={ad.id}
            src={ad.media_url}
            autoPlay
            muted
            loop={ads.length === 1}
            playsInline
            className="ads-media"
            onEnded={() => setCurrent(c => (c + 1) % ads.length)}
          />
        ) : (
          <img
            key={ad.id}
            src={ad.media_url}
            alt={ad.title || "Advertisement"}
            className="ads-media"
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