import express from "express";
import passport from "passport";
import * as googleAuthController from "../controllers/googleAuth.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

// ─── GOOGLE OAUTH ROUTES ──────────────────────────────────────────────────────
// These routes only work when GOOGLE_CLIENT_ID is set in .env.
// If credentials are missing, routes return a clear "not configured" message.

const googleNotConfigured = (req, res) => {
  res.status(501).json({
    success: false,
    message: "Google OAuth is not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env",
  });
};

const isGoogleConfigured = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

// GET /api/auth/google — start Google OAuth flow
router.get(
  "/google",
  isGoogleConfigured
    ? passport.authenticate("google", { scope: ["profile", "email"] })
    : googleNotConfigured
);

// GET /api/auth/google/callback — Google redirects here after user approves
router.get(
  "/google/callback",
  isGoogleConfigured
    ? passport.authenticate("google", {
        failureRedirect: `${process.env.CLIENT_URL || "http://localhost:5173"}/login?error=auth_failed`,
        session: false,
      })
    : googleNotConfigured,
  isGoogleConfigured ? googleAuthController.googleAuthCallback : googleNotConfigured
);

// GET /api/auth/me — get current logged in user (used by Google auth flow)
router.get("/me", authMiddleware, googleAuthController.getCurrentUser);

export default router;