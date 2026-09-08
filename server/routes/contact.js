import { Router } from "express";
import pool       from "../db.js";
import { requireStaff } from "../middleware/auth.js";

const router = Router();

// POST /api/contact — public submission
router.post("/", async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !message)
      return res.status(422).json({ error: "name, email and message are required." });
    if (message.length < 10)
      return res.status(422).json({ error: "Message must be at least 10 characters." });
    if (message.length > 5000)
      return res.status(422).json({ error: "Message too long." });
    const ip = (req.headers["x-forwarded-for"] || req.socket.remoteAddress || "").slice(0, 45);
    await pool.query(
      "INSERT INTO contact_submissions (name,email,subject,message,ip_address) VALUES (?,?,?,?,?)",
      [name.slice(0,80), email.slice(0,120), (subject||"").slice(0,200), message, ip]
    );
    res.json({ success: true, message: "Your message has been received." });
  } catch (e) {
    console.error("contact POST:", e.message);
    res.status(500).json({ error: "Failed to send message. Please try again." });
  }
});

// GET /api/contact — admin inbox
router.get("/", requireStaff, async (req, res) => {
  try {
    const limit      = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset     = parseInt(req.query.offset) || 0;
    const unreadOnly = req.query.filter === "unread";
    let sql    = "SELECT * FROM contact_submissions";
    const params = [];
    if (unreadOnly) sql += " WHERE is_read=0";
    sql += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);
    const [rows]       = await pool.query(sql, params);
    const [[{total}]]  = await pool.query("SELECT COUNT(*) AS total FROM contact_submissions");
    const [[{unread}]] = await pool.query("SELECT COUNT(*) AS unread FROM contact_submissions WHERE is_read=0");
    res.json({ submissions: rows, total, unread });
  } catch (e) {
    console.error("contact GET:", e.message);
    res.status(500).json({ error: "Failed to load submissions." });
  }
});

// PUT /api/contact/:id/read
router.put("/:id/read", requireStaff, async (req, res) => {
  try {
    await pool.query("UPDATE contact_submissions SET is_read=1 WHERE id=?", [req.params.id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Failed to mark as read." });
  }
});

// DELETE /api/contact/:id
router.delete("/:id", requireStaff, async (req, res) => {
  try {
    await pool.query("DELETE FROM contact_submissions WHERE id=?", [req.params.id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Failed to delete." });
  }
});

export default router;