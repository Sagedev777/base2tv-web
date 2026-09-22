import React, { useState, useEffect } from 'react';
import { adminAPI, getUser } from '../../services/api';
import { Trash2, RefreshCw, X, Save, UserPlus, ShieldCheck, Pencil, Users, Eye } from 'lucide-react';

const ROLES    = ['viewer', 'staff', 'manager', 'admin'];
const STATUSES = ['active', 'banned'];
const EMPTY_STAFF = { username: '', email: '', password: '', role: 'staff' };

const ROLE_META = {
  admin:   { label: 'Admin',   color: '#e50914', bg: 'rgba(229,9,20,0.1)',   icon: ShieldCheck, desc: 'Full access including users & settings' },
  manager: { label: 'Manager', color: '#ff9800', bg: 'rgba(255,152,0,0.1)', icon: Pencil,       desc: 'Manage all content, cannot manage users' },
  staff:   { label: 'Staff',   color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', icon: Pencil,      desc: 'Manage schedule, news, videos, featured' },
  viewer:  { label: 'Viewer',  color: '#6b7280', bg: 'rgba(107,114,128,0.1)',icon: Eye,         desc: 'Regular public user, no admin access' },
};

export default function AdminUsers() {
  const [items,    setItems]    = useState([]);
  const [total,    setTotal]    = useState(0);
  const [offset,   setOffset]   = useState(0);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');

  const [showForm, setShowForm] = useState(false);
  const [form,     setForm]     = useState({ ...EMPTY_STAFF });
  const [saving,   setSaving]   = useState(false);
  const [formErr,  setFormErr]  = useState('');
  const [formOk,   setFormOk]   = useState('');

  const me    = getUser();
  const LIMIT = 100; // load all to group properly

  const load = async (off = offset) => {
    setLoading(true);
    try {
      const d = await adminAPI.users.getAll(LIMIT, off);
      setItems(d.users || []); setTotal(d.total || 0);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [offset]);

  const updateUser = async (id, patch) => {
    setError('');
    try { await adminAPI.users.update(id, patch); load(); }
    catch (e) { setError(e.message); }
  };

  const remove = async (id, username) => {
    if (!confirm(`Permanently delete "${username}"? This cannot be undone.`)) return;
    setError('');
    try { await adminAPI.users.remove(id); load(); }
    catch (e) { setError(e.message); }
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    setFormErr(''); setFormOk(''); setSaving(true);
    try {
      const d = await adminAPI.users.createStaff(form);
      setFormOk(`✅ Account created for ${d.user.username} (${d.user.role})`);
      setForm({ ...EMPTY_STAFF });
      load();
      setTimeout(() => { setShowForm(false); setFormOk(''); }, 2000);
    } catch (err) {
      setFormErr(err.message);
    } finally {
      setSaving(false);
    }
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const fmt = (dt) => dt
    ? new Date(dt).toLocaleDateString('en-UG', { dateStyle: 'medium' })
    : '—';

  // Group users by role
  const grouped = { admin: [], manager: [], staff: [], viewer: [] };
  items.forEach(u => {
    const key = grouped[u.role] ? u.role : 'viewer';
    grouped[key].push(u);
  });

  const renderSection = (roleKey) => {
    const meta = ROLE_META[roleKey];
    const users = grouped[roleKey] || [];
    const Icon = meta.icon;
    if (users.length === 0 && roleKey === 'viewer') return null; // skip if no viewers for cleanliness... actually show count
    return (
      <div key={roleKey} style={{ marginBottom: 32 }}>
        {/* Section header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14,
          paddingBottom: 12, borderBottom: `2px solid ${meta.color}22`
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8, background: meta.bg,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <Icon size={18} color={meta.color} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.1rem', color: meta.color }}>
              {meta.label}s
              <span style={{
                marginLeft: 8, background: meta.bg, color: meta.color,
                padding: '2px 8px', borderRadius: 20, fontSize: '0.75rem'
              }}>{users.length}</span>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{meta.desc}</div>
          </div>
        </div>

        {users.length === 0 ? (
          <div style={{
            padding: '20px', textAlign: 'center', borderRadius: 10,
            border: '1px dashed rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.3)', fontSize: '0.9rem'
          }}>
            No {meta.label.toLowerCase()} accounts yet.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {users.map(row => {
              const isSelf = row.email === me?.email;
              return (
                <div key={row.id} style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '12px 16px', borderRadius: 10,
                  background: isSelf ? `${meta.color}08` : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${isSelf ? meta.color + '30' : 'rgba(255,255,255,0.06)'}`,
                  transition: 'all 0.15s'
                }}>
                  {/* Avatar */}
                  <img
                    src={row.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(row.username)}&background=222&color=fff&size=60`}
                    alt=""
                    style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0, border: `2px solid ${meta.color}44` }}
                  />

                  {/* Name & Email */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{row.username}</span>
                      {isSelf && <span style={{ background: '#3b82f6', color: 'white', fontSize: '0.65rem', padding: '1px 7px', borderRadius: 10, fontWeight: 700 }}>YOU</span>}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.4)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.email}</div>
                  </div>

                  {/* Dates */}
                  <div style={{ textAlign: 'right', flexShrink: 0, display: 'none' }} className="adm-hide-mobile">
                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)' }}>Joined {fmt(row.created_at)}</div>
                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.2)', marginTop: 2 }}>Login {fmt(row.last_login)}</div>
                  </div>

                  {/* Role change */}
                  {!isSelf ? (
                    <select
                      style={{
                        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: 7, color: 'white', padding: '5px 8px', fontSize: '0.82rem',
                        cursor: 'pointer', flexShrink: 0
                      }}
                      value={row.role}
                      onChange={e => updateUser(row.id, { role: e.target.value, status: row.status })}
                    >
                      {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  ) : (
                    <span style={{
                      padding: '4px 12px', borderRadius: 20, fontSize: '0.78rem',
                      fontWeight: 600, background: meta.bg, color: meta.color
                    }}>{row.role}</span>
                  )}

                  {/* Status */}
                  {!isSelf ? (
                    <select
                      style={{
                        background: row.status === 'banned' ? 'rgba(229,9,20,0.1)' : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${row.status === 'banned' ? 'rgba(229,9,20,0.4)' : 'rgba(255,255,255,0.12)'}`,
                        borderRadius: 7, color: row.status === 'banned' ? '#e50914' : 'white',
                        padding: '5px 8px', fontSize: '0.82rem', cursor: 'pointer', flexShrink: 0
                      }}
                      value={row.status}
                      onChange={e => updateUser(row.id, { role: row.role, status: e.target.value })}
                    >
                      {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  ) : (
                    <span style={{
                      padding: '4px 12px', borderRadius: 20, fontSize: '0.78rem',
                      fontWeight: 600, background: 'rgba(34,197,94,0.1)', color: '#22c55e'
                    }}>active</span>
                  )}

                  {/* Delete */}
                  {!isSelf && (
                    <button
                      onClick={() => remove(row.id, row.username)}
                      title="Delete account permanently"
                      style={{
                        background: 'rgba(229,9,20,0.08)', border: '1px solid rgba(229,9,20,0.2)',
                        borderRadius: 7, color: '#e50914', cursor: 'pointer', padding: '6px 8px',
                        display: 'flex', alignItems: 'center', flexShrink: 0
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="adm-page">

      {/* Page header */}
      <div className="adm-page-header">
        <div>
          <h2>User Management <span className="adm-count">{total}</span></h2>
          <p className="adm-subtitle" style={{ marginTop: 4, color: 'rgba(255,255,255,0.45)', fontSize: '0.88rem' }}>
            Accounts are grouped by access level.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="adm-btn-ghost" onClick={() => load()} title="Refresh">
            <RefreshCw size={14} />
          </button>
          <button className="adm-btn-primary" onClick={() => { setShowForm(true); setFormErr(''); setFormOk(''); }}>
            <UserPlus size={15} /> Add Account
          </button>
        </div>
      </div>

      {error && <div className="adm-error">{error}</div>}

      {/* Create Staff Modal */}
      {showForm && (
        <div className="adm-modal-overlay" onClick={() => setShowForm(false)}>
          <form className="adm-modal" onClick={e => e.stopPropagation()} onSubmit={handleCreateStaff}>
            <div className="adm-modal-header">
              <h3>Create Staff / Admin Account</h3>
              <button type="button" onClick={() => setShowForm(false)}><X size={18} /></button>
            </div>

            {formErr && <div className="adm-error">{formErr}</div>}
            {formOk  && <div className="adm-success">{formOk}</div>}

            <label>Username
              <input type="text" value={form.username} onChange={e => set('username', e.target.value)}
                placeholder="e.g. SportEditor" required minLength={3} maxLength={40} />
            </label>

            <label>Email Address
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                placeholder="e.g. sports@base2tv.ug" required />
            </label>

            <label>Password (min 6 characters)
              <input type="password" value={form.password} onChange={e => set('password', e.target.value)}
                placeholder="Set a strong password" required minLength={6} />
            </label>

            <label>Role
              <select value={form.role} onChange={e => set('role', e.target.value)}>
                <option value="staff">Staff — manage content</option>
                <option value="manager">Manager — manage all content</option>
                <option value="admin">Admin — full access including users</option>
                <option value="viewer">Viewer — public account only</option>
              </select>
            </label>

            <div className="adm-role-hint">
              {form.role === 'admin'   && '⚠️ Admin accounts can manage users, ban accounts, and delete content.'}
              {form.role === 'manager' && '🔑 Manager accounts can manage all content but cannot manage users.'}
              {form.role === 'staff'   && '✏️ Staff can manage schedule, news, videos, and featured content.'}
              {form.role === 'viewer'  && '👁 Viewer accounts are regular public users.'}
            </div>

            <div className="adm-modal-actions">
              <button type="button" className="adm-btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="adm-btn-primary" disabled={saving}>
                <Save size={15} /> {saving ? 'Creating…' : 'Create Account'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Grouped sections */}
      {loading ? <div className="adm-loader">Loading…</div> : (
        <div>
          {['admin', 'manager', 'staff', 'viewer'].map(role => renderSection(role))}
        </div>
      )}
    </div>
  );
}
