// models/book.model.js
import mongoose from "mongoose";

const bookSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
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
      type: String,
    },

    // ─── LOCATION ───────────────────────────────────────────────────────────────
    // Human-readable location (city, state) for display purposes
    location: {
      city: { type: String },
      state: { type: String },

      // Flat lat/lng kept for backward compatibility with existing data
      coordinates: {
        latitude: { type: Number },
        longitude: { type: Number },
      },

      // GeoJSON Point — used by MongoDB $geoNear for accurate distance queries.
      // Format: { type: "Point", coordinates: [longitude, latitude] }
      // NOTE: GeoJSON is [lng, lat] order — opposite of what humans expect!
      geoPoint: {
        type: {
          type: String,
          enum: ["Point"],
        },
        coordinates: [Number], // [longitude, latitude]
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
  { timestamps: true },
);

// ─── INDEXES ──────────────────────────────────────────────────────────────────
bookSchema.index({ userId: 1 });
bookSchema.index({ category: 1 });
bookSchema.index({ "location.city": 1 });
// 2dsphere index enables MongoDB geospatial queries ($geoNear, $near).
// This is the key fix for accurate nearby-books distance calculation.
bookSchema.index({ "location.geoPoint": "2dsphere" });

// ─── PRE-SAVE HOOK ────────────────────────────────────────────────────────────
// Whenever a book is saved with flat latitude/longitude coordinates,
// automatically populate the GeoJSON geoPoint field for geospatial queries.
bookSchema.pre("save", function (next) {
  try {
    if (!this.location) {
      this.location = {};
    }

    const lat = Number(this.location?.coordinates?.latitude);
    const lng = Number(this.location?.coordinates?.longitude);

    if (
      Number.isFinite(lat) &&
      Number.isFinite(lng) &&
      Math.abs(lat) <= 90 &&
      Math.abs(lng) <= 180
    ) {
      this.location.geoPoint = {
        type: "Point",
        coordinates: [lng, lat],
      };
    } else {
      this.location.geoPoint = undefined;
    }
  } catch (err) {
    console.error("Error in pre-save hook:", err.message);
    if (typeof next === "function") {
      return next(err);
    }
    throw err;
  }

  if (typeof next === "function") {
    return next();
  }
});qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq
const Book = mongoose.model("Book", bookSchema);

export default Book;
qqq