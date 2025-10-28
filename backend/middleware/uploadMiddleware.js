import multer from "multer";
import path from "path";
import fs from "fs";

const uploadDir = "public/uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadDir);
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `avatar-${Date.now()}${ext}`);
  },
});

function fileFilter(req, file, cb) {
  const allowed = /jpg|jpeg|png/;
  const isExtOk = allowed.test(path.extname(file.originalname).toLowerCase());
  const isMimeOk = allowed.test(file.mimetype);
  if (isExtOk && isMimeOk) cb(null, true);
  else cb(new Error("Only JPG/PNG images are allowed"));
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
});

export default upload;