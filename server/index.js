import express    from "express";
import cors       from "cors";
import dotenv     from "dotenv";
import rateLimit  from "express-rate-limit";
import path       from "path";
import { fileURLToPath } from "url";

import { getDbConfigStatus } from "./db.js";

import authRoutes      from "./routes/auth.js";
import scheduleRoutes  from "./routes/schedule.js";
import newsRoutes      from "./routes/news.js";
import chatRoutes      from "./routes/chat.js";
import featuredRoutes  from "./routes/featured.js";
import videosRoutes    from "./routes/videos.js";
import contactRoutes   from "./routes/contact.js";
import usersRoutes     from "./routes/users.js";
import settingsRoutes  from "./routes/settings.js";
import uploadRoutes    from "./routes/upload.js";
import adsRoutes       from "./routes/ads.js";
import advertiseRoutes from "./routes/advertise.js";
import careersRoutes   from "./routes/careers.js";

if (process.env.NODE_ENV === "production") {
  dotenv.config({ path: ".env", override: true });
} else {
  dotenv.config({ path: ".env.local", override: true });
  dotenv.config({ path: ".env", override: true });
}

const app     = express();
const PORT    = process.env.API_PORT || 5000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbStatus = getDbConfigStatus();

if (process.env.NODE_ENV === "production" && !dbStatus.isConfigured) {
  console.error("\n  FATAL: Database environment is not configured for production.");
  console.error("  Missing keys:", dbStatus.missing.join(", ") || "none");
  console.error("  Fix .env / cPanel environment variables, then restart the server.\n");
}

// ── Trust proxy (required for cPanel / reverse proxy hosting) ─
// This tells Express to trust X-Forwarded-For headers from the proxy
app.set("trust proxy", 1);

// ── CORS ──────────────────────────────────────────────────────
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
  "https://base2tv.ug",
  "https://www.base2tv.ug",
];
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));

// ── Body parser ───────────────────────────────────────────────
app.use(express.json({ limit: "1mb" }));

// ── Serve uploaded files ──────────────────────────────────────
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// ── Rate limiting ─────────────────────────────────────────────
const rateLimitDefaults = { validate: { xForwardedForHeader: false } };
const loginLimiter     = rateLimit({ ...rateLimitDefaults, windowMs: 5*60*1000,  max: 10, message: { error: "Too many login attempts. Try again in 5 minutes." } });
const registerLimiter  = rateLimit({ ...rateLimitDefaults, windowMs: 60*60*1000, max: 5,  message: { error: "Too many registrations from this IP." } });
const contactLimiter   = rateLimit({ ...rateLimitDefaults, windowMs: 10*60*1000, max: 3,  message: { error: "Too many messages. Please wait." } });
const advertiseLimiter = rateLimit({ ...rateLimitDefaults, windowMs: 10*60*1000, max: 5,  message: { error: "Too many submissions. Please wait." } });

app.use("/api/auth/login",    loginLimiter);
app.use("/api/auth/register", registerLimiter);
app.use("/api/contact",       contactLimiter);
app.use("/api/advertise",     advertiseLimiter);

// ── Routes ────────────────────────────────────────────────────
app.use("/api/auth",      authRoutes);
app.use("/api/schedule",  scheduleRoutes);
app.use("/api/news",      newsRoutes);
app.use("/api/chat",      chatRoutes);
app.use("/api/featured",  featuredRoutes);
app.use("/api/videos",    videosRoutes);
app.use("/api/contact",   contactRoutes);
app.use("/api/users",     usersRoutes);
app.use("/api/settings",  settingsRoutes);
app.use("/api/upload",    uploadRoutes);
app.use("/api/ads",       adsRoutes);
app.use("/api/advertise", advertiseRoutes);
app.use("/api/careers",   careersRoutes);

// ── Health ────────────────────────────────────────────────────
app.get("/api",        (req, res) => res.json({ name: "Base2 TV API", status: "running", version: "1.0.0" }));
app.get("/api/health", (req, res) => res.json({ ok: true, time: new Date().toISOString() }));
app.get("/api/debug/db", (req, res) => {
  const status = getDbConfigStatus();
  res.status(status.isConfigured ? 200 : 503).json({
    ok: status.isConfigured,
    ...status,
    message: status.isConfigured ? "Database is configured." : "Database configuration is incomplete.",
  });
});

// ── Start ─────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log("\n  Base2 TV API running on http://localhost:" + PORT + "/api\n");
});