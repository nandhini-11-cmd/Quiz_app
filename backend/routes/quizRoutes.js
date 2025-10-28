import express from "express";

import {
  createQuiz,
  aiGenerateQuiz,
  getQuizzes,
  getQuizById,
  updateQuiz,
  deleteQuiz,
} from "../controllers/quizController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/authorizeRoles.js";

const router = express.Router();

// Teacher creates quiz
router.post("/", protect, authorizeRoles("teacher"), createQuiz);
router.post("/ai-generate", protect, authorizeRoles("teacher"), aiGenerateQuiz);

// All users get quizzes
router.get("/", protect, getQuizzes);

// Get single quiz
router.get("/:id", protect, getQuizById);

// Teacher updates quiz
router.put("/:id", protect, authorizeRoles("teacher"), updateQuiz);

// Teacher deletes quiz
router.delete("/:id", protect, authorizeRoles("teacher"), deleteQuiz);

export default router;


