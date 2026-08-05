import jwt from "jsonwebtoken";
import { env } from "../src/config/env.js";

export const sendToken = (user, statusCode, res) => {
  const token = jwt.sign(
    { id: user._id },
    env.JWT_SECRET,
    {
      expiresIn: env.JWT_EXPIRES_IN,
    }
  );

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  };

  res
    .status(statusCode)
    .cookie("token", token, cookieOptions)
    .json({
      success: true,
      message: "Logged in successfully.",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        location: user.location,
      },
    });
};