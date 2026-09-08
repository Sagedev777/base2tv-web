import { Router } from "express";
import pool       from "../db.js";
import { requireStaff } from "../middleware/auth.js";

const router = Router();

// POST /api/advertise — public enquiry
router.post("/", async (req, res) => {
  try {
    const { name, company, email, phone, ad_type, budget, message, existing_ad_id } = req.body;
    if (!name || !email || !message || !phone)
      return res.status(422).json({ error: "Name, email, phone and message are required." });
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email))
      return res.status(422).json({ error: "Please provide a valid email address." });
    if (message.length < 10)
      return res.status(422).json({ error: "Message must be at least 10 characters." });
    const ip = (req.headers["x-forwarded-for"] || req.socket.remoteAddress || "").slice(0, 45);
    await pool.query(
      "INSERT INTO advertise_enquiries (name,company,email,phone,ad_type,budget,message,existing_ad_id,ip_address) VALUES (?,?,?,?,?,?,?,?,?)",
      [name.slice(0,80), (company||"").slice(0,120), email.slice(0,120), (phone||"").slice(0,30),
       (ad_type||"").slice(0,60), (budget||"").slice(0,60), message, existing_ad_id||null, ip]
    );
    res.json({ success: true, message: "Your enquiry has been received. Our advertising team will contact you within 24 hours." });
  } catch (e) {
    console.error("advertise POST:", e.message);
    res.status(500).json({ error: "Failed to submit enquiry. Please try again." });
  }
});

// GET /api/advertise — admin
router.get("/", requireStaff, async (req, res) => {
  try {
    const limit  = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = parseInt(req.query.offset) || 0;
    const [rows]       = await pool.query("SELECT * FROM advertise_enquiries ORDER BY created_at DESC LIMIT ? OFFSET ?", [limit, offset]);
    const [[{total}]]  = await pool.query("SELECT COUNT(*) AS total FROM advertise_enquiries");
    const [[{unread}]] = await pool.query("SELECT COUNT(*) AS unread FROM advertise_enquiries WHERE is_read=0");
    res.json({ enquiries: rows, total, unread });
  } catch (e) {
    console.error("advertise GET:", e.message);
    res.status(500).json({ error: "Failed to load enquiries." });
  }
});

router.put("/:id/read", requireStaff, async (req, res) => {
  try {
    await pool.query("UPDATE advertise_enquiries SET is_read=1 WHERE id=?", [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: "Failed." }); }
});

router.delete("/:id", requireStaff, async (req, res) => {
  try {
    await pool.query("DELETE FROM advertise_enquiries WHERE id=?", [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: "Failed." }); }
});

export default router;