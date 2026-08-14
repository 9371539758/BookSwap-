import mongoose from "mongoose";
import { env } from "./env.js";

export const connectDB = async () => {
  if (!env.MONGO_URI) {
    throw new Error(
      "MONGO_URI is not defined. Add it in your Render environment variables."
    );
  }

  try {
    await mongoose.connect(env.MONGO_URI);
    console.log("MongoDB Connected");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    throw error;
  }
};
