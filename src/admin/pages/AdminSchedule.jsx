import React, { useState, useEffect } from "react";
import { adminAPI } from "../../services/api";
import { Plus, Pencil, Trash2, Save, X, Clock, AlertCircle, AlertTriangle } from "lucide-react";
import ImageUpload from "../ImageUpload.jsx";

const WEEK_DAYS = [
  { key:"monday",    label:"Monday"    },
  { key:"tuesday",   label:"Tuesday"   },
  { key:"wednesday", label:"Wednesday" },
  { key:"thursday",  label:"Thursday"  },
  { key:"friday",    label:"Friday"    },
  { key:"saturday",  label:"Saturday"  },
  { key:"sunday",    label:"Sunday"    },
];

const makeEmpty = () => ({
  id: null,
  title: "", description: "", thumbnail: "", week_notes: "",
  // Create mode
  daily: false,
  dailyStart: "06:00",
  dailyEnd:   "07:00",
  daySlots: WEEK_DAYS.reduce((acc, d) => {
    acc[d.key] = { enabled:false, start:"06:00", end:"07:00" };
    return acc;
  }, {}),
  // Edit mode
  originalDays: "monday",
  editStart: "06:00",
  editEnd: "07:00"
});

const fmtTime = (t) => {
  if (!t) return "";
  const p = (t+"").split(":");
  const d = new Date(); d.setHours(parseInt(p[0])||0, parseInt(p[1])||0, 0);
  return d.toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit",hour12:true});
};

const toMin = (t) => {
  if (!t) return 0;
  const p = (t+"").split(":").map(Number);
  return (p[0]||0)*60 + (p[1]||0);
};

