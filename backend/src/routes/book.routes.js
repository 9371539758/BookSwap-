// routes/book.routes.js
import express from "express";
import {
  addBook,
  getAllBooks,
  getNearbyBooks,
  getBookById,
  getMyBooks,
  deleteBook,
} from "../controllers/book.controller.js";
import { addBookValidator } from "../validators/book.validator.js";
import { validate } from "../middleware/validate.middleware.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

// NOTE: specific paths (/nearby, /my) must be defined BEFORE /:id
// otherwise Express matches them as an id param

router.get("/nearby",   authMiddleware, getNearbyBooks);  // GET /api/books/nearby?latitude=&longitude=
router.get("/my",       authMiddleware, getMyBooks);      // GET /api/books/my
router.get("/my-books", authMiddleware, getMyBooks);      // backward-compat alias
router.get("/",         getAllBooks);                     // GET /api/books (public browse)
router.get("/:id",      getBookById);                    // GET /api/books/:id

router.post("/",        authMiddleware, addBookValidator, validate, addBook);  // create
router.delete("/:id",   authMiddleware, deleteBook);     // owner-only delete

export default router;

