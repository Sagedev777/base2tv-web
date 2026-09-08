import React, { useState } from "react";
import { PhoneCall, MessageCircle, Mic2, Tv, Send, CheckCircle } from "lucide-react";
import { contactAPI } from "../services/api";
import { useSettings } from "../services/useSettings";
import "./ContactSection.css";

const ContactSection = () => {
  const s = useSettings();
  const [form,    setForm]    = useState({ name:"", email:"", subject:"", message:"" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error,   setError]   = useState("");

  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await contactAPI.submit(form.name, form.email, form.subject, form.message);
      setSuccess(true);
      setForm({ name:"", email:"", subject:"", message:"" });
    } catch (err) {
      setError(err.message||"Failed to send. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="contact-section" id="contact">
      <div className="section-header">
        <h2>{s("contact_title","Base2 TV Phone Lines")}</h2>
        <span className="date-pill">{s("contact_pill","Get in Touch")}</span>
      </div>
      <p className="section-subtitle">{s("contact_subtitle","Connect directly with our live studio, newsdesk, or advertising team")}</p>

      <div className="contact-grid">
        <div className="contact-card glass-panel">
          <Mic2 size={32} className="contact-icon"/>
          <span className="contact-status coming-soon">COMING SOON</span>
          <h3>Studio Live Line</h3>
          <p>Call during live talk shows to speak with hosts</p>
        </div>
        <div className="contact-card glass-panel">
          <PhoneCall size={32} className="contact-icon"/>
          <span className="contact-status live">LIVE ON-AIR</span>
          <h3>Newsdesk &amp; Hotline Tips</h3>
          <p className="contact-number">+256 744 253 208</p>
          <p>Report breaking news, photos, or confidential tips</p>
        </div>
        <div className="contact-card glass-panel">
          <MessageCircle size={32} className="contact-icon"/>
          <span className="contact-status live">WHATSAPP</span>
          <h3>WhatsApp Desk</h3>
          <p className="contact-number">+256 744 253 208</p>
          <p>Send voice notes, video clips, and community messages</p>
        </div>
        <div className="contact-card glass-panel">
          <Tv size={32} className="contact-icon"/>
          <span className="contact-status">COMMERCIAL</span>
          <h3>Advertising &amp; Commercial</h3>
          <p className="contact-number">+256 704 972 253</p>
          <p>Inquire about TV advertisements, sponsorships &amp; coverage</p>
        </div>
      </div>

      <div className="story-submission glass-panel">
        <div className="story-content">
          <h2>{s("contact_story_heading","YOUR STORY MATTERS")}</h2>
          <h3>{s("contact_story_sub","Seen something? Tell Base2 TV.")}</h3>
          <p>Send us your name, location and message. Share a story, suggestion, community issue or call our Hotline at <strong>+256 744 253 208</strong>.</p>
        </div>

        {success ? (
          <div className="contact-success">
            <CheckCircle size={36} color="#4cde80"/>
            <h3>Message Sent!</h3>
            <p>Thank you for reaching out. Our team will get back to you shortly.</p>
            <button className="primary-btn" onClick={()=>setSuccess(false)}>Send Another</button>
          </div>
        ) : (
          <form className="contact-form" onSubmit={handleSubmit}>
            {error && <div className="contact-error">{error}</div>}
            <div className="contact-form-row">
              <input type="text" placeholder="Your Name *" value={form.name}
                onChange={e=>set("name",e.target.value)} required maxLength={80}/>
              <input type="email" placeholder="Your Email *" value={form.email}
                onChange={e=>set("email",e.target.value)} required maxLength={120}/>
            </div>
            <input type="text" placeholder="Subject" value={form.subject}
              onChange={e=>set("subject",e.target.value)} maxLength={200}/>
            <textarea rows={4} placeholder="Your message... *" value={form.message}
              onChange={e=>set("message",e.target.value)} required minLength={10} maxLength={5000}/>
            <div className="story-actions">
              <button type="submit" className="primary-btn" disabled={loading}>
                <Send size={15}/> {loading ? "Sending..." : "Send Message"}
              </button>
              <a href="tel:+256744253208" className="secondary-btn">Call +256 744 253 208</a>
            </div>
          </form>
        )}
      </div>
    </section>
  );
};
export default ContactSection;

