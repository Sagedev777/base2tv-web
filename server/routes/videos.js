import { Router } from "express";
import pool from "../db.js";
import { requireStaff } from "../middleware/auth.js";
const router = Router();

router.get("/", async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit)||12, 50);
  const offset = parseInt(req.query.offset)||0;
  const cat = req.query.category||"";
  const featured = req.query.featured;
  let sql = "SELECT * FROM videos WHERE 1=1";
  const params = [];
  if (featured) { sql += " AND is_featured=1"; }
  if (cat) { sql += " AND category=?"; params.push(cat); }
  sql += " ORDER BY published_at DESC LIMIT ? OFFSET ?";
  params.push(limit, offset);
  const [rows] = await pool.query(sql, params);
  res.json({ videos: rows });
});

router.get("/:id", async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM videos WHERE id=?", [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: "Not found." });
  await pool.query("UPDATE videos SET views=views+1 WHERE id=?", [req.params.id]);
  res.json({ video: rows[0] });
});

router.post("/", requireStaff, async (req, res) => {
  const { title, description, thumbnail, video_url, category, duration_sec, is_featured } = req.body;
  const [r] = await pool.query(
    "INSERT INTO videos (title,description,thumbnail,video_url,category,duration_sec,is_featured) VALUES (?,?,?,?,?,?,?)",
    [title, description||"", thumbnail||"", video_url, category||"General", duration_sec||0, is_featured?1:0]
  );
  res.status(201).json({ id: r.insertId });
});

router.put("/:id", requireStaff, async (req, res) => {
  const { title, description, thumbnail, video_url, category, duration_sec, is_featured } = req.body;
  await pool.query(
    "UPDATE videos SET title=?,description=?,thumbnail=?,video_url=?,category=?,duration_sec=?,is_featured=? WHERE id=?",
    [title, description||"", thumbnail||"", video_url, category||"General", duration_sec||0, is_featured?1:0, req.params.id]
  );
  res.json({ success: true });
});

router.delete("/:id", requireStaff, async (req, res) => {
  await pool.query("DELETE FROM videos WHERE id=?", [req.params.id]);
  res.json({ success: true });
});

export default router;