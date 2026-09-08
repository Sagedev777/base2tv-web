import React, { useState, useEffect } from "react";
import { Clock, Tv2, PlayCircle } from "lucide-react";
import { videosAPI } from "../services/api";
import { useSettings } from "../services/useSettings";
import "./VODSection.css";

const categoryColors = {
  NEWS:          "linear-gradient(135deg,#1a1a2e 0%,#16213e 100%)",
  FEATURES:      "linear-gradient(135deg,#1a1a2e 0%,#0f3460 100%)",
  SPORTS:        "linear-gradient(135deg,#1a1a2e 0%,#2d1b00 100%)",
  ENTERTAINMENT: "linear-gradient(135deg,#1a1a2e 0%,#2d0036 100%)",
};
const CATS = ["ALL","NEWS","FEATURES","SPORTS","ENTERTAINMENT"];
const fmt = (sec) => { if (!sec) return null; const m=Math.floor(sec/60),s=sec%60; return `${m}:${String(s).padStart(2,"0")}`; };

const VODSection = () => {
  const s = useSettings();
  const [videos,    setVideos]    = useState([]);
  const [activeCat, setActiveCat] = useState("ALL");
  const [loading,   setLoading]   = useState(true);
  const [playing,   setPlaying]   = useState(null);

  useEffect(() => {
    videosAPI.getAll(24,0).then(d=>setVideos(d.videos||[])).catch(()=>setVideos([])).finally(()=>setLoading(false));
  }, []);

  const filtered = activeCat==="ALL" ? videos : videos.filter(v=>v.category===activeCat);

  return (
    <section className="vod-section" id="catchup">
      <div className="section-header"><h2>{s("vod_title","Catch Up on Base2 TV")}</h2><span className="date-pill">{s("vod_pill","Missed a show?")}</span></div>
      <div className="vod-categories">{CATS.map(c=><button key={c} className={`vod-cat-btn ${activeCat===c?"active":""}`} onClick={()=>setActiveCat(c)}>{c}</button>)}</div>
      {loading ? (
        <div className="section-empty"><div className="section-empty-spinner"/><p>Loading episodes...</p></div>
      ) : filtered.length===0 ? (
        <div className="section-empty"><Tv2 size={40} opacity={0.3}/><p>No episodes available yet.</p><span>Recorded episodes will appear here once uploaded by our team.</span></div>
      ) : (
        <div className="vod-grid">
          {filtered.map(item=>{
            const hasVideo=!!item.video_url, isPlaying=playing===item.id;
            return (
              <div key={item.id} className="vod-card glass-panel">
                {isPlaying&&hasVideo ? (
                  <div className="thumbnail-wrapper"><video src={item.video_url} controls autoPlay style={{width:"100%",height:"100%",objectFit:"cover",background:"#000"}} onEnded={()=>setPlaying(null)}/></div>
                ) : item.thumbnail ? (
                  <div className="thumbnail-wrapper" style={{cursor:hasVideo?"pointer":"default"}} onClick={()=>hasVideo&&setPlaying(item.id)}>
                    <img src={item.thumbnail} alt={item.title} className="vod-thumbnail" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                    {hasVideo&&<div className="play-overlay"><PlayCircle size={48}/></div>}
                  </div>
                ) : (
                  <div className="thumbnail-wrapper vod-placeholder-thumb" style={{background:categoryColors[item.category]||categoryColors.NEWS,cursor:hasVideo?"pointer":"default"}} onClick={()=>hasVideo&&setPlaying(item.id)}>
                    {hasVideo?<PlayCircle size={48} className="placeholder-icon"/>:<Tv2 size={40} className="placeholder-icon"/>}
                  </div>
                )}
                <div className="vod-info">
                  <div className="vod-meta">
                    <span className="vod-category">{item.category}</span>
                    {item.duration_sec ? <span className="vod-views"><Clock size={11}/> {fmt(item.duration_sec)}</span> : hasVideo&&<span className="vod-views"><Clock size={11}/> Watch now</span>}
                  </div>
                  <h3 className="vod-title">{item.title}</h3>
                  <p className="vod-time">{item.description}</p>
                  {item.views>0&&<span className="vod-views" style={{marginTop:4}}>{item.views.toLocaleString()} views</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
export default VODSection;

