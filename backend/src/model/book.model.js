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
      city:  { type: String },
      state: { type: String },

      // Flat lat/lng kept for backward compatibility with existing data
      coordinates: {
        latitude:  { type: Number },
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
        coordinates: {
          type: [Number], // [longitude, latitude]
        },
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
  { timestamps: true }
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
bookSchema.pre("save", function () {
  const lat = this.location?.coordinates?.latitude;
  const lng = this.location?.coordinates?.longitude;

  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    // GeoJSON coordinates order: [longitude, latitude]
    this.location.geoPoint = {
      type: "Point",
      coordinates: [lng, lat],
    };
  }
});

const Book = mongoose.model("Book", bookSchema);

export default Book;