import { Router }       from "express";
import multer           from "multer";
import path             from "path";
import fs               from "fs";
import { fileURLToPath } from "url";
import { requireStaff } from "../middleware/auth.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router    = Router();

const makeStorage = (folder) => multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, "../../uploads", folder);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext  = path.extname(file.originalname).toLowerCase();
    const name = Date.now() + "-" + Math.round(Math.random() * 1e9) + ext;
    cb(null, name);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = [
    "image/jpeg","image/png","image/webp","image/gif","image/svg+xml",
    "video/mp4","video/webm","video/ogg","video/quicktime",
  ];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error("File type not allowed. Use JPEG, PNG, WebP, GIF, MP4 or WebM."));
};

const makeUpload = (folder) => multer({
  storage:    makeStorage(folder),
  fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB
});

const handleUpload = (folder) => (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded." });
  const subFolder = req.file.mimetype.startsWith("video/") && folder !== "ads" ? "videos" : folder;
  // Build absolute URL so it works on production too
  const host    = req.headers.host || "localhost:5000";
  const proto   = req.headers["x-forwarded-proto"] || (host.includes("localhost") ? "http" : "https");
  const baseUrl = proto + "://" + host;
  const path    = "/uploads/" + subFolder + "/" + req.file.filename;
  const url     = baseUrl + path;
  res.json({ url, path, filename: req.file.filename, size: req.file.size, type: req.file.mimetype });
};

// POST /api/upload/image
router.post("/image", requireStaff, (req, res, next) => {
  makeUpload("images").single("file")(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    handleUpload("images")(req, res);
  });
});

// POST /api/upload/video
router.post("/video", requireStaff, (req, res, next) => {
  makeUpload("videos").single("file")(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    handleUpload("videos")(req, res);
  });
});

// POST /api/upload/ad
router.post("/ad", requireStaff, (req, res, next) => {
  makeUpload("ads").single("file")(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    handleUpload("ads")(req, res);
  });
});

export default router;