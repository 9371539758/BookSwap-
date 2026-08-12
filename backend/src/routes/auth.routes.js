import { Router } from "express";
import { registerValidator } from "../validators/register.validtor.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { register, login, getMe, logout } from "../controllers/auth.controller.js";

const authRouter = Router();

// ─── PUBLIC ROUTES ────────────────────────────────────────────────────────────
// Anyone can hit these without a token

// POST /api/auth/register — create a new account
authRouter.post("/register", registerValidator, register);

// POST /api/auth/login — login with email/username + password
authRouter.post("/login", login);

// ─── PROTECTED ROUTES ─────────────────────────────────────────────────────────
// authMiddleware verifies JWT from cookie before allowing access

// GET /api/auth/getme — returns current user's profile (called on every page refresh)
authRouter.get("/getme", authMiddleware, getMe);

// POST /api/auth/logout — clears the JWT cookie and logs user out
authRouter.post("/logout", authMiddleware, logout);

export default authRouter;