import React, { useState, useEffect } from 'react';
import { authAPI, getToken, getUser, setToken, setUser, removeToken, removeUser } from '../services/api';
import AdminSchedule  from './pages/AdminSchedule';
import AdminNews      from './pages/AdminNews';
import AdminFeatured  from './pages/AdminFeatured';
import AdminVideos    from './pages/AdminVideos';
import AdminContacts  from './pages/AdminContacts';
import AdminUsers     from './pages/AdminUsers';
import AdminChatLogs  from './pages/AdminChatLogs';
import AdminSettings  from './pages/AdminSettings';
import AdminAds       from './pages/AdminAds';
import AdminCareers   from './pages/AdminCareers';
import AdminAdvertise from './pages/AdminAdvertise';
import './admin.css';

import {
  LayoutDashboard, CalendarDays, Newspaper, Star,
  Video, Mail, Users, LogOut, Tv, Menu, X, Settings, MessageSquare,
} from 'lucide-react';

const NAV = [
  { key: 'schedule',  label: 'TV Schedule',  icon: CalendarDays },
  { key: 'news',      label: 'News',         icon: Newspaper    },
  { key: 'featured',  label: 'Featured',     icon: Star         },
  { key: 'videos',    label: 'VOD / Videos', icon: Video        },
  { key: 'contacts',  label: 'Inbox',        icon: Mail         },
  { key: 'chatlogs',  label: 'Chat Logs',    icon: MessageSquare },
  { key: 'users',     label: 'Users',        icon: Users        },
  { key: 'settings',  label: 'Site Labels',   icon: Settings     },
  { key: 'ads',       label: 'Adverts',       icon: LayoutDashboard },
  { key: 'careers',   label: 'Careers',       icon: Users        },
  { key: 'advertise', label: 'Ad Enquiries',  icon: Mail         },
];

export default function AdminApp() {
  const [user,       setUserState] = useState(getUser);
  const [page,       setPage]      = useState('schedule');
  const [loginEmail, setEmail]     = useState('');
  const [loginPass,  setPass]      = useState('');
  const [error,      setError]     = useState('');
  const [sideOpen,   setSideOpen]  = useState(false);

  // If token exists try to restore session
  useEffect(() => {
    if (getToken() && !user) {
      authAPI.me()
        .then(d => { setUserState(d.user); setUser(d.user); })
        .catch(() => { removeToken(); removeUser(); });
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const d = await authAPI.login(loginEmail, loginPass);
      if (!d || !d.user) {
        setError('Unexpected server response. Try again.');
        return;
      }
      if (!['admin','manager','staff'].includes(d.user.role)) {
        setError('You do not have staff access.');
        return;
      }
      setToken(d.token);
      setUser(d.user);
      setUserState(d.user);
    } catch (err) {
      setError(err.message || 'Login failed.');
    }
  };

  const handleLogout = () => {
    removeToken(); removeUser(); setUserState(null);
  };

  // ── Login screen ──────────────────────────────────────────
  if (!user || !['admin','manager','staff'].includes(user.role)) {
    return (
      <div className="adm-login-screen">
        <div className="adm-login-box">
          <div className="adm-login-logo">
            <Tv size={32} />
            <span>Base2 TV</span>
          </div>
          <h2>Admin Dashboard</h2>
          <p>Sign in with your admin account</p>
          {error && <div className="adm-error">{error}</div>}
          <form onSubmit={handleLogin} className="adm-login-form">
            <input type="email"    placeholder="Email"    value={loginEmail} onChange={e => setEmail(e.target.value)} required />
            <input type="password" placeholder="Password" value={loginPass}  onChange={e => setPass(e.target.value)}  required />
            <button type="submit">Sign In</button>
          </form>
        </div>
      </div>
    );
  }

  const PageComponent = {
    schedule: AdminSchedule,
    news:     AdminNews,
    featured: AdminFeatured,
    videos:   AdminVideos,
    contacts: AdminContacts,
    users:    AdminUsers,
    settings:  AdminSettings,
    chatlogs: AdminChatLogs,
    ads:       AdminAds,
    careers:   AdminCareers,
    advertise: AdminAdvertise,
  }[page] || AdminSchedule;

  return (
    <div className="adm-layout">

      {/* Mobile overlay */}
      {sideOpen && <div className="adm-overlay" onClick={() => setSideOpen(false)} />}

      {/* Sidebar */}
      <aside className={`adm-sidebar ${sideOpen ? 'open' : ''}`}>
        <div className="adm-sidebar-logo">
          <Tv size={22} />
          <span>Base2 TV Admin</span>
          <button className="adm-close-btn" onClick={() => setSideOpen(false)}><X size={18} /></button>
        </div>

        <nav className="adm-nav">
          {NAV.filter(n => {
            if (user.role === 'staff' && ['schedule','ads','careers','users','settings'].includes(n.key)) return false;
            return true;
          }).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              className={`adm-nav-item ${page === key ? 'active' : ''}`}
              onClick={() => { setPage(key); setSideOpen(false); }}
            >
              <Icon size={18} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="adm-sidebar-footer">
          <img src={user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=e50914&color=fff`} alt="" className="adm-avatar" />
          <div className="adm-user-info">
            <span className="adm-username">{user.username}</span>
            <span className="adm-role">{user.role}</span>
          </div>
          <button className="adm-logout-btn" onClick={handleLogout} title="Sign out">
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="adm-main">
        <header className="adm-topbar">
          <button className="adm-menu-btn" onClick={() => setSideOpen(true)}>
            <Menu size={22} />
          </button>
          <h1 className="adm-page-title">
            {NAV.find(n => n.key === page)?.label}
          </h1>
          <a href="/" target="_blank" rel="noreferrer" className="adm-view-site">
            View Site ↗
          </a>
        </header>

        <div className="adm-content">
          <PageComponent />
        </div>
      </div>
    </div>
  );
}



