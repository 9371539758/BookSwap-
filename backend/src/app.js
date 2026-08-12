import express from "express";
import passport from "passport";
import session from "express-session";
import cookieParser from "cookie-parser"; // reads httpOnly cookies for JWT auth
import cors from "cors";
import "dotenv/config.js";
import "./config/passport.js"; // register Google OAuth strategy
import googleAuthRoutes from "./routes/googleAuth.routes.js";
import authRoutes from "./routes/auth.routes.js";

const app = express();

// ─── CORE MIDDLEWARE ──────────────────────────────────────────────────────────

// Parse incoming JSON request bodies
app.use(express.json());

// Parse cookies — REQUIRED so authMiddleware can read the JWT cookie
app.use(cookieParser());

// ─── CORS ─────────────────────────────────────────────────────────────────────
// Allows any localhost port (Vite picks 5173, 5174... depending on availability)
// In production, set CLIENT_URL in .env to your actual domain.
import cors from "cors";

const allowedOrigins = [
  "http://localhost:5173",
  "https://book-swap-pmyl1sabc-9371539758s-projects.vercel.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// ─── SESSION ─────────────────────────────────────────────────────────────────
// Used by Passport for Google OAuth session management
app.use(
  session({
    secret: process.env.SESSION_SECRET || "bookswap_session_secret_key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// ─── PASSPORT ────────────────────────────────────────────────────────────────
// Initialize Google OAuth middleware
app.use(passport.initialize());
app.use(passport.session());

// ─── ROUTES ──────────────────────────────────────────────────────────────────

// Google OAuth routes: /api/auth/google, /api/auth/google/callback
app.use("/api/auth", googleAuthRoutes);

// Local auth routes: /api/auth/register, /api/auth/login, /api/auth/getme, /api/auth/logout
app.use("/api/auth", authRoutes);

// ─── HEALTH CHECK ────────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.status(200).json({ success: true, message: "BookSwap API is running" });
});

export default app;