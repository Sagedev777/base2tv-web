import { Router } from "express";
import bcrypt     from "bcryptjs";
import pool       from "../db.js";
import { requireStaff, requireAdmin } from "../middleware/auth.js";

const router = Router();

// GET /api/users
router.get("/", requireAdmin, async (req, res) => {
  try {
    const limit  = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = parseInt(req.query.offset) || 0;
    const [rows] = await pool.query(
      "SELECT id,username,email,avatar_url,role,status,created_at,last_login FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?",
      [limit, offset]
    );
    const [[{ total }]] = await pool.query("SELECT COUNT(*) AS total FROM users");
    res.json({ users: rows, total });
  } catch (e) {
    console.error("users GET:", e.message);
    res.status(500).json({ error: "Failed to load users." });
  }
});

// PUT /api/users/:id — change role/status (admin only)
router.put("/:id", requireAdmin, async (req, res) => {
  try {
    const { role, status } = req.body;
    const validRoles    = ["viewer", "staff", "admin"];
    const validStatuses = ["active", "banned"];
    if (!validRoles.includes(role) || !validStatuses.includes(status))
      return res.status(422).json({ error: "Invalid role or status." });
    // Prevent admin from locking themselves out
    if (parseInt(req.params.id) === req.user.user_id && role !== "admin")
      return res.status(400).json({ error: "You cannot demote your own account." });
    await pool.query("UPDATE users SET role=?,status=? WHERE id=?", [role, status, req.params.id]);
    res.json({ success: true });
  } catch (e) {
    console.error("users PUT:", e.message);
    res.status(500).json({ error: "Failed to update user." });
  }
});

// DELETE /api/users/:id (admin only)
router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    if (parseInt(req.params.id) === req.user.user_id)
      return res.status(400).json({ error: "Cannot delete your own account." });
    const [rows] = await pool.query("SELECT id FROM users WHERE id=?", [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: "User not found." });
    await pool.query("DELETE FROM users WHERE id=?", [req.params.id]);
    res.json({ success: true });
  } catch (e) {
    console.error("users DELETE:", e.message);
    res.status(500).json({ error: "Failed to delete user." });
  }
});

// POST /api/users/create-staff (admin only)
router.post("/create-staff", requireAdmin, async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    if (!username || !email || !password || !role)
      return res.status(422).json({ error: "username, email, password and role are required." });
    if (!["viewer","staff","admin"].includes(role))
      return res.status(422).json({ error: "Invalid role." });
    if (password.length < 6)
      return res.status(422).json({ error: "Password must be at least 6 characters." });

    const [existing] = await pool.query(
      "SELECT id FROM users WHERE email=? OR username=?",
      [email.toLowerCase(), username]
    );
    if (existing.length) return res.status(409).json({ error: "Email or username already taken." });

    const hash   = await bcrypt.hash(password, 12);
    const avatar = "https://ui-avatars.com/api/?name=" + encodeURIComponent(username) + "&background=e50914&color=fff&size=200";
    const [r]    = await pool.query(
      "INSERT INTO users (username,email,password,avatar_url,role,status) VALUES (?,?,?,?,?,?)",
      [username, email.toLowerCase(), hash, avatar, role, "active"]
    );
    const [[user]] = await pool.query(
      "SELECT id,username,email,avatar_url,role,status FROM users WHERE id=?",
      [r.insertId]
    );
    res.status(201).json({ user });
  } catch (e) {
    console.error("create-staff:", e.message);
    res.status(500).json({ error: "Failed to create account." });
  }
});

export default router;