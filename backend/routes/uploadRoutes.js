import express from "express";
import multer from "multer";
import path from "path";

const router = express.Router();

// Storage config
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, "public/uploads");
  },
  filename(req, file, cb) {
    cb(null, `${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({ storage });

// ✅ No protect() for registration uploads
router.post("/", upload.single("image"), (req, res) => {
  res.json({
    message: "Image uploaded successfully",
    imagePath: `/uploads/${req.file.filename}`,
  });
});

export default router;
