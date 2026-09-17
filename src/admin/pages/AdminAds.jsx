import React, { useState, useEffect, useRef } from "react";
import { adsAPI, uploadAPI } from "../../services/api";
import { Plus, Pencil, Trash2, Save, X, Upload } from "lucide-react";
import ImageUpload from "../ImageUpload";

const POSITIONS = ["sidebar","below-chat","banner","all"];
const EMPTY = { title:"", media_url:"", media_type:"image", link_url:"", duration_sec:10, position:"sidebar", start_date:"", end_date:"", is_active:1, sort_order:0 };

export default function AdminAds() {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [form,    setForm]    = useState(null);
  const [saving,  setSaving]  = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error,   setError]   = useState("");


  const load = async () => {
    setLoading(true);
    try { const d = await adsAPI.getAll(); setItems(d.ads || []); }
    catch(e) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openNew  = ()    => setForm({ ...EMPTY });
  const openEdit = (row) => setForm({ ...row, start_date: row.start_date?.slice(0,16)||"", end_date: row.end_date?.slice(0,16)||"" });
  const closeForm = ()   => { setForm(null); setError(""); };
  const set = (k,v) => setForm(f => ({...f,[k]:v}));

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const data = await uploadAPI.ad(file);
      const isVideo = file.type.startsWith("video/");
      set("media_url", data.url);
      set("media_type", isVideo ? "video" : "image");
    } catch(err) { setError(err.message); }
    finally { setUploading(false); }
  };

  const save = async (e) => {
    e.preventDefault(); setSaving(true); setError("");
    try {
      const payload = { ...form, start_date: form.start_date || null, end_date: form.end_date || null };
      if (form.id) await adsAPI.update(form.id, payload);
      else         await adsAPI.create(payload);
      closeForm(); load();
    } catch(err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const remove = async (id) => {
    if (!confirm("Delete this ad?")) return;
    try { await adsAPI.remove(id); load(); }
    catch(e) { setError(e.message); }
  };

  return (
    <div className="adm-page">
      <div className="adm-page-header">
        <h2>Adverts <span className="adm-count">{items.length}</span></h2>
        <button className="adm-btn-primary" onClick={openNew}><Plus size={16}/> Add Ad</button>
      </div>

      {error && <div className="adm-error">{error}</div>}

      {form && (
        <div className="adm-modal-overlay" onClick={closeForm}>
          <form className="adm-modal adm-modal-wide" onClick={e=>e.stopPropagation()} onSubmit={save}>
            <div className="adm-modal-header">
              <h3>{form.id ? "Edit Ad" : "New Ad"}</h3>
              <button type="button" onClick={closeForm}><X size={18}/></button>
            </div>

            <label>Ad Title (internal label)
              <input type="text" value={form.title} onChange={e=>set("title",e.target.value)} maxLength={200}/>
            </label>

            <ImageUpload
              label="Ad Media (image or video)"
              value={form.media_url}
              onChange={url => { set("media_url", url); set("media_type", url.match(/\.(mp4|webm|ogg|mov)$/i) ? "video" : "image"); }}
              accept="image/*,video/*"
              type="ad"
            />

            <div className="adm-form-2col">
              <label>Media Type
                <select value={form.media_type} onChange={e=>set("media_type",e.target.value)}>
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                </select>
              </label>
              <label>Position
                <select value={form.position} onChange={e=>set("position",e.target.value)}>
                  {POSITIONS.map(p=><option key={p} value={p}>{p}</option>)}
                </select>
              </label>
            </div>

            <label>Click URL (where clicking the ad goes — optional)
              <input type="text" placeholder="https://..." value={form.link_url} onChange={e=>set("link_url",e.target.value)}/>
            </label>

            <div className="adm-form-2col">
              <label>Display Duration (seconds)
                <input type="number" min={3} max={300} value={form.duration_sec} onChange={e=>set("duration_sec",+e.target.value)}/>
              </label>
              <label>Sort Order
                <input type="number" min={0} value={form.sort_order} onChange={e=>set("sort_order",+e.target.value)}/>
              </label>
            </div>

            <div className="adm-form-2col">
              <label>Start Date (optional)
                <input type="datetime-local" value={form.start_date} onChange={e=>set("start_date",e.target.value)}/>
              </label>
              <label>End Date (optional)
                <input type="datetime-local" value={form.end_date} onChange={e=>set("end_date",e.target.value)}/>
              </label>
            </div>

            <label className="adm-checkbox-label">
              <input type="checkbox" checked={!!form.is_active} onChange={e=>set("is_active",e.target.checked?1:0)}/>
              Active (show on site)
            </label>

            {error && <div className="adm-error">{error}</div>}
            <div className="adm-modal-actions">
              <button type="button" className="adm-btn-ghost" onClick={closeForm}>Cancel</button>
              <button type="submit" className="adm-btn-primary" disabled={saving}>
                <Save size={15}/> {saving?"Saving...":"Save"}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? <div className="adm-loader">Loading...</div> : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead><tr><th>Preview</th><th>Title</th><th>Type</th><th>Position</th><th>Duration</th><th>Active</th><th>Expires</th><th></th></tr></thead>
            <tbody>
              {items.map(row => (
                <tr key={row.id}>
                  <td>
                    {row.media_url && (
                      row.media_type === "video"
                        ? <video src={row.media_url} style={{width:60,height:40,objectFit:"cover",borderRadius:4}}/>
                        : <img src={row.media_url} style={{width:60,height:40,objectFit:"cover",borderRadius:4}} alt=""/>
                    )}
                  </td>
                  <td className="adm-bold">{row.title||"(no title)"}</td>
                  <td><span className="adm-badge">{row.media_type}</span></td>
                  <td><span className="adm-badge blue">{row.position}</span></td>
                  <td className="adm-muted">{row.duration_sec}s</td>
                  <td><span className={`adm-badge ${row.is_active?"green":"gray"}`}>{row.is_active?"Yes":"No"}</span></td>
                  <td className="adm-muted">{row.end_date ? new Date(row.end_date).toLocaleDateString() : "—"}</td>
                  <td>
                    <div className="adm-row-actions">
                      <button className="adm-icon-btn" onClick={()=>openEdit(row)}><Pencil size={14}/></button>
                      <button className="adm-icon-btn danger" onClick={()=>remove(row.id)}><Trash2 size={14}/></button>
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