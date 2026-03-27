import dotenv from "dotenv";
import fetch from "node-fetch";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

// ─── Startup Diagnostics ─────────────────────────────────────────────────────
console.log("=== [AI SERVICE INITIALIZED] ===");
console.log("AI_PROVIDER:", process.env.AI_PROVIDER || "auto");
console.log("GEMINI_API_KEY exists:", !!process.env.GEMINI_API_KEY);
console.log("GEMINI_API_KEY length:", process.env.GEMINI_API_KEY?.length || 0);
// Log first+last chars to verify key is complete (not truncated)
const gKey = process.env.GEMINI_API_KEY || "";
if (gKey) console.log("GEMINI_API_KEY preview:", gKey.slice(0, 8) + "..." + gKey.slice(-4));
console.log("OPENAI_API_KEY exists:", !!process.env.OPENAI_API_KEY);
console.log("HF_API_KEY exists:", !!process.env.HF_API_KEY);

// ─── Provider Setup ───────────────────────────────────────────────────────────
let openai = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

let genAI = null;
if (process.env.GEMINI_API_KEY) {
  // ✅ apiVersion "v1" — v1beta dropped support for gemini-1.5-flash
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  console.log("[AI] Gemini client initialized");
} else {
  console.warn("[AI] Gemini NOT initialized — GEMINI_API_KEY missing");
}

// Free-tier models to try in order (gemini-2.0-flash is current free model)
const GEMINI_MODELS = [
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-1.5-flash-latest",
  "gemini-1.5-flash-8b",
];

const HF_KEY = process.env.HF_API_KEY;

// ✅ Read AI_PROVIDER env var — respect user's explicit choice
// Values: "gemini" | "openai" | "huggingface" | "auto"
const PROVIDER = (process.env.AI_PROVIDER || "auto").toLowerCase();
console.log("[AI] Active provider strategy:", PROVIDER);

// ─── In-Memory Cache ──────────────────────────────────────────────────────────
const questionCache = new Map();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ─── Fallback Questions ───────────────────────────────────────────────────────
const sampleQuestions = (topic, n = 5) => {
  console.warn("[AI] Using FALLBACK questions for topic:", topic);
  return Array.from({ length: n }).map((_, i) => ({
    questionText: `${topic} - Sample Question ${i + 1}: What is a key concept?`,
    options: ["Foundational Principle", "Unrelated Concept", "Incorrect Term", "Random Option"],
    correctAnswer: "Foundational Principle",
  }));
};

// ─── JSON Parser ──────────────────────────────────────────────────────────────
const parseJSONSafe = (text) => {
  if (!text) return null;
  const cleaned = text.replace(/```(json)?/gi, "").trim();
  try { return JSON.parse(cleaned); } catch {}
  const start = Math.min(...[cleaned.indexOf("["), cleaned.indexOf("{")].filter((i) => i >= 0));
  const end = Math.max(cleaned.lastIndexOf("]"), cleaned.lastIndexOf("}"));
  if (start >= 0 && end > start) {
    try { return JSON.parse(cleaned.slice(start, end + 1)); } catch {}
  }
  return null;
};

// ─── OpenAI Generator ─────────────────────────────────────────────────────────
const generateWithOpenAI = async (prompt) => {
  if (!openai) throw new Error("OpenAI not configured — no OPENAI_API_KEY");
  console.log("[AI] Calling OpenAI gpt-4o-mini...");
  const resp = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 1200,
  });
  return resp.choices?.[0]?.message?.content || "";
};

// ─── Gemini Generator (tries multiple free models in order) ──────────────────
const generateWithGemini = async (prompt) => {
  if (!genAI) throw new Error("Gemini not configured — no GEMINI_API_KEY");

  let lastError = "";

  for (const modelName of GEMINI_MODELS) {
    try {
      console.log(`[AI] Trying Gemini model: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const text = result.response.text();

      if (!text || text.trim().length === 0) throw new Error("Empty response");

      console.log(`[AI] ✅ Gemini success with model: ${modelName} (length: ${text.length})`);
      return text;

    } catch (error) {
      const msg = error.message || "";
      lastError = msg;
      console.warn(`[AI] Model "${modelName}" failed:`, msg.slice(0, 120));

      // Rate limit — wait 3s before trying next model
      if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED")) {
        console.log("[AI] Rate limited, waiting 3s...");
        await sleep(3000);
      }

      // Invalid key — no point trying other models
      if (msg.includes("API_KEY_INVALID") || msg.includes("403")) {
        console.error("[AI] GEMINI_API_KEY is INVALID. Get a new key: https://aistudio.google.com/app/apikey");
        throw new Error("Gemini API key is invalid — please regenerate");
      }

      // 404 = model not found on this account, try next one
      // continue loop to next model
    }
  }

  throw new Error("All Gemini models failed. Last error: " + lastError);
};

