import { useEffect, useState } from "react";
import API from "../utils/axios";
import { useNavigate } from "react-router-dom";

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState("overall");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  
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

  
const getMedal = (rank) => {
  const num = Number(rank); // convert string -> number
  switch (num) {
    case 1:
      return "🥇";
    case 2:
      return "🥈";
    case 3:
      return "🥉";
    default:
      return `#${rank}`;
  }
};

 
  const getRankColor = (rank) => {
    if (rank === 1) return "text-yellow-500 font-extrabold";
    if (rank === 2) return "text-gray-400 font-bold";
    if (rank === 3) return "text-amber-700 font-bold";
    return "text-blue-700";
  };

  return (
    <div className="max-w-5xl mx-auto mt-10 bg-white p-8 rounded-2xl shadow-lg">
      
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
              {leaderboard.map((entry, i) => (
                <tr
                  key={i}
                  className="hover:bg-indigo-50 transition-transform duration-200 hover:scale-[1.01]"
                >
                 <td className={`border px-4 py-3 text-lg ${getRankColor(entry.rank)}`}>
  {getMedal(entry.rank)}
</td>

                  <td className="border px-4 py-2 flex items-center justify-center gap-3">
                    <img
                      src={
                        entry.student?.avatar
                          ? `http://localhost:5000${entry.student.avatar}`
                          : "http://localhost:5000/avatars/default.png"
                      }
                      alt="avatar"
                      className="w-10 h-10 rounded-full object-cover border-2 border-indigo-200"
                      onError={(e) =>
                        (e.target.src =
                          "http://localhost:5000/avatars/default.png")
                      }
                    />
                    <span className="text-gray-800 font-semibold">
                      {entry.student?.username || "Unknown"}
                    </span>
                  </td>

                  <td className="border px-4 py-2 text-green-700 font-semibold">
                    {entry.bestScore || entry.averageScore}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    
      <p className="text-center text-sm text-gray-500 mt-4 italic">
        🌟 Celebrating learning and growth through every quiz!
      </p>
    </div>
  );
}