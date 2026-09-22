import { Router } from "express";
import pool from "../db.js";
import { requireStaff } from "../middleware/auth.js";

const router = Router();

// GET /api/categories
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM news_categories ORDER BY id ASC");
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch categories." });
  }
});

// POST /api/categories
router.post("/", requireStaff, async (req, res) => {
  const { name } = req.body;
  if (!name || typeof name !== "string") {
    return res.status(400).json({ error: "Category name is required." });
  }

  const cleanName = name.trim().toUpperCase();
  if (cleanName.length < 2) {
    return res.status(400).json({ error: "Category name must be at least 2 characters." });
  }

  try {
    const [result] = await pool.query("INSERT INTO news_categories (name) VALUES (?)", [cleanName]);
    res.json({ id: result.insertId, name: cleanName });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ error: "Category already exists." });
    }
    res.status(500).json({ error: "Failed to create category." });
  }
});

// DELETE /api/categories/:id
router.delete("/:id", requireStaff, async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query("DELETE FROM news_categories WHERE id = ?", [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Category not found." });
    }
    res.json({ message: "Category deleted." });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete category." });
  }
});

export default router;
