import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

// ─── AUTH MIDDLEWARE ──────────────────────────────────────────────────────────
// Runs before any protected route.
// FIX: reads JWT from cookie (not Authorization header) — backend uses cookie auth
// If valid: attaches decoded user {id} to req.user and calls next()
// If invalid/missing: returns 401 Unauthorized

export const authMiddleware = (req, res, next) => {
  try {
    // Read token from the httpOnly cookie set during login/register
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated. Please login.",
      });
    }

    // Verify and decode the JWT using our secret key
    const decoded = jwt.verify(token, env.JWT_SECRET);

    // Attach decoded payload {id} to request — available in all route handlers
    req.user = decoded;

    next(); // pass to the actual route controller
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Session expired or invalid. Please login again.",
    });
  }
};