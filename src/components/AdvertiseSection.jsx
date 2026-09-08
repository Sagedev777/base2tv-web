import React, { useState } from "react";
import { Send, CheckCircle, Tv, Users, TrendingUp, Radio } from "lucide-react";
import { advertiseAPI } from "../services/api";
import "./AdvertiseSection.css";

const AD_TYPES = [
  "TV Commercial (30 sec)",
  "TV Commercial (60 sec)",
  "Sponsored Programme Segment",
  "News Ticker / Banner",
  "Website Banner Ad",
  "Social Media Promotion",
  "Live Show Sponsorship",
  "Other",
];

const STATS = [
  { icon: Tv,         label: "Daily Viewers",   value: "100K+"   },
  { icon: Users,      label: "Online Audience",  value: "10K+"    },
  { icon: TrendingUp, label: "Monthly Reach",    value: "500K+"   },
  { icon: Radio,      label: "Broadcast Hours",  value: "24/7"    },
];

export default function AdvertiseSection() {
  const [form,    setForm]    = useState({ name:"", company:"", email:"", phone:"", ad_type:"", budget:"", message:"" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error,   setError]   = useState("");

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await advertiseAPI.submit(form);
      setSuccess(true);
      setForm({ name:"", company:"", email:"", phone:"", ad_type:"", budget:"", message:"" });
    } catch (err) {
      setError(err.message || "Failed to send. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="advertise-section" id="advertise">
      <div className="section-header">
        <h2>Advertise on Base2 TV</h2>
        <span className="date-pill">Reach Uganda</span>
      </div>
      <p className="section-subtitle">Connect your brand with Uganda's most engaged television audience</p>

      {/* Stats */}
      <div className="adv-stats-grid">
        {STATS.map(({ icon: Icon, label, value }) => (
          <div key={label} className="adv-stat-card glass-panel">
            <Icon size={24} className="adv-stat-icon" />
            <span className="adv-stat-value">{value}</span>
            <span className="adv-stat-label">{label}</span>
          </div>
        ))}
      </div>

      {/* Form */}
      <div className="adv-form-wrap glass-panel">
        <div className="adv-form-header">
          <h3>Submit Your Advertising Enquiry</h3>
          <p>Tell us about your brand and we will get back to you within 24 hours with a customised package.</p>
        </div>

        {success ? (
          <div className="adv-success">
            <CheckCircle size={44} color="#4cde80" />
            <h3>Enquiry Received!</h3>
            <p>Our advertising team will contact you within 24 hours.</p>
            <p className="adv-contact-note">
              For urgent enquiries call: <strong>+256 704 972 253</strong>
            </p>
            <button className="primary-btn" onClick={() => setSuccess(false)}>Submit Another</button>
          </div>
        ) : (
          <form className="adv-form" onSubmit={handleSubmit}>
            {error && <div className="adv-error">{error}</div>}

            <div className="adv-form-2col">
              <label>Your Name *
                <input type="text" placeholder="Full name" value={form.name}
                  onChange={e => set("name", e.target.value)} required maxLength={80} />
              </label>
              <label>Company / Brand
                <input type="text" placeholder="Company name" value={form.company}
                  onChange={e => set("company", e.target.value)} maxLength={120} />
              </label>
            </div>
            <div className="adv-form-2col">
              <label>Email Address *
                <input type="email" placeholder="your@email.com" value={form.email}
                  onChange={e => set("email", e.target.value)} required maxLength={120} />
              </label>
              <label>Phone Number *
                <input type="tel" placeholder="+256 700 000 000" value={form.phone}
                  onChange={e => set("phone", e.target.value)} required maxLength={30} />
              </label>
            </div>
            <div className="adv-form-2col">
              <label>Type of Advertisement
                <select value={form.ad_type} onChange={e => set("ad_type", e.target.value)}>
                  <option value="">Select ad type...</option>
                  {AD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </label>
              <label>Budget Range
                <select value={form.budget} onChange={e => set("budget", e.target.value)}>
                  <option value="">Select budget...</option>
                  <option>Under UGX 500,000</option>
                  <option>UGX 500,000 – 1,000,000</option>
                  <option>UGX 1,000,000 – 5,000,000</option>
                  <option>UGX 5,000,000 – 10,000,000</option>
                  <option>Above UGX 10,000,000</option>
                  <option>To be discussed</option>
                </select>
              </label>
            </div>
            <label>More Information About What You Want to Advertise *
              <textarea rows={5}
                placeholder="Describe your advertising goals, target audience, preferred schedule, or any changes to an existing ad..."
                value={form.message} onChange={e => set("message", e.target.value)}
                required minLength={10} maxLength={5000} />
            </label>

            <div className="adv-form-actions">
              <button type="submit" className="primary-btn" disabled={loading}>
                <Send size={15} /> {loading ? "Sending..." : "Submit Enquiry"}
              </button>
              <span className="adv-or">or call us directly: <strong>+256 704 972 253</strong></span>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}