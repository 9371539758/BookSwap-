import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      trim: true,
      minlength: 3,
      maxlength: 30,
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      minlength: 8,
      select: false,
      sparse: true, // For Google OAuth users without passwords
    },

    phone: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },

    location: {
      city: {
        type: String,
        trim: true,
      },
      state: {
        type: String,
        trim: true,
      },
      country: {
        type: String,
        trim: true,
      },
    },

    // Google OAuth fields
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },

    avatar: {
      type: String,
      default: null,
    },

    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },

    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving (only for local auth)
userSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }

  // Skip if no password (Google OAuth users)
  if (!this.password) {
    return;
  }

  this.password = await bcrypt.hash(this.password, 10);
});

// Compare password during login
userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

// Instance method to check if user can login with password
userSchema.methods.canLoginWithPassword = function () {
  return this.authProvider === "local" && this.password;
};

export const userModel = mongoose.model("User", userSchema);