// ─── Hugging Face Generator ───────────────────────────────────────────────────
const HF_MODELS = [
  "mistralai/Mistral-7B-Instruct-v0.2",
  "meta-llama/Meta-Llama-3-8B-Instruct",
  "HuggingFaceH4/zephyr-7b-beta",
];

const generateWithHuggingFace = async (prompt) => {
  if (!HF_KEY) throw new Error("Hugging Face not configured — no HF_API_KEY");

  let lastError = "";
  for (const model of HF_MODELS) {
    console.log(`[AI] Trying HuggingFace model: ${model}`);
    try {
      const res = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${HF_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ inputs: prompt }),
      });
      const text = await res.text();
      if (!res.ok) { lastError = text; continue; }
      const parsed = parseJSONSafe(text);
      const generated = Array.isArray(parsed) ? parsed[0]?.generated_text : null;
      if (generated) return generated;
      return text;
    } catch (err) {
      lastError = err.message;
    }
  }
  throw new Error("All HuggingFace models failed: " + lastError);
};

// ─── Provider Order based on AI_PROVIDER env ─────────────────────────────────
// ✅ If AI_PROVIDER=gemini → only try Gemini, no fallback to others
// ✅ If AI_PROVIDER=auto  → try gemini first, then openai, then hf
const getProviderOrder = () => {
  if (PROVIDER === "gemini")      return ["gemini"];
  if (PROVIDER === "openai")      return ["openai"];
  if (PROVIDER === "huggingface") return ["huggingface"];
  return ["gemini", "openai", "huggingface"]; // auto
};

const callProvider = async (providerName, prompt) => {
  switch (providerName) {
    case "gemini":      return await generateWithGemini(prompt);
    case "openai":      return await generateWithOpenAI(prompt);
    case "huggingface": return await generateWithHuggingFace(prompt);
    default: throw new Error("Unknown provider: " + providerName);
  }
};

// ─── Main: Generate Quiz Questions ───────────────────────────────────────────
export const generateQuizQuestions = async (topic, numQuestions = 5) => {
  const cacheKey = `quiz_${topic}_${numQuestions}`;
  if (questionCache.has(cacheKey)) {
    console.log("[AI] Cache hit for:", cacheKey);
    return questionCache.get(cacheKey);
  }

  const prompt = `Generate ${numQuestions} multiple-choice quiz questions on the topic: "${topic}".
Each question must have exactly 4 options and a correctAnswer that exactly matches one of the options.
Return ONLY a valid JSON array. No markdown, no explanation, no code blocks. Format:
[
  {"questionText":"...","options":["Option A","Option B","Option C","Option D"],"correctAnswer":"Option A"}
]`;

  const providers = getProviderOrder();
  console.log("[AI] Provider order for this request:", providers);

  let text = "";
  for (const provider of providers) {
    try {
      text = await callProvider(provider, prompt);
      if (text) {
        console.log(`[AI] Provider "${provider}" succeeded`);
        break;
      }
    } catch (e) {
      console.warn(`[AI] Provider "${provider}" failed:`, e.message);
    }
  }

  const parsed = parseJSONSafe(text);
  if (Array.isArray(parsed) && parsed.length > 0) {
    console.log(`[AI] Successfully parsed ${parsed.length} questions`);
    questionCache.set(cacheKey, parsed);
    setTimeout(() => questionCache.delete(cacheKey), 60 * 60 * 1000);
    return parsed;
  }

  console.error("[AI] All providers failed. Raw text:", text?.slice(0, 300));
  return sampleQuestions(topic, numQuestions);
};

// ─── Generate Explanation ─────────────────────────────────────────────────────
export const generateExplanation = async (question, correctAnswer) => {
  const cacheKey = `explain_${question.slice(0, 50)}`;
  if (questionCache.has(cacheKey)) return questionCache.get(cacheKey);

  const prompt = `Explain briefly and clearly why "${correctAnswer}" is the correct answer to: "${question}". Keep it under 2 sentences. Return plain text only.`;

  const providers = getProviderOrder();
  let text = "";

  for (const provider of providers) {
    try {
      text = await callProvider(provider, prompt);
      if (text) break;
    } catch (e) {
      console.warn(`[AI] Explanation "${provider}" failed:`, e.message);
    }
  }

  const result = text?.trim()
    ? text.trim()
    : `The correct answer is "${correctAnswer}" because it best matches the concept in the question.`;

  questionCache.set(cacheKey, result);
  setTimeout(() => questionCache.delete(cacheKey), 60 * 60 * 1000);
  return result;
};
