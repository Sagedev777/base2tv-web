import React, { useState, useEffect } from "react";
import { settingsAPI } from "../../services/api";
import { Save, RefreshCw } from "lucide-react";

const SECTIONS = [
  { key:"news",     label:"News Section" },
  { key:"guide",    label:"TV Guide" },
  { key:"featured", label:"Featured" },
  { key:"vod",      label:"VOD / Catch-Up" },
  { key:"contact",  label:"Contact Section" },
];

export default function AdminSettings() {
  const [rows,    setRows]    = useState([]);
  const [saving,  setSaving]  = useState({});
  const [values,  setValues]  = useState({});
  const [ok,      setOk]      = useState({});
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const d = await settingsAPI.getAll();
      setRows(d.rows || []);
      const v = {};
      (d.rows||[]).forEach(r => { v[r.key] = r.value; });
      setValues(v);
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const save = async (key) => {
    setSaving(s => ({...s, [key]: true}));
    try {
      await settingsAPI.update(key, values[key] || "");
      setOk(o => ({...o, [key]: true}));
      setTimeout(() => setOk(o => ({...o, [key]: false})), 2000);
    } catch(e) { setError(e.message); }
    finally { setSaving(s => ({...s, [key]: false})); }
  };

  const grouped = SECTIONS.map(sec => ({
    ...sec,
    rows: rows.filter(r => r.section === sec.key),
  }));

  return (
    <div className="adm-page">
      <div className="adm-page-header">
        <h2>Site Text &amp; Labels</h2>
        <button className="adm-btn-ghost" onClick={load}><RefreshCw size={14}/></button>
      </div>
      <p style={{color:"var(--adm-muted)",fontSize:".85rem",marginTop:-8}}>
        Edit the headings, subtitles and labels shown on the public website.
      </p>

      {error && <div className="adm-error">{error}</div>}
      {loading ? <div className="adm-loader">Loading...</div> : (
        <div style={{display:"flex",flexDirection:"column",gap:32}}>
          {grouped.map(sec => (
            <div key={sec.key}>
              <h3 style={{fontSize:".82rem",textTransform:"uppercase",letterSpacing:"1px",color:"var(--adm-muted)",marginBottom:12}}>{sec.label}</h3>
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {sec.rows.map(row => (
                  <div key={row.key} style={{display:"flex",gap:10,alignItems:"flex-start"}}>
                    <div style={{flex:1}}>
                      <label style={{display:"block",fontSize:".72rem",color:"var(--adm-muted)",marginBottom:4}}>{row.label}</label>
                      <input
                        style={{width:"100%",background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.1)",borderRadius:8,color:"white",padding:"9px 12px",fontSize:".9rem",outline:"none",fontFamily:"inherit"}}
                        value={values[row.key] ?? row.value}
                        onChange={e => setValues(v => ({...v, [row.key]: e.target.value}))}
                        onFocus={e => e.target.style.borderColor="#e50914"}
                        onBlur={e => e.target.style.borderColor="rgba(255,255,255,.1)"}
                      />
                    </div>
                    <button
                      className="adm-btn-primary"
                      style={{marginTop:22,flexShrink:0}}
                      onClick={() => save(row.key)}
                      disabled={saving[row.key]}
                    >
                      {ok[row.key] ? "Saved ✓" : saving[row.key] ? "..." : <><Save size={14}/> Save</>}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
