import mysql from "mysql2/promise";
import dotenv from "dotenv";

// .env.local takes priority (local dev). .env used only if .env.local absent (production).
dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local", override: true });

export function getDbConfigStatus(env = process.env) {
  const required = ["DB_HOST", "DB_USER", "DB_PASS", "DB_NAME"];
  const missing = required.filter((key) => {
    const value = env[key];
    return value === undefined || value === null || String(value).trim() === "" || String(value).trim() === "CHANGE_THIS_TO_YOUR_CPANEL_DB_PASSWORD";
  });

  return {
    isConfigured: missing.length === 0,
    missing,
    source: env.NODE_ENV === "production" ? "production" : "local",
  };
}

const dbStatus = getDbConfigStatus();

const pool = mysql.createPool({
  host:            process.env.DB_HOST     || "localhost",
  user:            process.env.DB_USER     || "root",
  password:        process.env.DB_PASS     || "",
  database:        process.env.DB_NAME     || "base2tv_db",
  charset:         "utf8mb4",
  waitForConnections: true,
  connectionLimit: 10,
  connectTimeout:  10000,
});

if (!dbStatus.isConfigured && process.env.NODE_ENV === "production") {
  console.error("  Production DB configuration is incomplete.");
  console.error("  Missing config:", dbStatus.missing.join(", ") || "none");
  console.error("  Update the cPanel environment variables before starting the API.");
}

// Test connection on startup
pool.getConnection()
  .then(conn => {
    console.log("  Database connected: " + (process.env.DB_NAME || "base2tv_db"));
    conn.release();
  })
  .catch(err => {
    console.error("  Database connection FAILED:", err.message);
  });

export default pool;

export async function ensureAdDescriptionColumn() {
  try {
    await pool.query("ALTER TABLE ads ADD COLUMN description TEXT NULL AFTER title");
    console.log("  Added ads.description column.");
    return true;
  } catch (error) {
    if (/duplicate column|already exists/i.test(error.message)) return true;
    console.error("  Could not verify ads.description column:", error.message);
    return false;
  }
}

export async function ensureNewsCategoriesTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS news_categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE
      )
    `);
    
    const [rows] = await pool.query("SELECT COUNT(*) as count FROM news_categories");
    if (rows[0].count === 0) {
      const defaultCategories = ['LOCAL NEWS', 'GLOBAL AFFAIRS', 'SPORTS', 'ENTERTAINMENT', 'AGRI-TECH', 'EXCLUSIVE INTERVIEW', 'REGIONAL AFFAIRS'];
      const values = defaultCategories.map(c => `('${c}')`).join(", ");
      await pool.query(`INSERT INTO news_categories (name) VALUES ${values}`);
      console.log("  Seeded news_categories table with defaults.");
    }
    return true;
  } catch (error) {
    console.error("  Could not initialize news_categories table:", error.message);
    return false;
  }
}