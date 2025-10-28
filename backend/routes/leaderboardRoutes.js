import express from "express";
import { getOverallLeaderboard, getQuizLeaderboard } from "../controllers/leaderboardController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Overall leaderboard
router.get("/", protect, getOverallLeaderboard);

// Leaderboard for a specific quiz
router.get("/:quizId", protect, getQuizLeaderboard);

export default router;