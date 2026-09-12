import { Router } from "express";
import pool from "../db.js";
import { requireStaff } from "../middleware/auth.js";

const router = Router();
const DAYS = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];

// ── Helpers ───────────────────────────────────────────────────
const getNowSec = () => {
  const ug = new Intl.DateTimeFormat("en-US", {
    timeZone: "Africa/Kampala", hour: "numeric", minute: "numeric", hour12: false
  }).format(new Date());
  const [h, m] = ug.split(":").map(Number);
  return h * 3600 + m * 60;
};

const toSec = (t) => {
  if (!t) return 0;
  const p = t.split(":").map(Number);
  return (p[0]||0)*3600 + (p[1]||0)*60;
};

const fmtTime = (airTime) => {
  const tp = (airTime||"00:00:00").split(":");
  const d  = new Date();
  d.setHours(parseInt(tp[0])||0, parseInt(tp[1])||0, 0);
  return d.toLocaleTimeString("en-US", { hour:"numeric", minute:"2-digit", hour12:true });
};

// Format one show using explicit end_time (admin-set)
const formatShow = (s) => {
  const nowSec   = getNowSec();
  const startSec = toSec(s.air_time);

  // Use admin-set end_time if available, otherwise fall back to duration_min
  let endSec;
  if (s.end_time) {
    endSec = toSec(s.end_time);
    // Handle midnight crossover (end < start means it goes past midnight)
    if (endSec <= startSec) endSec += 86400;
  } else {
    endSec = startSec + (s.duration_min || 60) * 60;
  }

  const durationMin = Math.round((endSec - startSec) / 60);

  let state = "future", progress = 0;
  if (nowSec >= startSec && nowSec < endSec) {
    state    = "current";
    progress = Math.round(((nowSec - startSec) / (endSec - startSec)) * 100);
  } else if (nowSec >= endSec) {
    state = "past";
  }

  return { ...s, state, progress, time: fmtTime(s.air_time), duration: durationMin, duration_min: durationMin };
};

const formatShows = (rows) => {
  const sorted = [...rows].sort((a,b) => toSec(a.air_time) - toSec(b.air_time));
  return sorted.map(s => formatShow(s));
};

// Check if a show belongs to a given day
const showBelongsToDay = (s, day) => {
  const str  = s.days || s.day_of_week || "daily";
  const list = str.split(",").map(x => x.trim());
  return list.includes("daily") || list.includes(day);
};

// ── Overlap check ─────────────────────────────────────────────
// Returns conflicting show title if overlap found, null if clear
const checkOverlap = async (airTime, endTime, days, excludeId = null) => {
  const newStart = toSec(airTime);
  const newEnd   = toSec(endTime);
  if (newEnd <= newStart) return null; // midnight shows — skip check for now

  const [rows] = await pool.query("SELECT * FROM schedule");

  for (const s of rows) {
    if (excludeId && s.id === excludeId) continue;

    // Check if days overlap
    const sDays    = (s.days || s.day_of_week || "daily").split(",").map(x => x.trim());
    const newDays  = days.split(",").map(x => x.trim());
    const dayMatch = sDays.includes("daily") || newDays.includes("daily") ||
                     sDays.some(d => newDays.includes(d));
    if (!dayMatch) continue;

    const existStart = toSec(s.air_time);
    const existEnd   = s.end_time ? toSec(s.end_time) : existStart + (s.duration_min||60)*60;

    // Overlap: new show starts before existing ends AND new show ends after existing starts
    if (newStart < existEnd && newEnd > existStart) {
      return s.title;
    }
  }
  return null;
};

// ── GET /api/schedule/all — admin: returns every show regardless of day ──
router.get("/all", requireStaff, async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM schedule ORDER BY air_time ASC");
    res.json({ schedule: rows.map(s => formatShow(s)) });
  } catch (e) {
    console.error("schedule/all:", e.message);
    res.status(500).json({ error: e.message });
  }
});

// ── GET /api/schedule ─────────────────────────────────────────
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

// ── GET /api/schedule/current ─────────────────────────────────
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

