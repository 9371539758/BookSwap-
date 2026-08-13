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
   CORS CONFIGURATION
   ============================================================ */

// List of frontend URLs that are allowed to communicate
// with this backend.
const allowedOrigins = [
  // Local development
  "http://localhost:5173",

  // Production frontend deployed on Vercel (custom domain)
  "https://book-swap-blond.vercel.app",

  // Vercel preview deployments (allow all .vercel.app domains)
  /https:\/\/book-swap-.*\.vercel\.app$/,
];

// Enable CORS
//
// credentials: true is required because our authentication
// uses cookies.
//
// The origin must exactly match one of the allowed origins.
app.use(
  cors({
    origin: allowedOrigins,
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
    // Secret used to sign the session ID
    secret: process.env.SESSION_SECRET || "bookswap_session_secret_key",

    // Don't save the session if nothing has changed
    resave: false,

    // Don't create an empty session for every visitor
    saveUninitialized: false,

    cookie: {
      // HTTPS is required for secure cookies in production
      secure: process.env.NODE_ENV === "production",

      // Prevent JavaScript from accessing the cookie
      httpOnly: true,

      // Session expires after 24 hours
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
