import { Router }       from "express";
import multer           from "multer";
import path             from "path";
import fs               from "fs";
import { fileURLToPath } from "url";
import { requireStaff } from "../middleware/auth.js";

const __dirname  = path.dirname(fileURLToPath(import.meta.url));
const router     = Router();
// Save files directly to the root 'uploads' folder so they match the /uploads/ URL perfectly
const uploadRoot = process.env.UPLOAD_DIR || path.join(__dirname, "../../uploads");

// ── File size limits ──────────────────────────────────────────
const IMAGE_LIMIT = 10  * 1024 * 1024;  // 10 MB
const VIDEO_LIMIT = 200 * 1024 * 1024;  // 200 MB
const AD_LIMIT    = 10  * 1024 * 1024;  // 10 MB

const makeStorage = (folder) => multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(uploadRoot, folder);
    try {
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    } catch (err) {
      cb(new Error(`Upload directory is not writable: ${dir}`));
    }
  },
  filename: (req, file, cb) => {
    const ext  = path.extname(file.originalname).toLowerCase();
    const name = Date.now() + "-" + Math.round(Math.random() * 1e9) + ext;
    cb(null, name);
  },
});

const imageFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error("File type not allowed. Use JPEG, PNG, WebP, GIF or SVG."));
};

const videoFilter = (req, file, cb) => {
  const allowed = ["video/mp4", "video/webm", "video/ogg", "video/quicktime"];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error("File type not allowed. Use MP4, WebM, OGG or MOV."));
};

const anyMediaFilter = (req, file, cb) => {
  const allowed = [
    "image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml",
    "video/mp4",  "video/webm", "video/ogg", "video/quicktime",
  ];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error("File type not allowed. Use JPEG, PNG, WebP, GIF, MP4 or WebM."));
};

// ── Build the public URL for an uploaded file ─────────────────
const buildFileUrl = (req, folder, filename) => {
  if (process.env.PUBLIC_API_URL) {
    return process.env.PUBLIC_API_URL.replace(/\/$/, "") + "/uploads/" + folder + "/" + filename;
  }
  // cPanel reverse proxy sets x-forwarded-host & x-forwarded-proto
  const host  = req.headers["x-forwarded-host"] || req.headers.host || "base2tv.ug";
  const proto = req.headers["x-forwarded-proto"] || "https";
  return proto + "://" + host + "/uploads/" + folder + "/" + filename;
};

// ── Multer v2: async upload handler ──────────────────────────
// In multer v2, calling upload.single('file')(req, res) returns a Promise.
const runUpload = (upload, req, res) => new Promise((resolve, reject) => {
  upload.single("file")(req, res, (err) => {
    if (err) reject(err);
    else resolve();
  });
});

// POST /api/upload/image
router.post("/image", requireStaff, async (req, res) => {
  try {
    const upload = multer({ storage: makeStorage("images"), fileFilter: imageFilter, limits: { fileSize: IMAGE_LIMIT } });
    await runUpload(upload, req, res);
    if (!req.file) return res.status(400).json({ error: "No file uploaded." });
    const filePath = "/uploads/images/" + req.file.filename;
    const fileUrl  = buildFileUrl(req, "images", req.file.filename);
    res.json({ url: fileUrl, path: filePath, filename: req.file.filename, size: req.file.size, type: req.file.mimetype });
  } catch (err) {
    const msg = err.code === "LIMIT_FILE_SIZE"
      ? `Image too large. Max size is ${IMAGE_LIMIT / 1024 / 1024}MB.`
      : err.message;
    res.status(400).json({ error: msg });
  }
});

// POST /api/upload/video
router.post("/video", requireStaff, async (req, res) => {
  try {
    const upload = multer({ storage: makeStorage("videos"), fileFilter: videoFilter, limits: { fileSize: VIDEO_LIMIT } });
    await runUpload(upload, req, res);
    if (!req.file) return res.status(400).json({ error: "No file uploaded." });
    const filePath = "/uploads/videos/" + req.file.filename;
    const fileUrl  = buildFileUrl(req, "videos", req.file.filename);
    res.json({ url: fileUrl, path: filePath, filename: req.file.filename, size: req.file.size, type: req.file.mimetype });
  } catch (err) {
    const msg = err.code === "LIMIT_FILE_SIZE"
      ? `Video too large. Max size is ${VIDEO_LIMIT / 1024 / 1024}MB.`
      : err.message;
    res.status(400).json({ error: msg });
  }
});

// POST /api/upload/ad
router.post("/ad", requireStaff, async (req, res) => {
  try {
    const upload = multer({ storage: makeStorage("ads"), fileFilter: anyMediaFilter, limits: { fileSize: AD_LIMIT } });
    await runUpload(upload, req, res);
    if (!req.file) return res.status(400).json({ error: "No file uploaded." });
    const folder   = req.file.mimetype.startsWith("video/") ? "videos" : "ads";
    const filePath = "/uploads/" + folder + "/" + req.file.filename;
    const fileUrl  = buildFileUrl(req, folder, req.file.filename);
    res.json({ url: fileUrl, path: filePath, filename: req.file.filename, size: req.file.size, type: req.file.mimetype });
  } catch (err) {
    const msg = err.code === "LIMIT_FILE_SIZE"
      ? `File too large. Max size is ${AD_LIMIT / 1024 / 1024}MB.`
      : err.message;
    res.status(400).json({ error: msg });
  }
});

export default router;