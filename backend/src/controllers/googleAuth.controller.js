import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { userModel } from "../model/user.model.js";

export const googleAuthCallback = async (req, res) => {
  try {
    const user = req.user;

    // Generate JWT token in the same way regular login uses it
    const token = jwt.sign({ id: user._id }, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN,
    });

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    };

    res.cookie("token", token, cookieOptions);

    const clientURL =
      process.env.CLIENT_URL ||
      process.env.FRONTEND_URL ||
      "http://localhost:5173";
    res.redirect(`${clientURL}/auth/success`);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getCurrentUser = async (req, res) => {
  try {
    const user = await userModel.findById(req.user.id).select("-password");
    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const logout = (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: err.message,
      });
    }
    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  });
};
