  
  import { useEffect, useState } from "react";
import API from "../utils/axios";
import { useNavigate } from "react-router-dom";

export default function DashboardStudent() {
  const [quizzes, setQuizzes] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const { data } = await API.get("/quizzes", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setQuizzes(data);
      } catch (err) {
        console.error("Error fetching quizzes:", err);
      }
    };
    fetchQuizzes();
  }, []);

  return (
    <div className="max-w-5xl mx-auto mt-10">
      
      <div className="flex justify-end">
  <button
    onClick={() => navigate("/teacher/leaderboard")}
    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
  >
    🏆 Leaderboard
  </button>
</div>
      <h1 className="text-3xl font-bold text-green-600 mb-6 text-center">
        Student Dashboard
      </h1>


      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {quizzes.map((quiz) => (
          <div
            key={quiz._id}
            className="border rounded-xl p-4 shadow hover:shadow-md transition"
          >
            <h2 className="text-lg font-semibold mb-2">{quiz.title}</h2>
            <p className="text-gray-600 text-sm mb-3">{quiz.description}</p>
            <button
              onClick={() => navigate(`/student/quiz/${quiz._id}`)}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Start Quiz
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
  