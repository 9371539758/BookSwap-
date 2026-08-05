import express from 'express';
import passport from 'passport';
import * as googleAuthController from '../controllers/googleAuth.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = express.Router();

// Initiate Google OAuth login
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Google callback - passport handles authentication
router.get(
  '/google/callback',
  passport.authenticate('google', { 
    failureRedirect: 'http://localhost:3000/login?error=auth_failed',
    session: false 
  }),
  googleAuthController.googleAuthCallback
);

// Get current authenticated user
router.get('/me', authMiddleware, googleAuthController.getCurrentUser);

// Logout
router.post('/logout', authMiddleware, googleAuthController.logout);

export default router;