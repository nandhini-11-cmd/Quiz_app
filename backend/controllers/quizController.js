import Quiz from "../models/Quiz.js";
import { generateQuizQuestions, generateExplanation } from "../services/aiService.js";
// ✅ FIXED: Added generateExplanation to the import (was missing — caused crash on ?explain=true)

// ─── Create Quiz (manual) ─────────────────────────────────────────────────────
export const createQuiz = async (req, res) => {
  try {
    const { title, description, questions } = req.body;
    const quiz = await Quiz.create({
      title,
      description,
      questions,
      createdBy: req.user._id,
    });
    res.status(201).json(quiz);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── AI Generate Quiz ─────────────────────────────────────────────────────────
export const aiGenerateQuiz = async (req, res) => {
  console.log("[AI DEBUG] aiGenerateQuiz controller called");
  try {
    const { topic, numQuestions } = req.body;

    if (!topic || !topic.trim()) {
      return res.status(400).json({ message: "Topic is required" });
    }

    const count = Math.min(parseInt(numQuestions) || 5, 20); // cap at 20
    const questions = await generateQuizQuestions(topic.trim(), count);

    // Tell the frontend whether AI was used or fallback
    const isAI = questions[0]?.questionText &&
      !questions[0].questionText.includes("Sample Question");

    res.json({
      topic,
      questions,
      source: isAI ? "ai" : "fallback",
    });
  } catch (err) {
    console.error("[Quiz] aiGenerateQuiz error:", err.message);
    res.status(500).json({ message: err.message });
  }
};

// ─── Get All Quizzes ──────────────────────────────────────────────────────────
export const getQuizzes = async (req, res) => {
  try {
    const quizzes = await Quiz.find().populate("createdBy", "username email role avatar");
    res.json(quizzes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Get Single Quiz (with optional AI explanations) ─────────────────────────
export const getQuizById = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id).populate(
      "createdBy",
      "username email role avatar"
    );
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    // If ?explain=true → generate AI explanations for each question
    if (req.query.explain === "true") {
      const explainedQuestions = await Promise.all(
        quiz.questions.map(async (q) => {
          const explanation = await generateExplanation(
            q.questionText,
            q.correctAnswer
          );
          return { ...q.toObject(), explanation };
        })
      );
      return res.json({ ...quiz.toObject(), questions: explainedQuestions });
    }

    res.json(quiz);
  } catch (err) {
    console.error("[Quiz] getQuizById error:", err.message);
    res.status(500).json({ message: err.message });
  }
};

// ─── Update Quiz ──────────────────────────────────────────────────────────────
export const updateQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    // Ownership check
    if (quiz.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to update this quiz" });
    }

    quiz.title = req.body.title || quiz.title;
    quiz.description = req.body.description || quiz.description;
    quiz.questions = req.body.questions || quiz.questions;

    const updatedQuiz = await quiz.save();
    res.json(updatedQuiz);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Delete Quiz ──────────────────────────────────────────────────────────────
export const deleteQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    // Ownership check
    if (quiz.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this quiz" });
    }

    await quiz.deleteOne();
    res.json({ message: "Quiz deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
