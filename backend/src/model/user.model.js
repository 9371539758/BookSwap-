import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema(
  {
    // Unique short handle — used for login + display (e.g., @sujit)
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },

    // Full display name (e.g., Sujit Kumar)
    fullName: {
      type: String,
      trim: true,
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },

    // Password is not returned by default (select: false)
    password: {
      type: String,
      minlength: 8,
      select: false,
      sparse: true, // Google OAuth users have no password
    },

    phone: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },

    // Flexible location object — city, state, country all optional
    location: {
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      country: { type: String, trim: true },
    },

    // ─── Google OAuth fields ───────────────────────────────────────────────────
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },

    // Profile picture — from Google or uploaded manually
    avatar: {
      type: String,
      default: null,
    },

    // Tracks how the user signed up
    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },

    // Email verification status (for future email verification feature)
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt automatically
  }
);

// ─── HOOKS ────────────────────────────────────────────────────────────────────

// Hash the password before saving — only runs if password was modified
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  if (!this.password) return; // skip Google users
  this.password = await bcrypt.hash(this.password, 10);
});

// ─── METHODS ──────────────────────────────────────────────────────────────────

// Compare plain password against stored hash during login
userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

// Check if user is allowed to use password login (not Google account)
userSchema.methods.canLoginWithPassword = function () {
  return this.authProvider === "local" && this.password;
};

export const userModel = mongoose.model("User", userSchema);