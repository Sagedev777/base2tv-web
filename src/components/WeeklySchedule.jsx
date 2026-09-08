import React, { useState, useEffect } from "react";
import { Tv2, Clock, ChevronRight } from "lucide-react";
import "./WeeklySchedule.css";

const DAYS = [
  { key: "monday",    short: "MON", label: "Monday"    },
  { key: "tuesday",   short: "TUE", label: "Tuesday"   },
  { key: "wednesday", short: "WED", label: "Wednesday" },
  { key: "thursday",  short: "THU", label: "Thursday"  },
  { key: "friday",    short: "FRI", label: "Friday"    },
  { key: "saturday",  short: "SAT", label: "Saturday"  },
  { key: "sunday",    short: "SUN", label: "Sunday"    },
];

const BASE = import.meta.env.VITE_API_URL || "/api";

const WeeklySchedule = () => {
  const [grouped,    setGrouped]    = useState({});
  const [today,      setToday]      = useState("monday");
  const [activeDay,  setActiveDay]  = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [expanded,   setExpanded]   = useState(null);

  useEffect(() => {
    fetch(`${BASE}/schedule/weekly`)
      .then(r => r.json())
      .then(d => {
        setGrouped(d.grouped || {});
        setToday(d.today || "monday");
        setActiveDay(d.today || "monday");
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Shows for selected day = that day's specific shows + daily shows
  const getShowsForDay = (day) => {
    const dayShows   = grouped[day]    || [];
    const dailyShows = grouped["daily"] || [];
    // Merge and sort by air_time, deduplicate by id
    const merged = [...dayShows, ...dailyShows.filter(d => !dayShows.find(s => s.id === d.id))];
    return merged.sort((a, b) => a.air_time?.localeCompare(b.air_time));
  };

  const shows = activeDay ? getShowsForDay(activeDay) : [];

  return (
    <div className="weekly-schedule">
      <div className="weekly-header">
        <h3>Weekly Programme</h3>
        <span className="weekly-subtitle">What is on Base2 TV this week</span>
      </div>

      {/* Day tabs */}
      <div className="weekly-day-tabs">
        {DAYS.map(d => (
          <button
            key={d.key}
            className={`weekly-day-tab ${activeDay === d.key ? "active" : ""} ${today === d.key ? "today" : ""}`}
            onClick={() => { setActiveDay(d.key); setExpanded(null); }}
          >
            <span className="day-short">{d.short}</span>
            <span className="day-label">{d.label}</span>
            {today === d.key && <span className="today-dot" />}
          </button>
        ))}
      </div>

      {/* Show list */}
      <div className="weekly-shows-list">
        {loading ? (
          <div className="section-empty"><div className="section-empty-spinner" /><p>Loading...</p></div>
        ) : shows.length === 0 ? (
          <div className="section-empty">
            <Tv2 size={32} opacity={0.3} />
            <p>No programmes scheduled for this day.</p>
          </div>
        ) : (
          shows.map(show => (
            <div
              key={show.id}
              className={`weekly-show-row ${show.state === "current" ? "is-live" : ""} ${expanded === show.id ? "is-expanded" : ""}`}
              onClick={() => setExpanded(expanded === show.id ? null : show.id)}
            >
              {/* Left: time */}
              <div className="weekly-show-time">
                <span className="wst-time">{show.time}</span>
                <span className="wst-duration">
                  <Clock size={11} /> {show.duration} min
                </span>
              </div>

              {/* Middle: info */}
              <div className="weekly-show-info">
                <div className="weekly-show-top">
                  <span className="weekly-show-title">{show.title}</span>
                  {show.state === "current" && (
                    <span className="weekly-live-badge">
                      <span className="wlb-dot" /> LIVE
                    </span>
                  )}
                  {show.day_of_week !== "daily" && (
                    <span className="weekly-day-badge" style={{textTransform:"capitalize"}}>{show.day_of_week}</span>
                  )}
                </div>
                {expanded === show.id && show.description && (
                  <p className="weekly-show-desc">{show.description}</p>
                )}
                {show.week_notes && (
                  <span className="weekly-show-note">{show.week_notes}</span>
                )}
              </div>

              {/* Right: thumbnail or expand arrow */}
              <div className="weekly-show-right">
                {show.thumbnail ? (
                  <img src={show.thumbnail} alt={show.title} className="weekly-thumb" />
                ) : (
                  <ChevronRight
                    size={16}
                    className={`weekly-chevron ${expanded === show.id ? "rotated" : ""}`}
                  />
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default WeeklySchedule;