export default function AdminSchedule() {
  const [scheduleData, setScheduleData] = useState({});
  const [activeTab, setActiveTab] = useState("monday");
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const d = await adminAPI.schedule.getAll(); 
      const grouped = d.grouped || {};
      const fullDays = {};
      
      WEEK_DAYS.forEach(day => {
        // Merge daily items and this day's items
        const merged = [...(grouped[day.key] || []), ...(grouped.daily || [])];
        merged.sort((a,b) => toMin(a.air_time) - toMin(b.air_time));
        
        // Remove exact duplicates
        const unique = [];
        const seen = new Set();
        merged.forEach(item => {
          if (!seen.has(item.id)) {
            seen.add(item.id);
            unique.push(item);
          }
        });
        fullDays[day.key] = unique;
      });
      
      setScheduleData(fullDays);
      if (!activeTab) setActiveTab(d.today || "monday");
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openNew = () => setForm(makeEmpty());

  const openEdit = (row) => {
    const f = makeEmpty();
    f.id = row.id;
    f.title = row.title || ""; 
    f.description = row.description || "";
    f.thumbnail = row.thumbnail || ""; 
    f.week_notes = row.week_notes || "";
    f.originalDays = row.days || row.day_of_week || "daily";
    
    const st = (row.air_time || "06:00:00").slice(0,5);
    let en = "07:00:00";
    if (row.end_time) {
      en = row.end_time.slice(0,5);
    } else if (row.duration_min) {
      const parts = st.split(":").map(Number);
      const endMins = (parts[0]*60 + parts[1]) + row.duration_min;
      en = String(Math.floor(endMins/60)).padStart(2,"0") + ":" + String(endMins%60).padStart(2,"0");
    }
    
    f.editStart = st;
    f.editEnd = en;
    setForm(f);
  };

  const closeForm = () => { setForm(null); setError(""); };

  const setSlot = (day, key, value) => setForm(f => ({
    ...f, daySlots: { ...f.daySlots, [day]: { ...f.daySlots[day], [key]: value } }
  }));

  const validateTimes = () => {
    if (form.id) {
      if (toMin(form.editEnd) <= toMin(form.editStart)) return "End time must be after start time.";
    } else {
      if (form.daily) {
        if (toMin(form.dailyEnd) <= toMin(form.dailyStart)) return "End time must be after start time for Every Day setting.";
      } else {
        for (const d of WEEK_DAYS) {
          const s = form.daySlots[d.key];
          if (!s.enabled) continue;
          if (toMin(s.end) <= toMin(s.start)) return `End time must be after start time for ${d.label}.`;
        }
      }
    }
    return null;
  };

  const save = async (e) => {
    e.preventDefault();
    if (!form.id) {
      const anySelected = form.daily || WEEK_DAYS.some(d => form.daySlots[d.key].enabled);
      if (!anySelected) { setError("Select at least one day."); return; }
    }
    const timeErr = validateTimes();
    if (timeErr) { setError(timeErr); return; }

    setSaving(true); setError("");
    try {
      const base = { title:form.title, description:form.description, thumbnail:form.thumbnail, week_notes:form.week_notes };

      if (form.id) {
        // EDIT MODE
        await adminAPI.schedule.update(form.id, {
          ...base,
          air_time: form.editStart+":00", 
          end_time: form.editEnd+":00",
          day_of_week: form.originalDays, 
          days: form.originalDays
        });
      } else {
        // CREATE MODE
        if (form.daily) {
          // Creates independent records for each day of the week
          for (const d of WEEK_DAYS) {
            await adminAPI.schedule.create({ 
               ...base, 
               air_time: form.dailyStart+":00", 
               end_time: form.dailyEnd+":00", 
               day_of_week: d.key, 
               days: d.key 
            });
          }
        } else {
          for (const d of WEEK_DAYS) {
            const s = form.daySlots[d.key];
            if (!s.enabled) continue;
            await adminAPI.schedule.create({ 
               ...base, 
               air_time: s.start+":00", 
               end_time: s.end+":00", 
               day_of_week: d.key, 
               days: d.key 
            });
          }
        }
      }
      closeForm(); load();
    } catch(err) {
      setError(err.message);
    } finally { setSaving(false); }
  };

  const removeSlot = async (id) => {
    if (!confirm(`Delete this programme slot?`)) return;
    try {
      await adminAPI.schedule.remove(id);
      load();
    } catch(e) { setError(e.message); }
  };

  const TimeRow = ({ label, startVal, endVal, onStartChange, onEndChange, disabled=false }) => (
    <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
      <span style={{fontSize:".75rem",color:"rgba(255,255,255,.4)",minWidth:30}}>{label}</span>
      <div style={{display:"flex",alignItems:"center",gap:6}}>
        <Clock size={12} style={{color:"rgba(255,255,255,.3)"}}/>
        <input type="time" value={startVal} onChange={e=>onStartChange(e.target.value)} disabled={disabled}
          style={{background:disabled?"rgba(255,255,255,.02)":"rgba(255,255,255,.06)",
            border:"1px solid rgba(255,255,255,.1)",borderRadius:7,color:disabled?"rgba(255,255,255,.25)":"white",
            padding:"6px 10px",fontSize:".85rem",outline:"none",cursor:disabled?"not-allowed":"text"}}/>
        <span style={{fontSize:".75rem",color:"rgba(255,255,255,.3)"}}>to</span>
        <input type="time" value={endVal} onChange={e=>onEndChange(e.target.value)} disabled={disabled}
          style={{background:disabled?"rgba(255,255,255,.02)":"rgba(255,255,255,.06)",
            border:`1px solid ${!disabled && toMin(endVal)<=toMin(startVal) ? "rgba(229,9,20,.5)" : "rgba(255,255,255,.1)"}`,
            borderRadius:7,color:disabled?"rgba(255,255,255,.25)":"white",
            padding:"6px 10px",fontSize:".85rem",outline:"none",cursor:disabled?"not-allowed":"text"}}/>
        {!disabled && (
          <span style={{fontSize:".7rem",color:"rgba(255,255,255,.3)"}}>
            {toMin(endVal)>toMin(startVal) ? `${toMin(endVal)-toMin(startVal)} min` : ""}
          </span>
        )}
      </div>
    </div>
  );

  return (
    <div className="adm-page">
      <div className="adm-page-header">
        <div>
          <h2>TV Schedule</h2>
          <p className="adm-subtitle">Chronological broadcast schedule by day.</p>
        </div>
        <button className="adm-btn-primary" onClick={openNew}><Plus size={16}/> Add Programme</button>
      </div>

      {error && !form && (
        <div className="adm-error" style={{display:"flex",alignItems:"flex-start",gap:8}}>
          <AlertCircle size={16} style={{flexShrink:0,marginTop:2}}/>
          {error}
        </div>
      )}

      {/* Tabs */}
      <div style={{display:"flex", gap:10, marginBottom:20, overflowX:"auto", paddingBottom:5}}>
        {WEEK_DAYS.map(d => (
          <button 
            key={d.key} 
            onClick={() => setActiveTab(d.key)}
            style={{
              padding: "10px 18px",
              borderRadius: "8px",
              border: activeTab === d.key ? "1px solid #e50914" : "1px solid rgba(255,255,255,0.1)",
              background: activeTab === d.key ? "rgba(229,9,20,0.1)" : "rgba(255,255,255,0.03)",
              color: activeTab === d.key ? "#ff6b6b" : "white",
              fontWeight: 600,
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "all 0.2s"
            }}
          >
            {d.label}
          </button>
        ))}
      </div>

      {form && (
        <div className="adm-modal-overlay" onClick={closeForm}>
          <form className="adm-modal adm-modal-wide" onClick={e=>e.stopPropagation()} onSubmit={save}
            style={{maxHeight:"90vh",overflowY:"auto"}}>
            <div className="adm-modal-header">
              <h3>{form.id ? "Edit Programme Slot" : "Add New Programme"}</h3>
              <button type="button" onClick={closeForm}><X size={18}/></button>
            </div>

            <label>Programme Title *
              <input type="text" value={form.title}
                onChange={e=>setForm(f=>({...f,title:e.target.value}))}
                required maxLength={120} placeholder="e.g. Morning Devotion"/>
            </label>

            <label>Description
              <textarea rows={2} value={form.description}
                onChange={e=>setForm(f=>({...f,description:e.target.value}))}
                placeholder="Short description"/>
            </label>

            {form.id ? (
              // EDIT MODE UI
              <div style={{background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.08)",borderRadius:10,padding:14,marginBottom:15}}>
                 <div style={{fontWeight:600, marginBottom:10, color:"rgba(255,255,255,0.6)"}}>Time Slot Details</div>
                 <TimeRow
                    label="Time:"
                    startVal={form.editStart}
                    endVal={form.editEnd}
                    onStartChange={v=>setForm(f=>({...f,editStart:v}))}
                    onEndChange={v=>setForm(f=>({...f,editEnd:v}))}
                  />
                  {(form.originalDays === "daily" || form.originalDays.split(",").length > 1) && (
                    <div style={{marginTop:12, fontSize:"0.85rem", color:"#ff9800", display:"flex", gap:6, alignItems:"flex-start"}}>
                      <AlertTriangle size={14} style={{flexShrink:0, marginTop:2}}/>
                      <div>This is a legacy multi-day series. Editing this will modify it across all its days. To make it independent, please delete it and recreate it using the new system.</div>
                    </div>
                  )}
              </div>
            ) : (
              // CREATE MODE UI
              <>
                <div style={{background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.08)",borderRadius:10,padding:14, marginBottom:15}}>
                  <label style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",marginBottom:form.daily?14:0}}>
                    <div style={{width:40,height:22,borderRadius:11,position:"relative",
                      background:form.daily?"#e50914":"rgba(255,255,255,.15)",transition:"background .2s",flexShrink:0}}
                      onClick={()=>setForm(f=>({...f,daily:!f.daily}))}>
                      <div style={{position:"absolute",top:2,left:form.daily?20:2,width:18,height:18,
                        borderRadius:"50%",background:"white",transition:"left .2s"}}/>
                    </div>
                    <span style={{fontWeight:700,color:form.daily?"#ff6b6b":"rgba(255,255,255,.6)",fontSize:".88rem"}}>
                      Airs Every Day (creates 7 independent slots)
                    </span>
                  </label>

                  {form.daily && (
                    <div style={{marginLeft:50}}>
                      <TimeRow
                        label="Time:"
                        startVal={form.dailyStart}
                        endVal={form.dailyEnd}
                        onStartChange={v=>setForm(f=>({...f,dailyStart:v}))}
                        onEndChange={v=>setForm(f=>({...f,dailyEnd:v}))}
                      />
                    </div>
                  )}
                </div>

                {!form.daily && (
                  <div style={{marginBottom:15}}>
                    <div style={{fontSize:".78rem",fontWeight:600,color:"rgba(255,255,255,.5)",
                      textTransform:"uppercase",letterSpacing:".6px",marginBottom:10}}>
                      Select Days &amp; Set Start / End Times
                    </div>
                    <div style={{display:"flex",flexDirection:"column",gap:8}}>
                      {WEEK_DAYS.map(d => {
                        const slot = form.daySlots[d.key];
                        return (
                          <div key={d.key} style={{
                            padding:"10px 14px",borderRadius:10,
                            border:`1px solid ${slot.enabled?"rgba(229,9,20,.3)":"rgba(255,255,255,.07)"}`,
                            background:slot.enabled?"rgba(229,9,20,.05)":"rgba(255,255,255,.02)",
                            transition:"all .15s",
                          }}>
                            <div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
                              <label style={{display:"flex",alignItems:"center",gap:7,cursor:"pointer",minWidth:110}}>
                                <div style={{width:18,height:18,borderRadius:4,flexShrink:0,
                                  border:`2px solid ${slot.enabled?"#e50914":"rgba(255,255,255,.2)"}`,
                                  background:slot.enabled?"#e50914":"transparent",
                                  display:"flex",alignItems:"center",justifyContent:"center"}}
                                  onClick={()=>setSlot(d.key,"enabled",!slot.enabled)}>
                                  {slot.enabled&&<span style={{color:"white",fontSize:11,fontWeight:900}}>✓</span>}
                                </div>
                                <span style={{fontWeight:700,fontSize:".85rem",
                                  color:slot.enabled?"white":"rgba(255,255,255,.4)"}}>
                                  {d.label}
                                </span>
                              </label>

                              <TimeRow
                                label=""
                                startVal={slot.start}
                                endVal={slot.end}
                                onStartChange={v=>setSlot(d.key,"start",v)}
                                onEndChange={v=>setSlot(d.key,"end",v)}
                                disabled={!slot.enabled}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}

            <ImageUpload
              label="Thumbnail (optional)"
              value={form.thumbnail}
              onChange={url=>setForm(f=>({...f,thumbnail:url}))}
            />

            {error && (
              <div className="adm-error" style={{display:"flex",alignItems:"flex-start",gap:8}}>
                <AlertCircle size={14} style={{flexShrink:0,marginTop:2}}/>{error}
              </div>
            )}

            <div className="adm-modal-actions">
              <button type="button" className="adm-btn-ghost" onClick={closeForm}>Cancel</button>
              <button type="submit" className="adm-btn-primary" disabled={saving}>
                <Save size={15}/> {saving?"Saving...":"Save Programme"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      {loading ? <div className="adm-loader">Loading...</div> : (
        <div className="adm-timeline">
          {!scheduleData[activeTab] || scheduleData[activeTab].length === 0 ? (
            <div style={{padding:40, textAlign:"center", background:"rgba(255,255,255,0.02)", borderRadius:10, border:"1px dashed rgba(255,255,255,0.1)"}}>
              <p style={{color:"rgba(255,255,255,0.4)", fontSize:"1.1rem", marginBottom:15}}>No programs scheduled for {WEEK_DAYS.find(d=>d.key===activeTab)?.label}.</p>
              <button className="adm-btn-primary" onClick={openNew}><Plus size={16}/> Add Programme</button>
            </div>
          ) : (
            <div style={{display:"flex", flexDirection:"column", gap:10}}>
              {scheduleData[activeTab].map((row, i) => {
                const nextRow = scheduleData[activeTab][i + 1];
                
                // Calculate display end time for legacy rows missing end_time
                let displayEnd = row.end_time;
                if (!displayEnd && row.duration_min) {
                  const parts = (row.air_time || "00:00").split(":").map(Number);
                  const endMins = (parts[0]*60 + parts[1]) + row.duration_min;
                  displayEnd = String(Math.floor(endMins/60)).padStart(2,"0") + ":" + String(endMins%60).padStart(2,"0");
                }

                let gapMins = 0;
                if (nextRow) {
                  gapMins = toMin(nextRow.air_time) - toMin(displayEnd);
                }

                return (
                  <React.Fragment key={row.id}>
                    <div style={{
                      display:"flex", alignItems:"center", gap:20, padding:"16px",
                      background:"rgba(255,255,255,0.03)", borderRadius:10, border:"1px solid rgba(255,255,255,0.05)",
                      position:"relative"
                    }}>
                      {/* Left: Time Block */}
                      <div style={{minWidth:140, borderRight:"1px solid rgba(255,255,255,0.1)", paddingRight:15}}>
                        <div style={{fontSize:"1.2rem", fontWeight:700, color:"#e50914"}}>{fmtTime(row.air_time)}</div>
                        <div style={{fontSize:"0.85rem", color:"rgba(255,255,255,0.5)", marginTop:4}}>to {fmtTime(displayEnd)}</div>
                        <div style={{fontSize:"0.75rem", color:"rgba(255,255,255,0.25)", marginTop:6}}>{row.duration_min} mins</div>
                      </div>
                      
                      {/* Thumbnail */}
                      {row.thumbnail && (
                        <div style={{width:80, height:60, borderRadius:6, overflow:"hidden", flexShrink:0}}>
                          <img src={row.thumbnail} alt="" style={{width:"100%", height:"100%", objectFit:"cover"}} />
                        </div>
                      )}

                      {/* Info */}
                      <div style={{flex:1}}>
                        <div style={{fontSize:"1.15rem", fontWeight:600}}>{row.title}</div>
                        <div style={{fontSize:"0.9rem", color:"rgba(255,255,255,0.5)", marginTop:6}}>{row.description}</div>
                        {(row.days==="daily" || row.day_of_week==="daily") && (
                          <span className="adm-badge green" style={{marginTop:8, display:"inline-block", fontSize:"0.65rem"}}>Legacy Daily Series</span>
                        )}
                      </div>

                      {/* Actions */}
                      <div style={{display:"flex", gap:8}}>
                        <button className="adm-icon-btn" onClick={() => openEdit(row)} title="Edit Slot"><Pencil size={16}/></button>
                        <button className="adm-icon-btn danger" onClick={() => removeSlot(row.id)} title="Delete Slot"><Trash2 size={16}/></button>
                      </div>
                    </div>

                    {/* Show gap warning if there is a gap or overlap */}
                    {gapMins > 0 && (
                      <div style={{textAlign:"center", color:"rgba(255,255,255,0.3)", fontSize:"0.8rem", padding:"4px 0"}}>
                        ↓ {gapMins} minutes gap ↓
                      </div>
                    )}
                    {gapMins < 0 && (
                      <div style={{textAlign:"center", color:"#e50914", fontSize:"0.8rem", padding:"4px 0", fontWeight:600}}>
                        ⚠️ OVERLAP DETECTED ({Math.abs(gapMins)} mins) ⚠️
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}