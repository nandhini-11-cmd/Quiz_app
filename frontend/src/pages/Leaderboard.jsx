import { useEffect, useState } from "react";
import API from "../utils/axios";
import { useNavigate } from "react-router-dom";
import UserAvatar from "../components/UserAvatar"; // ✅ Import UserAvatar

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState("overall");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  // Fetch quizzes
  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const { data } = await API.get("/quizzes", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setQuizzes(data);
      } catch (err) {
        console.error("Error loading quizzes:", err);
      }
    };
    fetchQuizzes();
  }, []);

  // Fetch leaderboard
  const fetchLeaderboard = async (quizId) => {
    setLoading(true);
    try {
      const url =
        quizId === "overall" ? "/leaderboard" : `/leaderboard/${quizId}`;
      const { data } = await API.get(url, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setLeaderboard(data);
    } catch (err) {
      console.error("Error loading leaderboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard("overall");
  }, []);

  const handleSelect = (e) => {
    const quizId = e.target.value;
    setSelectedQuiz(quizId);
    fetchLeaderboard(quizId);
  };

  const handleBack = () => {
    if (user?.role === "teacher") navigate("/teacher/dashboard");
    else navigate("/student/dashboard");
  };

  // Rank medals
  const getMedal = (rankNum) => {
    switch (rankNum) {
      case 1: return "🥇";
      case 2: return "🥈";
      case 3: return "🥉";
      default: return `#${rankNum}`;
    }
  };

  const getRankColor = (rankNum) => {
    if (rankNum === 1) return "text-yellow-500 font-extrabold";
    if (rankNum === 2) return "text-gray-400 font-bold";
    if (rankNum === 3) return "text-amber-700 font-bold";
    return "text-blue-700";
  };

  return (
    <div className="max-w-5xl mx-auto mt-10 bg-white p-8 rounded-2xl shadow-lg">
      {/* Back button */}
      <div className="flex justify-end">
        <button
          onClick={handleBack}
          className="text-blue-700 font-bold underline hover:text-blue-900 transition"
        >
          ⬅ Back to Dashboard
        </button>
      </div>

      <h2 className="text-3xl font-bold text-indigo-700 text-center mb-6">
        🏆 Leaderboard
      </h2>

      {/* Quiz selector */}
      <div className="flex justify-center mb-8">
        <select
          value={selectedQuiz}
          onChange={handleSelect}
          className="border p-2 rounded-lg w-72 text-gray-700 focus:ring-2 focus:ring-indigo-400 focus:outline-none shadow-sm"
        >
          <option value="overall">Overall Leaderboard</option>
          {quizzes.map((quiz) => (
            <option key={quiz._id} value={quiz._id}>
              {quiz.title}
            </option>
          ))}
        </select>
      </div>

      {/* Leaderboard Table */}
      {loading ? (
        <p className="text-center text-gray-500">Loading leaderboard...</p>
      ) : leaderboard.length === 0 ? (
        <p className="text-center text-gray-500">
          No results found for this selection.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-center shadow-sm">
            <thead>
              <tr className="bg-gradient-to-r from-indigo-100 to-blue-100 text-indigo-800 uppercase text-sm">
                <th className="border px-4 py-2">Rank</th>
                <th className="border px-4 py-2">Student</th>
                <th className="border px-4 py-2">Score (%)</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((entry, i) => {
                // ✅ Use rankNumber (number) for color/medal logic
                const rankNum = entry.rankNumber ?? i + 1;

                return (
                  <tr
                    key={i}
                    className="hover:bg-indigo-50 transition-transform duration-200 hover:scale-[1.01]"
                  >
                    <td className={`border px-4 py-3 text-lg ${getRankColor(rankNum)}`}>
                      {getMedal(rankNum)}
                    </td>

                    <td className="border px-4 py-2">
                      <div className="flex items-center justify-center gap-3">
                        {/* ✅ FIXED: Replaced broken <img> with UserAvatar — no more infinite loop */}
                        <UserAvatar
                          username={entry.student?.username}
                          avatar={entry.student?.avatar}
                          size={40}
                        />
                        <span className="text-gray-800 font-semibold">
                          {entry.student?.username || "Unknown"}
                        </span>
                      </div>
                    </td>

                    <td className="border px-4 py-2 text-green-700 font-semibold">
                      {entry.bestScore ?? entry.averageScore}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer */}
      <p className="text-center text-sm text-gray-500 mt-4 italic">
        🌟 Celebrating learning and growth through every quiz!
      </p>
    </div>
  );
}
