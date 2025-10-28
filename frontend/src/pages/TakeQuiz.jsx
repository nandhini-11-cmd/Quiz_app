import { useEffect, useState } from "react";
import API from "../utils/axios";
import { useParams, useNavigate } from "react-router-dom";

export default function TakeQuiz() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [timer, setTimer] = useState(null);
  const [timerTotal, setTimerTotal] = useState(null);
  const [started, setStarted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Format timer display (MM:SS)
  const formatTime = (secs) => {
    if (secs === null || secs === undefined) return "--:--";
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // Fetch quiz details
  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const { data } = await API.get(`/quizzes/${id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setQuiz(data);

        const qCount = data.questions.length;
        const baseTime = Math.ceil(qCount / 10) * 60;
        setTimer(baseTime);
        setTimerTotal(baseTime);
        setStarted(true);
      } catch (err) {
        console.error("Error loading quiz:", err);
      }
    };
    fetchQuiz();
  }, [id]);

  // Countdown timer
  useEffect(() => {
    if (!started || timer === null) return;

    if (timer <= 0) {
      setStarted(false);
      handleSubmit(true); // auto submit
      return;
    }

    const countdown = setInterval(() => setTimer((prev) => prev - 1), 1000);
    return () => clearInterval(countdown);
  }, [started, timer]);

  // Handle option selection
  const handleSelect = (qId, option) => {
    setAnswers((prev) => ({ ...prev, [qId]: option }));
  };

  // Submit quiz answers
  const handleSubmit = async (autoSubmit = false) => {
    if (submitting) return;
    setSubmitting(true);

    try {
      const formattedAnswers = Object.entries(answers).map(
        ([questionId, answer]) => ({
          questionId,
          answer,
        })
      );

      const { data } = await API.post(
        `/results/${id}/submit`,
        { answers: formattedAnswers },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      const user = JSON.parse(localStorage.getItem("user") || "{}");

      navigate("/student/result", {
        state: {
          score: data.score,
          total: data.total,
          details: data.details,
          studentName: user.username,
          avatar: user.avatar,
          quizTitle: quiz.title,
          quizId: quiz._id,
        },
      });
    } catch (err) {
      console.error("Error submitting quiz:", err);
      alert(err.response?.data?.message || "Failed to submit quiz");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    setAnswers({});
  }, [id]);

  if (!quiz)
    return <div className="text-center text-gray-500 mt-10">Loading quiz...</div>;

  const progressPct =
    timerTotal && timer !== null && timerTotal > 0
      ? Math.max(0, Math.min(100, (timer / timerTotal) * 100))
      : 100;

  return (
    <div className="relative max-w-3xl mx-auto mt-10 bg-white p-6 rounded-xl shadow-lg">
      {/* Back Button */}
      <div className="flex justify-end">
        <button
          onClick={() => navigate(`/student/dashboard`)}
          className="text-blue-700 font-semibold underline hover:text-blue-900"
        >
          ⬅ Back to Dashboard
        </button>
      </div>

      {/* Title & Description */}
      <h1 className="text-2xl font-bold mb-4 text-center text-indigo-700">
        {quiz.title}
      </h1>
      <p className="text-gray-600 text-center mb-6">{quiz.description}</p>

      {/* Timer */}
      <div className="text-right mb-4">
        <p className="font-semibold text-red-600">
          Time Left: {formatTime(timer)}
        </p>
        <div className="w-full bg-gray-200 h-2 rounded-full mt-2">
          <div
            className="h-2 bg-green-500 rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Questions */}
      {quiz.questions.map((q, index) => (
        <div key={q._id} className="mb-6 border border-gray-200 p-4 rounded-lg">
          <p className="font-medium mb-2 text-gray-800">
            {index + 1}. {q.questionText}
          </p>

          <div className="space-y-1">
            {q.options.map((opt, i) => (
              <label
                key={i}
                className="block p-2 rounded hover:bg-blue-50 cursor-pointer"
              >
                <input
                  type="radio"
                  name={q._id}
                  value={opt}
                  checked={answers[q._id] === opt}
                  onChange={() => handleSelect(q._id, opt)}
                  className="mr-2 accent-blue-600"
                />
                {opt}
              </label>
            ))}
          </div>
        </div>
      ))}

      {/* Submit Button */}
      <button
        onClick={() => handleSubmit(false)}
        disabled={submitting}
        className="bg-green-600 hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed 
                   text-white py-2 px-6 rounded-lg w-full font-semibold transition duration-300 
                   flex justify-center items-center gap-2"
      >
        {submitting ? (
          <>
            <svg
              className="animate-spin h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              ></path>
            </svg>
            <span>Submitting the quiz...</span>
          </>
        ) : (
          "Submit Quiz"
        )}
      </button>

      {/* Full-Screen Overlay While Submitting */}
      {submitting && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex flex-col justify-center items-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg flex flex-col items-center gap-3">
            <svg
              className="animate-spin h-8 w-8 text-green-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              ></path>
            </svg>
            <p className="text-lg font-medium text-gray-700">
              Evaluating your answers... Please wait.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
