import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Users, X, ChevronRight, Reply, CornerUpLeft } from 'lucide-react';
import { scheduleAPI, chatAPI, authAPI, getToken, setToken, setUser, getUser, removeToken, removeUser } from '../services/api';
import './LiveChat.css';

// ── Viewer count simulation ──
// Starts small (3-15) and grows naturally when a show begins
const randomViewerBase = () => Math.floor(Math.random() * 12) + 3; // 3-15 to feel real
const nudgeViewers = (n, target) => {
  // Gradually grow toward target, small random drift
  const drift = n < target
    ? Math.round(n * (Math.random() * 0.12 + 0.03))  // grow faster when small
    : Math.round(n * (Math.random() * 0.04 - 0.02));  // small drift when large
  return Math.max(1, Math.min(8000, n + drift));
};

const LiveChat = () => {
  // ── Auth state ──────────────────────────────────────────────
  const [currentUser, setCurrentUser]   = useState(getUser);
  const [showSignIn, setShowSignIn]     = useState(null);
  const [signupName, setSignupName]     = useState('');
  const [signupEmail, setSignupEmail]   = useState('');
  const [signupPass, setSignupPass]     = useState('');
  const [authMode, setAuthMode]         = useState('guest'); // 'guest' | 'register' | 'login'
  const [authError, setAuthError]       = useState('');

  // ── Chat state ──────────────────────────────────────────────
  const [messages, setMessages]         = useState([]);
  const [inputValue, setInputValue]     = useState('');
  const [currentShow, setCurrentShow]   = useState(null);
  const [replyingTo, setReplyingTo]     = useState(null);
  const [highlightedId, setHighlightedId] = useState(null);
  const [loadingMsgs, setLoadingMsgs]   = useState(false);

  // ── Viewer count ────────────────────────────────────────────
  const [viewerCount, setViewerCount]   = useState(randomViewerBase);
  const viewerTimerRef                  = useRef(null);

  const chatMessagesRef = useRef(null);
  const pollTimerRef    = useRef(null);

  // ── Scroll helpers ──────────────────────────────────────────
  const scrollToBottom = useCallback(() => {
    const el = chatMessagesRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, []);

  const scrollToMessage = useCallback((msgId) => {
    const el   = document.getElementById(`chat-msg-${msgId}`);
    const cont = chatMessagesRef.current;
    if (el && cont) {
      cont.scrollTo({ top: el.offsetTop - cont.offsetTop - 10, behavior: 'smooth' });
      setHighlightedId(msgId);
      setTimeout(() => setHighlightedId(null), 1800);
    }
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  // ── Viewer simulation — starts tiny, grows organically ────
  const startViewerSim = useCallback(() => {
    if (viewerTimerRef.current) clearTimeout(viewerTimerRef.current);
    // Start tiny (3-15), target is a realistic peak for the show
    const target = Math.floor(Math.random() * (3000 - 400 + 1)) + 400;
    let cur = randomViewerBase(); // 3-15
    setViewerCount(cur);
    const tick = () => {
      const delay = cur < 50
        ? Math.floor(Math.random() * 3000) + 1000   // faster growth at start
        : Math.floor(Math.random() * 8000) + 3000;  // slower when established
      viewerTimerRef.current = setTimeout(() => {
        cur = nudgeViewers(cur, target);
        setViewerCount(cur);
        tick();
      }, delay);
    };
    tick();
  }, []);

  useEffect(() => () => {
    if (viewerTimerRef.current) clearTimeout(viewerTimerRef.current);
  }, []);

  // ── Load messages from API for a show ───────────────────────
  const loadMessages = useCallback(async (showId) => {
    setLoadingMsgs(true);
    try {
      const data = await chatAPI.getMessages(showId, 50);
      // Normalise API fields to match our render keys
      const normalised = (data.messages || []).map(m => ({
        id:        m.id,
        programId: m.show_id,
        user:      m.username,
        avatar:    m.avatar_url,
        text:      m.message,
        timestamp: new Date(m.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        replyTo:   m.reply_user
          ? { user: m.reply_user, text: m.reply_text }
          : null,
      }));
      setMessages(normalised);
    } catch {
      // API not reachable yet — show nothing, don't crash
      setMessages([]);
    } finally {
      setLoadingMsgs(false);
    }
  }, []);

  // ── Poll for new messages every 8 s while a show is active ──
  const startPolling = useCallback((showId) => {
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    pollTimerRef.current = setInterval(async () => {
      try {
        const data = await chatAPI.getMessages(showId, 50);
        const normalised = (data.messages || []).map(m => ({
          id:        m.id,
          programId: m.show_id,
          user:      m.username,
          avatar:    m.avatar_url,
          text:      m.message,
          timestamp: new Date(m.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          replyTo:   m.reply_user ? { user: m.reply_user, text: m.reply_text } : null,
        }));
        setMessages(normalised);
      } catch { /* silent */ }
    }, 30000); // 30s polling — reduces server load
  }, []);

  useEffect(() => () => {
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
  }, []);

  // ── Detect current show (from API, falls back to static) ────
  useEffect(() => {
    const detect = async () => {
      try {
        const data = await scheduleAPI.getCurrent();
        const show = data.show || null;
        setCurrentShow(prev => {
          if (show?.id !== prev?.id) {
            if (show) {
              loadMessages(show.id);
              startPolling(show.id);
              startViewerSim(randomViewerBase());
            } else {
              setMessages([]);
              if (pollTimerRef.current)  clearInterval(pollTimerRef.current);
              if (viewerTimerRef.current) clearTimeout(viewerTimerRef.current);
              setViewerCount(0);
            }
          }
          return show;
        });
      } catch {
        // API offline — clear everything gracefully
        setCurrentShow(null);
        setMessages([]);
      }
    };
    detect();
    const interval = setInterval(detect, 300000) // 5 min — show changes rarely;
    return () => clearInterval(interval);
  }, [loadMessages, startPolling, startViewerSim]);

  // ── Auth: guest name sign-in ─────────────────────────────────
  const handleGuestSignIn = (e) => {
    e.preventDefault();
    if (!signupName.trim()) return;
    const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(signupName.trim())}&background=333&color=fff&size=100`;
    const user = { name: signupName.trim(), avatar, isGuest: true };
    setCurrentUser(user);
    setUser(user);
    setShowSignIn(null);
    setSignupName('');
    setAuthError('');
  };

  // ── Auth: register full account ──────────────────────────────
  const handleRegister = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      const data = await authAPI.register(signupName.trim(), signupEmail.trim(), signupPass);
      setToken(data.token);
      const user = { ...data.user, name: data.user.username, avatar: data.user.avatar_url, isGuest: false };
      setCurrentUser(user);
      setUser(user);
      setShowSignIn(null);
    } catch (err) {
      setAuthError(err.message);
    }
  };

  // ── Auth: login existing account ─────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      const data = await authAPI.login(signupEmail.trim(), signupPass);
      setToken(data.token);
      const user = { ...data.user, name: data.user.username, avatar: data.user.avatar_url, isGuest: false };
      setCurrentUser(user);
      setUser(user);
      setShowSignIn(null);
    } catch (err) {
      setAuthError(err.message);
    }
  };

  const handleSignOut = () => {
    removeToken();
    removeUser();
    setCurrentUser(null);
  };

  // ── Send message ─────────────────────────────────────────────
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || !currentUser) return;

    const text = inputValue.trim();
    setInputValue('');

    // Optimistic UI — add immediately
    const tempMsg = {
      id:        Date.now(),
      programId: currentShow.id,
      user:      currentUser.name,
      avatar:    currentUser.avatar,
      text,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      replyTo:   replyingTo ? { user: replyingTo.user, text: replyingTo.text } : null,
    };
    setMessages(prev => [...prev, tempMsg]);
    setReplyingTo(null);

    try {
      await chatAPI.sendMessage(
        currentShow.id,
        text,
        currentUser.isGuest ? currentUser.name : '',
        replyingTo?.id ?? null
      );
    } catch {
      // Message failed — remove optimistic entry
      setMessages(prev => prev.filter(m => m.id !== tempMsg.id));
    }
  };

  const handleReply = (msg) => {
    setReplyingTo(msg);
    document.getElementById('chat-input')?.focus();
  };

  // Show all messages — no filter by show ID so chat history is never cleared when admin edits a show
  const activeMessages = messages;


  // ── Render ───────────────────────────────────────────────────
  return (
    <div className="live-chat-container glass-panel">

      {/* Header */}
      <div className="chat-header">
        <div className="chat-header-info">
          <div className="chat-title-row">
            <span className="chat-live-dot" />
            <h3>Live Chat</h3>
          </div>
          {currentShow
            ? <span className="chat-subtitle">Now: {currentShow.title}</span>
            : <span className="chat-subtitle offline">No broadcast right now</span>
          }
        </div>
        {viewerCount > 0 && currentShow && (
          <div className="viewers-count viewers-live">
            <Users size={14} />
            <span key={viewerCount} className="viewers-number">{viewerCount.toLocaleString()}</span>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="chat-messages" ref={chatMessagesRef}>
        {!currentShow ? (
          <div className="chat-status-msg">
            <p>💤 Chat is offline</p>
            <span>Opens when the next program begins</span>
          </div>
        ) : loadingMsgs ? (
          <div className="chat-status-msg"><p>Loading chat…</p></div>
        ) : activeMessages.length === 0 ? (
          <div className="chat-status-msg">
            <p>👋 Welcome to {currentShow.title}!</p>
            <span>Be the first to send a message.</span>
          </div>
        ) : (
          activeMessages.map(msg => (
            <div
              key={msg.id}
              id={`chat-msg-${msg.id}`}
              className={`chat-message ${currentUser?.name === msg.user ? 'own-message' : ''} ${highlightedId === msg.id ? 'highlighted' : ''}`}
            >
              <img src={msg.avatar} alt={msg.user} className="chat-avatar" />
              <div className="chat-message-content">
                <div className="chat-message-header">
                  <span className="chat-username">{msg.user}</span>
                  <span className="chat-timestamp">{msg.timestamp}</span>
                </div>

                {msg.replyTo && (
                  <div
                    className="reply-quote"
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      const orig = activeMessages.find(
                        m => m.user === msg.replyTo.user && m.text === msg.replyTo.text
                      );
                      if (orig) scrollToMessage(orig.id);
                    }}
                  >
                    <CornerUpLeft size={11} />
                    <div className="reply-quote-inner">
                      <span className="reply-quote-user">{msg.replyTo.user}</span>
                      <span className="reply-quote-text">{msg.replyTo.text}</span>
                    </div>
                  </div>
                )}

                <p className={`chat-text ${msg.failed ? "chat-text-failed" : ""}`}>{msg.text}</p>
                {msg.failed && (
                  <span className="chat-failed-label">⚠ Not sent — tap to retry</span>
                )}
                {currentShow && (
                  <button className="reply-btn" onClick={() => handleReply(msg)}>
                    <Reply size={12} /> Reply
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="chat-footer">
        {!currentShow ? (
          <div className="chat-locked-bar">Chat opens when broadcast begins</div>

        ) : showSignIn === 'bar' ? (
          /* ── Sign-in / Register / Login form ── */
          <div className="inline-signin-form">
            <div className="inline-signin-header">
              <div className="auth-tabs">
                <button className={authMode === 'guest'    ? 'auth-tab active' : 'auth-tab'} onClick={() => { setAuthMode('guest');    setAuthError(''); }}>Guest</button>
                <button className={authMode === 'register' ? 'auth-tab active' : 'auth-tab'} onClick={() => { setAuthMode('register'); setAuthError(''); }}>Register</button>
                <button className={authMode === 'login'    ? 'auth-tab active' : 'auth-tab'} onClick={() => { setAuthMode('login');    setAuthError(''); }}>Login</button>
              </div>
              <button type="button" className="cancel-signin" onClick={() => setShowSignIn(null)}>
                <X size={14} />
              </button>
            </div>

            {authError && <p className="auth-error">{authError}</p>}

            {authMode === 'guest' && (
              <form className="inline-signin-row" onSubmit={handleGuestSignIn}>
                <input type="text" placeholder="Display name…" value={signupName}
                  onChange={e => setSignupName(e.target.value)} maxLength={20} autoFocus />
                <button type="submit" disabled={!signupName.trim()} className="signin-submit-btn">
                  <ChevronRight size={18} />
                </button>
              </form>
            )}

            {authMode === 'register' && (
              <form className="auth-form" onSubmit={handleRegister}>
                <input type="text"     placeholder="Username"  value={signupName}  onChange={e => setSignupName(e.target.value)}  maxLength={40} required />
                <input type="email"    placeholder="Email"     value={signupEmail} onChange={e => setSignupEmail(e.target.value)} required />
                <input type="password" placeholder="Password (min 6)" value={signupPass} onChange={e => setSignupPass(e.target.value)} required />
                <button type="submit" className="signin-submit-btn full-width">Create Account</button>
              </form>
            )}

            {authMode === 'login' && (
              <form className="auth-form" onSubmit={handleLogin}>
                <input type="email"    placeholder="Email"    value={signupEmail} onChange={e => setSignupEmail(e.target.value)} required />
                <input type="password" placeholder="Password" value={signupPass}  onChange={e => setSignupPass(e.target.value)}  required />
                <button type="submit" className="signin-submit-btn full-width">Sign In</button>
              </form>
            )}
          </div>

        ) : !currentUser ? (
          <button className="join-chat-btn" onClick={() => setShowSignIn('bar')}>
            Join the conversation — Sign in to chat
          </button>

        ) : (
          <form onSubmit={handleSendMessage} className="chat-form-wrapper">
            {replyingTo && (
              <div className="reply-preview">
                <div className="reply-preview-inner">
                  <CornerUpLeft size={13} />
                  <div>
                    <span className="reply-preview-user">Replying to {replyingTo.user}</span>
                    <span className="reply-preview-text">{replyingTo.text}</span>
                  </div>
                </div>
                <button type="button" className="cancel-reply-btn" onClick={() => setReplyingTo(null)}>
                  <X size={14} />
                </button>
              </div>
            )}
            <div className="chat-form">
              <img src={currentUser.avatar} alt="You" className="current-user-avatar" />
              <input
                id="chat-input"
                type="text"
                placeholder={replyingTo ? `Reply to ${replyingTo.user}…` : `Chat as ${currentUser.name}…`}
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                maxLength={500}
              />
              <button type="submit" className="send-btn" disabled={!inputValue.trim()}>
                <Send size={16} />
              </button>
            </div>
            {!currentUser.isGuest && (
              <button type="button" className="signout-link" onClick={handleSignOut}>Sign out</button>
            )}
          </form>
        )}
      </div>
    </div>
  );
};

export default LiveChat;
