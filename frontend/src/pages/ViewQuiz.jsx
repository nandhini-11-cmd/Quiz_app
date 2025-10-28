import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../utils/axios";

export default function ViewQuiz() {
  const { id } = useParams(); // quizId
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const { data } = await API.get(`/quizzes/${id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setQuiz(data);
      } catch (err) {
        console.error("Error fetching quiz:", err);
        alert("Failed to load quiz details");
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [id]);

  if (loading) {
    return (
      <div className="text-center text-gray-500 mt-10">Loading quiz...</div>
    );
  }

  if (!quiz) {
    return (
      <div className="text-center text-gray-600 mt-10">
        Quiz not found or unavailable.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto mt-10 bg-white p-6 rounded-xl shadow-md border">
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-indigo-700">{quiz.title}</h1>
        <button
          onClick={() => navigate(-1)}
          className="text-blue-600 underline font-semibold"
        >
          ← Back to Dashboard
        </button>
      </div>

      
      <p className="text-gray-600 mb-4">{quiz.description}</p>

     
      <div className="flex items-center gap-2 mb-6">
        <img
          src={
            quiz.createdBy?.avatar
              ? `http://localhost:5000${quiz.createdBy.avatar}`
              : "http://localhost:5000/avatars/default.png"
          }
          alt="avatar"
          className="w-8 h-8 rounded-full border object-cover"
        />
        <span className="text-gray-700">
          Created by{" "}
          <span className="font-medium text-indigo-700">
            {quiz.createdBy?.username || "Unknown"}
          </span>
        </span>
      </div>

     
      <div className="space-y-6">
        {quiz.questions.map((q, index) => (
          <div
            key={q._id}
            className="border rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition"
          >
            <p className="font-semibold text-gray-800">
              {index + 1}. {q.questionText}
            </p>
            <ul className="list-disc ml-6 mt-2 text-gray-700">
              {q.options.map((opt, i) => (
                <li key={i}>{opt}</li>
              ))}
            </ul>
            <p className="mt-3 text-green-700 font-medium">
              ✅ Correct Answer: {q.correctAnswer}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
