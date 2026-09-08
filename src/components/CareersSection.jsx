import React, { useState, useEffect } from "react";
import { Briefcase, MapPin, Clock, Calendar, ChevronDown, ChevronUp } from "lucide-react";
import { careersAPI } from "../services/api";
import "./CareersSection.css";

const TYPE_COLORS = {
  "Full-time":  "#4cde80",
  "Part-time":  "#4a90e2",
  "Contract":   "#f5a623",
  "Internship": "#c084fc",
  "Volunteer":  "#50e3c2",
};

export default function CareersSection() {
  const [jobs,     setJobs]     = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    careersAPI.getActive()
      .then(d => setJobs(d.jobs || []))
      .catch(() => setJobs([]))
      .finally(() => setLoading(false));
  }, []);

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-UG", { dateStyle: "medium" }) : null;

  const daysLeft = (deadline) => {
    if (!deadline) return null;
    const diff = Math.ceil((new Date(deadline) - new Date()) / 86400000);
    if (diff < 0)  return { text: "Closed", urgent: true };
    if (diff === 0) return { text: "Closes today!", urgent: true };
    if (diff <= 7)  return { text: `${diff} day${diff !== 1 ? "s" : ""} left`, urgent: true };
    return { text: `${diff} days left`, urgent: false };
  };

  return (
    <section className="careers-section" id="careers">
      <div className="section-header">
        <h2>Careers at Base2 TV</h2>
        <span className="date-pill">Join Our Team</span>
      </div>
      <p className="section-subtitle">Be part of Uganda's independent media voice</p>

      {loading ? (
        <div className="section-empty"><div className="section-empty-spinner" /><p>Loading opportunities...</p></div>
      ) : jobs.length === 0 ? (
        <div className="section-empty careers-empty">
          <Briefcase size={40} opacity={0.3} />
          <p>No open positions right now.</p>
          <span>Check back soon — we are always growing. You can also send your CV to <strong>careers@base2tv.ug</strong></span>
        </div>
      ) : (
        <div className="careers-list">
          {jobs.map(job => {
            const dl     = daysLeft(job.deadline);
            const isOpen = expanded === job.id;
            return (
              <div key={job.id} className={`career-card glass-panel ${isOpen ? "open" : ""}`}>
                {/* Header row — always visible */}
                <div className="career-header" onClick={() => setExpanded(isOpen ? null : job.id)}>
                  <div className="career-info">
                    <div className="career-title-row">
                      <h3 className="career-title">{job.title}</h3>
                      <span
                        className="career-type-badge"
                        style={{ "--type-color": TYPE_COLORS[job.type] || "#fff" }}
                      >
                        {job.type}
                      </span>
                    </div>
                    <div className="career-meta">
                      <span><Briefcase size={13} /> {job.department}</span>
                      <span><MapPin size={13} /> {job.location}</span>
                      {job.salary_range && <span><Clock size={13} /> {job.salary_range}</span>}
                      {job.deadline && (
                        <span className={`career-deadline ${dl?.urgent ? "urgent" : ""}`}>
                          <Calendar size={13} />
                          Deadline: {fmtDate(job.deadline)}
                          {dl && <strong> · {dl.text}</strong>}
                        </span>
                      )}
                    </div>
                  </div>
                  <button className="career-expand-btn" aria-label={isOpen ? "Collapse" : "Expand"}>
                    {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>
                </div>

                {/* Expanded details */}
                {isOpen && (
                  <div className="career-body">
                    <div className="career-section">
                      <h4>About the Role</h4>
                      <p>{job.description}</p>
                    </div>
                    {job.requirements && (
                      <div className="career-section">
                        <h4>Requirements</h4>
                        <p style={{ whiteSpace: "pre-line" }}>{job.requirements}</p>
                      </div>
                    )}
                    <div className="career-apply">
                      <a
                        href={`mailto:careers@base2tv.ug?subject=Application: ${encodeURIComponent(job.title)}`}
                        className="primary-btn"
                      >
                        Apply Now — careers@base2tv.ug
                      </a>
                      {job.deadline && (
                        <span className="career-closes">
                          Applications close: {fmtDate(job.deadline)}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="careers-footer-note glass-panel">
        <Briefcase size={20} />
        <p>
          Don't see a fitting role? Send your CV and cover letter to{" "}
          <a href="mailto:careers@base2tv.ug">careers@base2tv.ug</a> — we keep great talent on file.
        </p>
      </div>
    </section>
  );
}