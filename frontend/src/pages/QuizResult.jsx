import { useLocation, useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function QuizResult() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const { score, total, details } = state || {};
  const correctCount = score || 0;
  const wrongCount = (total || 0) - (score || 0);

  const chartData = [
    { name: "Correct", value: correctCount },
    { name: "Wrong", value: wrongCount },
  ];
  const COLORS = ["#16a34a", "#dc2626"];

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const username = state?.studentName || user.username;
  const avatar = state?.avatar || user.avatar;

  if (!details) {
    return (
      <div className="flex flex-col items-center mt-20">
        <h2 className="text-xl font-semibold text-gray-600">
          No result data found.
        </h2>
        <button
          onClick={() => navigate("/student/dashboard")}
          className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-lg"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const handleDownloadPDF = async () => {
    const element = document.getElementById("quiz-result");
    if (!element) return;

    const clone = element.cloneNode(true);
    clone.id = "pdf-clone";

    // ❌ Remove chart & buttons (exclude from PDF)
    clone.querySelectorAll("button, .no-print, .hide-on-pdf").forEach((el) => el.remove());

    // ✅ Add a simple neutral header
    const header = document.createElement("div");
    header.innerHTML = `
      <div style="text-align:center;border-bottom:1px solid #ccc;padding:10px;margin-bottom:20px;">
        <h2 style="color:#1e40af;margin:0;font-size:18px;">QuizNova - Student Report</h2>
      </div>
    `;
    clone.prepend(header);

    // Neutral styling
    clone.querySelectorAll("*").forEach((el) => {
      el.style.color = "#000";
      el.style.backgroundColor = "#fff";
      el.style.borderColor = "#ccc";
      el.style.boxShadow = "none";
    });

    // Hide off-screen
    clone.style.position = "absolute";
    clone.style.top = "-9999px";
    clone.style.left = "0";
    clone.style.width = "800px";
    document.body.appendChild(clone);

    try {
      const canvas = await html2canvas(clone, {
        scale: 2,
        backgroundColor: "#fff",
        useCORS: true,
        logging: false,
        windowWidth: 800,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");

      const pageWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * pageWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, pageWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, pageWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`Quiz_Report_${username || "student"}_${Date.now()}.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      document.body.removeChild(clone);
    }
  };

  return (
    <div
      id="quiz-result"
      className="max-w-6xl mx-auto mt-6 bg-white p-6 sm:p-8 rounded-xl shadow-md"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-b pb-4 mb-6 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-indigo-700">
            🎓 Quiz Result Report
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <img
              src={`http://localhost:5000${avatar}`}
              alt="avatar"
              className="w-12 h-12 sm:w-16 sm:h-16 rounded-full border"
            />
            <div>
              <p className="text-gray-800 font-semibold">
                {username || "Student Name"}
              </p>
              <p className="text-gray-600 text-sm sm:text-base">
                🧩 {state?.quizTitle || "Quiz Title"}
              </p>
              <p className="text-gray-500 text-sm">
                📅{" "}
                {new Date().toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={() => navigate("/student/dashboard")}
          className="text-blue-700 font-semibold underline hover:text-blue-900 self-end sm:self-auto"
        >
          Back to Dashboard
        </button>
      </div>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left - Questions */}
        <div className="flex-1 bg-gray-50 p-4 sm:p-5 rounded-lg shadow-inner overflow-y-auto">
          {details.map((q, index) => (
            <div
              key={index}
              className={`p-4 mb-5 rounded-lg border transition-transform hover:scale-[1.01] ${
                q.isCorrect
                  ? "bg-green-50 border-green-300"
                  : "bg-red-50 border-red-300"
              }`}
            >
              <p className="font-semibold mb-2 text-gray-800 text-base sm:text-lg">
                {index + 1}. {q.questionText}
              </p>
              <div className="ml-2 sm:ml-4 space-y-1">
                <p>
                  <span className="font-medium text-gray-700">Your Answer: </span>
                  <span
                    className={
                      q.isCorrect
                        ? "text-green-700 font-semibold"
                        : "text-red-700 font-semibold"
                    }
                  >
                    {q.studentAnswer}
                  </span>
                </p>
                <p>
                  <span className="font-medium text-gray-700">Correct Answer: </span>
                  <span className="text-green-700 font-semibold">
                    {q.correctAnswer}
                  </span>
                </p>
                <p className="italic text-gray-600 mt-2 leading-snug">
                  💡 {q.explanation}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Right - Chart (excluded from PDF via .no-print) */}
        <div className="no-print lg:w-2/5 w-full flex flex-col items-center justify-start bg-gray-100 p-5 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-3 text-gray-700 text-center">
            📊 Performance Summary
          </h3>
          <div className="w-full h-64">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="text-center mt-4 text-gray-700">
            ✅ Correct: <b>{correctCount}</b> / {total}
            <br />
            ❌ Wrong: <b>{wrongCount}</b>
            <p className="mt-2 text-sm text-gray-600">
              Accuracy:{" "}
              <span className="font-semibold text-indigo-700">
                {((score / total) * 100).toFixed(1)}%
              </span>
            </p>
          </div>
          <p className="mt-6 text-center text-sm italic text-green-600">
            🌟 Keep learning — every quiz brings you closer to mastery!
          </p>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex flex-wrap justify-center gap-4 mt-8">
        <button
          onClick={() => navigate("/student/dashboard")}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg shadow transition"
        >
          Back to Dashboard
        </button>

        <button
          onClick={handleDownloadPDF}
          className="bg-rose-600 hover:bg-rose-700 text-white px-6 py-2 rounded-lg shadow transition"
        >
          📄 Download PDF
        </button>

        <button
          onClick={() =>
            navigate(
              state?.quizId ? `/student/quiz/${state.quizId}` : "/student/dashboard"
            )
          }
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg shadow transition"
        >
          🔁 Retake Quiz
        </button>
      </div>

      <div className="mt-10 text-center text-gray-500 text-xs border-t pt-4">
        Generated by <span className="text-indigo-700 font-semibold">QuizNova</span> •{" "}
        {new Date().toLocaleString()}
      </div>
    </div>
  );
}
