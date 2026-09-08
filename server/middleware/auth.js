import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "base2tv_jwt_secret_change_in_production";

export const makeToken = (payload) =>
  jwt.sign(payload, SECRET, { expiresIn: "30d" });

export const verifyToken = (token) => {
  try { return jwt.verify(token, SECRET); }
  catch { return null; }
};

// Middleware: require any logged-in user
export const requireAuth = (req, res, next) => {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) return res.status(401).json({ error: "Unauthorized." });
  const payload = verifyToken(header.slice(7));
  if (!payload) return res.status(401).json({ error: "Invalid or expired token." });
  req.user = payload;
  next();
};

// Middleware: require admin, manager, or staff
export const requireStaff = (req, res, next) => {
  requireAuth(req, res, () => {
    if (!["admin", "manager", "staff"].includes(req.user.role))
      return res.status(403).json({ error: "Staff access required." });
    next();
  });
};

// Middleware: require admin or manager only
export const requireAdmin = (req, res, next) => {
  requireAuth(req, res, () => {
    if (!["admin", "manager"].includes(req.user.role))
      return res.status(403).json({ error: "Admin or Manager access required." });
    next();
  });
};