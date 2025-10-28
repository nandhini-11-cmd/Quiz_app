import { useEffect, useState } from "react";
import API from "../utils/axios";
import { useNavigate } from "react-router-dom";

export default function DashboardTeacher() {
  const [quizzes, setQuizzes] = useState([]);
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
        console.error("Error fetching quizzes", err);
      }
    };
    fetchQuizzes();
  }, []);

 
  const handleDelete = async (quizId) => {
    if (!window.confirm("Are you sure you want to delete this quiz?")) return;

    try {
      await API.delete(`/quizzes/${quizId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setQuizzes(quizzes.filter((q) => q._id !== quizId));
      alert("Quiz deleted successfully!");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to delete quiz");
    }
  };

  return (
    <div className="max-w-6xl mx-auto mt-10 px-4">
      <h1 className="text-3xl font-extrabold text-blue-600 mb-6 text-center">
        🎓 Teacher Dashboard
      </h1>

     
      <div className="flex justify-end gap-3 mb-6">
        <button
          onClick={() => navigate("/teacher/create")}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg font-semibold shadow"
        >
          ➕ Create New Quiz
        </button>
        <button
          onClick={() => navigate("/teacher/leaderboard")}
          className="bg-yellow-500 hover:bg-yellow-600 text-white px-5 py-2 rounded-lg font-semibold shadow"
        >
          🏆 Leaderboard
        </button>
      </div>

    
      {quizzes.length === 0 ? (
        <p className="text-center text-gray-500 text-lg">No quizzes found yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {quizzes.map((quiz) => {
            const isOwner = quiz.createdBy?._id === user?._id;

            return (
              <div
                key={quiz._id}
                className="bg-white p-5 rounded-xl shadow hover:shadow-lg border border-gray-200 transition-transform hover:scale-[1.01]"
              >
               
                <h2 className="text-xl font-bold text-indigo-700">{quiz.title}</h2>
                <p className="text-gray-600 text-sm mt-1 mb-3 line-clamp-3">
                  {quiz.description}
                </p>

                
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                  <img
                    src={
                      quiz.createdBy?.avatar
                        ? `http://localhost:5000${quiz.createdBy.avatar}`
                        : "http://localhost:5000/avatars/default.png"
                    }
                    alt="avatar"
                    className="w-7 h-7 rounded-full border object-cover"
                  />
                  <p>
                    Created by:{" "}
                    <span className="font-medium text-gray-800">
                      {quiz.createdBy?.username || "Unknown"}
                    </span>
                  </p>
                </div>

                
                <div className="flex justify-between items-center mt-2">
                  {isOwner ? (
                    <>
                      <button
                        onClick={() => navigate(`/teacher/edit/${quiz._id}`)}
                        className="text-blue-600 font-semibold hover:underline"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDelete(quiz._id)}
                        className="text-red-600 font-semibold hover:underline"
                      >
                        🗑 Delete
                      </button>
                    </>
                  ) : (
                    <span className="text-sm italic text-gray-400">
                      🔒 View Only
                    </span>
                  )}

                  <button
                    onClick={() => navigate(`/quiz/${quiz._id}`)}
                    className="text-green-600 font-semibold hover:underline"
                  >
                    👁 View
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}