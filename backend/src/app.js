import express from 'express';
import passport from 'passport';
import session from 'express-session';
import cors from 'cors';
import 'dotenv/config.js';
import './config/passport.js'; // Import passport config
import googleAuthRoutes from './routes/googleAuth.routes.js';
// Import your existing routes
import authRoutes from './routes/auth.routes.js'; // Your register/login routes

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));

// Session middleware (for Passport)
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'your_session_secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/api/auth', googleAuthRoutes); // Google OAuth routes
app.use('/api/auth', authRoutes); // Your existing register/login routes

export default app;