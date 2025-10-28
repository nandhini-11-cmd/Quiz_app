import Result from "../models/Result.js";
import User from "../models/User.js";
import mongoose from "mongoose";

// Helper function to format ranks as 1st, 2nd, 3rd...
const getOrdinalSuffix = (num) => {
  const suffixes = ["th", "st", "nd", "rd"];
  const v = num % 100;
  return (
    num +
    (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0])
  );
};

// Overall Leaderboard (Top N students by average score)
export const getOverallLeaderboard = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 3;

    const leaderboard = await Result.aggregate([
      {
        $group: {
          _id: "$student",
          averageScore: {
            $avg: { $multiply: [{ $divide: ["$score", "$total"] }, 100] }
          }
        }
      },
      { $sort: { averageScore: -1 } },
      { $limit: limit }
    ]);

    // populate student details
    const populated = await User.populate(leaderboard, {
      path: "_id",
      select: "username avatar"
    });

 const ranked = populated.map((item, index) => ({
  rank: getOrdinalSuffix(index + 1),  // ordinal rank
  student: item._id,
  averageScore: item.averageScore.toFixed(2)
}));

    res.json(ranked);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Leaderboard for a specific quiz (Top N students by best score)
export const getQuizLeaderboard = async (req, res) => {
  try {
    const { quizId } = req.params;
    const limit = parseInt(req.query.limit) || 3;

    const leaderboard = await Result.aggregate([
      { $match: { quiz: new mongoose.Types.ObjectId(quizId) } },
      {
        $group: {
          _id: "$student",
          bestScore: {
            $max: { $multiply: [{ $divide: ["$score", "$total"] }, 100] }
          }
        }
      },
      { $sort: { bestScore: -1 } },
      { $limit: limit }
    ]);

    // populate student details
    const populated = await User.populate(leaderboard, {
      path: "_id",
      select: "username avatar"
    });

    // Quiz Leaderboard
const ranked = populated.map((item, index) => ({
  rank: getOrdinalSuffix(index + 1),  // ordinal rank
  student: item._id,
  bestScore: item.bestScore.toFixed(2)
}));

    res.json(ranked);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};