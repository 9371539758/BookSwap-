// src/controllers/upload.controller.js
// Receives a file from multer (req.file.buffer) and streams it to Cloudinary.
import streamifier from "streamifier";
import cloudinary from "../../utils/cloudinary.js";

export const uploadImage = (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ success: false, message: "No file provided" });
    }

    // Temporarily omit the folder parameter to rule out folder-related signature issues
    const uploadStream = cloudinary.uploader.upload_stream((error, result) => {
      if (error) {
        console.error("Cloudinary upload error:", error);
        return res.status(500).json({ success: false, message: "Upload failed" });
      }

      return res.status(201).json({ success: true, url: result.secure_url });
    });

    // Stream the buffer to Cloudinary
    streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
  } catch (err) {
    console.error("Upload controller error:", err);
    return res.status(500).json({ success: false, message: "Upload failed" });
  }
};
