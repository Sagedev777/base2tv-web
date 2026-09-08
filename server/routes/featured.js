import { Router } from "express";
import pool from "../db.js";
import { requireStaff } from "../middleware/auth.js";
const router = Router();

router.get("/", async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM featured ORDER BY sort_order ASC, id ASC");
  res.json({ items: rows });
});

router.post("/", requireStaff, async (req, res) => {
  const { title, subtitle, description, full_bio, tag, initials, color, image_url, sort_order } = req.body;
  const [r] = await pool.query(
    "INSERT INTO featured (title,subtitle,description,full_bio,tag,initials,color,image_url,sort_order) VALUES (?,?,?,?,?,?,?,?,?)",
    [title, subtitle||"", description||"", full_bio||"", tag||"FEATURED", (initials||"??").slice(0,2).toUpperCase(), color||"", image_url||"", sort_order||0]
  );
  res.status(201).json({ id: r.insertId });
});

router.put("/:id", requireStaff, async (req, res) => {
  const { title, subtitle, description, full_bio, tag, initials, color, image_url, sort_order } = req.body;
  await pool.query(
    "UPDATE featured SET title=?,subtitle=?,description=?,full_bio=?,tag=?,initials=?,color=?,image_url=?,sort_order=? WHERE id=?",
    [title, subtitle||"", description||"", full_bio||"", tag||"FEATURED", (initials||"??").slice(0,2).toUpperCase(), color||"", image_url||"", sort_order||0, req.params.id]
  );
  res.json({ success: true });
});

router.delete("/:id", requireStaff, async (req, res) => {
  await pool.query("DELETE FROM featured WHERE id=?", [req.params.id]);
  res.json({ success: true });
});

export default router;