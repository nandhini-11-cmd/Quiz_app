import Result from "../models/Result.js";
import Quiz from "../models/Quiz.js";
import { generateExplanation } from "../services/aiService.js"; 
// Student submits quiz (with AI explanations)
export const submitQuiz = async (req, res) => {
  try {
    const { answers } = req.body; // [{ questionId, answer }]
    const { quizId } = req.params;
    const studentId = req.user.id;

    const quiz = await Quiz.findById(quizId);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    let score = 0;
    const detailedResults = [];

    // Go through each question in the quiz
    for (const q of quiz.questions) {
      const studentAnswer = answers.find((a) => a.questionId == q._id);
      const isCorrect =
        studentAnswer && studentAnswer.answer === q.correctAnswer;

      if (isCorrect) score++;

      //  AI explanation per question
      let explanation = "";
      try {
        explanation = await generateExplanation(q.questionText, q.correctAnswer);
      } catch (err) {
        console.warn("[AI] Explanation generation failed:", err.message);
        explanation = `The correct answer is "${q.correctAnswer}".`;
      }

      detailedResults.push({
        questionText: q.questionText,
        correctAnswer: q.correctAnswer,
        studentAnswer: studentAnswer ? studentAnswer.answer : "No answer",
        isCorrect,
        explanation,
      });
    }

    // Save the quiz result summary in DB (score, total)
    const result = await Result.create({
      quiz: quizId,
      student: studentId,
      score,
      total: quiz.questions.length,
    });

    // Send detailed explanations in API response (not stored)
    res.status(201).json({
      message: "Quiz submitted successfully",
      quizId,
      score,
      total: quiz.questions.length,
      details: detailedResults,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

//  Student checks own results
export const getMyResults = async (req, res) => {
  try {
    const results = await Result.find({ student: req.user.id }).populate("quiz", "title");
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Teacher checks results of a quiz
export const getQuizResults = async (req, res) => {
  try {
    const { quizId } = req.params;
    const results = await Result.find({ quiz: quizId })
      .populate("student", "username email avatar")
      .populate("quiz", "title");
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};