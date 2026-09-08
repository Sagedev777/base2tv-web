import React, { useState, useEffect } from 'react';
import { adminAPI, getUser } from '../../services/api';
import { Trash2, RefreshCw, Plus, X, Save, UserPlus } from 'lucide-react';

const ROLES    = ['viewer', 'staff', 'admin'];
const STATUSES = ['active', 'banned'];

const EMPTY_STAFF = { username: '', email: '', password: '', role: 'staff' };

export default function AdminUsers() {
  const [items,    setItems]    = useState([]);
  const [total,    setTotal]    = useState(0);
  const [offset,   setOffset]   = useState(0);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');

  // Create staff form
  const [showForm, setShowForm] = useState(false);
  const [form,     setForm]     = useState({ ...EMPTY_STAFF });
  const [saving,   setSaving]   = useState(false);
  const [formErr,  setFormErr]  = useState('');
  const [formOk,   setFormOk]   = useState('');

  const me    = getUser();
  const LIMIT = 20;

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
      // Auto-close form after 2s
      setTimeout(() => { setShowForm(false); setFormOk(''); }, 2000);
    } catch (err) {
      setFormErr(err.message);
    } finally {
      setSaving(false);
    }
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const roleBadge = (role) => {
    const map = { admin: 'red', staff: 'purple', viewer: 'gray' };
    return <span className={`adm-badge ${map[role] || 'gray'}`}>{role}</span>;
  };

  const fmt = (dt) => dt
    ? new Date(dt).toLocaleDateString('en-UG', { dateStyle: 'medium' })
    : '—';

  return (
    <div className="adm-page">

      {/* ── Page header ── */}
      <div className="adm-page-header">
        <h2>Users <span className="adm-count">{total}</span></h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="adm-btn-ghost" onClick={() => load()}>
            <RefreshCw size={14} />
          </button>
          <button className="adm-btn-primary" onClick={() => { setShowForm(true); setFormErr(''); setFormOk(''); }}>
            <UserPlus size={15} /> Add Staff Account
          </button>
        </div>
      </div>

      {error && <div className="adm-error">{error}</div>}

      {/* ── Create Staff Modal ── */}
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
              <input
                type="text" value={form.username}
                onChange={e => set('username', e.target.value)}
                placeholder="e.g. SportEditor" required minLength={3} maxLength={40}
              />
            </label>

            <label>Email Address
              <input
                type="email" value={form.email}
                onChange={e => set('email', e.target.value)}
                placeholder="e.g. sports@base2tv.ug" required
              />
            </label>

            <label>Password (min 6 characters)
              <input
                type="password" value={form.password}
                onChange={e => set('password', e.target.value)}
                placeholder="Set a strong password" required minLength={6}
              />
            </label>

            <label>Role
              <select value={form.role} onChange={e => set('role', e.target.value)}>
                <option value="staff">Staff — can manage content</option>
                <option value="admin">Admin — full access including users</option>
                <option value="viewer">Viewer — public account only</option>
              </select>
            </label>

            {/* Role description */}
            <div className="adm-role-hint">
              {form.role === 'admin'  && '⚠️ Admin accounts can manage users, ban accounts, and delete content.'}
              {form.role === 'staff'  && '✏️ Staff can manage schedule, news, videos, and featured content.'}
              {form.role === 'viewer' && '👁 Viewer accounts are regular public users.'}
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

      {/* ── Users table ── */}
      {loading ? <div className="adm-loader">Loading…</div> : (
        <>
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Last Login</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map(row => {
                  const isSelf = row.email === me?.email;
                  return (
                    <tr key={row.id} className={isSelf ? 'adm-self-row' : ''}>

                      {/* Avatar + name */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <img
                            src={row.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(row.username)}&background=333&color=fff&size=60`}
                            alt="" className="adm-user-avatar-sm"
                          />
                          <span className="adm-bold">{row.username}</span>
                          {isSelf && <span className="adm-badge blue">You</span>}
                        </div>
                      </td>

                      {/* Email */}
                      <td className="adm-muted">{row.email}</td>

                      {/* Role — dropdown unless it's yourself */}
                      <td>
                        {isSelf ? roleBadge(row.role) : (
                          <select
                            className="adm-select-inline"
                            value={row.role}
                            onChange={e => updateUser(row.id, { role: e.target.value, status: row.status })}
                          >
                            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                          </select>
                        )}
                      </td>

                      {/* Status — dropdown unless it's yourself */}
                      <td>
                        {isSelf ? (
                          <span className="adm-badge green">active</span>
                        ) : (
                          <select
                            className={`adm-select-inline ${row.status === 'banned' ? 'danger' : ''}`}
                            value={row.status}
                            onChange={e => updateUser(row.id, { role: row.role, status: e.target.value })}
                          >
                            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        )}
                      </td>

                      <td className="adm-muted">{fmt(row.created_at)}</td>
                      <td className="adm-muted">{fmt(row.last_login)}</td>

                      {/* Delete — not for yourself */}
                      <td>
                        {!isSelf && (
                          <button
                            className="adm-icon-btn danger"
                            onClick={() => remove(row.id, row.username)}
                            title="Delete account permanently"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="adm-pagination">
            <button disabled={offset === 0} onClick={() => setOffset(o => Math.max(0, o - LIMIT))}>← Prev</button>
            <span>{Math.min(offset + 1, total)}–{Math.min(offset + LIMIT, total)} of {total}</span>
            <button disabled={offset + LIMIT >= total} onClick={() => setOffset(o => o + LIMIT)}>Next →</button>
          </div>
        </>
      )}
    </div>
  );
}
