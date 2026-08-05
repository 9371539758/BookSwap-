import { sendToken } from "../../utils/sendToken.js";
import { userModel } from "../model/user.model.js";

export const register = async (req, res) => {
  try {
    const { username, name, email, password, phone, location } = req.body;
    const finalUsername = username || name;

    if (!finalUsername || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Username, email, and password are required",
      });
    }

    const query = [{ email }];

    if (phone) {
      query.push({ phone });
    }

    const existingUser = await userModel.findOne({
      $or: query,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User already exists with this email or phone",
      });
    }

    const user = await userModel.create({
      username: finalUsername,
      email,
      password,
      location: location || undefined,
      phone: phone || undefined,
    });

    return sendToken(user, 201, res);
  } catch (error) {
    console.log("Register Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server Error",
    });
  }
};
export const login = async (req, res) => {
  try {
    const { login, password } = req.body;

    // Find user by email OR username
    const user = await userModel
      .findOne({
        $or: [
          { email: login },
          { username: login }
        ]
      })
      .select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Compare password
    const isPasswordMatched = await user.comparePassword(password);

    if (!isPasswordMatched) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    return sendToken(user, 200, res);

  } catch (error) {
    console.error("Login Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};