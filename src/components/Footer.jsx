import React, { useState } from "react";
import { Lock, X } from "lucide-react";
import { authAPI, setToken, setUser } from "../services/api";
import "./Footer.css";

// ─── Social Media Icons (real SVG brand icons) ───────────────
const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
    <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.235 2.686.235v2.97h-1.514c-1.491 0-1.956.93-1.956 1.886v2.252h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
  </svg>
);

const YouTubeIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
  </svg>
);

const XTwitterIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
    <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/>
  </svg>
);

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
  </svg>
);

const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
  </svg>
);

// Social links — update URLs to Base2 TV real accounts
const SOCIALS = [
  { Icon: FacebookIcon,  label: "Facebook",  url: "https://www.facebook.com/base2tvuganda", color: "#1877F2" },
  { Icon: YouTubeIcon,   label: "YouTube",   url: "https://www.youtube.com/@base2tvuganda", color: "#FF0000" },
  { Icon: InstagramIcon, label: "Instagram", url: "https://www.instagram.com/base2tvuganda", color: "#E1306C" },
  { Icon: XTwitterIcon,  label: "X / Twitter", url: "https://twitter.com/base2tv",          color: "#fff" },
  { Icon: WhatsAppIcon,  label: "WhatsApp",  url: "https://wa.me/256744253208",              color: "#25D366" },
  { Icon: TikTokIcon,    label: "TikTok",    url: "https://www.tiktok.com/@base2tvuganda",   color: "#fff" },
];

// ─── Staff Login Modal ────────────────────────────────────────
const StaffLoginModal = ({ onClose }) => {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const data = await authAPI.login(email.trim(), password);
      if (!data || !data.user) { setError("Unexpected server response. Please try again."); return; }
      if (!["admin","staff"].includes(data.user.role)) { setError("You do not have staff access."); return; }
      setToken(data.token);
      setUser({ ...data.user, name: data.user.username, avatar: data.user.avatar_url });
      window.location.href = "/admin";
    } catch (err) {
      setError(err.message || "Login failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="staff-overlay" onClick={onClose}>
      <div className="staff-popup glass-panel" onClick={e => e.stopPropagation()}>
        <button className="staff-close-btn" onClick={onClose}><X size={16} /></button>
        <div className="staff-popup-header"><Lock size={18} /><span>Staff Portal Login</span></div>
        <p className="staff-popup-subtitle">Authorised personnel only</p>
        {error && <div className="staff-error">{error}</div>}
        <form onSubmit={handleSubmit} className="staff-form">
          <input type="email" placeholder="Staff Email" value={email}
            onChange={e => setEmail(e.target.value)} required autoFocus />
          <input type="password" placeholder="Password" value={password}
            onChange={e => setPassword(e.target.value)} required />
          <button type="submit" className="staff-submit-btn" disabled={loading}>
            {loading ? "Signing in…" : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
};

// ─── Footer ──────────────────────────────────────────────────
const Footer = () => {
  const [showStaffLogin, setShowStaffLogin] = useState(false);

  return (
    <footer className="app-footer">
      <div className="footer-top">

        {/* Brand */}
        <div className="footer-brand">
          <img src="/logo.png" alt="Base2 TV Logo" className="footer-logo" />
          <p className="footer-tagline">Bamufuna Mpola.<br />Telefwunkeni ya Bamufuna Mpola.</p>
          <p className="footer-contact">Hotline: +256 744 253 208</p>

          {/* Social icons */}
          <div className="footer-socials">
            {SOCIALS.map(({ Icon, label, url, color }) => (
              <a
                key={label}
                href={url}
                target="_blank"
                rel="noreferrer"
                aria-label={label}
                className="footer-social-btn"
                style={{ "--social-color": color }}
                title={label}
              >
                <Icon />
              </a>
            ))}
          </div>
        </div>

        {/* Links grid */}
        <div className="footer-links-grid">
          <div className="footer-col">
            <h4>EXPLORE</h4>
            <a href="#live">Live TV</a>
            <a href="#guide">TV Guide</a>
            <a href="#news">News</a>
            <a href="#catchup">Catch Up</a>
            <a href="#features">Features</a>
            <a href="#contact">Contact</a>
          </div>

          <div className="footer-col">
            <h4>BASE2 TV</h4>
            <a href="#about">About Us</a>
            <a href="#contact">Contact Desk</a>
            <a href="#advertise">Advertise</a>
            <a href="#careers">Careers</a>
          </div>

          <div className="footer-col">
            <h4>FOLLOW US</h4>
            {SOCIALS.map(({ label, url }) => (
              <a key={label} href={url} target="_blank" rel="noreferrer">{label}</a>
            ))}
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} Base2 Television Uganda. All rights reserved.</p>
        <button className="staff-login-link" onClick={() => setShowStaffLogin(true)}>
          Staff Portal
        </button>
      </div>

      {showStaffLogin && <StaffLoginModal onClose={() => setShowStaffLogin(false)} />}
    </footer>
  );
};

export default Footer;