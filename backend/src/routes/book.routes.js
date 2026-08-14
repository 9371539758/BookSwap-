// routes/book.routes.js
import express from "express";
import { addBook,getMyBooks,deleteBook } from "../controllers/book.controller.js";
import { addBookValidator } from "../validators/book.validator.js";
import { validate } from "../middleware/validate.middleware.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();
router.get("/", getAllBooks);           // or /all, /browse, whatever you prefer

router.get("/", getAllBooks);
router.get("/my", authMiddleware, getMyBooks);
router.get("/my-books", authMiddleware, getMyBooks); // backward compatibility for older frontend builds
router.get("/:id", getBookById);
router.post("/", authMiddleware, addBookValidator, validate, addBook);
router.delete("/:id", authMiddleware, deleteBook);

export default router;
