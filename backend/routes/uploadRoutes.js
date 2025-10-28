import express from "express";
import upload from "../middleware/uploadMiddleware.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// POST /api/upload  (form-data: image=<file>)
router.post("/", protect, upload.single("image"), (req, res) => {
  res.json({
    message: "Image uploaded successfully",
    imagePath: `/uploads/${req.file.filename}`,
  });
});

export default router;