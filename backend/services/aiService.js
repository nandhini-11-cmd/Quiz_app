import dotenv from "dotenv";
import fetch from "node-fetch";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

console.log("=== [AI SERVICE INITIALIZED] ===");
console.log("AI Provider:", process.env.AI_PROVIDER || "auto");
console.log("HF Key exists:", !!process.env.HF_API_KEY);
console.log("OpenAI Key exists:", !!process.env.OPENAI_API_KEY);
console.log("Gemini Key exists:", !!process.env.GEMINI_API_KEY);

// ─── OpenAI Setup ────────────────────────────────────────────────────────────
let openai = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

// ─── Gemini Setup ────────────────────────────────────────────────────────────
let genAI = null;
if (process.env.GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

const HF_KEY = process.env.HF_API_KEY;

// ─── In-Memory Cache (clears after 1 hour) ───────────────────────────────────
const questionCache = new Map();

// ─── Sleep Helper ────────────────────────────────────────────────────────────
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ─── Fallback Questions ──────────────────────────────────────────────────────
const sampleQuestions = (topic, n = 5) => {
  console.log("[AI DEBUG] Returning fallback questions for topic:", topic);
  return Array.from({ length: n }).map((_, i) => ({
    questionText: `${topic} - Sample Question ${i + 1}: What is a key concept?`,
    options: [
      "Foundational Principle",
      "Unrelated Concept",
      "Incorrect Term",
      "Random Option",
    ],
    correctAnswer: "Foundational Principle",
  }));
};

// ─── JSON Parser (robust) ────────────────────────────────────────────────────
const parseJSONSafe = (text) => {
  if (!text) return null;

  // Remove markdown code fences
  const cleaned = text.replace(/```(json)?/gi, "").trim();

  // Try direct parse first
  try {
    return JSON.parse(cleaned);
  } catch {}

  // Try extracting JSON array/object from text
  const start = Math.min(
    ...[cleaned.indexOf("["), cleaned.indexOf("{")].filter((i) => i >= 0)
  );
  const end = Math.max(cleaned.lastIndexOf("]"), cleaned.lastIndexOf("}"));
  if (start >= 0 && end > start) {
    try {
      return JSON.parse(cleaned.slice(start, end + 1));
    } catch {}
  }
  return null;
};

// ─── OpenAI Generator ────────────────────────────────────────────────────────
const generateWithOpenAI = async (prompt) => {
  if (!openai) throw new Error("OpenAI not configured");
  const resp = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 1200,
  });
  return resp.choices?.[0]?.message?.content || "";
};

// ─── Gemini Generator (FREE TIER: gemini-1.5-flash with retry) ───────────────
const generateWithGemini = async (prompt, retries = 3) => {
  if (!genAI) throw new Error("Gemini not configured");

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`[AI] Gemini attempt ${attempt}/${retries} using gemini-1.5-flash`);

      // ✅ FIXED: Use gemini-1.5-flash (free tier supported model)
      // gemini-2.5-pro requires a paid billing account
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const result = await model.generateContent(prompt);
      const text = result.response.text();

      if (!text || text.trim().length === 0) {
        throw new Error("Empty response from Gemini");
      }

      console.log("[AI] Gemini responded successfully");
      return text;

    } catch (error) {
      const msg = error.message || "";
      console.warn(`[AI] Gemini attempt ${attempt} failed:`, msg);

      // Rate limit (429) → wait and retry
      if (msg.includes("429") || msg.includes("quota") || msg.includes("RESOURCE_EXHAUSTED")) {
        if (attempt < retries) {
          const waitTime = attempt * 3000; // 3s, 6s, 9s
          console.log(`[AI] Rate limited. Waiting ${waitTime / 1000}s before retry...`);
          await sleep(waitTime);
          continue;
        }
      }

      // Last attempt → throw
      if (attempt === retries) throw error;
    }
  }
};

// ─── Hugging Face Generator ──────────────────────────────────────────────────
const HF_MODELS = [
  "mistralai/Mistral-7B-Instruct-v0.2",
  "meta-llama/Meta-Llama-3-8B-Instruct",
  "google/gemma-7b-it",
  "HuggingFaceH4/zephyr-7b-beta",
];

const generateWithHuggingFace = async (prompt) => {
  if (!HF_KEY) throw new Error("Hugging Face not configured");

  let lastError = "";
  for (const model of HF_MODELS) {
    const url = `https://api-inference.huggingface.co/models/${model}`;
    console.log(`[AI] Trying Hugging Face model: ${model}`);

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${HF_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputs: prompt }),
      });

      const text = await res.text();
      if (!res.ok) {
        lastError = text;
        console.log(`[AI] HF model ${model} failed: ${text.slice(0, 200)}`);
        continue;
      }

      console.log("[AI DEBUG] HF Raw Output:", text.slice(0, 500));

      const hfResponse = parseJSONSafe(text);
      const generatedText = Array.isArray(hfResponse)
        ? hfResponse[0]?.generated_text  // ✅ FIXED: was hfResponse?.generated_text (wrong)
        : null;

      if (generatedText) return generatedText;
      return text;

    } catch (err) {
      console.warn("[AI] HF error:", err.message);
      lastError = err.message;
    }
  }
  throw new Error("All Hugging Face models failed. " + lastError);
};

