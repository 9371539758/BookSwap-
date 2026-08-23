// controllers/book.controller.js
import Book from "../model/book.model.js";
import mongoose from "mongoose";

// ─── HAVERSINE FALLBACK ───────────────────────────────────────────────────────
// Used when a book has flat lat/lng coords but no GeoJSON geoPoint yet.
// Formula: calculates great-circle distance between two points on Earth.
const haversineKm = (fromLat, fromLng, toLat, toLng) => {
  const R = 6371; // Earth radius in km
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(toLat - fromLat);
  const dLng = toRad(toLng - fromLng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(fromLat)) * Math.cos(toRad(toLat)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// ─── GET NEARBY BOOKS ─────────────────────────────────────────────────────────
// GET /api/books/nearby?latitude=xx&longitude=yy&radiusKm=50
//
// Strategy 1 (preferred): MongoDB $geoNear aggregation using 2dsphere index.
//   → Accurate, server-side sorted by distance, uses DB index for speed.
//
// Strategy 2 (fallback): In-memory Haversine for books with flat coordinates.
//   → Catches books added before GeoJSON field was introduced.
//
// Books with NO location data at all are excluded from results.

export const getNearbyBooks = async (req, res) => {
  const latitude  = Number(req.query.latitude);
  const longitude = Number(req.query.longitude);
  const radiusKm  = Math.min(Number(req.query.radiusKm) || 50, 500); // cap at 500 km

  // Validate incoming coordinates
  if (
    !Number.isFinite(latitude)  || Math.abs(latitude)  > 90  ||
    !Number.isFinite(longitude) || Math.abs(longitude) > 180
  ) {
    return res.status(400).json({
      success: false,
      message: "A valid current location (latitude & longitude) is required",
    });
  }

  try {
    // ── Strategy 1: $geoNear — uses the 2dsphere index ───────────────────────
    // $geoNear must be the first stage in the pipeline.
    // distanceField is added to each document as "distanceMeters".
    const geoResults = await Book.aggregate([
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [longitude, latitude], // GeoJSON: [lng, lat]
          },
          distanceField: "distanceMeters",    // meters from user
          maxDistance: radiusKm * 1000,       // convert km → meters
          query: { available: true, "location.geoPoint": { $exists: true } },
          spherical: true,                    // use spherical Earth model
        },
      },
      { $sort: { distanceMeters: 1 } },      // nearest first
      { $limit: 100 },
      {
        $lookup: {                            // join User data
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "userId",
          pipeline: [
            { $project: { username: 1, fullName: 1, location: 1 } },
          ],
        },
      },
      { $unwind: { path: "$userId", preserveNullAndEmpty: true } },
    ]);

    // Convert distanceMeters → distanceKm, round to 1 decimal
    const geoBooks = geoResults.map((book) => ({
      ...book,
      distanceKm: Number((book.distanceMeters / 1000).toFixed(1)),
    }));

    // ── Strategy 2: Haversine fallback for books without geoPoint ────────────
    // These are older records that have flat lat/lng but no GeoJSON field.
    const geoBookIds = new Set(geoBooks.map((b) => String(b._id)));

    const legacyBooks = await Book.find({
      available: true,
      "location.geoPoint": { $exists: false },      // not handled by geoNear
      "location.coordinates.latitude":  { $exists: true },
      "location.coordinates.longitude": { $exists: true },
    })
      .populate("userId", "username fullName location")
      .lean();

    const legacyNearby = legacyBooks
      .filter((b) => !geoBookIds.has(String(b._id))) // avoid duplicates
      .map((b) => {
        const distKm = haversineKm(
          latitude, longitude,
          b.location.coordinates.latitude,
          b.location.coordinates.longitude
        );
        return { ...b, distanceKm: Number(distKm.toFixed(1)) };
      })
      .filter((b) => b.distanceKm <= radiusKm);

    // ── Merge & sort ──────────────────────────────────────────────────────────
    const all = [...geoBooks, ...legacyNearby].sort(
      (a, b) => a.distanceKm - b.distanceKm
    );

    return res.json({
      success: true,
      count: all.length,
      data: all,
    });
  } catch (error) {
    console.error("Nearby books error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Could not find nearby books",
    });
  }
};

