import jwt from "jsonwebtoken";
import { env } from "../src/config/env.js";

// ─── SEND TOKEN ───────────────────────────────────────────────────────────────
// Called after successful login or register.
// 1. Creates a signed JWT with user's id
// 2. Stores it in an httpOnly cookie (safe from XSS attacks)
// 3. Returns user data in JSON response (no password)

export const sendToken = (user, statusCode, res) => {
  // Sign JWT — expires based on env config (default 7d)
  const token = jwt.sign({ id: user._id }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });

  // Cookie settings — httpOnly means JS cannot read it (XSS protection)
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  };

  // Set cookie + send user data (excluding sensitive fields)
  res
    .status(statusCode)
    .cookie("token", token, cookieOptions)
    .json({
      success: true,
      message:
        statusCode === 201
          ? "Account created successfully"
          : "Logged in successfully",
      user: {
        id: user._id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        location: user.location,
        avatar: user.avatar,
        authProvider: user.authProvider,
      },
    });
};
