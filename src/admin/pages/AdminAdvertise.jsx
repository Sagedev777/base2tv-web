import React, { useState, useEffect } from "react";
import { advertiseAPI } from "../../services/api";
import { Trash2, RefreshCw, Mail, MailOpen } from "lucide-react";

export default function AdminAdvertise() {
  const [items,    setItems]    = useState([]);
  const [total,    setTotal]    = useState(0);
  const [unread,   setUnread]   = useState(0);
  const [offset,   setOffset]   = useState(0);
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState(null);
  const [error,    setError]    = useState("");
  const LIMIT = 20;

  const load = async (off=offset) => {
    setLoading(true);
    try {
      const d = await advertiseAPI.getAll(LIMIT, off);
      setItems(d.enquiries||[]); setTotal(d.total||0); setUnread(d.unread||0);
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(()=>{ load(); },[offset]);

  const open = async (row) => {
    setSelected(row);
    if (!row.is_read) {
      try {
        await advertiseAPI.markRead(row.id);
        setItems(prev=>prev.map(m=>m.id===row.id?{...m,is_read:1}:m));
        setUnread(u=>Math.max(0,u-1));
      } catch {}
    }
  };

  const remove = async (id) => {
    if (!confirm("Delete this enquiry?")) return;
    try { await advertiseAPI.remove(id); if(selected?.id===id) setSelected(null); load(); }
    catch(e) { setError(e.message); }
  };

  const fmt = (dt) => dt ? new Date(dt).toLocaleString("en-UG",{dateStyle:"medium",timeStyle:"short"}) : "";

  return (
    <div className="adm-page">
      <div className="adm-page-header">
        <h2>Advertising Enquiries {unread>0&&<span className="adm-unread-badge">{unread} new</span>}</h2>
        <button className="adm-btn-ghost" onClick={()=>load()}><RefreshCw size={14}/></button>
      </div>

      {error && <div className="adm-error">{error}</div>}

      <div className="adm-inbox-layout">
        <div className="adm-inbox-list">
          {loading ? <div className="adm-loader">Loading...</div> : items.length===0 ? (
            <div className="adm-empty">No enquiries yet.</div>
          ) : items.map(row=>(
            <div key={row.id}
              className={`adm-inbox-row ${!row.is_read?"unread":""} ${selected?.id===row.id?"selected":""}`}
              onClick={()=>open(row)}>
              <div className="adm-inbox-row-top">
                <span className="adm-inbox-name">{row.name}{row.company&&` — ${row.company}`}</span>
                <span className="adm-inbox-time">{fmt(row.created_at)}</span>
              </div>
              <div className="adm-inbox-subject">{row.ad_type||"Advertising Enquiry"}</div>
              <div className="adm-inbox-preview">{row.message?.slice(0,80)}...</div>
            </div>
          ))}
          <div className="adm-pagination">
            <button disabled={offset===0} onClick={()=>setOffset(o=>Math.max(0,o-LIMIT))}>← Prev</button>
            <span>{Math.min(offset+1,total)}–{Math.min(offset+LIMIT,total)} of {total}</span>
            <button disabled={offset+LIMIT>=total} onClick={()=>setOffset(o=>o+LIMIT)}>Next →</button>
          </div>
        </div>

        <div className="adm-inbox-detail">
          {!selected ? (
            <div className="adm-empty" style={{margin:"auto"}}>
              <Mail size={40} style={{opacity:.3,marginBottom:12}}/>
              <p>Select an enquiry to read it</p>
            </div>
          ) : (
            <>
              <div className="adm-inbox-detail-header">
                <div>
                  <h3>{selected.ad_type||"Advertising Enquiry"}</h3>
                  <span className="adm-muted">From: <strong>{selected.name}</strong>{selected.company&&` (${selected.company})`}</span>
                  <br/>
                  <span className="adm-muted">Email: <strong>{selected.email}</strong></span>
                  {selected.phone && <><br/><span className="adm-muted">Phone: <strong>{selected.phone}</strong></span></>}
                  {selected.budget && <><br/><span className="adm-muted">Budget: <strong>{selected.budget}</strong></span></>}
                  <br/>
                  <span className="adm-muted">{fmt(selected.created_at)}</span>
                </div>
                <button className="adm-icon-btn danger" onClick={()=>remove(selected.id)}><Trash2 size={16}/></button>
              </div>
              <div className="adm-inbox-body" style={{marginTop:16}}>{selected.message}</div>
              <a href={`mailto:${selected.email}?subject=Re: ${encodeURIComponent(selected.ad_type||"Your Advertising Enquiry")}`}
                className="adm-btn-primary"
                style={{display:"inline-flex",alignItems:"center",gap:6,textDecoration:"none",marginTop:16}}>
                <MailOpen size={15}/> Reply by Email
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}