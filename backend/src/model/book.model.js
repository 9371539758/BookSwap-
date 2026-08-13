// models/book.model.js
import mongoose from "mongoose";

const bookSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true, // every book MUST belong to a logged-in user
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    author: {
      type: String,
      required: true,
      trim: true,
    },
    isbn: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      trim: true,
    },
    condition: {
      type: String,
      enum: ["Like New", "Good", "Fair", "Poor"],
      default: "Good",
    },
    description: {
      type: String,
      trim: true,
    },
    language: {
      type: String,
      default: "English",
    },
    publicationYear: {
      type: Number,
    },
    coverImage: {
      type: String, // URL or file path
    },
    location: {
      city: { type: String },
      state: { type: String },
      coordinates: {
        latitude: { type: Number },
        longitude: { type: Number },
      },
    },
    price: {
      type: Number,
    },
    available: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true } // adds createdAt & updatedAt automatically
);

// Index for faster search/filter queries
bookSchema.index({ userId: 1 });
bookSchema.index({ category: 1 });
bookSchema.index({ "location.city": 1 });

const Book = mongoose.model("Book", bookSchema);

export default Book;