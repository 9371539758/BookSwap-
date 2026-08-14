// routes/book.routes.js
import express from "express";
import { addBook,getMyBooks,deleteBook,getAllBooks } from "../controllers/book.controller.js";
import { addBookValidator } from "../validators/book.validator.js";
import { validate } from "../middleware/validate.middleware.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();
router.get("/", getAllBooks);           // or /all, /browse, whatever you prefer

router.post("/", authMiddleware, addBookValidator, validate, addBook);
router.get("/my", authMiddleware, getMyBooks);   
router.delete("/:id", authMiddleware, deleteBook);

export default router;
