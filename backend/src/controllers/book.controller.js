// controllers/book.controller.js
import Book from "../model/book.model.js";

const distanceInKm = (fromLat, fromLng, toLat, toLng) => {
  const earthRadiusKm = 6371;
  const toRadians = (value) => (value * Math.PI) / 180;
  const latDistance = toRadians(toLat - fromLat);
  const lngDistance = toRadians(toLng - fromLng);
  const value =
    Math.sin(latDistance / 2) ** 2 +
    Math.cos(toRadians(fromLat)) * Math.cos(toRadians(toLat)) * Math.sin(lngDistance / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
};

export const getNearbyBooks = async (req, res) => {
  const latitude = Number(req.query.latitude);
  const longitude = Number(req.query.longitude);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
    return res.status(400).json({ success: false, message: "A valid current location is required" });
  }

  try {
    const books = await Book.find({ available: true })
      .populate("userId", "username fullName location")
      .sort({ createdAt: -1 });

    const nearbyBooks = books
      .filter((book) => Number.isFinite(book.location?.coordinates?.latitude) && Number.isFinite(book.location?.coordinates?.longitude))
      .map((book) => ({
        ...book.toObject(),
        distanceKm: Number(distanceInKm(latitude, longitude, book.location.coordinates.latitude, book.location.coordinates.longitude).toFixed(1)),
      }))
      .sort((first, second) => first.distanceKm - second.distanceKm);

    res.json({ success: true, count: nearbyBooks.length, data: nearbyBooks });
  } catch (error) {
    console.error("Nearby books error:", error.message);
    res.status(500).json({ success: false, message: "Could not find nearby books" });
  }
};

// export const getAllBooks = async (req, res) => {
//   try {
//     const books = await Book.find().sort({ createdAt: -1 }).populate("userId", "username fullName email");

//     return res.status(200).json({
//       success: true,
//       count: books.length,
//       data: books,
//     });
//   } catch (error) {
//     console.error("Get all books error:", error.message);
//     return res.status(500).json({
//       success: false,
//       message: "Something went wrong while fetching books",
//     });
//   }
// };

export const getBookById = async (req, res) => {
  try {
    const { id } = req.params;

    const book = await Book.findById(id).populate("userId", "username fullName email");

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: book,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid book ID",
      });
    }

    console.error("Get book by ID error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while fetching the book",
    });
  }
};

export const addBook = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. Please log in to add a book.",
      });
    }

    const {
      title,
      author,
      isbn,
      category,
      condition,
      description,
      language,
      publicationYear,
      coverImage,
      location,
      price,
      available,
    } = req.body;

    // Edge case: duplicate ISBN for the same user (avoid accidental double-listing)
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
      title,
      author,
      isbn,
      category,
      condition,
      description,
      language,
      publicationYear,
      coverImage,
      location,
      price,
      available: available ?? true, // default even if client sends nothing
    });

    const savedBook = await newBook.save();

    return res.status(201).json({
      success: true,
      message: "Book added successfully",
      data: savedBook,
    });
  } catch (error) {
    // Edge case: Mongoose validation errors slipping past express-validator
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
    return res.status(500).json({
      success: false,
      message: "Something went wrong while adding the book",
    });
  }
};
// Get all books added by the logged-in user
export const getMyBooks = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. Please log in to view your books.",
      });
    }

    const myBooks = await Book.find({ userId: req.user.id }).sort({
      createdAt: -1, // newest first
    });

    return res.status(200).json({
      success: true,
      count: myBooks.length,
      data: myBooks,
    });
  } catch (error) {
    console.error("Get my books error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while fetching your books",
    });
  }
};

// Delete a book (only the owner can delete their own book)
export const deleteBook = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. Please log in to delete a book.",
      });
    }

    const { id } = req.params;

    const book = await Book.findById(id);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    // Edge case: prevent users from deleting someone else's book
    if (book.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this book",
      });
    }

    await book.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Book deleted successfully",
    });
  } catch (error) {
    // Edge case: invalid Mongo ObjectId format in the URL
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid book ID",
      });
    }
    console.error("Delete book error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while deleting the book",
    });
  }
};
// Get ALL books (public browse – no login required)
export const getAllBooks = async (req, res) => {
  try {
    const { category, condition, search, page = 1, limit = 20 } = req.query;

    const filter = {};

    // Optional filters
    if (category) filter.category = category;
    if (condition) filter.condition = condition;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { author: { $regex: search, $options: "i" } },
        { isbn: { $regex: search, $options: "i" } },
      ];
    }

    // Only show available books by default (optional)
    // filter.available = true;

    const skip = (Number(page) - 1) * Number(limit);

    const [books, total] = await Promise.all([
      Book.find(filter)
        .populate("userId", "username fullName location")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Book.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      count: books.length,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
      data: books,
    });
  } catch (error) {
    console.error("Get all books error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while fetching books",
    });
  }
};
