// ============================================================
//  useSettings.js  — fetch site labels from the database
// ============================================================
import { useState, useEffect } from "react";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const cache = {};

export function useSettings() {
  const [map, setMap] = useState(cache.data || {});

  useEffect(() => {
    if (cache.data) { setMap(cache.data); return; }
    fetch(`${BASE}/settings`)
      .then(r => r.json())
      .then(d => {
        cache.data = d.settings || {};
        setMap(cache.data);
      })
      .catch(() => {});
  }, []);

  return (key, fallback = "") => map[key] ?? fallback;
}