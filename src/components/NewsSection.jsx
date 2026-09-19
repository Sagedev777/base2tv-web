import React, { useState, useEffect } from "react";
import { newsAPI } from "../services/api";
import { Newspaper } from "lucide-react";
import { useSettings } from "../services/useSettings";
import "./NewsSection.css";

const SCOPE_FILTERS = ["ALL","LOCAL","GLOBAL"];
const PREVIEW_STORY_COUNT = 6;
const kampalaDate = (date) => new Intl.DateTimeFormat("en-CA", {
  timeZone: "Africa/Kampala",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
}).format(new Date(date));

const isPublishedToday = (article) => {
  if (!article.published_at) return false;
  return kampalaDate(article.published_at) === kampalaDate(new Date());
};

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

const StoryCard = ({ article, lead = false, onSelect }) => (
  <article className={`news-card ${lead ? "news-card-lead" : "news-card-supporting"}`}>
    {article.thumbnail ? (
      <div className="news-image-wrapper">
        <img src={article.thumbnail} alt={article.title} loading="lazy"/>
        <div className="news-card-overlay">
          <span className="news-category">{article.category}</span>
        </div>
      </div>
    ) : (
      <div className="news-gradient-header" style={{background:article.color||"linear-gradient(135deg,#1a1a2e,#0d0d11)"}}>
        <span className="news-category">{article.category}</span>
      </div>
    )}
    <div className="news-content">
      <div className="news-meta">
        <span className="news-time">{timeAgo(article.published_at)}</span>
        <span className={`scope-badge ${(article.scope||"LOCAL").toLowerCase()}`}>{article.scope || "LOCAL"}</span>
      </div>
      <h3>{article.title}</h3>
      {lead && <p>{article.excerpt||article.summary}</p>}
      <button className="read-more-btn" onClick={()=>onSelect(article)}>Read Full Story</button>
    </div>
  </article>
);

