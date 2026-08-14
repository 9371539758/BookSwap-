import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

// ─── AUTH MIDDLEWARE ──────────────────────────────────────────────────────────
// Runs before any protected route.
// FIX: reads JWT from cookie (not Authorization header) — backend uses cookie auth
// If valid: attaches decoded user {id} to req.user and calls next()
// If invalid/missing: returns 401 Unauthorized

export const authMiddleware = (req, res, next) => {
  try {
    const cookieToken = req.cookies?.token;
    const authHeader = req.headers.authorization || "";
    const headerToken = authHeader.startsWith("Bearer ")
      ? authHeader.replace("Bearer ", "")
      : "";
    const token = cookieToken || headerToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated. Please login.",
      });
    }

    const decoded = jwt.verify(token, env.JWT_SECRET);
    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Session expired or invalid. Please login again.",
    });
  }
};
