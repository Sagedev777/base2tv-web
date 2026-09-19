import { Router } from "express";
import pool from "../db.js";
import { requireAdmin } from "../middleware/auth.js";

const router = Router();

// GET /api/ads — active ads for public display
router.get("/", async (req, res) => {
  const [rows] = await pool.query(
    `SELECT id, title, description, media_url, media_type, link_url, duration_sec, position
     FROM ads
     WHERE is_active = 1
       AND (start_date IS NULL OR start_date <= NOW())
       AND (end_date   IS NULL OR end_date   >= NOW())
     ORDER BY sort_order ASC, id ASC`
  );
  res.json({ ads: rows });
});

// GET /api/ads/all — all ads for admin
router.get("/all", requireAdmin, async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM ads ORDER BY sort_order ASC, created_at DESC");
  const [[{ total }]] = await pool.query("SELECT COUNT(*) AS total FROM ads");
  res.json({ ads: rows, total });
});

// POST — create ad (staff)
router.post("/", requireAdmin, async (req, res) => {
  const { title, description, media_url, media_type, link_url, duration_sec, position, start_date, end_date, is_active, sort_order } = req.body;
  const [r] = await pool.query(
    `INSERT INTO ads (title, description, media_url, media_type, link_url, duration_sec, position, start_date, end_date, is_active, sort_order)
     VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    [title||"", description||"", media_url, media_type||"image", link_url||"", duration_sec||10, position||"sidebar", start_date||null, end_date||null, is_active??1, sort_order||0]
  );
  res.status(201).json({ id: r.insertId });
});

// PUT — update
router.put("/:id", requireAdmin, async (req, res) => {
  const { title, description, media_url, media_type, link_url, duration_sec, position, start_date, end_date, is_active, sort_order } = req.body;
  await pool.query(
    `UPDATE ads SET title=?,description=?,media_url=?,media_type=?,link_url=?,duration_sec=?,position=?,start_date=?,end_date=?,is_active=?,sort_order=? WHERE id=?`,
    [title||"", description||"", media_url, media_type||"image", link_url||"", duration_sec||10, position||"sidebar", start_date||null, end_date||null, is_active??1, sort_order||0, req.params.id]
  );
  res.json({ success: true });
});

// DELETE
router.delete("/:id", requireAdmin, async (req, res) => {
  await pool.query("DELETE FROM ads WHERE id=?", [req.params.id]);
  res.json({ success: true });
});

export default router;