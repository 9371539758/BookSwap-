// src/routes/upload.routes.js
import express from "express";
import { uploadImage } from "../controllers/upload.controller.js";
import { uploadSingle } from "../middleware/upload.middleware.js";
import { authMiddleware } from "../middleware/auth.middleware.js"; // keep auth if uploads require login

const router = express.Router();

// POST /api/uploads
// expects multipart/form-data with a field named 'file'
router.post("/", authMiddleware, uploadSingle, uploadImage);

export default router;
