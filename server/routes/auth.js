import { Router }    from "express";
import bcrypt        from "bcryptjs";
import pool          from "../db.js";
import { makeToken, verifyToken } from "../middleware/auth.js";

const router = Router();

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password)
      return res.status(422).json({ error: "username, email and password are required." });
    if (username.length < 3 || username.length > 40)
      return res.status(422).json({ error: "Username must be 3-40 characters." });
    if (!/^[a-zA-Z0-9_\-\.]+$/.test(username))
      return res.status(422).json({ error: "Username contains invalid characters." });
    if (password.length < 6)
      return res.status(422).json({ error: "Password must be at least 6 characters." });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return res.status(422).json({ error: "Invalid email address." });

    const [existing] = await pool.query(
      "SELECT id FROM users WHERE email = ? OR username = ?",
      [email.toLowerCase(), username]
    );
    if (existing.length) return res.status(409).json({ error: "Email or username already taken." });

    const hash   = await bcrypt.hash(password, 12);
    const avatar = "https://ui-avatars.com/api/?name=" + encodeURIComponent(username) + "&background=e50914&color=fff&size=100";

    const [result] = await pool.query(
      "INSERT INTO users (username, email, password, avatar_url, role, status) VALUES (?,?,?,?,?,?)",
      [username, email.toLowerCase(), hash, avatar, "viewer", "active"]
    );

    const token = makeToken({ user_id: result.insertId, username, role: "viewer" });
    res.status(201).json({
      token,
      user: { id: result.insertId, username, email: email.toLowerCase(), avatar_url: avatar, role: "viewer" }
    });
  } catch (e) {
    console.error("register error:", e.message);
    res.status(500).json({ error: "Registration failed. Please try again." });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(422).json({ error: "Email and password are required." });

    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email.toLowerCase()]);
    const user   = rows[0];

    // Always run bcrypt to prevent timing attacks
    const dummy = "";
    const valid  = user
      ? await bcrypt.compare(password, user.password)
      : await bcrypt.compare(password, dummy);

    if (!user || !valid)
      return res.status(401).json({ error: "Invalid email or password." });
    if (user.status === "banned")
      return res.status(403).json({ error: "This account has been suspended." });

    await pool.query("UPDATE users SET last_login = NOW() WHERE id = ?", [user.id]);

    const token = makeToken({ user_id: user.id, username: user.username, role: user.role });
    res.json({
      token,
      user: { id: user.id, username: user.username, email: user.email, avatar_url: user.avatar_url, role: user.role }
    });
  } catch (e) {
    console.error("login error:", e.message);
    res.status(500).json({ error: "Login failed. Please try again." });
  }
});

// GET /api/auth/me
router.get("/me", async (req, res) => {
  try {
    const header = req.headers.authorization || "";
    if (!header.startsWith("Bearer "))
      return res.status(401).json({ error: "Unauthorized." });

    const payload = verifyToken(header.slice(7));
    if (!payload)
      return res.status(401).json({ error: "Invalid or expired token." });

    const [rows] = await pool.query(
      "SELECT id, username, email, avatar_url, role, status, created_at FROM users WHERE id = ?",
      [payload.user_id]
    );
    const user = rows[0];
    if (!user)   return res.status(404).json({ error: "User not found." });
    if (user.status === "banned") return res.status(403).json({ error: "Account suspended." });

    res.json({ user });
  } catch (e) {
    console.error("me error:", e.message);
    res.status(500).json({ error: "Server error." });
  }
});

export default router;