// ─── GET BOOK BY ID ───────────────────────────────────────────────────────────
export const getBookById = async (req, res) => {
  try {
    const { id } = req.params;
    const book = await Book.findById(id).populate("userId", "username fullName email");

    if (!book) {
      return res.status(404).json({ success: false, message: "Book not found" });
    }

    return res.status(200).json({ success: true, data: book });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ success: false, message: "Invalid book ID" });
    }
    console.error("Get book by ID error:", error.message);
    return res.status(500).json({ success: false, message: "Something went wrong" });
  }
};

// ─── ADD BOOK ─────────────────────────────────────────────────────────────────
export const addBook = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: "Unauthorized. Please log in." });
    }

    const {
      title, author, isbn, category, condition, description,
      language, publicationYear, coverImage, location, price, available,
    } = req.body;

    // Prevent duplicate ISBN per user
    if (isbn) {
      const existing = await Book.findOne({ userId: req.user.id, isbn });
      if (existing) {
        return res.status(409).json({
          success: false,
          message: "You already listed a book with this ISBN",
        });
      }
    }

    const newBook = new Book({
      userId: req.user.id,
      title, author, isbn, category, condition, description,
      language, publicationYear, coverImage, location,
      price, available: available ?? true,
    });

    const savedBook = await newBook.save();

    return res.status(201).json({
      success: true,
      message: "Book added successfully",
      data: savedBook,
    });
  } catch (error) {
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid book data",
        errors: error.errors
          ? Object.values(error.errors).map((e) => e.message)
          : [error.message],
      });
    }
    console.error("Add book error:", error.message);
    return res.status(500).json({ success: false, message: "Something went wrong" });
  }
};

// ─── GET MY BOOKS ─────────────────────────────────────────────────────────────
export const getMyBooks = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: "Unauthorized." });
    }

    const myBooks = await Book.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .lean(); // .lean() returns plain JS objects — faster than full Mongoose docs

    return res.status(200).json({
      success: true,
      count: myBooks.length,
      data: myBooks,
    });
  } catch (error) {
    console.error("Get my books error:", error.message);
    return res.status(500).json({ success: false, message: "Something went wrong" });
  }
};

// ─── DELETE BOOK ──────────────────────────────────────────────────────────────
export const deleteBook = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: "Unauthorized." });
    }

    const { id } = req.params;
    const book = await Book.findById(id);

    if (!book) {
      return res.status(404).json({ success: false, message: "Book not found" });
    }

    // Only the owner can delete their book
    if (book.userId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Not authorized to delete this book" });
    }

    await book.deleteOne();

    return res.status(200).json({ success: true, message: "Book deleted successfully" });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ success: false, message: "Invalid book ID" });
    }
    console.error("Delete book error:", error.message);
    return res.status(500).json({ success: false, message: "Something went wrong" });
  }
};

// ─── GET ALL BOOKS ────────────────────────────────────────────────────────────
// Public browse — no login required. Supports search, filter, pagination.
export const getAllBooks = async (req, res) => {
  try {
    const { category, condition, search, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (category)  filter.category  = category;
    if (condition) filter.condition = condition;
    if (search) {
      filter.$or = [
        { title:  { $regex: search, $options: "i" } },
        { author: { $regex: search, $options: "i" } },
        { isbn:   { $regex: search, $options: "i" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [books, total] = await Promise.all([
      Book.find(filter)
        .populate("userId", "username fullName location")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(), // .lean() = faster, no Mongoose overhead
      Book.countDocuments(filter),
    ]);

    // Set cache header — browsers/CDNs can cache this for 30 seconds
    res.set("Cache-Control", "public, max-age=30");

    return res.status(200).json({
      success: true,
      count: books.length,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      data: books,
    });
  } catch (error) {
    console.error("Get all books error:", error.message);
    return res.status(500).json({ success: false, message: "Something went wrong" });
  }
};
