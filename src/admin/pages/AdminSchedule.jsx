import React, { useState, useEffect } from "react";
import { adminAPI } from "../../services/api";
import { Plus, Pencil, Trash2, Save, X, Clock, AlertCircle } from "lucide-react";
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
  title: "", description: "", thumbnail: "", week_notes: "",
  daily: false,
  dailyStart: "06:00",
  dailyEnd:   "07:00",
  daySlots: WEEK_DAYS.reduce((acc, d) => {
    acc[d.key] = { enabled:false, start:"06:00", end:"07:00" };
    return acc;
  }, {}),
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
  const [items,   setItems]   = useState([]);
  const [grouped, setGrouped] = useState({});
  const [loading, setLoading] = useState(true);
  const [form,    setForm]    = useState(null);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const d = await adminAPI.schedule.getAll();
      // /schedule/weekly returns { grouped: {monday:[...], tuesday:[...], ...} }
      // Flatten all shows into a unique list (by id) so items has every show
      let rows = [];
      if (d.grouped) {
        const seen = new Set();
        Object.values(d.grouped).forEach(arr => {
          arr.forEach(r => { if (!seen.has(r.id)) { seen.add(r.id); rows.push(r); } });
        });
      } else {
        rows = d.schedule || [];
      }
      setItems(rows);
      const g = {};
      rows.forEach(r => { if (!g[r.title]) g[r.title]=[]; g[r.title].push(r); });
      setGrouped(g);
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openNew = () => setForm({ ...makeEmpty(), _editIds:[] });

  const openEdit = (row) => {
    const sameTitle = items.filter(r => r.title === row.title);
    const f = makeEmpty();
    f.title = row.title||""; f.description = row.description||"";
    f.thumbnail = row.thumbnail||""; f.week_notes = row.week_notes||"";
    f._editIds = sameTitle.map(r => r.id);
    sameTitle.forEach(r => {
      const daysStr = r.days || r.day_of_week || "daily";
      const dayList = daysStr.split(",").map(x => x.trim());

      // air_time and end_time come as "HH:MM:SS" from MySQL — slice to "HH:MM"
      const st = (r.air_time  || "06:00:00").slice(0,5);
      // end_time might be null if not set — calculate from duration_min as fallback
      let en = "07:00:00";
      if (r.end_time) {
        en = r.end_time.slice(0,5);
      } else if (r.duration_min) {
        // Calculate from start + duration
        const parts = st.split(":").map(Number);
        const startMins = parts[0]*60 + parts[1];
        const endMins   = startMins + r.duration_min;
        en = String(Math.floor(endMins/60)).padStart(2,"0") + ":" + String(endMins%60).padStart(2,"0");
      }

      if (dayList.includes("daily")) {
        f.daily = true; f.dailyStart = st; f.dailyEnd = en;
      } else {
        dayList.forEach(day => {
          if (f.daySlots[day]) {
            f.daySlots[day].enabled = true;
            f.daySlots[day].start   = st;
            f.daySlots[day].end     = en;
          }
        });
      }
    });
    setForm(f);
  };

  const closeForm = () => { setForm(null); setError(""); };

  const setSlot = (day, key, value) => setForm(f => ({
    ...f, daySlots: { ...f.daySlots, [day]: { ...f.daySlots[day], [key]: value } }
  }));

  // Client-side validation: end must be after start
  const validateTimes = () => {
    if (form.daily) {
      if (toMin(form.dailyEnd) <= toMin(form.dailyStart)) {
        return "End time must be after start time for Every Day setting.";
      }
    } else {
      for (const d of WEEK_DAYS) {
        const s = form.daySlots[d.key];
        if (!s.enabled) continue;
        if (toMin(s.end) <= toMin(s.start)) {
          return `End time must be after start time for ${d.label}.`;
        }
      }
    }
    return null;
  };

  const save = async (e) => {
    e.preventDefault();
    const anySelected = form.daily || WEEK_DAYS.some(d => form.daySlots[d.key].enabled);
    if (!anySelected) { setError("Select at least one day."); return; }
    const timeErr = validateTimes();
    if (timeErr) { setError(timeErr); return; }

    setSaving(true); setError("");
    try {
      const base = { title:form.title, description:form.description, thumbnail:form.thumbnail, week_notes:form.week_notes };

      if (form._editIds?.length) {
        // EDIT MODE: update existing rows in place to preserve chat message links
        // Get list of new slots to save
        const newSlots = [];
        if (form.daily) {
          newSlots.push({ air_time: form.dailyStart+":00", end_time: form.dailyEnd+":00", day_of_week:"daily", days:"daily", duration_min: toMin(form.dailyEnd)-toMin(form.dailyStart) });
        } else {
          for (const d of WEEK_DAYS) {
            const s = form.daySlots[d.key];
            if (!s.enabled) continue;
            newSlots.push({ air_time: s.start+":00", end_time: s.end+":00", day_of_week: d.key, days: d.key, duration_min: toMin(s.end)-toMin(s.start) });
          }
        }
        // Update existing rows, delete extras, create new ones
        for (let i = 0; i < Math.max(form._editIds.length, newSlots.length); i++) {
          if (i < newSlots.length && i < form._editIds.length) {
            // Update existing row — PRESERVES the show ID so chat messages stay linked
            await adminAPI.schedule.update(form._editIds[i], { ...base, ...newSlots[i] });
          } else if (i < form._editIds.length) {
            // Extra old row — delete it
            await adminAPI.schedule.remove(form._editIds[i]).catch(()=>{});
          } else {
            // New slot — create it
            await adminAPI.schedule.create({ ...base, ...newSlots[i] });
          }
        }
      } else {
        // CREATE MODE
        if (form.daily) {
          await adminAPI.schedule.create({ ...base, air_time: form.dailyStart+":00", end_time: form.dailyEnd+":00", day_of_week:"daily", days:"daily", duration_min: toMin(form.dailyEnd)-toMin(form.dailyStart) });
        } else {
          for (const d of WEEK_DAYS) {
            const s = form.daySlots[d.key];
            if (!s.enabled) continue;
            await adminAPI.schedule.create({ ...base, air_time: s.start+":00", end_time: s.end+":00", day_of_week: d.key, days: d.key, duration_min: toMin(s.end)-toMin(s.start) });
          }
        }
      }
      closeForm(); load();
    } catch(err) {
      // Show the conflict error prominently
      setError(err.message);
    } finally { setSaving(false); }
  };

  const removeGroup = async (title) => {
    if (!confirm(`Delete all slots for "${title}"?`)) return;
    try {
      for (const r of items.filter(r=>r.title===title)) await adminAPI.schedule.remove(r.id);
      load();
    } catch(e) { setError(e.message); }
  };

  const fmtDayKey = (k) => WEEK_DAYS.find(d=>d.key===k)?.label || k;

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
        <h2>TV Schedule</h2>
        <button className="adm-btn-primary" onClick={openNew}><Plus size={16}/> Add Programme</button>
      </div>

      {error && (
        <div className="adm-error" style={{display:"flex",alignItems:"flex-start",gap:8}}>
          <AlertCircle size={16} style={{flexShrink:0,marginTop:2}}/>
          {error}
        </div>
      )}

      {form && (
        <div className="adm-modal-overlay" onClick={closeForm}>
          <form className="adm-modal adm-modal-wide" onClick={e=>e.stopPropagation()} onSubmit={save}
            style={{maxHeight:"90vh",overflowY:"auto"}}>
            <div className="adm-modal-header">
              <h3>{form._editIds?.length ? "Edit Programme" : "Add Programme"}</h3>
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

            {/* Every Day toggle */}
            <div style={{background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.08)",borderRadius:10,padding:14}}>
              <label style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",marginBottom:form.daily?14:0}}>
                <div style={{width:40,height:22,borderRadius:11,position:"relative",
                  background:form.daily?"#e50914":"rgba(255,255,255,.15)",transition:"background .2s",flexShrink:0}}
                  onClick={()=>setForm(f=>({...f,daily:!f.daily}))}>
                  <div style={{position:"absolute",top:2,left:form.daily?20:2,width:18,height:18,
                    borderRadius:"50%",background:"white",transition:"left .2s"}}/>
                </div>
                <span style={{fontWeight:700,color:form.daily?"#ff6b6b":"rgba(255,255,255,.6)",fontSize:".88rem"}}>
                  Airs Every Day (same schedule daily)
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

            {/* Per-day slots */}
            {!form.daily && (
              <div>
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
                          {/* Checkbox */}
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

                          {/* Time inputs */}
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

            <label>Week Notes (optional)
              <input type="text" value={form.week_notes}
                onChange={e=>setForm(f=>({...f,week_notes:e.target.value}))}
                maxLength={200} placeholder='e.g. "Live Monday to Friday"'/>
            </label>

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

      {/* Table */}
      {loading ? <div className="adm-loader">Loading...</div> : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead><tr><th>Programme</th><th>Schedule</th><th>Description</th><th></th></tr></thead>
            <tbody>
              {Object.entries(grouped).map(([title, rows]) => {
                const isDaily = rows.some(r=>(r.days||r.day_of_week||"")===("daily"));
                return (
                  <tr key={title}>
                    <td className="adm-bold">{title}</td>
                    <td>
                      {isDaily ? (
                        <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
                          <span className="adm-badge green">Every Day</span>
                          <span className="adm-badge">{fmtTime(rows[0]?.air_time)} — {fmtTime(rows[0]?.end_time)}</span>
                        </div>
                      ) : (
                        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                          {rows.map(r=>(
                            <span key={r.id} className="adm-badge blue" style={{fontSize:".65rem"}}>
                              {fmtDayKey(r.day_of_week)} {fmtTime(r.air_time)}–{fmtTime(r.end_time)}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="adm-muted adm-truncate" style={{maxWidth:200}}>{rows[0]?.description}</td>
                    <td>
                      <div className="adm-row-actions">
                        <button className="adm-icon-btn" onClick={()=>openEdit(rows[0])} title="Edit"><Pencil size={14}/></button>
                        <button className="adm-icon-btn danger" onClick={()=>removeGroup(title)} title="Delete all"><Trash2 size={14}/></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}