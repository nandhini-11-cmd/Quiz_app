import dotenv from "dotenv";
import fetch from "node-fetch";
import OpenAI from "openai";

dotenv.config();

// ─── Startup Diagnostics ─────────────────────────────────────────────────────
console.log("=== [AI SERVICE INITIALIZED] ===");
const GEMINI_KEY = process.env.GEMINI_API_KEY || "";
console.log("AI_PROVIDER:", process.env.AI_PROVIDER || "auto");
console.log("GEMINI_API_KEY exists:", !!GEMINI_KEY, "| length:", GEMINI_KEY.length);
if (GEMINI_KEY) console.log("GEMINI_API_KEY preview:", GEMINI_KEY.slice(0,8) + "..." + GEMINI_KEY.slice(-4));
console.log("OPENAI_API_KEY exists:", !!process.env.OPENAI_API_KEY);
console.log("HF_API_KEY exists:", !!process.env.HF_API_KEY);

// ─── Provider Setup ───────────────────────────────────────────────────────────
let openai = null;
if (process.env.OPENAI_API_KEY) openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const HF_KEY = process.env.HF_API_KEY;
const PROVIDER = (process.env.AI_PROVIDER || "auto").toLowerCase();
console.log("[AI] Active provider strategy:", PROVIDER);

// ─── Cache & Helpers ──────────────────────────────────────────────────────────
const questionCache = new Map();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ─── JSON Parser ──────────────────────────────────────────────────────────────
const parseJSONSafe = (text) => {
  if (!text) return null;
  const cleaned = text.replace(/```(json)?/gi, "").trim();
  try { return JSON.parse(cleaned); } catch {}
  const s = Math.min(...[cleaned.indexOf("["), cleaned.indexOf("{")].filter(i => i >= 0));
  const e = Math.max(cleaned.lastIndexOf("]"), cleaned.lastIndexOf("}"));
  if (s >= 0 && e > s) { try { return JSON.parse(cleaned.slice(s, e+1)); } catch {} }
  return null;
};

// ─── Gemini REST API — v1 stable (NOT SDK, NOT v1beta) ───────────────────────
const GEMINI_MODELS = ["gemini-2.0-flash", "gemini-2.0-flash-lite", "gemini-1.5-flash", "gemini-1.5-flash-8b"];

const generateWithGemini = async (prompt) => {
  if (!GEMINI_KEY) throw new Error("GEMINI_API_KEY not set");

  let lastError = "";
  for (const modelName of GEMINI_MODELS) {
    // ✅ /v1/ stable endpoint — NOT /v1beta/ (SDK was using v1beta, which broke)
    const url = `https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${GEMINI_KEY}`;
    try {
      console.log(`[AI] Trying Gemini model: ${modelName}`);
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
        }),
      });

      const raw = await res.text();
      if (!res.ok) {
        lastError = raw;
        const errJson = parseJSONSafe(raw);
        const errMsg = errJson?.error?.message || raw;
        console.warn(`[AI] Gemini ${modelName} HTTP ${res.status}:`, errMsg.slice(0, 150));

        if (res.status === 429) { await sleep(3000); }
        if (res.status === 403 || errMsg.includes("API_KEY_INVALID")) {
          throw new Error("API_KEY_INVALID");
        }
        // ✅ Detect quota error specifically — used to set reason in response
        if (errMsg.includes("quota") || errMsg.includes("RESOURCE_EXHAUSTED")) {
          throw new Error("QUOTA_EXCEEDED: " + errMsg.slice(0, 100));
        }
        continue;
      }

      const json = parseJSONSafe(raw);
      const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text?.trim()) { lastError = "Empty content"; continue; }

      console.log(`[AI] ✅ Gemini success! Model: ${modelName}`);
      return text;

    } catch (err) {
      if (err.message === "API_KEY_INVALID") throw err;
      if (err.message.startsWith("QUOTA_EXCEEDED")) throw err;
      lastError = err.message;
      console.warn(`[AI] Model ${modelName} error:`, err.message.slice(0, 100));
    }
  }
  throw new Error("ALL_MODELS_FAILED: " + lastError.slice(0, 150));
};

// ─── OpenAI ───────────────────────────────────────────────────────────────────
const generateWithOpenAI = async (prompt) => {
  if (!openai) throw new Error("OpenAI not configured");
  const resp = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 1200,
  });
  return resp.choices?.[0]?.message?.content || "";
};

// ─── Hugging Face ─────────────────────────────────────────────────────────────
const HF_MODELS = ["mistralai/Mistral-7B-Instruct-v0.2", "HuggingFaceH4/zephyr-7b-beta"];
const generateWithHuggingFace = async (prompt) => {
  if (!HF_KEY) throw new Error("HF not configured");
  let lastError = "";
  for (const model of HF_MODELS) {
    try {
      const res = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${HF_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ inputs: prompt }),
      });
      const text = await res.text();
      if (!res.ok) { lastError = text; continue; }
      const parsed = parseJSONSafe(text);
      return Array.isArray(parsed) ? parsed[0]?.generated_text : text;
    } catch (err) { lastError = err.message; }
  }
  throw new Error("HF failed: " + lastError);
};

// ─── Provider Order ───────────────────────────────────────────────────────────
const getProviderOrder = () => {
  if (PROVIDER === "gemini")      return ["gemini"];
  if (PROVIDER === "openai")      return ["openai"];
  if (PROVIDER === "huggingface") return ["huggingface"];
  return ["gemini", "openai", "huggingface"];
};

const callProvider = (name, prompt) => {
  if (name === "gemini")      return generateWithGemini(prompt);
  if (name === "openai")      return generateWithOpenAI(prompt);
  if (name === "huggingface") return generateWithHuggingFace(prompt);
  throw new Error("Unknown provider: " + name);
};

// ─── Classify failure reason for user-friendly message ───────────────────────
const getFailureReason = (errorMessage) => {
  const msg = errorMessage || "";
  if (msg.includes("QUOTA_EXCEEDED") || msg.includes("quota") || msg.includes("RESOURCE_EXHAUSTED"))
    return "AI quota exceeded for today. Showing preset questions instead.";
  if (msg.includes("API_KEY_INVALID"))
    return "AI service configuration error. Showing preset questions instead.";
  if (msg.includes("ALL_MODELS_FAILED"))
    return "AI service is temporarily unavailable. Showing preset questions instead.";
  return "AI could not generate questions right now. Showing preset questions instead.";
};

// ─── Fallback Questions ───────────────────────────────────────────────────────
const makeFallback = (topic, n, reason) => ({
  questions: Array.from({ length: n }).map((_, i) => ({
    questionText: `${topic} - Question ${i + 1}: What is a key concept in this topic?`,
    options: ["Foundational Principle", "Unrelated Concept", "Incorrect Term", "Random Option"],
    correctAnswer: "Foundational Principle",
  })),
  source: "fallback",
  reason,
});

// ─── Main: Generate Quiz Questions ───────────────────────────────────────────
// ✅ Now returns { questions, source, reason } instead of just array
export const generateQuizQuestions = async (topic, numQuestions = 5) => {
  const cacheKey = `quiz_${topic}_${numQuestions}`;
  if (questionCache.has(cacheKey)) {
    console.log("[AI] Cache hit:", cacheKey);
    return questionCache.get(cacheKey);
  }

  const prompt = `Generate ${numQuestions} multiple-choice quiz questions on the topic: "${topic}".
Each question must have exactly 4 options and a correctAnswer that exactly matches one of the options.
Return ONLY a valid JSON array. No markdown, no explanation, no code blocks. Format:
[{"questionText":"...","options":["A","B","C","D"],"correctAnswer":"A"}]`;

  const providers = getProviderOrder();
  console.log("[AI] Provider order:", providers);

  let text = "";
  let failureReason = "";

  for (const provider of providers) {
    try {
      text = await callProvider(provider, prompt);
      if (text) { console.log(`[AI] Provider "${provider}" succeeded`); break; }
    } catch (e) {
      console.warn(`[AI] Provider "${provider}" failed:`, e.message);
      failureReason = e.message; // save last error for user message
    }
  }

  const parsed = parseJSONSafe(text);
  if (Array.isArray(parsed) && parsed.length > 0) {
    console.log(`[AI] Parsed ${parsed.length} questions`);
    const result = { questions: parsed, source: "ai", reason: null };
    questionCache.set(cacheKey, result);
    setTimeout(() => questionCache.delete(cacheKey), 60 * 60 * 1000);
    return result;
  }

  // ✅ Include human-readable reason so frontend can show it
  const userReason = getFailureReason(failureReason);
  console.warn("[AI] Using fallback. Reason:", userReason);
  return makeFallback(topic, numQuestions, userReason);
};

// ─── Generate Explanation ─────────────────────────────────────────────────────
export const generateExplanation = async (question, correctAnswer) => {
  const cacheKey = `explain_${question.slice(0, 50)}`;
  if (questionCache.has(cacheKey)) return questionCache.get(cacheKey);

  const prompt = `Explain briefly why "${correctAnswer}" is the correct answer to: "${question}". Under 2 sentences. Plain text only.`;

  const providers = getProviderOrder();
  let text = "";
  for (const provider of providers) {
    try { text = await callProvider(provider, prompt); if (text) break; }
    catch (e) { console.warn(`[AI] Explain "${provider}" failed:`, e.message); }
  }

  const result = text?.trim() || `The correct answer is "${correctAnswer}" because it best matches the concept.`;
  questionCache.set(cacheKey, result);
  setTimeout(() => questionCache.delete(cacheKey), 60 * 60 * 1000);
  return result;
};
