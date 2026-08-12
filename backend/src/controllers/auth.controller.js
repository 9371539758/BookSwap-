import { sendToken } from "../../utils/sendToken.js";
import { userModel } from "../model/user.model.js";

// ─── REGISTER ─────────────────────────────────────────────────────────────────
// Creates a new user in MongoDB.
// Reads: username, fullName, email, password, phone, location from req.body
export const register = async (req, res) => {
  try {
    const { username, fullName, email, password, phone, location } = req.body;

    // Both username and fullName required; email + password always required
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Username, email, and password are required",
      });
    }

    // Check if email or phone already exists
    const query = [{ email }];
    if (phone) query.push({ phone });

    const existingUser = await userModel.findOne({ $or: query });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User already exists with this email or phone",
      });
    }

    // Create user — username and fullName stored separately
    const user = await userModel.create({
      username,
      fullName: fullName || username, // fallback to username if no fullName given
      email,
      password,
      phone: phone || undefined,
      location: location || undefined,
    });

    // Send JWT token in cookie + return user data
    return sendToken(user, 201, res);
  } catch (error) {
    console.error("Register Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ─── LOGIN ────────────────────────────────────────────────────────────────────
// Authenticates user with email OR username + password.
// FIX: reads `identifier` from req.body (frontend sends `identifier`, not `login`)
export const login = async (req, res) => {
  try {
    const { identifier, password } = req.body; // identifier = email or username

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: "Identifier and password are required",
      });
    }

    // Find user by email OR username — include password (select: false by default)
    const user = await userModel
      .findOne({
        $or: [{ email: identifier }, { username: identifier }],
      })
      .select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check if user is a Google account (no password set)
    if (!user.password) {
      return res.status(401).json({
        success: false,
        message: "This account uses Google login. Please sign in with Google.",
      });
    }

    // Compare hashed password
    const isPasswordMatched = await user.comparePassword(password);
    if (!isPasswordMatched) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Send JWT token in cookie + return user data
    return sendToken(user, 200, res);
  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// ─── GET ME ───────────────────────────────────────────────────────────────────
// Returns current logged-in user's data.
// Used on every page refresh to verify the session is still valid.
// Reads JWT from cookie (set by authMiddleware on req.user)
export const getMe = async (req, res) => {
  try {
    // req.user is set by authMiddleware after verifying the JWT cookie
    const user = await userModel.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("GetMe Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// ─── LOGOUT ───────────────────────────────────────────────────────────────────
// Clears the JWT cookie to log the user out.
// No DB call needed — just invalidate the cookie on client side
export const logout = (req, res) => {
  res
    .status(200)
    .cookie("token", "", {
      httpOnly: true,
      expires: new Date(0), // Expire the cookie immediately
      sameSite: "strict",
    })
    .json({
      success: true,
      message: "Logged out successfully",
    });
};