import React, { useState, useEffect } from 'react';
import { Search, Menu, X, LogIn, LogOut, User } from 'lucide-react';
import { authAPI, getToken, getUser, setToken, setUser, removeToken, removeUser } from '../services/api';
import './Header.css';

// ── Public Auth Modal ─────────────────────────────────────────
const PublicAuthModal = ({ onClose, onSuccess }) => {
  const [tab,      setTab]      = useState('signin');
  const [username, setUsername] = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const switchTab = (t) => { setTab(t); setError(''); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      let data;
      if (tab === 'signup') {
        if (username.trim().length < 3) { setError('Username must be at least 3 characters.'); setLoading(false); return; }
        data = await authAPI.register(username.trim(), email.trim(), password);
      } else {
        data = await authAPI.login(email.trim(), password);
      }
      if (!data || !data.user) {
        setError('Unexpected server response. Please try again.');
        setLoading(false);
        return;
      }
      // Persist session
      setToken(data.token);
      const u = { ...data.user, name: data.user.username, avatar: data.user.avatar_url };
      setUser(u);
      onSuccess(u);
      onClose();
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-overlay" onClick={onClose}>
      <div className="auth-popup glass-panel" onClick={e => e.stopPropagation()}>
        <button className="auth-close-btn" onClick={onClose}><X size={18} /></button>

        <div className="auth-tabs">
          <button className={`auth-tab ${tab === 'signin' ? 'active' : ''}`} onClick={() => switchTab('signin')}>Sign In</button>
          <button className={`auth-tab ${tab === 'signup' ? 'active' : ''}`} onClick={() => switchTab('signup')}>Sign Up</button>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          {tab === 'signup' && (
            <input
              type="text" placeholder="Username (3–40 chars)"
              value={username} onChange={e => setUsername(e.target.value)}
              maxLength={40} required autoFocus
            />
          )}
          <input
            type="email" placeholder="Email Address"
            value={email} onChange={e => setEmail(e.target.value)}
            required autoFocus={tab === 'signin'}
          />
          <input
            type="password" placeholder={tab === 'signup' ? 'Password (min 6 chars)' : 'Password'}
            value={password} onChange={e => setPassword(e.target.value)}
            required minLength={6}
          />
          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? 'Please wait…' : tab === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p className="auth-switch">
          {tab === 'signin'
            ? <> Don't have an account? <span onClick={() => switchTab('signup')}>Sign Up</span> </>
            : <> Already have an account? <span onClick={() => switchTab('signin')}>Sign In</span> </>
          }
        </p>
      </div>
    </div>
  );
};

// ── Header ────────────────────────────────────────────────────
const Header = () => {
  const [showAuth,    setShowAuth]    = useState(false);
  const [mobileOpen,  setMobileOpen]  = useState(false);
  const [currentUser, setCurrentUser] = useState(getUser);

  // Restore session on mount
  useEffect(() => {
    if (getToken() && !currentUser) {
      authAPI.me()
        .then(d => {
          const u = { ...d.user, name: d.user.username, avatar: d.user.avatar_url };
          setUser(u); setCurrentUser(u);
        })
        .catch(() => { removeToken(); removeUser(); });
    }
  }, []);

  const handleLogout = () => {
    removeToken(); removeUser(); setCurrentUser(null);
  };

  const handleSuccess = (u) => setCurrentUser(u);

  return (
    <>
      <header className="app-header glass-panel">
        <div className="logo-container">
          <img src="/logo.png" alt="Base2 TV" className="header-logo-img" style={{ height: 40 }} />
        </div>

        <nav className={`main-nav ${mobileOpen ? 'open' : ''}`}>
          <a href="#live"     className="nav-link active" onClick={() => setMobileOpen(false)}>Live</a>
          <a href="#guide"    className="nav-link"        onClick={() => setMobileOpen(false)}>Guide</a>
          <a href="#latest-stories" className="nav-link"   onClick={() => setMobileOpen(false)}>News</a>
          <a href="#catchup"  className="nav-link"        onClick={() => setMobileOpen(false)}>Catch-Up</a>
          <a href="#features" className="nav-link"        onClick={() => setMobileOpen(false)}>Features</a>
          <a href="#contact"  className="nav-link"        onClick={() => setMobileOpen(false)}>Contact</a>
        </nav>

        <div className="header-actions">
          <button className="icon-btn"><Search size={20} /></button>

          {currentUser ? (
            /* ── Logged-in state ── */
            <div className="header-user-pill">
              <img
                src={currentUser.avatar || currentUser.avatar_url ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name || currentUser.username)}&background=e50914&color=fff&size=60`}
                alt={currentUser.name}
                className="header-avatar"
              />
              <span className="header-username">{currentUser.name || currentUser.username}</span>
              <button className="icon-btn" onClick={handleLogout} title="Sign out">
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            /* ── Signed-out state ── */
            <button className="header-signin-btn" onClick={() => setShowAuth(true)}>
              <LogIn size={16} />
              <span>Sign In</span>
            </button>
          )}

          <button className="icon-btn mobile-menu" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {showAuth && (
        <PublicAuthModal
          onClose={() => setShowAuth(false)}
          onSuccess={handleSuccess}
        />
      )}
    </>
  );
};

export default Header;
