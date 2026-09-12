import { Router } from "express";
import pool from "../db.js";
import { verifyToken } from "../middleware/auth.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const showId = parseInt(req.query.show_id);
    const limit  = Math.min(parseInt(req.query.limit) || 50, 100);
    const id     = isNaN(showId) ? 0 : showId;
    const sql    = "SELECT m.id, m.show_id, m.message, m.created_at, m.reply_to_id, COALESCE(u.username, m.guest_name) AS username, COALESCE(u.avatar_url, m.avatar_url) AS avatar_url, r.message AS reply_text, COALESCE(ru.username, r.guest_name) AS reply_user FROM chat_messages m LEFT JOIN users u ON u.id = m.user_id LEFT JOIN chat_messages r ON r.id = m.reply_to_id LEFT JOIN users ru ON ru.id = r.user_id WHERE m.show_id = ? ORDER BY m.created_at ASC LIMIT ?";
    const [rows] = await pool.query(sql, [id, limit]);
    res.json({ messages: rows });
  } catch (e) {
    console.error("chat GET:", e.message);
    res.status(500).json({ error: "Failed to load messages." });
  }
});

router.post("/", async (req, res) => {
  try {
    const { show_id, message, guest_name, reply_to_id } = req.body;
    const showId = parseInt(show_id) || 0;
    if (!message || message.trim() === "") return res.status(422).json({ error: "message is required." });
    let userId = null, avatarUrl = "";
    const header = req.headers.authorization || "";
    if (header.startsWith("Bearer ")) {
      const payload = verifyToken(header.slice(7));
      if (payload) {
        userId = payload.user_id;
        const [u] = await pool.query("SELECT avatar_url FROM users WHERE id = ?", [userId]);
        avatarUrl = u[0]?.avatar_url || "";
      }
    }
    if (!userId && (!guest_name || guest_name.trim() === "")) return res.status(422).json({ error: "guest_name is required." });
    if (!userId && !avatarUrl) avatarUrl = "https://ui-avatars.com/api/?name=" + encodeURIComponent(guest_name) + "&background=333&color=fff&size=100";
    const [r] = await pool.query(
      "INSERT INTO chat_messages (show_id, user_id, guest_name, avatar_url, message, reply_to_id) VALUES (?, ?, ?, ?, ?, ?)",
      [showId, userId, guest_name || null, avatarUrl, message.trim(), reply_to_id || null]
    );
    const [[msg]] = await pool.query(
      "SELECT m.id, m.show_id, m.message, m.created_at, m.reply_to_id, COALESCE(u.username, m.guest_name) AS username, COALESCE(u.avatar_url, m.avatar_url) AS avatar_url, r.message AS reply_text, COALESCE(ru.username, r.guest_name) AS reply_user FROM chat_messages m LEFT JOIN users u ON u.id = m.user_id LEFT JOIN chat_messages r ON r.id = m.reply_to_id LEFT JOIN users ru ON ru.id = r.user_id WHERE m.id = ?",
      [r.insertId]
    );
    res.status(201).json({ message: msg });
  } catch (e) {
    console.error("chat POST:", e.message);
    res.status(500).json({ error: "Failed to send message." });
  }
});

// DELETE /api/chat/:id — delete a message (staff only)
router.delete("/:id", async (req, res) => {
  try {
    const header = req.headers.authorization || "";
    if (!header.startsWith("Bearer ")) return res.status(401).json({ error: "Unauthorized." });
    const { verifyToken } = await import("../middleware/auth.js");
    const payload = verifyToken(header.slice(7));
    if (!payload || !["admin","staff"].includes(payload.role)) {
      return res.status(403).json({ error: "Staff access required." });
    }
    await pool.query("DELETE FROM chat_messages WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch(e) {
    res.status(500).json({ error: "Failed to delete message." });
  }
});

export default router;