// ─── Main: Generate Quiz Questions ───────────────────────────────────────────
export const generateQuizQuestions = async (topic, numQuestions = 5) => {
  // Check cache first
  const cacheKey = `quiz_${topic}_${numQuestions}`;
  if (questionCache.has(cacheKey)) {
    console.log("[AI] Returning cached questions for:", cacheKey);
    return questionCache.get(cacheKey);
  }

  const prompt = `Generate ${numQuestions} multiple-choice quiz questions on the topic: "${topic}".
Each question must have exactly 4 options and a correctAnswer that exactly matches one of the options.
Return ONLY valid JSON array (no markdown, no commentary, no code blocks). Format:
[
  {"questionText":"...","options":["Option A","Option B","Option C","Option D"],"correctAnswer":"Option A"}
]`;

  let text = "";

  // 1. Try OpenAI
  if (openai) {
    console.log("[AI] Trying OpenAI...");
    try {
      text = await generateWithOpenAI(prompt);
      console.log("[AI] ✅ OpenAI succeeded");
    } catch (e) {
      console.warn("[AI] OpenAI failed:", e.message);
    }
  }

  // 2. Try Gemini (free tier: gemini-1.5-flash)
  if (!text && genAI) {
    console.log("[AI] Trying Gemini (gemini-1.5-flash)...");
    try {
      text = await generateWithGemini(prompt);
      console.log("[AI] ✅ Gemini succeeded");
    } catch (e) {
      console.warn("[AI] Gemini failed:", e.message);
    }
  }

  // 3. Try Hugging Face
  if (!text && HF_KEY) {
    console.log("[AI] Trying Hugging Face...");
    try {
      text = await generateWithHuggingFace(prompt);
      console.log("[AI] ✅ Hugging Face succeeded");
    } catch (e) {
      console.warn("[AI] Hugging Face failed:", e.message);
    }
  }

  // Parse and validate
  const parsed = parseJSONSafe(text);
  if (Array.isArray(parsed) && parsed.length > 0) {
    console.log(`[AI] ✅ Parsed ${parsed.length} valid questions`);

    // Cache result for 1 hour
    questionCache.set(cacheKey, parsed);
    setTimeout(() => {
      questionCache.delete(cacheKey);
      console.log("[AI] Cache cleared for:", cacheKey);
    }, 60 * 60 * 1000);

    return parsed;
  }

  console.warn("[AI] ❌ All providers failed or returned invalid JSON. Using fallback.");
  return sampleQuestions(topic, numQuestions);
};

// ─── Generate Explanation ────────────────────────────────────────────────────
export const generateExplanation = async (question, correctAnswer) => {
  // Check cache
  const cacheKey = `explain_${question.slice(0, 50)}`;
  if (questionCache.has(cacheKey)) {
    return questionCache.get(cacheKey);
  }

  const prompt = `Explain briefly and clearly why "${correctAnswer}" is the correct answer to: "${question}".
Keep it under 2 sentences. Return plain text only, no markdown or code fences.`;

  let text = "";

  if (openai) {
    try {
      text = await generateWithOpenAI(prompt);
    } catch (e) {
      console.warn("[AI] OpenAI failed (explain):", e.message);
    }
  }

  if (!text && genAI) {
    try {
      text = await generateWithGemini(prompt);
    } catch (e) {
      console.warn("[AI] Gemini failed (explain):", e.message);
    }
  }

  if (!text && HF_KEY) {
    try {
      text = await generateWithHuggingFace(prompt);
    } catch (e) {
      console.warn("[AI] Hugging Face failed (explain):", e.message);
    }
  }

  const result = text?.trim()
    ? text.trim()
    : `The correct answer is "${correctAnswer}" because it best matches the concept in the question.`;

  // Cache explanation for 1 hour
  questionCache.set(cacheKey, result);
  setTimeout(() => questionCache.delete(cacheKey), 60 * 60 * 1000);

  return result;
};
