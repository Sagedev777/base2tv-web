import React, { useState, useEffect, useCallback } from "react";
import { Activity, Wifi, Users, RefreshCw } from "lucide-react";
import "./AudienceStats.css";

const clamp = (v, mn, mx) => Math.min(Math.max(v, mn), mx);
const nudge = (cur, mn, mx) => clamp(Math.round(cur + cur * (Math.random() * 0.06 - 0.03)), mn, mx);
const fmt   = (n) => n >= 1000 ? (n / 1000).toFixed(1) + "k" : n.toString();

const REFRESH = 30;
const PLATFORMS = [
  { key: "freeToAir", label: "Free to Air", Icon: () => <Activity size={11}/>, min: 50000,  max: 100000, color: "#e50914" },
  { key: "gotv",      label: "GOtv",        Icon: () => <img src="/assets/logos/gotv.png"      alt="GOtv"      style={{width:14,height:14,objectFit:"contain"}}/>, min: 500,   max: 50000,  color: "#f5a623" },
  { key: "zuku",      label: "Zuku",        Icon: () => <img src="/assets/logos/zuku.jpg"      alt="Zuku"      style={{width:14,height:14,objectFit:"contain",borderRadius:2}}/>, min: 800, max: 2000, color: "#4a90e2" },
  { key: "startimes", label: "StarTimes",   Icon: () => <img src="/assets/logos/startimes.png" alt="StarTimes" style={{width:14,height:14,objectFit:"contain"}}/>, min: 800, max: 2000, color: "#7ed321" },
  { key: "online",    label: "Online",      Icon: () => <Wifi size={11}/>, min: 5000, max: 10000, color: "#50e3c2" },
];

const seed = () => PLATFORMS.reduce((a, p) => { a[p.key] = Math.floor(Math.random() * (p.max - p.min + 1)) + p.min; return a; }, {});

export default function AudienceStats() {
  const [stats,     setStats]     = useState(seed);
  const [prevStats, setPrevStats] = useState(null);
  const [countdown, setCountdown] = useState(REFRESH);
  const [flashKeys, setFlashKeys] = useState({});

  const refresh = useCallback(() => {
    setStats(prev => {
      const next = PLATFORMS.reduce((a, p) => { a[p.key] = nudge(prev[p.key], p.min, p.max); return a; }, {});
      const f    = PLATFORMS.reduce((a, p) => { a[p.key] = next[p.key] >= prev[p.key] ? "up" : "down"; return a; }, {});
      setPrevStats(prev); setFlashKeys(f);
      setTimeout(() => setFlashKeys({}), 1200);
      return next;
    });
    setCountdown(REFRESH);
  }, []);

  useEffect(() => { const t = setInterval(refresh, REFRESH * 1000); return () => clearInterval(t); }, [refresh]);
  useEffect(() => { const t = setInterval(() => setCountdown(c => c > 0 ? c - 1 : 0), 1000); return () => clearInterval(t); }, []);

  const total = PLATFORMS.reduce((s, p) => s + stats[p.key], 0);

  return (
    <div className="audience-strip">
      {/* Total + refresh */}
      <div className="as-total">
        <Users size={11} className="as-icon-red" />
        <span className="as-total-num">{fmt(total)}</span>
        <span className="as-total-label">watching</span>
        <span className="as-sep">·</span>
        <RefreshCw size={9} className={countdown <= 3 ? "as-spin" : "as-muted"} />
        <span className="as-muted">{countdown}s</span>
      </div>

      <span className="as-divider" />

      {/* Platform pills */}
      {PLATFORMS.map(p => {
        const { Icon } = p;
        const curr  = stats[p.key];
        const prev  = prevStats?.[p.key];
        const diff  = prev != null ? curr - prev : 0;
        const flash = flashKeys[p.key];
        return (
          <div key={p.key} className={`as-pill ${flash ? "as-flash-" + flash : ""}`} style={{"--pc": p.color}}>
            <span className="as-pill-icon"><Icon /></span>
            <span className="as-pill-label">{p.label}</span>
            <span key={curr} className="as-pill-num">{fmt(curr)}</span>
            {diff !== 0 && (
              <span className={`as-pill-delta ${diff > 0 ? "as-up" : "as-down"}`}>
                {diff > 0 ? "▲" : "▼"}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
