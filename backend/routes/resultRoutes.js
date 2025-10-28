import express from "express";
import {
  submitQuiz,
  getMyResults,
  getQuizResults,
} from "../controllers/resultController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/authorizeRoles.js";

const router = express.Router();

// Student submits quiz
router.post("/:quizId/submit", protect, authorizeRoles("student"), submitQuiz);

// Student views own results
router.get("/my", protect, authorizeRoles("student"), getMyResults);

// Teacher views results for a quiz
router.get("/quiz/:quizId", protect, authorizeRoles("teacher"), getQuizResults);

export default router;