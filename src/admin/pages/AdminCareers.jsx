import React, { useState, useEffect } from "react";
import { careersAPI } from "../../services/api";
import { Plus, Pencil, Trash2, Save, X, Eye, EyeOff } from "lucide-react";

const TYPES = ["Full-time","Part-time","Contract","Internship","Volunteer"];
const DEPTS = ["News","Sports","Entertainment","Technology","Production","Administration","Marketing","General"];
const EMPTY = { title:"", department:"General", location:"Kampala, Uganda", type:"Full-time", description:"", requirements:"", salary_range:"", deadline:"", is_active:1 };

export default function AdminCareers() {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [form,    setForm]    = useState(null);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState("");

  const load = async () => {
    setLoading(true);
    try { const d = await careersAPI.getAll(); setItems(d.jobs||[]); }
    catch(e) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openNew  = ()    => setForm({...EMPTY});
  const openEdit = (row) => setForm({...row, deadline: row.deadline?.slice(0,10)||""});
  const closeForm = ()   => { setForm(null); setError(""); };
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const save = async (e) => {
    e.preventDefault(); setSaving(true); setError("");
    try {
      const payload = {...form, deadline: form.deadline||null};
      if (form.id) await careersAPI.update(form.id, payload);
      else         await careersAPI.create(payload);
      closeForm(); load();
    } catch(err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const remove = async (id) => {
    if (!confirm("Delete this job posting?")) return;
    try { await careersAPI.remove(id); load(); }
    catch(e) { setError(e.message); }
  };

  const toggleActive = async (row) => {
    try { await careersAPI.update(row.id, {...row, is_active: row.is_active?0:1}); load(); }
    catch(e) { setError(e.message); }
  };

  const fmt = (d) => d ? new Date(d).toLocaleDateString("en-UG",{dateStyle:"medium"}) : "—";
  const isExpired = (d) => d && new Date(d) < new Date();

  return (
    <div className="adm-page">
      <div className="adm-page-header">
        <h2>Careers <span className="adm-count">{items.length}</span></h2>
        <button className="adm-btn-primary" onClick={openNew}><Plus size={16}/> Post Job</button>
      </div>

      {error && <div className="adm-error">{error}</div>}

      {form && (
        <div className="adm-modal-overlay" onClick={closeForm}>
          <form className="adm-modal adm-modal-wide" onClick={e=>e.stopPropagation()} onSubmit={save}>
            <div className="adm-modal-header">
              <h3>{form.id?"Edit Job":"New Job Posting"}</h3>
              <button type="button" onClick={closeForm}><X size={18}/></button>
            </div>

            <label>Job Title *
              <input type="text" value={form.title} onChange={e=>set("title",e.target.value)} required maxLength={200}/>
            </label>
            <div className="adm-form-2col">
              <label>Department
                <select value={form.department} onChange={e=>set("department",e.target.value)}>
                  {DEPTS.map(d=><option key={d}>{d}</option>)}
                </select>
              </label>
              <label>Job Type
                <select value={form.type} onChange={e=>set("type",e.target.value)}>
                  {TYPES.map(t=><option key={t}>{t}</option>)}
                </select>
              </label>
            </div>
            <div className="adm-form-2col">
              <label>Location
                <input type="text" value={form.location} onChange={e=>set("location",e.target.value)} maxLength={100}/>
              </label>
              <label>Salary Range (optional)
                <input type="text" placeholder="e.g. UGX 800,000 – 1,200,000/month" value={form.salary_range} onChange={e=>set("salary_range",e.target.value)} maxLength={80}/>
              </label>
            </div>
            <label>Application Deadline
              <input type="date" value={form.deadline} onChange={e=>set("deadline",e.target.value)}/>
            </label>
            <label>Job Description *
              <textarea rows={5} value={form.description} onChange={e=>set("description",e.target.value)} required placeholder="Describe the role, responsibilities, and what the candidate will do..."/>
            </label>
            <label>Requirements (one per line)
              <textarea rows={5} value={form.requirements} onChange={e=>set("requirements",e.target.value)} placeholder="• Bachelor degree in relevant field&#10;• 2+ years experience&#10;• Strong communication skills..."/>
            </label>
            <label className="adm-checkbox-label">
              <input type="checkbox" checked={!!form.is_active} onChange={e=>set("is_active",e.target.checked?1:0)}/>
              Active (visible on site)
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
            <thead><tr><th>Title</th><th>Department</th><th>Type</th><th>Deadline</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {items.map(row=>(
                <tr key={row.id} style={{opacity: isExpired(row.deadline)?0.5:1}}>
                  <td className="adm-bold">{row.title}</td>
                  <td className="adm-muted">{row.department}</td>
                  <td><span className="adm-badge">{row.type}</span></td>
                  <td className={`adm-muted ${isExpired(row.deadline)?"":"" }`}>
                    {fmt(row.deadline)}
                    {isExpired(row.deadline) && <span className="adm-badge" style={{marginLeft:6,color:"#ff5252"}}>Expired</span>}
                  </td>
                  <td>
                    <button className="adm-icon-btn" onClick={()=>toggleActive(row)} title={row.is_active?"Unpublish":"Publish"}>
                      {row.is_active ? <Eye size={14}/> : <EyeOff size={14}/>}
                    </button>
                  </td>
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