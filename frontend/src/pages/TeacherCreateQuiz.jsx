import { useState } from "react";
import API from "../utils/axios";
import { useNavigate } from "react-router-dom";

export default function TeacherCreateQuiz() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState([
    { questionText: "", options: ["", "", "", ""], correctAnswer: "" },
  ]);
  const [topic, setTopic] = useState("");
  const [numQuestions, setNumQuestions] = useState(3);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();


  const addQuestion = () => {
    setQuestions([
      ...questions,
      { questionText: "", options: ["", "", "", ""], correctAnswer: "" },
    ]);
  };

  const removeQuestion = (index) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  
  const generateWithAI = async () => {
    if (!topic.trim()) {
      alert("Please enter a topic");
      return;
    }
    setLoading(true);
    try {
      const { data } = await API.post(
        "/quizzes/ai-generate",
        { topic, numQuestions },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      setTitle(`${topic} Quiz`);
      setQuestions(data.questions || []);
      alert("AI-generated quiz questions added!");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "AI generation failed");
    } finally {
      setLoading(false);
    }
  };

  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || questions.length === 0) {
      alert("Please enter a title and at least one question");
      return;
    }

    try {
      const { data } = await API.post(
        "/quizzes",
        { title, description, questions },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      alert("Quiz created successfully!");
      navigate("/teacher/dashboard");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Quiz creation failed");
    }
  };

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
        Create Quiz
      </h2>

      
      <div className="border p-4 rounded-lg mb-6 bg-gray-50">
        <h3 className="text-lg font-semibold mb-2 text-gray-700">
          🤖 Auto-Generate Quiz (AI)
        </h3>
        <div className="flex flex-col md:flex-row gap-3 items-center">
          <input
            type="text"
            placeholder="Enter topic (e.g. JavaScript Basics)"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="border p-2 rounded w-full"
          /> 
          <input
            type="number"
            min="1"
            max="10"
            placeholder="Enter number of questions to generate"
            value={numQuestions}
            onChange={(e) => setNumQuestions(e.target.value)}
            className="border p-2 rounded w-24"
          />
          <button
            onClick={generateWithAI}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            {loading ? "Generating..." : "Generate"}
          </button>
        </div>
      </div>

      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
           <label className="block mb-1 font-medium">Manual Quiz creation:</label> 
          <label className="block mb-1 font-medium">Quiz Title</label>
          <input
            type="text"
            className="w-full border p-2 rounded"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter quiz title"
          />
        </div>

        <div className="mb-4">
          <label className="block mb-1 font-medium">Description</label>
          <textarea
            className="w-full border p-2 rounded"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Short description (optional)"
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
                onChange={(e) => {
                  const newQuestions = [...questions];
                  newQuestions[i].questionText = e.target.value;
                  setQuestions(newQuestions);
                }}
                placeholder="Enter question text"
              />

              <div className="grid grid-cols-2 gap-2">
                {q.options.map((opt, idx) => (
                  <input
                    key={idx}
                    type="text"
                    className="border p-2 rounded"
                    placeholder={`Option ${idx + 1}`}
                    value={opt}
                    onChange={(e) => {
                      const newQuestions = [...questions];
                      newQuestions[i].options[idx] = e.target.value;
                      setQuestions(newQuestions);
                    }}
                  />
                ))}
              </div>

              <input
                type="text"
                className="border p-2 rounded w-full mt-2"
                placeholder="Correct Answer"
                value={q.correctAnswer}
                onChange={(e) => {
                  const newQuestions = [...questions];
                  newQuestions[i].correctAnswer = e.target.value;
                  setQuestions(newQuestions);
                }}
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
          className="block w-full bg-blue-600 text-white py-2 mt-6 rounded hover:bg-blue-700"
        >
          Save Quiz
        </button>
      </form>
    </div>
  );
}