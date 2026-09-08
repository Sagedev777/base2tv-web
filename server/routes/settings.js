import { Router } from "express";
import pool from "../db.js";
import { requireAdmin } from "../middleware/auth.js";
const router = Router();

router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT `key`,`value`,`label`,`section` FROM site_settings ORDER BY section, `key`");
    const map = {};
    rows.forEach(r => { map[r.key] = r.value; });
    res.json({ settings: map, rows });
  } catch { res.json({ settings: {}, rows: [] }); }
});

router.put("/", requireAdmin, async (req, res) => {
  const { key, value } = req.body;
  if (!key || value === undefined) return res.status(422).json({ error: "key and value required." });
  await pool.query("UPDATE site_settings SET `value`=? WHERE `key`=?", [value, key]);
  res.json({ success: true, key, value });
});

export default router;