// ── GET /api/schedule/weekly ──────────────────────────────────
router.get("/weekly", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM schedule ORDER BY air_time ASC");
    const grouped = { daily:[], monday:[], tuesday:[], wednesday:[], thursday:[], friday:[], saturday:[], sunday:[] };

    rows.forEach(s => {
      const daysStr = s.days || s.day_of_week || "daily";
      const dayList = daysStr.split(",").map(d => d.trim()).filter(Boolean);
      dayList.forEach(day => {
        const key = grouped[day] !== undefined ? day : "daily";
        if (!grouped[key].find(x => x.id === s.id)) grouped[key].push(s);
      });
    });

    Object.keys(grouped).forEach(key => { grouped[key] = formatShows(grouped[key]); });

    const todayName = new Intl.DateTimeFormat("en-US", {
      timeZone: "Africa/Kampala", weekday: "long"
    }).format(new Date()).toLowerCase();

    res.json({ grouped, today: todayName, days: DAYS });
  } catch (e) {
    console.error("schedule/weekly:", e.message);
    res.status(500).json({ error: e.message });
  }
});

// ── GET /api/schedule/day/:day ────────────────────────────────
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

// ── POST — create ─────────────────────────────────────────────
router.post("/", requireStaff, async (req, res) => {
  try {
    const { air_time, end_time, title, description, duration_min, thumbnail, day_of_week, days, week_notes } = req.body;

    if (!air_time || !title) {
      return res.status(422).json({ error: "air_time and title are required." });
    }
    if (!end_time) {
      return res.status(422).json({ error: "end_time is required. Set when the programme ends." });
    }
    if (toSec(end_time) <= toSec(air_time)) {
      return res.status(422).json({ error: "End time must be after start time." });
    }

    const daysVal = days || day_of_week || "daily";

    // Check for overlap
    const conflict = await checkOverlap(air_time, end_time, daysVal);
    if (conflict) {
      return res.status(409).json({
        error: "Time slot conflict — \"" + conflict + "\" already runs during this time on the selected day(s). Please choose a different time or day."
      });
    }

    // Calculate duration from start/end
    const durationCalc = Math.round((toSec(end_time) - toSec(air_time)) / 60);

    const [r] = await pool.query(
      "INSERT INTO schedule (air_time,end_time,title,description,duration_min,thumbnail,day_of_week,days,week_notes) VALUES (?,?,?,?,?,?,?,?,?)",
      [air_time, end_time, title, description||"", durationCalc, thumbnail||"", daysVal, daysVal, week_notes||""]
    );
    res.status(201).json({ id: r.insertId });
  } catch (e) {
    console.error("schedule POST:", e.message);
    res.status(500).json({ error: "Failed to create show: " + e.message });
  }
});

// ── PUT — update ──────────────────────────────────────────────
router.put("/:id", requireStaff, async (req, res) => {
  try {
    const { air_time, end_time, title, description, thumbnail, day_of_week, days, week_notes } = req.body;

    if (!air_time || !title) {
      return res.status(422).json({ error: "air_time and title are required." });
    }
    if (!end_time) {
      return res.status(422).json({ error: "end_time is required." });
    }
    if (toSec(end_time) <= toSec(air_time)) {
      return res.status(422).json({ error: "End time must be after start time." });
    }

    const daysVal = days || day_of_week || "daily";

    // Check for overlap excluding this show's own ID
    const conflict = await checkOverlap(air_time, end_time, daysVal, parseInt(req.params.id));
    if (conflict) {
      return res.status(409).json({
        error: "Time slot conflict — \"" + conflict + "\" already runs during this time. Please choose a different time."
      });
    }

    const durationCalc = Math.round((toSec(end_time) - toSec(air_time)) / 60);

    await pool.query(
      "UPDATE schedule SET air_time=?,end_time=?,title=?,description=?,duration_min=?,thumbnail=?,day_of_week=?,days=?,week_notes=? WHERE id=?",
      [air_time, end_time, title, description||"", durationCalc, thumbnail||"", daysVal, daysVal, week_notes||"", req.params.id]
    );
    res.json({ success: true });
  } catch (e) {
    console.error("schedule PUT:", e.message);
    res.status(500).json({ error: "Failed to update show: " + e.message });
  }
});

// ── DELETE ────────────────────────────────────────────────────
router.delete("/:id", requireStaff, async (req, res) => {
  try {
    await pool.query("DELETE FROM schedule WHERE id=?", [req.params.id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Failed to delete show." });
  }
});

export default router;