import express from "express";
import {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import { forgotPassword, resetPassword } from "../controllers/authController.js";



const router = express.Router();

// Auth routes
router.post("/register", registerUser);
router.post("/login", loginUser);

// Profile routes (protected by JWT middleware)
router.get("/profile", protect, getUserProfile);
router.put("/profile", protect, updateUserProfile);

router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);
export default router;