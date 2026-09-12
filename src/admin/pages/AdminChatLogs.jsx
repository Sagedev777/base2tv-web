import React, { useState, useEffect } from "react";
import { adminAPI } from "../../services/api";
import { MessageSquare, RefreshCw, Trash2, Search, ChevronDown, ChevronUp } from "lucide-react";

export default function AdminChatLogs() {
  const [shows,      setShows]      = useState([]);
  const [messages,   setMessages]   = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedTitle, setSelectedTitle] = useState("");
  const [loading,    setLoading]    = useState(false);
  const [search,     setSearch]     = useState("");
  const [error,      setError]      = useState("");

  // Load today's schedule to list shows
  useEffect(() => {
    adminAPI.schedule.getAll()
      .then(d => setShows(d.schedule || []))
      .catch(e => setError(e.message));
  }, []);

  const loadMessages = async (showId, title) => {
    if (selectedId === showId) { setSelectedId(null); setMessages([]); return; }
    setLoading(true); setSelectedId(showId); setSelectedTitle(title); setMessages([]);
    try {
      const BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      const r    = await fetch(`${BASE}/chat?show_id=${showId}&limit=200`, {
        headers: { Authorization: "Bearer " + localStorage.getItem("b2tv_token") }
      });
      const d = await r.json();
      setMessages(d.messages || []);
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const deleteMsg = async (msgId) => {
    if (!confirm("Delete this message?")) return;
    try {
      const BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      await fetch(`${BASE}/chat/${msgId}`, {
        method: "DELETE",
        headers: { Authorization: "Bearer " + localStorage.getItem("b2tv_token") }
      });
      setMessages(prev => prev.filter(m => m.id !== msgId));
    } catch(e) { setError(e.message); }
  };

  const fmt = (dt) => dt ? new Date(dt).toLocaleString("en-UG", { dateStyle:"short", timeStyle:"short" }) : "";

  const filtered = messages.filter(m =>
    !search ||
    (m.username||"").toLowerCase().includes(search.toLowerCase()) ||
    (m.message ||"").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="adm-page">
      <div className="adm-page-header">
        <h2>Chat Logs</h2>
        <span className="adm-muted" style={{fontSize:".82rem"}}>Click a programme to view its chat</span>
      </div>

      {error && <div className="adm-error">{error}</div>}

      {/* General chat */}
      <div
        className={`adm-chat-show-row ${selectedId === 0 ? "selected" : ""}`}
        onClick={() => loadMessages(0, "General Chat (no programme)")}
      >
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <MessageSquare size={16} style={{color:"#50e3c2"}}/>
          <span className="adm-bold">General Chat</span>
          <span className="adm-muted" style={{fontSize:".75rem"}}>Messages sent outside a programme</span>
        </div>
        {selectedId === 0 ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
      </div>

      {/* Show list */}
      <div style={{display:"flex",flexDirection:"column",gap:6,marginTop:4}}>
        {shows.map(show => (
          <div key={show.id}>
            <div
              className={`adm-chat-show-row ${selectedId === show.id ? "selected" : ""}`}
              onClick={() => loadMessages(show.id, show.title)}
            >
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <MessageSquare size={16} style={{color:"var(--accent)"}}/>
                <span className="adm-bold">{show.title}</span>
                <span className="adm-badge" style={{fontSize:".62rem",textTransform:"capitalize"}}>
                  {show.state}
                </span>
                <span className="adm-muted" style={{fontSize:".75rem"}}>{show.time}</span>
              </div>
              {selectedId === show.id ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
            </div>

            {/* Messages panel */}
            {selectedId === show.id && (
              <div className="adm-chat-messages-panel">
                <MessagesList
                  title={selectedTitle}
                  messages={filtered}
                  loading={loading}
                  search={search}
                  onSearch={setSearch}
                  onDelete={deleteMsg}
                  onRefresh={() => loadMessages(show.id, show.title)}
                  fmt={fmt}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* General chat messages panel */}
      {selectedId === 0 && (
        <div className="adm-chat-messages-panel">
          <MessagesList
            title="General Chat"
            messages={filtered}
            loading={loading}
            search={search}
            onSearch={setSearch}
            onDelete={deleteMsg}
            onRefresh={() => loadMessages(0, "General Chat")}
            fmt={fmt}
          />
        </div>
      )}
    </div>
  );
}

function MessagesList({ title, messages, loading, search, onSearch, onDelete, onRefresh, fmt }) {
  return (
    <div style={{padding:"14px",borderTop:"1px solid rgba(255,255,255,.06)"}}>
      {/* Toolbar */}
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12,flexWrap:"wrap"}}>
        <span style={{fontSize:".8rem",fontWeight:700,color:"rgba(255,255,255,.5)"}}>
          {messages.length} message{messages.length !== 1 ? "s" : ""}
        </span>
        <div style={{display:"flex",alignItems:"center",gap:6,background:"rgba(255,255,255,.04)",
          border:"1px solid rgba(255,255,255,.08)",borderRadius:8,padding:"5px 10px",flex:1,maxWidth:280}}>
          <Search size={13} style={{color:"rgba(255,255,255,.3)",flexShrink:0}}/>
          <input
            type="text" placeholder="Search messages or usernames..."
            value={search} onChange={e => onSearch(e.target.value)}
            style={{background:"none",border:"none",color:"white",outline:"none",
              fontSize:".8rem",width:"100%",fontFamily:"inherit"}}
          />
        </div>
        <button className="adm-btn-ghost" onClick={onRefresh} style={{padding:"5px 10px",fontSize:".78rem"}}>
          <RefreshCw size={13}/> Refresh
        </button>
      </div>

      {loading ? (
        <div className="adm-loader">Loading messages...</div>
      ) : messages.length === 0 ? (
        <div className="adm-empty">
          <MessageSquare size={32} opacity={0.3}/>
          <p>{search ? "No messages match your search." : "No messages in this chat."}</p>
        </div>
      ) : (
        <div style={{display:"flex",flexDirection:"column",gap:6,maxHeight:400,overflowY:"auto"}}>
          {messages.map(msg => (
            <div key={msg.id} style={{
              display:"flex",alignItems:"flex-start",gap:10,
              padding:"8px 10px",borderRadius:8,
              background:"rgba(255,255,255,.03)",
              border:"1px solid rgba(255,255,255,.05)",
            }}>
              {msg.avatar_url && (
                <img src={msg.avatar_url} alt="" style={{width:28,height:28,borderRadius:"50%",
                  objectFit:"cover",flexShrink:0}}/>
              )}
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:2,flexWrap:"wrap"}}>
                  <span style={{fontWeight:700,fontSize:".8rem",color:"white"}}>{msg.username||"Guest"}</span>
                  <span style={{fontSize:".68rem",color:"rgba(255,255,255,.3)"}}>{fmt(msg.created_at)}</span>
                  {msg.reply_user && (
                    <span style={{fontSize:".68rem",color:"rgba(255,255,255,.3)"}}>
                      ↩ replied to {msg.reply_user}
                    </span>
                  )}
                </div>
                <p style={{margin:0,fontSize:".85rem",color:"rgba(255,255,255,.8)",
                  wordBreak:"break-word",lineHeight:1.4}}>{msg.message}</p>
              </div>
              <button
                onClick={() => onDelete(msg.id)}
                style={{background:"none",border:"none",color:"rgba(255,255,255,.2)",
                  cursor:"pointer",padding:4,flexShrink:0,transition:"color .2s"}}
                onMouseOver={e=>e.currentTarget.style.color="#ff5252"}
                onMouseOut={e=>e.currentTarget.style.color="rgba(255,255,255,.2)"}
                title="Delete message"
              >
                <Trash2 size={13}/>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}