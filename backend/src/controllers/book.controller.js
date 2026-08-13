// controllers/book.controller.js
import Book from "../model/book.model.js";

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