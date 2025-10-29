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
  const [timeUp, setTimeUp] = useState(false); // ✅ new state

  // Format MM:SS
  const formatTime = (secs) => {
    if (secs === null || secs === undefined) return "--:--";
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // Fetch quiz
  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const { data } = await API.get(`/quizzes/${id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setQuiz(data);
        const qCount = data.questions.length;
        const baseTime = Math.ceil(qCount / 5) * 60;
        setTimer(baseTime);
        setTimerTotal(baseTime);
        setStarted(true);
      } catch (err) {
        console.error("Error loading quiz:", err);
      }
    };
    fetchQuiz();
  }, [id]);

  // Countdown
  useEffect(() => {
    if (!started || timer === null) return;

    if (timer <= 0) {
      setStarted(false);
      setTimeUp(true); // ✅ trigger popup
      return;
    }

    const countdown = setInterval(() => setTimer((prev) => prev - 1), 1000);
    return () => clearInterval(countdown);
  }, [started, timer]);

  // Handle time-up auto-submit
  useEffect(() => {
    if (timeUp) {
      // show popup for 2s, then auto-submit
      const timeout = setTimeout(() => handleSubmit(true), 2000);
      return () => clearTimeout(timeout);
    }
  }, [timeUp]);

  // Option select
  const handleSelect = (qId, option) => {
    setAnswers((prev) => ({ ...prev, [qId]: option }));
  };

  // Submit
  const handleSubmit = async (autoSubmit = false) => {
    if (submitting) return;
    setSubmitting(true);

    try {
      const formattedAnswers = Object.entries(answers).map(
        ([questionId, answer]) => ({ questionId, answer })
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
      setTimeUp(false);
    }
  };

  useEffect(() => setAnswers({}), [id]);

  if (!quiz)
    return <div className="text-center text-gray-500 mt-10">Loading quiz...</div>;

  const progressPct =
    timerTotal && timer !== null && timerTotal > 0
      ? Math.max(0, Math.min(100, (timer / timerTotal) * 100))
      : 100;

  return (
    <div className="relative max-w-3xl mx-auto mt-10 bg-white p-6 rounded-xl shadow-lg">
      {/* Back */}
      <div className="flex justify-end">
        <button
          onClick={() => navigate(`/student/dashboard`)}
          className="text-blue-700 font-semibold underline hover:text-blue-900"
        >
          ⬅ Back to Dashboard
        </button>
      </div>

      {/* Title */}
      <h1 className="text-2xl font-bold mb-4 text-center text-indigo-700">
        {quiz.title}
      </h1>
      <p className="text-gray-600 text-center mb-6">{quiz.description}</p>

      {/* Timer (Sticky) */}
<div className="sticky top-0 bg-white py-3 z-20 border-b border-gray-200">
  <div className="text-right mb-1 px-2">
    <p className="font-semibold text-red-600">
      Time Left: {formatTime(timer)}
    </p>
  </div>
  <div className="w-full bg-gray-200 h-2 rounded-full">
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

      {/* Submit */}
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

      {/* ⏰ Time-up Popup */}
      {timeUp && !submitting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-3">⏰ Time’s Up!</h2>
            <p className="text-gray-700">
              Your quiz time has ended. Submitting automatically...
            </p>
          </div>
        </div>
      )}

      {/* Evaluating Overlay */}
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
