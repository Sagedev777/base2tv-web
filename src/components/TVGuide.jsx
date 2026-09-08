import React, { useEffect, useRef, useState } from "react";
import WeeklySchedule from "./WeeklySchedule";
import { Tv2 } from "lucide-react";
import { useSettings } from "../services/useSettings";
import { scheduleAPI } from "../services/api";
import "./TVGuide.css";

const computeState = (show) => {
  const now=new Date();
  const ugStr=new Intl.DateTimeFormat("en-US",{timeZone:"Africa/Kampala",hour:"numeric",minute:"numeric",hour12:false}).format(now);
  const [h,m]=ugStr.split(":").map(Number), nowMins=h*60+m;
  let startMins=0;
  if (show.air_time){ const [sh,sm]=show.air_time.split(":").map(Number); startMins=sh*60+sm; }
  const duration=show.duration_min??60, endMins=startMins+duration;
  let state="future",progress=0;
  if (nowMins>=startMins&&nowMins<endMins){ state="current"; progress=Math.round(((nowMins-startMins)/duration)*100); }
  else if (nowMins>=endMins){ state="past"; }
  const displayTime=(()=>{ const [sh,sm]=show.air_time.split(":"); const d=new Date(); d.setHours(+sh,+sm,0); return d.toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit",hour12:true}); })();
  return {...show,state,progress,time:displayTime,duration};
};

const TVGuide = () => {
  const s = useSettings();
  const scrollRef=useRef(null), rawRef=useRef([]);
  const [schedule,setSchedule]=useState([]), [loading,setLoading]=useState(true);
  const rebuild=()=>{ if(rawRef.current.length) setSchedule(rawRef.current.map(computeState)); };

  useEffect(()=>{
    scheduleAPI.getAll().then(d=>{ rawRef.current=d.schedule||[]; rebuild(); }).catch(()=>{ rawRef.current=[]; setSchedule([]); }).finally(()=>setLoading(false));
    const i=setInterval(rebuild,60000); return ()=>clearInterval(i);
  },[]);

  useEffect(()=>{
    if(!schedule.length||!scrollRef.current) return;
    setTimeout(()=>{
      const cur=scrollRef.current.querySelector(".show-block.current");
      if(cur){ const center=scrollRef.current.clientWidth/2; scrollRef.current.scrollTo({left:cur.offsetLeft+cur.offsetWidth/2-center,behavior:"smooth"}); }
    },500);
  },[schedule]);

  return (
    <section className="tv-guide-section" id="guide">
      <div className="section-header"><h2>{s("guide_title","TV Guide")}</h2><span className="date-pill">{s("guide_pill","Uganda Time (EAT)")}</span></div>
      <p className="section-subtitle">{s("guide_subtitle","Auto-syncs with live broadcast schedule")}</p>
      {loading ? (
        <div className="section-empty"><div className="section-empty-spinner"/><p>Loading schedule...</p></div>
      ) : schedule.length===0 ? (
        <div className="section-empty"><Tv2 size={40} opacity={0.3}/><p>No schedule published yet.</p><span>The programme guide will appear here once added by the admin.</span></div>
      ) : (
        <div className="guide-container" ref={scrollRef}>
          <div className="shows-track">
            {schedule.map(show=>(
              <div key={show.id} className={`show-block ${show.state}`}>
                <div className="show-thumbnail">
                  {show.thumbnail ? <img src={show.thumbnail} alt={show.title}/> : <div className="tvguide-placeholder"><Tv2 size={32} className="placeholder-icon"/></div>}
                  <div className="thumbnail-gradient"/>
                  {show.state==="current"&&<div className="live-pulse-container"><span className="live-pulse-ring"/><span className="live-tag">LIVE NOW</span></div>}
                  {show.state==="past"&&<div className="status-tag past-tag">ENDED</div>}
                  {show.state==="future"&&<div className="status-tag future-tag">UPCOMING</div>}
                </div>
                <div className="show-details">
                  <div className="show-time">{show.time} · {show.duration} min</div>
                  <div className="show-title">{show.title}</div>
                  <div className="show-desc">{show.description}</div>
                </div>
                {show.state==="current"&&<div className="progress-bar"><div className="progress-fill" style={{width:`${show.progress}%`}}/></div>}
              </div>
            ))}
          </div>
        </div>
      )}
      <WeeklySchedule />
    </section>
  );
};
export default TVGuide;

