import ImageUpload from '../ImageUpload.jsx';
import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { Plus, Pencil, Trash2, Save, X, Star } from 'lucide-react';

const CATS  = ['NEWS','FEATURES','SPORTS','ENTERTAINMENT'];
const EMPTY = { title:'', description:'', thumbnail:'', video_url:'', category:'NEWS', duration_sec:0, is_featured:0 };

export default function AdminVideos() {
  const [items,   setItems]   = useState([]);
  const [total,   setTotal]   = useState(0);
  const [offset,  setOffset]  = useState(0);
  const [loading, setLoading] = useState(true);
  const [form,    setForm]    = useState(null);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');
  const LIMIT = 15;

  const load = async (off = offset) => {
    setLoading(true);
    try {
      const d = await adminAPI.videos.getAll(LIMIT, off);
      setItems(d.videos || []); setTotal(d.total || 0);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [offset]);

  const openNew   = ()    => setForm({ ...EMPTY });
  const openEdit  = (row) => setForm({ ...row });
  const closeForm = ()    => { setForm(null); setError(''); };
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      // video_url populated by upload — allow save without it
      if (form.id) await adminAPI.videos.update(form.id, form);
      else         await adminAPI.videos.create(form);
      closeForm(); load();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const remove = async (id) => {
    if (!confirm('Delete this video?')) return;
    try { await adminAPI.videos.remove(id); load(); }
    catch (e) { setError(e.message); }
  };

  const toggleFeatured = async (row) => {
    try { await adminAPI.videos.update(row.id, { ...row, is_featured: row.is_featured ? 0 : 1 }); load(); }
    catch (e) { setError(e.message); }
  };

  const fmtDuration = (sec) => {
    if (!sec) return '—';
    const m = Math.floor(sec / 60), s = sec % 60;
    return `${m}:${String(s).padStart(2,'0')}`;
  };

  return (
    <div className="adm-page">
      <div className="adm-page-header">
        <h2>VOD / Videos <span className="adm-count">{total}</span></h2>
        <button className="adm-btn-primary" onClick={openNew}><Plus size={16} /> Add Video</button>
      </div>

      {error && <div className="adm-error">{error}</div>}

      {form && (
        <div className="adm-modal-overlay" onClick={closeForm}>
          <form className="adm-modal adm-modal-wide" onClick={e => e.stopPropagation()} onSubmit={save}>
            <div className="adm-modal-header">
              <h3>{form.id ? 'Edit Video' : 'Add Video'}</h3>
              <button type="button" onClick={closeForm}><X size={18} /></button>
            </div>

            <label>Title
              <input type="text" value={form.title} onChange={e => set('title', e.target.value)} required maxLength={200} />
            </label>
            <div className="adm-form-2col">
              <label>Category
                <select value={form.category} onChange={e => set('category', e.target.value)}>
                  {CATS.map(c => <option key={c}>{c}</option>)}
                </select>
              </label>
              <label>Duration (seconds)
                <input type="number" min={0} value={form.duration_sec} onChange={e => set('duration_sec', +e.target.value)} />
              </label>
            </div>
            <label>Description
              <textarea rows={3} value={form.description} onChange={e => set('description', e.target.value)} />
            </label>
            <ImageUpload
              label="Video File (upload MP4/WebM or paste URL)"
              value={form.video_url}
              onChange={url => set("video_url", url)}
              accept="video/*"
              type="video"
            />
            <ImageUpload
              label="Thumbnail Image (upload or paste URL)"
              value={form.thumbnail}
              onChange={url => set("thumbnail", url)}
              accept="image/*"
              type="image"
            />
            <label className="adm-checkbox-label">
              <input type="checkbox" checked={!!form.is_featured} onChange={e => set('is_featured', e.target.checked ? 1 : 0)} />
              Featured video
            </label>

            {error && <div className="adm-error">{error}</div>}
            <div className="adm-modal-actions">
              <button type="button" className="adm-btn-ghost" onClick={closeForm}>Cancel</button>
              <button type="submit" className="adm-btn-primary" disabled={saving}>
                <Save size={15} /> {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? <div className="adm-loader">Loading…</div> : (
        <>
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead><tr><th>Title</th><th>Category</th><th>Duration</th><th>Featured</th><th>Views</th><th></th></tr></thead>
              <tbody>
                {items.map(row => (
                  <tr key={row.id}>
                    <td className="adm-bold adm-truncate" style={{maxWidth:260}}>{row.title}</td>
                    <td><span className="adm-badge">{row.category}</span></td>
                    <td className="adm-muted">{fmtDuration(row.duration_sec)}</td>
                    <td>
                      <button className={`adm-icon-btn ${row.is_featured ? 'star-on' : ''}`} onClick={() => toggleFeatured(row)}>
                        <Star size={14} fill={row.is_featured ? 'currentColor' : 'none'} />
                      </button>
                    </td>
                    <td className="adm-muted">{row.views}</td>
                    <td>
                      <div className="adm-row-actions">
                        <button className="adm-icon-btn" onClick={() => openEdit(row)}><Pencil size={14} /></button>
                        <button className="adm-icon-btn danger" onClick={() => remove(row.id)}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="adm-pagination">
            <button disabled={offset === 0} onClick={() => setOffset(o => Math.max(0, o - LIMIT))}>← Prev</button>
            <span>{offset + 1}–{Math.min(offset + LIMIT, total)} of {total}</span>
            <button disabled={offset + LIMIT >= total} onClick={() => setOffset(o => o + LIMIT)}>Next →</button>
          </div>
        </>
      )}
    </div>
  );
}
