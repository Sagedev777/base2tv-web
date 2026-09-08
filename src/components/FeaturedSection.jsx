import React, { useState, useEffect } from "react";
import { featuredAPI } from "../services/api";
import { Star } from "lucide-react";
import { useSettings } from "../services/useSettings";
import "./FeaturedSection.css";

const BioModal = ({ item, onClose }) => {
  if (!item) return null;
  const image = item.image_url||"";
  return (
    <div className="bio-modal-overlay" onClick={onClose}>
      <div className="bio-modal glass-panel" onClick={e=>e.stopPropagation()}>
        <button className="bio-modal-close" onClick={onClose}>x</button>
        {image ? (
          <div className="bio-modal-image-header" style={{position:"relative",width:"100%",height:240}}>
            <img src={image} alt={item.title} style={{width:"100%",height:"100%",objectFit:"cover",borderRadius:"12px 12px 0 0"}}/>
            <div className="bio-initials-circle" style={{position:"absolute",bottom:-40,left:20,zIndex:10,background:"#111"}}>{item.initials}</div>
          </div>
        ) : (
          <div className="bio-modal-gradient" style={{background:item.color}}>
            <div className="bio-initials-circle">{item.initials}</div>
          </div>
        )}
        <div className="bio-modal-body">
          <span className="featured-tag">{item.tag}</span>
          <h2>{item.title}</h2>
          <span className="featured-subtitle">{item.subtitle}</span>
          <p>{item.full_bio}</p>
        </div>
      </div>
    </div>
  );
};

const FeaturedSection = () => {
  const s = useSettings();
  const [items,setItems]=useState([]), [selected,setSelected]=useState(null), [loading,setLoading]=useState(true);
  useEffect(()=>{ featuredAPI.getAll().then(d=>setItems(d.items||[])).catch(()=>setItems([])).finally(()=>setLoading(false)); },[]);
  return (
    <section className="featured-section" id="features">
      <div className="section-header"><h2>{s("featured_title","Base2 TV Features")}</h2><span className="date-pill">{s("featured_pill","People worth watching")}</span></div>
      {loading ? (
        <div className="section-empty"><div className="section-empty-spinner"/><p>Loading features...</p></div>
      ) : items.length===0 ? (
        <div className="section-empty"><Star size={40} opacity={0.3}/><p>No featured profiles yet.</p><span>Add people and stories from the admin dashboard.</span></div>
      ) : (
        <div className="featured-grid">
          {items.map(item=>{
            const image=item.image_url||"";
            return (
              <div key={item.id} className="featured-card glass-panel">
                {image ? (
                  <div className="featured-image" style={{width:"100%",height:200,position:"relative"}}>
                    <img src={image} alt={item.title} style={{width:"100%",height:"100%",objectFit:"cover",borderRadius:"12px 12px 0 0"}}/>
                    <span className="featured-tag-overlay" style={{position:"absolute",top:12,right:12,background:"rgba(0,0,0,.6)",padding:"4px 10px",borderRadius:4,fontSize:".7rem",fontWeight:700,color:"white"}}>{item.tag}</span>
                  </div>
                ) : (
                  <div className="featured-gradient-header" style={{background:item.color}}>
                    <div className="featured-initials">{item.initials}</div>
                    <span className="featured-tag-overlay">{item.tag}</span>
                  </div>
                )}
                <div className="featured-info">
                  <h3>{item.title}</h3>
                  <span className="featured-subtitle">{item.subtitle}</span>
                  <p>{item.description}</p>
                  <button className="read-more-btn" onClick={()=>setSelected(item)}>Read Full Profile</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {selected&&<BioModal item={selected} onClose={()=>setSelected(null)}/>}
    </section>
  );
};
export default FeaturedSection;

