// routes/book.routes.js
import express from "express";
import {
  addBook,
  getMyBooks,
  deleteBook,
} from "../controllers/book.controller.js";
import { addBookValidator } from "../validators/book.validator.js";
import { validate } from "../middleware/validate.middleware.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", authMiddleware, addBookValidator, validate, addBook);
router.get("/my", authMiddleware, getMyBooks);
router.get("/my-books", authMiddleware, getMyBooks); // backward compatibility for older frontend builds
router.delete("/:id", authMiddleware, deleteBook);

export default router;
