import React, { useState, useEffect } from "react";
import { adminAPI } from "../../services/api";
import { Plus, Pencil, Trash2, Save, X, Clock } from "lucide-react";
import ImageUpload from "../ImageUpload.jsx";

const ALL_DAYS = [
  { key: "monday",    label: "Mon" },
  { key: "tuesday",   label: "Tue" },
  { key: "wednesday", label: "Wed" },
  { key: "thursday",  label: "Thu" },
  { key: "friday",    label: "Fri" },
  { key: "saturday",  label: "Sat" },
  { key: "sunday",    label: "Sun" },
  { key: "daily",     label: "Every Day" },
];

const EMPTY = {
  title: "",
  description: "",
  thumbnail: "",
  week_notes: "",
  times: ["06:00"],        // array of HH:MM strings
  days: ["daily"],         // array of selected day keys
};

const parseDays  = (str) => str ? str.split(",").map(s => s.trim()).filter(Boolean) : ["daily"];
const parseTimes = (airTime) => airTime ? [airTime.slice(0, 5)] : ["06:00"];

export default function AdminSchedule() {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [form,    setForm]    = useState(null);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState("");

  const load = async () => {
    setLoading(true);
    try { const d = await adminAPI.schedule.getAll(); setItems(d.schedule || []); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openNew  = () => setForm({ ...EMPTY, times: ["06:00"], days: ["daily"] });
  const openEdit = (row) => setForm({
    ...EMPTY,
    id: row.id,
    title: row.title || "",
    description: row.description || "",
    thumbnail: row.thumbnail || "",
    week_notes: row.week_notes || "",
    times: parseTimes(row.air_time),
    days:  parseDays(row.days || row.day_of_week || "daily"),
  });
  const closeForm = () => { setForm(null); setError(""); };

  // ── Time slot helpers ──────────────────────────────────────
  const addTime    = ()     => setForm(f => ({ ...f, times: [...f.times, "06:00"] }));
  const removeTime = (i)    => setForm(f => ({ ...f, times: f.times.filter((_, idx) => idx !== i) }));
  const setTime    = (i, v) => setForm(f => { const t = [...f.times]; t[i] = v; return { ...f, times: t }; });

  // ── Day checkbox helpers ───────────────────────────────────
  const toggleDay = (key) => setForm(f => {
    let days = [...f.days];
    if (key === "daily") {
      // "Every Day" is exclusive
      days = days.includes("daily") ? [] : ["daily"];
    } else {
      // Remove "daily" when specific days chosen
      days = days.filter(d => d !== "daily");
      if (days.includes(key)) days = days.filter(d => d !== key);
      else days.push(key);
      if (days.length === 0) days = ["daily"];
    }
    return { ...f, days };
  });

  // ── Save — creates one DB row per time slot ────────────────
  const save = async (e) => {
    e.preventDefault();
    setSaving(true); setError("");
    try {
      const { times, days, id, ...base } = form;
      const daysStr = days.join(",");

      if (id) {
        // Update: modify first time slot, add/remove extra rows
        await adminAPI.schedule.update(id, {
          ...base,
          air_time:    times[0] + ":00",
          day_of_week: days[0] || "daily",
          days:        daysStr,
        });
        // For extra times we create new rows (simplified approach)
        for (let i = 1; i < times.length; i++) {
          await adminAPI.schedule.create({
            ...base,
            air_time:    times[i] + ":00",
            day_of_week: days[0] || "daily",
            days:        daysStr,
          });
        }
      } else {
        // Create one row per time slot
        for (const t of times) {
          await adminAPI.schedule.create({
            ...base,
            air_time:    t + ":00",
            day_of_week: days[0] || "daily",
            days:        daysStr,
          });
        }
      }
      closeForm(); load();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const remove = async (id) => {
    if (!confirm("Delete this show slot?")) return;
    try { await adminAPI.schedule.remove(id); load(); }
    catch (e) { setError(e.message); }
  };

  const fmtDays = (row) => {
    const d = parseDays(row.days || row.day_of_week || "daily");
    if (d.includes("daily")) return "Every Day";
    return d.map(k => ALL_DAYS.find(x => x.key === k)?.label || k).join(", ");
  };

  return (
    <div className="adm-page">
      <div className="adm-page-header">
        <h2>TV Schedule</h2>
        <button className="adm-btn-primary" onClick={openNew}><Plus size={16}/> Add Programme</button>
      </div>

      {error && <div className="adm-error">{error}</div>}

      {/* ── Form modal ── */}
      {form && (
        <div className="adm-modal-overlay" onClick={closeForm}>
          <form className="adm-modal adm-modal-wide" onClick={e => e.stopPropagation()} onSubmit={save}>
            <div className="adm-modal-header">
              <h3>{form.id ? "Edit Programme" : "Add Programme"}</h3>
              <button type="button" onClick={closeForm}><X size={18}/></button>
            </div>

            <label>Programme Title *
              <input type="text" value={form.title}
                onChange={e => setForm(f => ({...f, title: e.target.value}))}
                required maxLength={120} placeholder="e.g. Morning Devotion" />
            </label>

            <label>Description
              <textarea rows={2} value={form.description}
                onChange={e => setForm(f => ({...f, description: e.target.value}))}
                placeholder="Short description of the programme" />
            </label>

            {/* ── Days selection ── */}
            <div>
              <span style={{fontSize:".78rem",fontWeight:600,color:"rgba(255,255,255,.5)",textTransform:"uppercase",letterSpacing:".6px"}}>
                Days this programme airs *
              </span>
              <div style={{display:"flex",flexWrap:"wrap",gap:8,marginTop:8}}>
                {ALL_DAYS.map(d => (
                  <label key={d.key} style={{
                    display:"flex",alignItems:"center",gap:6,
                    padding:"6px 12px",borderRadius:20,cursor:"pointer",
                    border:`1px solid ${form.days.includes(d.key) ? "#e50914" : "rgba(255,255,255,.1)"}`,
                    background: form.days.includes(d.key) ? "rgba(229,9,20,.15)" : "rgba(255,255,255,.04)",
                    color: form.days.includes(d.key) ? "#ff6b6b" : "rgba(255,255,255,.5)",
                    fontSize:".8rem", fontWeight:600, userSelect:"none",
                    transition:"all .15s",
                  }}>
                    <input
                      type="checkbox"
                      checked={form.days.includes(d.key)}
                      onChange={() => toggleDay(d.key)}
                      style={{display:"none"}}
                    />
                    {d.label}
                  </label>
                ))}
              </div>
              {form.days.length === 0 && (
                <span style={{fontSize:".72rem",color:"#ff5252",marginTop:4,display:"block"}}>Select at least one day</span>
              )}
            </div>

            {/* ── Time slots ── */}
            <div>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                <span style={{fontSize:".78rem",fontWeight:600,color:"rgba(255,255,255,.5)",textTransform:"uppercase",letterSpacing:".6px"}}>
                  Air Times (when it airs each day) *
                </span>
                <button type="button" className="adm-btn-ghost" onClick={addTime} style={{fontSize:".75rem",padding:"4px 10px"}}>
                  <Plus size={13}/> Add Time
                </button>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {form.times.map((t, i) => (
                  <div key={i} style={{display:"flex",alignItems:"center",gap:8}}>
                    <Clock size={14} style={{color:"rgba(255,255,255,.3)",flexShrink:0}} />
                    <input
                      type="time"
                      value={t}
                      onChange={e => setTime(i, e.target.value)}
                      required
                      style={{background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.1)",borderRadius:8,color:"white",padding:"8px 12px",fontSize:".9rem",outline:"none"}}
                    />
                    {form.times.length > 1 && (
                      <button type="button" className="adm-icon-btn danger" onClick={() => removeTime(i)}>
                        <X size={14}/>
                      </button>
                    )}
                    {i === 0 && <span style={{fontSize:".7rem",color:"rgba(255,255,255,.3)"}}>First airing</span>}
                    {i > 0  && <span style={{fontSize:".7rem",color:"rgba(255,255,255,.3)"}}>Repeat {i}</span>}
                  </div>
                ))}
              </div>
            </div>

            <label>Week Notes (optional)
              <input type="text" value={form.week_notes}
                onChange={e => setForm(f => ({...f, week_notes: e.target.value}))}
                maxLength={200} placeholder='e.g. "Live every Monday and Friday"' />
            </label>

            <ImageUpload
              label="Thumbnail (optional)"
              value={form.thumbnail}
              onChange={url => setForm(f => ({...f, thumbnail: url}))}
            />

            {error && <div className="adm-error">{error}</div>}
            <div className="adm-modal-actions">
              <button type="button" className="adm-btn-ghost" onClick={closeForm}>Cancel</button>
              <button type="submit" className="adm-btn-primary" disabled={saving || form.days.length === 0}>
                <Save size={15}/> {saving ? "Saving..." : "Save Programme"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Table ── */}
      {loading ? <div className="adm-loader">Loading...</div> : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Title</th>
                <th>Days</th>
                <th>Description</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map(row => (
                <tr key={row.id}>
                  <td><span className="adm-badge">{row.air_time?.slice(0,5)}</span></td>
                  <td className="adm-bold">{row.title}</td>
                  <td><span className="adm-badge blue" style={{textTransform:"capitalize"}}>{fmtDays(row)}</span></td>
                  <td className="adm-muted adm-truncate">{row.description}</td>
                  <td>
                    <div className="adm-row-actions">
                      <button className="adm-icon-btn" onClick={() => openEdit(row)}><Pencil size={14}/></button>
                      <button className="adm-icon-btn danger" onClick={() => remove(row.id)}><Trash2 size={14}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}