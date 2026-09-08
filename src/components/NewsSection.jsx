import React, { useState, useEffect } from "react";
import { newsAPI } from "../services/api";
import { Newspaper } from "lucide-react";
import { useSettings } from "../services/useSettings";
import "./NewsSection.css";

const FILTERS = ["ALL","LOCAL","GLOBAL"];
const timeAgo = (dt) => {
  if (!dt) return "";
  const diff = Date.now()-new Date(dt).getTime(), mins=Math.floor(diff/60000);
  if (mins<60) return `${mins}m ago`;
  const hrs=Math.floor(mins/60); if (hrs<24) return `${hrs}h ago`;
  const days=Math.floor(hrs/24); if (days<7) return `${days}d ago`;
  return new Date(dt).toLocaleDateString("en-UG",{dateStyle:"medium"});
};

const StoryModal = ({ article, onClose }) => {
  if (!article) return null;
  return (
    <div className="story-modal-overlay" onClick={onClose}>
      <div className="story-modal glass-panel" onClick={e=>e.stopPropagation()}>
        <button className="story-modal-close" onClick={onClose}>x</button>
        {article.thumbnail ? (
          <div className="story-modal-image-header">
            <img src={article.thumbnail} alt={article.title} className="story-modal-image"/>
            <span className="news-category" style={{position:"absolute",bottom:12,left:12}}>{article.category}</span>
          </div>
        ) : (
          <div className="story-modal-gradient" style={{background:article.color||"linear-gradient(135deg,#1a1a2e,#0d0d11)"}}>
            <span className="news-category">{article.category}</span>
          </div>
        )}
        <div className="story-modal-body">
          <span className="news-time">{timeAgo(article.published_at)}</span>
          <h2>{article.title}</h2>
          <p>{article.body||article.excerpt}</p>
        </div>
      </div>
    </div>
  );
};

const NewsSection = () => {
  const s = useSettings();
  const [articles,setArticles]=useState([]), [activeFilter,setActiveFilter]=useState("ALL");
  const [selected,setSelected]=useState(null), [loading,setLoading]=useState(true), [error,setError]=useState("");

  useEffect(()=>{
    newsAPI.getAll(20,0).then(d=>setArticles(d.articles||[])).catch(()=>setError("Could not load articles.")).finally(()=>setLoading(false));
  },[]);

  const filtered = activeFilter==="ALL" ? articles : articles.filter(a=>(a.scope||"LOCAL")===activeFilter);

  return (
    <section className="news-section" id="news">
      <div className="section-header"><h2>{s("news_title","Latest Stories")}</h2><span className="date-pill">{s("news_pill","FROM UGANDA")}</span></div>
      <p className="section-subtitle">{s("news_subtitle","Local first · Global when it matters")}</p>
      <div className="news-filters">{FILTERS.map(f=><button key={f} className={`news-filter-btn ${activeFilter===f?"active":""}`} onClick={()=>setActiveFilter(f)}>{f}</button>)}</div>
      {loading ? (
        <div className="section-empty"><div className="section-empty-spinner"/><p>Loading stories...</p></div>
      ) : error ? (
        <div className="section-empty"><Newspaper size={40} opacity={0.3}/><p>{error}</p></div>
      ) : filtered.length===0 ? (
        <div className="section-empty"><Newspaper size={40} opacity={0.3}/><p>No stories published yet.</p><span>Check back soon — our newsdesk is working on it.</span></div>
      ) : (
        <div className="news-grid">
          {filtered.map(article=>(
            <article key={article.id} className="news-card glass-panel">
              {article.thumbnail ? (
                <div className="news-image-wrapper"><img src={article.thumbnail} alt={article.title}/><span className="news-category">{article.category}</span><span className={`scope-badge ${(article.scope||"LOCAL").toLowerCase()}`}>{article.scope}</span></div>
              ) : (
                <div className="news-gradient-header" style={{background:article.color||"linear-gradient(135deg,#1a1a2e,#0d0d11)"}}>
                  <span className="news-category">{article.category}</span><span className={`scope-badge ${(article.scope||"LOCAL").toLowerCase()}`}>{article.scope}</span>
                </div>
              )}
              <div className="news-content">
                <span className="news-time">{timeAgo(article.published_at)}</span>
                <h3>{article.title}</h3>
                <p>{article.excerpt||article.summary}</p>
                <button className="read-more-btn" onClick={()=>setSelected(article)}>Read Full Story</button>
              </div>
            </article>
          ))}
        </div>
      )}
      {selected&&<StoryModal article={selected} onClose={()=>setSelected(null)}/>}
    </section>
  );
};
export default NewsSection;

