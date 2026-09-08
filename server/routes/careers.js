import { Router } from "express";
import pool       from "../db.js";
import { requireAdmin } from "../middleware/auth.js";

const router = Router();

// GET /api/careers — active public jobs
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id,title,department,location,type,description,requirements,salary_range,deadline,posted_at FROM careers WHERE is_active=1 AND (deadline IS NULL OR deadline >= CURDATE()) ORDER BY posted_at DESC"
    );
    res.json({ jobs: rows });
  } catch (e) {
    console.error("careers GET:", e.message);
    res.status(500).json({ error: "Failed to load jobs." });
  }
});

// GET /api/careers/all — admin all jobs
router.get("/all", requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM careers ORDER BY posted_at DESC");
    res.json({ jobs: rows });
  } catch (e) {
    res.status(500).json({ error: "Failed to load jobs." });
  }
});

// POST — create
router.post("/", requireAdmin, async (req, res) => {
  try {
    const { title, department, location, type, description, requirements, salary_range, deadline, is_active } = req.body;
    if (!title || !description)
      return res.status(422).json({ error: "title and description are required." });
    const [r] = await pool.query(
      "INSERT INTO careers (title,department,location,type,description,requirements,salary_range,deadline,is_active) VALUES (?,?,?,?,?,?,?,?,?)",
      [title, department||"General", location||"Kampala, Uganda", type||"Full-time", description, requirements||"", salary_range||"", deadline||null, is_active??1]
    );
    res.status(201).json({ id: r.insertId });
  } catch (e) {
    console.error("careers POST:", e.message);
    res.status(500).json({ error: "Failed to create job." });
  }
});

// PUT — update
router.put("/:id", requireAdmin, async (req, res) => {
  try {
    const { title, department, location, type, description, requirements, salary_range, deadline, is_active } = req.body;
    if (!title || !description)
      return res.status(422).json({ error: "title and description are required." });
    await pool.query(
      "UPDATE careers SET title=?,department=?,location=?,type=?,description=?,requirements=?,salary_range=?,deadline=?,is_active=? WHERE id=?",
      [title, department||"General", location||"Kampala, Uganda", type||"Full-time", description, requirements||"", salary_range||"", deadline||null, is_active??1, req.params.id]
    );
    res.json({ success: true });
  } catch (e) {
    console.error("careers PUT:", e.message);
    res.status(500).json({ error: "Failed to update job." });
  }
});

// DELETE
router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    await pool.query("DELETE FROM careers WHERE id=?", [req.params.id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Failed to delete job." });
  }
});

export default router;