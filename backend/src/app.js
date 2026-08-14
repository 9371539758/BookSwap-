import express from "express";
import passport from "passport";
import session from "express-session";
import cookieParser from "cookie-parser";
import cors from "cors";
import "dotenv/config.js";

// Load Passport Google OAuth configuration
import "./config/passport.js";

// Import authentication routes
import googleAuthRoutes from "./routes/googleAuth.routes.js";
import authRoutes from "./routes/auth.routes.js";
import bookRoutes from "./routes/book.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
const app = express();

/* ============================================================
   CORE MIDDLEWARE
   ============================================================ */

// Parse JSON data coming from requests
// Example: { email, password }
app.use(express.json());

// Read cookies sent by the browser
// Required for JWT authentication stored in HTTP-only cookies
app.use(cookieParser());

/* ============================================================
/* ============================================================
   CORS CONFIGURATION
   ============================================================ */

// Enable CORS with dynamic origin check
app.use(
  cors({
    origin: function (origin, callback) {
      const allowedOrigins = [
        "http://localhost:5173",
        "http://localhost:5174",
        "https://book-swap-blond.vercel.app",
        "https://book-swap-puce.vercel.app",
        "https://bookswap-frontend-4ayc.onrender.com",
        "https://bookswap-backend-vvkg.onrender.com",
        process.env.CLIENT_URL,
        process.env.FRONTEND_URL,
      ].filter(Boolean);

      if (!origin) {
        return callback(null, true);
      }

      const isAllowed =
        allowedOrigins.includes(origin) ||
        origin.endsWith(".vercel.app") ||
        origin.endsWith(".onrender.com");

      if (isAllowed) {
        return callback(null, true);
      }

      console.warn(`CORS blocked: ${origin}`);
      callback(new Error("CORS policy violation"));
    },
    credentials: true,
  }),
);

/* ============================================================
   EXPRESS SESSION
   ============================================================ */

// Express session is mainly used by Passport
// for Google OAuth authentication.
//
// JWT authentication for normal login is handled separately.
app.use(
  session({
    secret: process.env.SESSION_SECRET || "bookswap_session_secret_key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000,
    },
  }),
);

/* ============================================================
   PASSPORT CONFIGURATION
   ============================================================ */

// Initialize Passport
app.use(passport.initialize());

// Enable Passport session support
// Required for Google OAuth session handling
app.use(passport.session());

/* ============================================================
   AUTHENTICATION ROUTES
   ============================================================ */

// Google OAuth routes
//
// GET /api/auth/google
// GET /api/auth/google/callback
app.use("/api/auth", googleAuthRoutes);

// Normal authentication routes
//
// POST /api/auth/register
// POST /api/auth/login
// POST /api/auth/logout
// GET  /api/auth/getme
app.use("/api/auth", authRoutes);

/* ============================================================
   HEALTH CHECK
   ============================================================ */

// Used to check whether the backend is running.
//
// Open:
// https://bookswap-jpsw.onrender.com/api/health
//
// Expected response:
// {
//   success: true,
//   message: "BookSwap API is running"
// }

/* ============================================================
   BOOK ROUTES
   ============================================================ */

// Book management routes
//
// POST   /api/books        - Add a new book (requires login)
// GET    /api/books        - List all books
// GET    /api/books/:id    - Get one book
// PUT    /api/books/:id    - Update a book (owner only)
// DELETE /api/books/:id    - Delete a book (owner only)
app.use("/api/books", bookRoutes);

// Uploads route (Cloudinary streaming)
app.use("/api/uploads", uploadRoutes);

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "BookSwap API is running",
  });
});

/* ============================================================
   EXPORT APP
   ============================================================ */

// Export the Express application
// server.js will start the actual server.
export default app;