const NewsSection = ({ fullPage = false }) => {
  const s = useSettings();
  const [articles,setArticles]=useState([]), [activeFilter,setActiveFilter]=useState("ALL");
  const [activeSector,setActiveSector]=useState("ALL");
  const [selected,setSelected]=useState(null), [loading,setLoading]=useState(true), [error,setError]=useState("");
  const [rotationStart,setRotationStart]=useState(0);

  useEffect(()=>{
    newsAPI.getAll(50,0).then(d=>setArticles(d.articles||[])).catch(()=>setError("Could not load articles.")).finally(()=>setLoading(false));
  },[]);

  const sectors = ["ALL", ...new Set(articles.map(article=>article.category).filter(Boolean))];
  const filtered = (activeFilter==="ALL" ? articles : articles.filter(a=>(a.scope||"LOCAL")===activeFilter))
    .filter(article=>activeSector==="ALL" || article.category===activeSector)
    .slice()
    .sort((a,b)=>new Date(b.published_at||0)-new Date(a.published_at||0));
  const todayArticles = filtered.filter(isPublishedToday);

  useEffect(()=>{
    if (fullPage) return;
    setRotationStart(0);
  },[activeFilter,activeSector,fullPage]);

  useEffect(()=>{
    if (fullPage || todayArticles.length<=PREVIEW_STORY_COUNT) return;
    const interval=setInterval(()=>setRotationStart(start=>(start+PREVIEW_STORY_COUNT)%todayArticles.length),8000);
    return ()=>clearInterval(interval);
  },[todayArticles.length,fullPage]);

  const visibleArticles = fullPage
    ? filtered
    : Array.from({length:Math.min(PREVIEW_STORY_COUNT,todayArticles.length)},(_,index)=>todayArticles[(rotationStart+index)%todayArticles.length]);
  const belowLeadArticles = !fullPage
    ? Array.from({length:Math.min(2, Math.max(0, todayArticles.length - PREVIEW_STORY_COUNT))},(_,index)=>todayArticles[(rotationStart + PREVIEW_STORY_COUNT + index) % todayArticles.length])
    : [];

  const renderFullPageFeed = () => {
    const lead = filtered[0];
    const sideStories = filtered.slice(1, 5);
    const exploreStories = filtered.slice(5, 11);
    const moreStories = filtered.slice(11, 17);
    const listStories = filtered.slice(17, 27);

    return (
      <div className="bbc-page-feed">
        <section className="bbc-top-stories">
          <h3 className="bbc-band-title">TOP STORIES</h3>
          <div className="bbc-top-grid">
            <StoryCard article={lead} lead onSelect={setSelected}/>
            <div className="bbc-top-side">
              {sideStories.map(article=><StoryCard key={article.id} article={article} onSelect={setSelected}/>)}
            </div>
          </div>
        </section>

        {exploreStories.length > 0 && <section className="bbc-news-band">
          <h3 className="bbc-band-title">MORE TO EXPLORE</h3>
          <div className="bbc-story-grid">
            {exploreStories.map(article=><StoryCard key={article.id} article={article} onSelect={setSelected}/>)}
          </div>
        </section>}

        {moreStories.length > 0 && <section className="bbc-news-band">
          <h3 className="bbc-band-title">ALSO IN NEWS</h3>
          <div className="bbc-story-grid">
            {moreStories.map(article=><StoryCard key={article.id} article={article} onSelect={setSelected}/>)}
          </div>
        </section>}

        {listStories.length > 0 && <section className="bbc-list-band">
          <div>
            <h3 className="bbc-band-title">MOST READ</h3>
            <ol className="bbc-ranked-list">
              {listStories.slice(0, 5).map(article=><li key={article.id} onClick={()=>setSelected(article)}>{article.title}</li>)}
            </ol>
          </div>
          <div>
            <h3 className="bbc-band-title">LATEST</h3>
            <ol className="bbc-ranked-list">
              {listStories.slice(5, 10).map(article=><li key={article.id} onClick={()=>setSelected(article)}>{article.title}</li>)}
            </ol>
          </div>
        </section>}
      </div>
    );
  };

  return (
    <section className={`news-section ${fullPage ? "latest-stories-page" : "homepage-news"}`} id="news">
      <div className="section-header"><h2>{fullPage ? "Latest Stories" : s("news_title","Latest Stories")}</h2><span className="date-pill">{s("news_pill","FROM UGANDA")}</span></div>
      <p className="section-subtitle">{fullPage ? "All published stories from Base2 TV" : s("news_subtitle","Local first · Global when it matters")}</p>
      {fullPage && <button className="latest-back-btn" onClick={()=>{ window.location.hash=""; }}>Back to homepage</button>}
      <div className="news-filter-groups">
        <div className="news-filters" aria-label="News scope">
          {SCOPE_FILTERS.map(f=><button key={f} className={`news-filter-btn ${activeFilter===f?"active":""}`} onClick={()=>setActiveFilter(f)}>{f}</button>)}
        </div>
        <div className="news-sectors" aria-label="News sectors">
          {sectors.map(sector=><button key={sector} className={`news-sector-btn ${activeSector===sector?"active":""}`} onClick={()=>setActiveSector(sector)}>{sector}</button>)}
        </div>
      </div>
      {loading ? (
        <div className="section-empty"><div className="section-empty-spinner"/><p>Loading stories...</p></div>
      ) : error ? (
        <div className="section-empty"><Newspaper size={40} opacity={0.3}/><p>{error}</p></div>
      ) : (fullPage ? filtered.length===0 : todayArticles.length===0) ? (
        <div className="section-empty"><Newspaper size={40} opacity={0.3}/><p>{fullPage ? "No stories published yet." : "No stories published today."}</p><span>{fullPage ? "Check back soon — our newsdesk is working on it." : "Older stories are available on the Latest Stories page."}</span></div>
      ) : fullPage ? renderFullPageFeed() : (
        <div className="news-grid">
          <div className="homepage-lead-column">
            <StoryCard article={visibleArticles[0]} lead onSelect={setSelected}/>
            {belowLeadArticles.length > 0 && (
              <div className="homepage-below-lead-feed">
                <h3 className="homepage-feed-label">MORE FROM TODAY</h3>
                {belowLeadArticles.map(article=><StoryCard key={article.id} article={article} onSelect={setSelected}/>)}
              </div>
            )}
          </div>
          <div className="news-supporting-feed">
            {visibleArticles.slice(1).map(article=>(
              <StoryCard key={article.id} article={article} onSelect={setSelected}/>
            ))}
            {!fullPage && !loading && !error && todayArticles.length > 0 && (
              <div className="news-actions">
                <button className="news-view-more-btn" onClick={()=>{ window.location.hash="latest-stories" }}>
                  View more news
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      {selected&&<StoryModal article={selected} onClose={()=>setSelected(null)}/>}
    </section>
  );
};
export default NewsSection;

