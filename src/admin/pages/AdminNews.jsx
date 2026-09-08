import ImageUpload from '../ImageUpload.jsx';
import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { Plus, Pencil, Trash2, Save, X, Eye, EyeOff } from 'lucide-react';

const SCOPES = ['LOCAL', 'GLOBAL'];
const CATS   = ['LOCAL NEWS','GLOBAL AFFAIRS','SPORTS','ENTERTAINMENT','AGRI-TECH','EXCLUSIVE INTERVIEW','REGIONAL AFFAIRS'];
const EMPTY  = { title:'', excerpt:'', body:'', category:'LOCAL NEWS', scope:'LOCAL', author:'Base2 TV', thumbnail:'', color:'', is_published:1 };

export default function AdminNews() {
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
      const d = await adminAPI.news.getAll(LIMIT, off);
      setItems(d.articles || []); setTotal(d.total || 0);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [offset]);

  const openNew  = ()    => setForm({ ...EMPTY });
  const openEdit = (row) => setForm({ ...row });
  const closeForm = ()   => { setForm(null); setError(''); };

  const save = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      if (form.id) await adminAPI.news.update(form.id, form);
      else         await adminAPI.news.create(form);
      closeForm(); load();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const remove = async (id) => {
    if (!confirm('Delete this article?')) return;
    try { await adminAPI.news.remove(id); load(); }
    catch (e) { setError(e.message); }
  };

  const togglePublish = async (row) => {
    try { await adminAPI.news.update(row.id, { ...row, is_published: row.is_published ? 0 : 1 }); load(); }
    catch (e) { setError(e.message); }
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="adm-page">
      <div className="adm-page-header">
        <h2>News Articles <span className="adm-count">{total}</span></h2>
        <button className="adm-btn-primary" onClick={openNew}><Plus size={16} /> New Article</button>
      </div>

      {error && <div className="adm-error">{error}</div>}

      {form && (
        <div className="adm-modal-overlay" onClick={closeForm}>
          <form className="adm-modal adm-modal-wide" onClick={e => e.stopPropagation()} onSubmit={save}>
            <div className="adm-modal-header">
              <h3>{form.id ? 'Edit Article' : 'New Article'}</h3>
              <button type="button" onClick={closeForm}><X size={18} /></button>
            </div>

            <div className="adm-form-row">
              <label>Title
                <input type="text" value={form.title} onChange={e => set('title', e.target.value)} required maxLength={200} />
              </label>
            </div>
            <div className="adm-form-2col">
              <label>Category
                <select value={form.category} onChange={e => set('category', e.target.value)}>
                  {CATS.map(c => <option key={c}>{c}</option>)}
                </select>
              </label>
              <label>Scope
                <select value={form.scope} onChange={e => set('scope', e.target.value)}>
                  {SCOPES.map(s => <option key={s}>{s}</option>)}
                </select>
              </label>
            </div>
            <label>Summary / Excerpt
              <textarea rows={2} value={form.excerpt} onChange={e => set('excerpt', e.target.value)} required />
            </label>
            <label>Full Story
              <textarea rows={7} value={form.body} onChange={e => set('body', e.target.value)} />
            </label>
            <div className="adm-form-2col">
              <label>Author
                <input type="text" value={form.author} onChange={e => set('author', e.target.value)} />
              </label>
              <ImageUpload label="Thumbnail" value={form.thumbnail} onChange={url=>set('thumbnail',url)}/>
            </div>
            <label>Card Gradient (CSS, used when no thumbnail)
              <input type="text" value={form.color} onChange={e => set('color', e.target.value)} placeholder="linear-gradient(135deg,#1a0505 0%,#3d0000 100%)" />
            </label>
            <label className="adm-checkbox-label">
              <input type="checkbox" checked={!!form.is_published} onChange={e => set('is_published', e.target.checked ? 1 : 0)} />
              Published
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
              <thead><tr><th>Title</th><th>Category</th><th>Scope</th><th>Author</th><th>Published</th><th></th></tr></thead>
              <tbody>
                {items.map(row => (
                  <tr key={row.id}>
                    <td className="adm-bold adm-truncate" style={{maxWidth:280}}>{row.title}</td>
                    <td><span className="adm-badge">{row.category}</span></td>
                    <td><span className={`adm-badge ${row.scope === 'GLOBAL' ? 'blue' : 'green'}`}>{row.scope}</span></td>
                    <td className="adm-muted">{row.author}</td>
                    <td>
                      <button className="adm-icon-btn" onClick={() => togglePublish(row)} title={row.is_published ? 'Unpublish' : 'Publish'}>
                        {row.is_published ? <Eye size={14} /> : <EyeOff size={14} />}
                      </button>
                    </td>
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
