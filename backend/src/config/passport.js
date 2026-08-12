import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { userModel } from "../model/user.model.js";

// ─── GOOGLE OAUTH STRATEGY ────────────────────────────────────────────────────
// Only registers Google strategy if credentials are present in .env.
// Without GOOGLE_CLIENT_ID, the strategy is skipped — app still works for
// local login/register. Add credentials when you're ready to enable Google auth.

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL:
          process.env.GOOGLE_CALLBACK_URL ||
          "http://localhost:3000/api/auth/google/callback",
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value?.toLowerCase();
          const googleId = profile.id;

          // First try to find an existing Google-linked user
          let user = await userModel.findOne({ googleId });
          if (user) {
            return done(null, user);
          }

          // If the user already exists by email, link the Google account
          if (email) {
            user = await userModel.findOne({ email });
            if (user) {
              user.googleId = googleId;
              user.authProvider = "google";
              user.isVerified = true;
              user.avatar = user.avatar || profile.photos[0]?.value || null;
              await user.save();
              return done(null, user);
            }
          }

          // New Google user — create account automatically
          user = await userModel.create({
            googleId,
            username: profile.emails[0].value.split("@")[0], // email prefix as username
            fullName: profile.displayName,
            email,
            avatar: profile.photos[0]?.value || null,
            authProvider: "google",
            isVerified: true,
          });

          return done(null, user);
        } catch (error) {
          return done(error, null);
        }
      },
    ),
  );

  // Serialize: store only user ID in session
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  // Deserialize: load full user from DB on each request
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await userModel.findById(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  console.log("✅ Google OAuth strategy registered");
} else {
  // Google credentials not set — skip strategy registration
  // Local login/register still works perfectly
  console.log("⚠️  Google OAuth skipped — GOOGLE_CLIENT_ID not set in .env");
}

export default passport;
