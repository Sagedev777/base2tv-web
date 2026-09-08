import { Router } from "express";
import pool from "../db.js";
import { requireAdmin } from "../middleware/auth.js";

const router = Router();
const DAYS = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];

const getNowSec = () => {
  const ug = new Intl.DateTimeFormat("en-US", {
    timeZone: "Africa/Kampala", hour: "numeric", minute: "numeric", hour12: false
  }).format(new Date());
  const [h, m] = ug.split(":").map(Number);
  return h * 3600 + m * 60;
};

const toSec = (airTime) => {
  const parts = (airTime || "00:00:00").split(":").map(Number);
  return (parts[0] || 0) * 3600 + (parts[1] || 0) * 60;
};

const formatShow = (s, nextStartSec = null) => {
  const nowSec   = getNowSec();
  const startSec = toSec(s.air_time);
  let durationSec = (s.duration_min || 60) * 60;
  if (nextStartSec !== null && nextStartSec > startSec) {
    durationSec = nextStartSec - startSec;
  }
  const durationMin = Math.round(durationSec / 60);
  const endSec = startSec + durationSec;
  let state = "future", progress = 0;
  if (nowSec >= startSec && nowSec < endSec) {
    state = "current";
    progress = Math.round(((nowSec - startSec) / durationSec) * 100);
  } else if (nowSec >= endSec) {
    state = "past";
  }
  const d = new Date();
  const tp = (s.air_time || "00:00:00").split(":");
  d.setHours(parseInt(tp[0]) || 0, parseInt(tp[1]) || 0, 0);
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  return { ...s, state, progress, time, duration: durationMin, duration_min: durationMin };
};

const formatShows = (rows) => {
  const sorted = [...rows].sort((a, b) => toSec(a.air_time) - toSec(b.air_time));
  return sorted.map((s, i) => {
    const next = sorted[i + 1] || null;
    const nextSec = next ? toSec(next.air_time) : null;
    return formatShow(s, nextSec);
  });
};

// Check if a show belongs to a given day (checks both 'days' and 'day_of_week')
const showBelongsToDay = (s, day) => {
  const daysStr = s.days || s.day_of_week || "daily";
  const list = daysStr.split(",").map(x => x.trim());
  return list.includes("daily") || list.includes(day);
};

// GET /api/schedule — today's shows
router.get("/", async (req, res) => {
  try {
    const ugDay = new Intl.DateTimeFormat("en-US", {
      timeZone: "Africa/Kampala", weekday: "long"
    }).format(new Date()).toLowerCase();

    const [rows] = await pool.query("SELECT * FROM schedule ORDER BY air_time ASC");
    const filtered = rows.filter(s => showBelongsToDay(s, ugDay));
    res.json({ schedule: formatShows(filtered), today: ugDay });
  } catch (e) {
    console.error("schedule GET:", e.message);
    res.status(500).json({ error: e.message });
  }
});

// GET /api/schedule/current
router.get("/current", async (req, res) => {
  try {
    const ugDay = new Intl.DateTimeFormat("en-US", {
      timeZone: "Africa/Kampala", weekday: "long"
    }).format(new Date()).toLowerCase();

    const [rows] = await pool.query("SELECT * FROM schedule ORDER BY air_time ASC");
    const filtered  = rows.filter(s => showBelongsToDay(s, ugDay));
    const formatted = formatShows(filtered);
    const current   = formatted.find(s => s.state === "current") || null;
    res.json({ show: current });
  } catch (e) {
    console.error("schedule/current:", e.message);
    res.status(500).json({ error: e.message });
  }
});

// GET /api/schedule/weekly
router.get("/weekly", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM schedule ORDER BY air_time ASC");
    const grouped = { daily:[], monday:[], tuesday:[], wednesday:[], thursday:[], friday:[], saturday:[], sunday:[] };

    rows.forEach(s => {
      const daysStr = s.days || s.day_of_week || "daily";
      const dayList = daysStr.split(",").map(d => d.trim()).filter(Boolean);
      dayList.forEach(day => {
        const key = grouped[day] !== undefined ? day : "daily";
        if (!grouped[key].find(x => x.id === s.id)) {
          grouped[key].push(s);
        }
      });
    });

    Object.keys(grouped).forEach(key => {
      grouped[key] = formatShows(grouped[key]);
    });

    const todayName = new Intl.DateTimeFormat("en-US", {
      timeZone: "Africa/Kampala", weekday: "long"
    }).format(new Date()).toLowerCase();

    res.json({ grouped, today: todayName, days: DAYS });
  } catch (e) {
    console.error("schedule/weekly:", e.message);
    res.status(500).json({ error: e.message });
  }
});

// GET /api/schedule/day/:day
router.get("/day/:day", async (req, res) => {
  try {
    const day = req.params.day.toLowerCase();
    if (!DAYS.includes(day) && day !== "daily") {
      return res.status(422).json({ error: "Invalid day." });
    }
    const [rows] = await pool.query("SELECT * FROM schedule ORDER BY air_time ASC");
    const filtered = rows.filter(s => showBelongsToDay(s, day));
    res.json({ schedule: formatShows(filtered), day });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST — create
router.post("/", requireAdmin, async (req, res) => {
  try {
    const { air_time, title, description, duration_min, thumbnail, day_of_week, days, week_notes } = req.body;
    if (!air_time || !title) return res.status(422).json({ error: "air_time and title are required." });
    const daysVal = days || day_of_week || "daily";
    const [r] = await pool.query(
      "INSERT INTO schedule (air_time,title,description,duration_min,thumbnail,day_of_week,days,week_notes) VALUES (?,?,?,?,?,?,?,?)",
      [air_time, title, description||"", duration_min||60, thumbnail||"", daysVal, daysVal, week_notes||""]
    );
    res.status(201).json({ id: r.insertId });
  } catch (e) {
    console.error("schedule POST:", e.message);
    res.status(500).json({ error: "Failed to create show." });
  }
});

// PUT — update
router.put("/:id", requireAdmin, async (req, res) => {
  try {
    const { air_time, title, description, duration_min, thumbnail, day_of_week, days, week_notes } = req.body;
    if (!air_time || !title) return res.status(422).json({ error: "air_time and title are required." });
    const daysVal = days || day_of_week || "daily";
    await pool.query(
      "UPDATE schedule SET air_time=?,title=?,description=?,duration_min=?,thumbnail=?,day_of_week=?,days=?,week_notes=? WHERE id=?",
      [air_time, title, description||"", duration_min||60, thumbnail||"", daysVal, daysVal, week_notes||"", req.params.id]
    );
    res.json({ success: true });
  } catch (e) {
    console.error("schedule PUT:", e.message);
    res.status(500).json({ error: "Failed to update show." });
  }
});

// DELETE
router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    await pool.query("DELETE FROM schedule WHERE id=?", [req.params.id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Failed to delete show." });
  }
});

export default router;