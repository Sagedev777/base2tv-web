import { Router } from "express";
import pool from "../db.js";
import { requireStaff } from "../middleware/auth.js";

const router = Router();
const slug = (t) => t.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"") + "-" + Date.now().toString(36);

router.get("/", async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit)||10, 50);
  const offset = parseInt(req.query.offset)||0;
  const cat = req.query.category||"";
  let sql = "SELECT * FROM news WHERE is_published=1";
  const params = [];
  if (cat) { sql += " AND category=?"; params.push(cat); }
  sql += " ORDER BY published_at DESC LIMIT ? OFFSET ?";
  params.push(limit, offset);
  const [rows] = await pool.query(sql, params);
  const [[{total}]] = await pool.query("SELECT COUNT(*) AS total FROM news WHERE is_published=1");
  res.json({ articles: rows, total });
});

router.get("/:id", async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM news WHERE id=? AND is_published=1", [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: "Not found." });
  await pool.query("UPDATE news SET views=views+1 WHERE id=?", [req.params.id]);
  res.json({ article: rows[0] });
});

// Admin
router.post("/", requireStaff, async (req, res) => {
  const { title, excerpt, body, category, scope, author, thumbnail, color, is_published } = req.body;
  const [r] = await pool.query(
    "INSERT INTO news (title,slug,excerpt,body,thumbnail,category,scope,color,author,is_published) VALUES (?,?,?,?,?,?,?,?,?,?)",
    [title, slug(title), excerpt||"", body||"", thumbnail||"", category||"General", scope||"LOCAL", color||"", author||"Base2 TV", is_published??1]
  );
  res.status(201).json({ id: r.insertId });
});

router.put("/:id", requireStaff, async (req, res) => {
  const { title, excerpt, body, category, scope, author, thumbnail, color, is_published } = req.body;
  await pool.query(
    "UPDATE news SET title=?,excerpt=?,body=?,thumbnail=?,category=?,scope=?,color=?,author=?,is_published=? WHERE id=?",
    [title, excerpt||"", body||"", thumbnail||"", category||"General", scope||"LOCAL", color||"", author||"Base2 TV", is_published??1, req.params.id]
  );
  res.json({ success: true });
});

router.delete("/:id", requireStaff, async (req, res) => {
  await pool.query("DELETE FROM news WHERE id=?", [req.params.id]);
  res.json({ success: true });
});

export default router;