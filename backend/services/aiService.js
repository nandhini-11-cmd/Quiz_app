import dotenv from "dotenv";
import fetch from "node-fetch";
import OpenAI from "openai";
// ✅ NOT using @google/generative-ai SDK anymore
// The SDK hardcodes v1beta which dropped gemini-1.5-flash and gemini-2.0-flash support
// We call Gemini REST API directly using the stable v1 endpoint

dotenv.config();

// ─── Startup Diagnostics ─────────────────────────────────────────────────────
console.log("=== [AI SERVICE INITIALIZED] ===");
console.log("AI_PROVIDER:", process.env.AI_PROVIDER || "auto");
const GEMINI_KEY = process.env.GEMINI_API_KEY || "";
console.log("GEMINI_API_KEY exists:", !!GEMINI_KEY);
console.log("GEMINI_API_KEY length:", GEMINI_KEY.length);
if (GEMINI_KEY) {
  console.log("GEMINI_API_KEY preview:", GEMINI_KEY.slice(0, 8) + "..." + GEMINI_KEY.slice(-4));
  console.log("[AI] Gemini REST client ready (v1 stable endpoint)");
} else {
  console.warn("[AI] Gemini NOT ready — GEMINI_API_KEY missing in env vars");
}
console.log("OPENAI_API_KEY exists:", !!process.env.OPENAI_API_KEY);
console.log("HF_API_KEY exists:", !!process.env.HF_API_KEY);

// ─── OpenAI Setup ─────────────────────────────────────────────────────────────
let openai = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

const HF_KEY = process.env.HF_API_KEY;
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

// ─── Gemini REST API (v1 stable — NOT v1beta) ─────────────────────────────────
// SDK (@google/generative-ai) hardcodes v1beta which dropped flash model support.
// Direct REST call lets us use the v1 stable endpoint where these models still work.
const GEMINI_MODELS = [
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-1.5-flash",
  "gemini-1.5-flash-8b",
];

const generateWithGemini = async (prompt) => {
  if (!GEMINI_KEY) throw new Error("Gemini not configured — GEMINI_API_KEY missing");

  let lastError = "";

  for (const modelName of GEMINI_MODELS) {
    // ✅ Using /v1/ (stable) NOT /v1beta/ (deprecated for these models)
    const url = `https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${GEMINI_KEY}`;

    try {
      console.log(`[AI] Trying Gemini model: ${modelName} via REST v1`);

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
        console.warn(`[AI] Model "${modelName}" HTTP ${res.status}:`, raw.slice(0, 200));

        // Rate limit → wait before next model
        if (res.status === 429) {
          console.log("[AI] Rate limited. Waiting 3s...");
          await sleep(3000);
        }
        // Invalid key → stop immediately
        if (res.status === 400 || res.status === 403) {
          const parsed = parseJSONSafe(raw);
          const errMsg = parsed?.error?.message || raw;
          if (errMsg.includes("API_KEY_INVALID") || res.status === 403) {
            console.error("[AI] ❌ GEMINI_API_KEY INVALID. Regenerate: https://aistudio.google.com/app/apikey");
            throw new Error("Gemini API key is invalid");
          }
        }
        continue; // try next model
      }

      const json = parseJSONSafe(raw);
      const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text || text.trim().length === 0) {
        console.warn(`[AI] Model "${modelName}" returned empty content`);
        lastError = "Empty content from model";
        continue;
      }

      console.log(`[AI] ✅ Gemini success! Model: ${modelName}, Response length: ${text.length}`);
      return text;

    } catch (err) {
      if (err.message === "Gemini API key is invalid") throw err; // bubble up key errors
      lastError = err.message;
      console.warn(`[AI] Model "${modelName}" threw error:`, err.message.slice(0, 150));
    }
  }

  throw new Error("All Gemini models failed. Last: " + lastError.slice(0, 200));
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
      return generated || text;
    } catch (err) { lastError = err.message; }
  }
  throw new Error("All HuggingFace models failed: " + lastError);
};

// ─── Provider Order ───────────────────────────────────────────────────────────
const getProviderOrder = () => {
  if (PROVIDER === "gemini")      return ["gemini"];
  if (PROVIDER === "openai")      return ["openai"];
  if (PROVIDER === "huggingface") return ["huggingface"];
  return ["gemini", "openai", "huggingface"]; // auto
};

const callProvider = async (name, prompt) => {
  if (name === "gemini")      return generateWithGemini(prompt);
  if (name === "openai")      return generateWithOpenAI(prompt);
  if (name === "huggingface") return generateWithHuggingFace(prompt);
  throw new Error("Unknown provider: " + name);
};

// ─── Generate Quiz Questions ──────────────────────────────────────────────────
export const generateQuizQuestions = async (topic, numQuestions = 5) => {
  const cacheKey = `quiz_${topic}_${numQuestions}`;
  if (questionCache.has(cacheKey)) {
    console.log("[AI] Cache hit:", cacheKey);
    return questionCache.get(cacheKey);
  }

  const prompt = `Generate ${numQuestions} multiple-choice quiz questions on the topic: "${topic}".
Each question must have exactly 4 options and a correctAnswer that exactly matches one of the options.
Return ONLY a valid JSON array. No markdown, no explanation, no code blocks. Format:
[
  {"questionText":"...","options":["Option A","Option B","Option C","Option D"],"correctAnswer":"Option A"}
]`;

  const providers = getProviderOrder();
  console.log("[AI] Provider order:", providers);

  let text = "";
  for (const provider of providers) {
    try {
      text = await callProvider(provider, prompt);
      if (text) { console.log(`[AI] Provider "${provider}" succeeded`); break; }
    } catch (e) {
      console.warn(`[AI] Provider "${provider}" failed:`, e.message);
    }
  }

  const parsed = parseJSONSafe(text);
  if (Array.isArray(parsed) && parsed.length > 0) {
    console.log(`[AI] Parsed ${parsed.length} questions successfully`);
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

  const result = text?.trim() || `The correct answer is "${correctAnswer}" because it best matches the concept in the question.`;
  questionCache.set(cacheKey, result);
  setTimeout(() => questionCache.delete(cacheKey), 60 * 60 * 1000);
  return result;
};
