import Result from "../models/Result.js";
import User from "../models/User.js";
import mongoose from "mongoose";

// Helper: format rank as 1st, 2nd, 3rd...
const getOrdinalSuffix = (num) => {
  const suffixes = ["th", "st", "nd", "rd"];
  const v = num % 100;
  return num + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
};

// ✅ FIX: Return a safe avatar URL
// Instead of returning a path that may not exist on the deployed server,
// return null and let the frontend handle the fallback with a UI avatar.
const getSafeAvatar = (avatar) => {
  if (!avatar) return null;
  // If it's already a full URL (e.g. from Google OAuth), return as-is
  if (avatar.startsWith("http://") || avatar.startsWith("https://")) return avatar;
  // If it's a local path like /avatars/default.png — skip it on production
  // because free-tier servers don't persist uploaded files
  if (avatar.startsWith("/avatars/") || avatar.startsWith("avatars/")) return null;
  return avatar;
};

// ─── Overall Leaderboard (Top N students by average score) ───────────────────
export const getOverallLeaderboard = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const leaderboard = await Result.aggregate([
      {
        $group: {
          _id: "$student",
          averageScore: {
            $avg: { $multiply: [{ $divide: ["$score", "$total"] }, 100] },
          },
          totalQuizzes: { $sum: 1 },
        },
      },
      { $sort: { averageScore: -1 } },
      { $limit: limit },
    ]);

    const populated = await User.populate(leaderboard, {
      path: "_id",
      select: "username avatar",
    });

    const ranked = populated.map((item, index) => ({
      rank: getOrdinalSuffix(index + 1),
      rankNumber: index + 1,
      student: {
        _id: item._id?._id,
        username: item._id?.username || "Unknown",
        // ✅ Safe avatar — null instead of broken local path
        avatar: getSafeAvatar(item._id?.avatar),
      },
      averageScore: parseFloat(item.averageScore.toFixed(2)),
      totalQuizzes: item.totalQuizzes,
    }));

    res.json(ranked);
  } catch (err) {
    console.error("[Leaderboard] getOverallLeaderboard error:", err.message);
    res.status(500).json({ message: err.message });
  }
};

// ─── Quiz Leaderboard (Top N students by best score for a specific quiz) ──────
export const getQuizLeaderboard = async (req, res) => {
  try {
    const { quizId } = req.params;
    const limit = parseInt(req.query.limit) || 10;

    if (!mongoose.Types.ObjectId.isValid(quizId)) {
      return res.status(400).json({ message: "Invalid quiz ID" });
    }

    const leaderboard = await Result.aggregate([
      { $match: { quiz: new mongoose.Types.ObjectId(quizId) } },
      {
        $group: {
          _id: "$student",
          bestScore: {
            $max: { $multiply: [{ $divide: ["$score", "$total"] }, 100] },
          },
          attempts: { $sum: 1 },
        },
      },
      { $sort: { bestScore: -1 } },
      { $limit: limit },
    ]);

    const populated = await User.populate(leaderboard, {
      path: "_id",
      select: "username avatar",
    });

    const ranked = populated.map((item, index) => ({
      rank: getOrdinalSuffix(index + 1),
      rankNumber: index + 1,
      student: {
        _id: item._id?._id,
        username: item._id?.username || "Unknown",
        // ✅ Safe avatar — null instead of broken local path
        avatar: getSafeAvatar(item._id?.avatar),
      },
      bestScore: parseFloat(item.bestScore.toFixed(2)),
      attempts: item.attempts,
    }));

    res.json(ranked);
  } catch (err) {
    console.error("[Leaderboard] getQuizLeaderboard error:", err.message);
    res.status(500).json({ message: err.message });
  }
};
