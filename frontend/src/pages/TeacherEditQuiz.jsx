import { useEffect, useState } from "react";
import API from "../utils/axios";
import { useParams, useNavigate } from "react-router-dom";

export default function TeacherEditQuiz() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  
  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const { data } = await API.get(`/quizzes/${id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setTitle(data.title);
        setDescription(data.description);
        setQuestions(data.questions);
      } catch (err) {
        console.error("Failed to load quiz:", err);
        alert("Error loading quiz details");
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [id]);

  
  const handleChange = (index, key, value) => {
    const updated = [...questions];
    updated[index][key] = value;
    setQuestions(updated);
  };

  const handleOptionChange = (qIndex, optIndex, value) => {
    const updated = [...questions];
    updated[qIndex].options[optIndex] = value;
    setQuestions(updated);
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      { questionText: "", options: ["", "", "", ""], correctAnswer: "" },
    ]);
  };

  const removeQuestion = (index) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await API.put(
        `/quizzes/${id}`,
        { title, description, questions },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      alert("Quiz updated successfully!");
      navigate("/teacher/dashboard");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to update quiz");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center mt-10 text-gray-500">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto mt-10 bg-white p-6 rounded-xl shadow-lg">
      <div className="flex justify-end">
        <button
                onClick={() => navigate(`/teacher/dashboard`)}
                className="text-blue-700 font-bold underline hover:underline"
              >
                Back to dashboard
              </button>
              </div>
      <h2 className="text-2xl font-bold text-blue-600 mb-6 text-center">
        Edit Quiz
      </h2>

      <form onSubmit={handleSubmit}>
        
        <div className="mb-4">
          <label className="block mb-1 font-medium">Quiz Title</label>
          <input
            type="text"
            className="w-full border p-2 rounded"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

       
        <div className="mb-4">
          <label className="block mb-1 font-medium">Description</label>
          <textarea
            className="w-full border p-2 rounded"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          ></textarea>
        </div>

       
        <div>
          <h3 className="text-lg font-semibold mb-3">Questions</h3>
          {questions.map((q, i) => (
            <div key={i} className="border p-4 mb-4 rounded-lg bg-gray-50">
              <label className="block font-medium">Question {i + 1}</label>
              <input
                type="text"
                className="w-full border p-2 rounded mb-2"
                value={q.questionText}
                onChange={(e) => handleChange(i, "questionText", e.target.value)}
              />

              <div className="grid grid-cols-2 gap-2">
                {q.options.map((opt, idx) => (
                  <input
                    key={idx}
                    type="text"
                    className="border p-2 rounded"
                    placeholder={`Option ${idx + 1}`}
                    value={opt}
                    onChange={(e) => handleOptionChange(i, idx, e.target.value)}
                  />
                ))}
              </div>

              <input
                type="text"
                className="border p-2 rounded w-full mt-2"
                placeholder="Correct Answer"
                value={q.correctAnswer}
                onChange={(e) => handleChange(i, "correctAnswer", e.target.value)}
              />

              <button
                type="button"
                onClick={() => removeQuestion(i)}
                className="text-red-500 mt-2 text-sm hover:underline"
              >
                Remove
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={addQuestion}
            className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
          >
            ➕ Add Question
          </button>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="block w-full bg-blue-600 text-white py-2 mt-6 rounded hover:bg-blue-700"
        >
          {saving ? "Saving Changes..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}