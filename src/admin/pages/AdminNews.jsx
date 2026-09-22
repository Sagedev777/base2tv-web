import ImageUpload from '../ImageUpload.jsx';
import React, { useState, useEffect } from 'react';
import { adminAPI, categoriesAPI } from '../../services/api';
import { Plus, Pencil, Trash2, Save, X, Eye, EyeOff, Newspaper, Search } from 'lucide-react';

const SCOPES = ['LOCAL', 'GLOBAL'];
const EMPTY = { title:'', excerpt:'', body:'', category:'LOCAL NEWS', scope:'LOCAL', author:'Base2 TV', thumbnail:'', color:'', is_published:1 };

const timeAgo = (dt) => {
  if (!dt) return '';
  const diff = Date.now() - new Date(dt).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dt).toLocaleDateString('en-UG', { dateStyle: 'medium' });
};

export default function AdminNews() {
  const [items,      setItems]      = useState([]);
  const [total,      setTotal]      = useState(0);
  const [offset,     setOffset]     = useState(0);
  const [loading,    setLoading]    = useState(true);
  const [form,       setForm]       = useState(null);
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState('');
  const [categories, setCategories] = useState([]);
  const [search,     setSearch]     = useState('');
  const LIMIT = 15;

  const load = async (off = offset) => {
    setLoading(true);
    try {
      const d = await adminAPI.news.getAll(LIMIT, off);
      setItems(d.articles || []); setTotal(d.total || 0);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const loadCategories = async () => {
    try {
      const data = await categoriesAPI.getAll();
      setCategories(data.map(c => c.name));
    } catch (e) { console.error("Failed to load categories", e); }
  };

  useEffect(() => { load(); }, [offset]);
  useEffect(() => { loadCategories(); }, []);

  const openNew  = () => setForm({ ...EMPTY });
  const openEdit = (row) => setForm({ ...row });
  const closeForm = () => { setForm(null); setError(''); };

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

  const filtered = items.filter(a =>
    !search || a.title?.toLowerCase().includes(search.toLowerCase()) ||
    a.category?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="adm-page">
      {/* Header */}
      <div className="adm-page-header">
        <div>
          <h2>News Articles <span className="adm-count">{total}</span></h2>
          <p style={{ marginTop: 4, color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>
            Manage published and draft news articles.
          </p>
        </div>
        <button className="adm-btn-primary" onClick={openNew}><Plus size={16} /> New Article</button>
      </div>

      {error && <div className="adm-error">{error}</div>}

      {/* Search bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 10, padding: '10px 14px', marginBottom: 20
      }}>
        <Search size={16} style={{ color: 'rgba(255,255,255,0.3)', flexShrink: 0 }} />
        <input
          type="text"
          placeholder="Search articles by title or category…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            background: 'transparent', border: 'none', outline: 'none',
            color: 'white', fontSize: '0.9rem', flex: 1,
          }}
        />
        {search && (
          <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: 0 }}>
            <X size={14} />
          </button>
        )}
      </div>

      {/* Edit / New Modal */}
      {form && (
        <div className="adm-modal-overlay" onClick={closeForm}>
          <form className="adm-modal adm-modal-wide" onClick={e => e.stopPropagation()} onSubmit={save}
            style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="adm-modal-header">
              <h3>{form.id ? 'Edit Article' : 'New Article'}</h3>
              <button type="button" onClick={closeForm}><X size={18} /></button>
            </div>

            <div className="adm-form-row">
              <label>Title *
                <input type="text" value={form.title} onChange={e => set('title', e.target.value)} required maxLength={200} placeholder="Article headline..." />
              </label>
            </div>

            <div className="adm-form-2col">
              <label>Category
                <select value={form.category} onChange={e => set('category', e.target.value)}>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </label>
              <label>Scope
                <select value={form.scope} onChange={e => set('scope', e.target.value)}>
                  {SCOPES.map(s => <option key={s}>{s}</option>)}
                </select>
              </label>
            </div>

            <label>Summary / Excerpt *
              <textarea rows={2} value={form.excerpt} onChange={e => set('excerpt', e.target.value)} required placeholder="Brief summary shown on cards..." />
            </label>

            <label>Full Story
              <textarea rows={8} value={form.body} onChange={e => set('body', e.target.value)} placeholder="Full article content..." style={{ fontFamily: 'inherit' }} />
            </label>

            <div className="adm-form-2col">
              <label>Author
                <input type="text" value={form.author} onChange={e => set('author', e.target.value)} />
              </label>
              <ImageUpload label="Thumbnail" value={form.thumbnail} onChange={url => set('thumbnail', url)} />
            </div>

            <label>Card Gradient (CSS — used when no thumbnail)
              <input type="text" value={form.color} onChange={e => set('color', e.target.value)} placeholder="linear-gradient(135deg,#1a0505 0%,#3d0000 100%)" />
            </label>

            <label className="adm-checkbox-label">
              <input type="checkbox" checked={!!form.is_published} onChange={e => set('is_published', e.target.checked ? 1 : 0)} />
              Publish immediately
            </label>

            {error && <div className="adm-error">{error}</div>}

            <div className="adm-modal-actions">
              <button type="button" className="adm-btn-ghost" onClick={closeForm}>Cancel</button>
              <button type="submit" className="adm-btn-primary" disabled={saving}>
                <Save size={15} /> {saving ? 'Saving…' : 'Save Article'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Article List */}
      {loading ? <div className="adm-loader">Loading…</div> : filtered.length === 0 ? (
        <div style={{
          padding: 50, textAlign: 'center', background: 'rgba(255,255,255,0.02)',
          borderRadius: 12, border: '1px dashed rgba(255,255,255,0.08)'
        }}>
          <Newspaper size={48} style={{ color: 'rgba(255,255,255,0.15)', marginBottom: 12 }} />
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '1rem', marginBottom: 16 }}>
            {search ? 'No articles match your search.' : 'No articles yet.'}
          </p>
          {!search && <button className="adm-btn-primary" onClick={openNew}><Plus size={15} /> Write First Article</button>}
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map(row => (
              <div key={row.id} style={{
                display: 'flex', alignItems: 'center', gap: 16, padding: '14px 16px',
                background: row.is_published ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.015)',
                border: `1px solid ${row.is_published ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.04)'}`,
                borderRadius: 10, transition: 'all 0.15s',
                opacity: row.is_published ? 1 : 0.6
              }}>
                {/* Thumbnail */}
                <div style={{
                  width: 80, height: 60, borderRadius: 8, flexShrink: 0,
                  overflow: 'hidden', background: row.color || 'rgba(229,9,20,0.15)'
                }}>
                  {row.thumbnail ? (
                    <img src={row.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Newspaper size={20} style={{ color: 'rgba(255,255,255,0.2)' }} />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 5 }}>
                    <span style={{
                      background: 'rgba(229,9,20,0.15)', color: '#ff6b6b',
                      fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px',
                      borderRadius: 20, textTransform: 'uppercase', letterSpacing: '0.5px'
                    }}>{row.category}</span>
                    <span style={{
                      background: row.scope === 'GLOBAL' ? 'rgba(59,130,246,0.15)' : 'rgba(34,197,94,0.12)',
                      color: row.scope === 'GLOBAL' ? '#60a5fa' : '#4ade80',
                      fontSize: '0.65rem', fontWeight: 600, padding: '2px 7px', borderRadius: 20
                    }}>{row.scope}</span>
                    {!row.is_published && (
                      <span style={{
                        background: 'rgba(255,152,0,0.15)', color: '#fb923c',
                        fontSize: '0.65rem', fontWeight: 600, padding: '2px 7px', borderRadius: 20
                      }}>DRAFT</span>
                    )}
                  </div>
                  <div style={{
                    fontWeight: 600, fontSize: '0.95rem', whiteSpace: 'nowrap',
                    overflow: 'hidden', textOverflow: 'ellipsis'
                  }}>{row.title}</div>
                  <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>
                    {row.author} · {timeAgo(row.published_at || row.created_at)}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <button
                    onClick={() => togglePublish(row)}
                    title={row.is_published ? 'Unpublish' : 'Publish'}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '6px 12px', borderRadius: 7, cursor: 'pointer', fontWeight: 600,
                      fontSize: '0.78rem', border: '1px solid',
                      background: row.is_published ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.05)',
                      borderColor: row.is_published ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.1)',
                      color: row.is_published ? '#4ade80' : 'rgba(255,255,255,0.5)',
                    }}
                  >
                    {row.is_published ? <Eye size={13} /> : <EyeOff size={13} />}
                    {row.is_published ? 'Live' : 'Draft'}
                  </button>
                  <button className="adm-icon-btn" onClick={() => openEdit(row)} title="Edit"><Pencil size={14} /></button>
                  <button className="adm-icon-btn danger" onClick={() => remove(row.id)} title="Delete"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="adm-pagination" style={{ marginTop: 20 }}>
            <button disabled={offset === 0} onClick={() => setOffset(o => Math.max(0, o - LIMIT))}>← Prev</button>
            <span>{offset + 1}–{Math.min(offset + LIMIT, total)} of {total}</span>
            <button disabled={offset + LIMIT >= total} onClick={() => setOffset(o => o + LIMIT)}>Next →</button>
          </div>
        </>
      )}
    </div>
  );
}
