import ImageUpload from '../ImageUpload.jsx';
import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { Plus, Pencil, Trash2, Save, X } from 'lucide-react';

const TAGS  = ['FEATURED', 'COMMUNITY', 'STAFF'];
const EMPTY = { title:'', subtitle:'', description:'', full_bio:'', tag:'FEATURED', initials:'??', color:'linear-gradient(135deg,#1a0505 0%,#3d0011 100%)', image_url:'', sort_order:0 };

export default function AdminFeatured() {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [form,    setForm]    = useState(null);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');

  const load = async () => {
    setLoading(true);
    try { const d = await adminAPI.featured.getAll(); setItems(d.items || []); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openNew   = ()    => setForm({ ...EMPTY });
  const openEdit  = (row) => setForm({ ...row });
  const closeForm = ()    => { setForm(null); setError(''); };
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      if (form.id) await adminAPI.featured.update(form.id, form);
      else         await adminAPI.featured.create(form);
      closeForm(); load();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const remove = async (id) => {
    if (!confirm('Delete this featured item?')) return;
    try { await adminAPI.featured.remove(id); load(); }
    catch (e) { setError(e.message); }
  };

  return (
    <div className="adm-page">
      <div className="adm-page-header">
        <h2>Featured People &amp; Stories</h2>
        <button className="adm-btn-primary" onClick={openNew}><Plus size={16} /> Add Item</button>
      </div>

      {error && <div className="adm-error">{error}</div>}

      {form && (
        <div className="adm-modal-overlay" onClick={closeForm}>
          <form className="adm-modal adm-modal-wide" onClick={e => e.stopPropagation()} onSubmit={save}>
            <div className="adm-modal-header">
              <h3>{form.id ? 'Edit Featured Item' : 'New Featured Item'}</h3>
              <button type="button" onClick={closeForm}><X size={18} /></button>
            </div>

            <div className="adm-form-2col">
              <label>Title
                <input type="text" value={form.title} onChange={e => set('title', e.target.value)} required maxLength={200} />
              </label>
              <label>Tag
                <select value={form.tag} onChange={e => set('tag', e.target.value)}>
                  {TAGS.map(t => <option key={t}>{t}</option>)}
                </select>
              </label>
            </div>
            <label>Subtitle / Role
              <input type="text" value={form.subtitle} onChange={e => set('subtitle', e.target.value)} maxLength={200} />
            </label>
            <label>Short Description (card teaser)
              <textarea rows={2} value={form.description} onChange={e => set('description', e.target.value)} required />
            </label>
            <label>Full Bio / Story (shown in modal)
              <textarea rows={6} value={form.full_bio} onChange={e => set('full_bio', e.target.value)} required />
            </label>
            <div className="adm-form-2col">
              <label>Initials (2 chars, fallback avatar)
                <input type="text" value={form.initials} onChange={e => set('initials', e.target.value.toUpperCase().slice(0,2))} maxLength={2} />
              </label>
              <label>Sort Order
                <input type="number" min={0} value={form.sort_order} onChange={e => set('sort_order', +e.target.value)} />
              </label>
            </div>
            <ImageUpload label="Image (optional)" value={form.image_url} onChange={url=>set('image_url',url)}/>
            <label>Card Gradient (CSS, used when no image)
              <input type="text" value={form.color} onChange={e => set('color', e.target.value)} />
            </label>
            {form.color && (
              <div className="adm-gradient-preview" style={{ background: form.color }} />
            )}

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
        <div className="adm-cards-grid">
          {items.map(row => (
            <div key={row.id} className="adm-featured-card">
              <div className="adm-featured-thumb" style={{ background: row.image_url ? `url(${row.image_url}) center/cover` : row.color }}>
                {!row.image_url && <span className="adm-initials">{row.initials}</span>}
                <span className="adm-badge">{row.tag}</span>
              </div>
              <div className="adm-featured-body">
                <strong>{row.title}</strong>
                <span className="adm-muted">{row.subtitle}</span>
                <p className="adm-truncate">{row.description}</p>
              </div>
              <div className="adm-row-actions">
                <button className="adm-icon-btn" onClick={() => openEdit(row)}><Pencil size={14} /></button>
                <button className="adm-icon-btn danger" onClick={() => remove(row.id)}><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
