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

let openai = null;
if (process.env.OPENAI_API_KEY) {
 openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

let genAI = null;
if (process.env.GEMINI_API_KEY) {
 genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

const HF_KEY = process.env.HF_API_KEY;
const PROVIDER = (process.env.AI_PROVIDER || "auto").toLowerCase();

const sampleQuestions = (topic, n = 5) => {
 console.log("[AI DEBUG] Returning fallback questions");
 return Array.from({ length: n }).map((_, i) => ({
 questionText: `${topic} sample question ${i + 1}?`,
 options: ["Option A", "Option B", "Option C", "Option D"],
 correctAnswer: "Option A",
 }));
};

const parseJSONSafe = (text) => {
 if (!text) return null;
 const cleaned = text.replace(/```(json)?/gi, "").trim();
 try {
 return JSON.parse(cleaned);
 } catch {}
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

const generateWithOpenAI = async (prompt) => {
 if (!openai) throw new Error("OpenAI not configured");
 const resp = await openai.chat.completions.create({
 model: "gpt-4o-mini",
 messages: [{ role: "user", content: prompt }],
 max_tokens: 1200,
 });
 return resp.choices?.message?.content || "";
};

const generateWithGemini = async (prompt) => {
 if (!genAI) throw new Error("Gemini not configured");
 const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
 console.log("[AI DEBUG] Gemini model initialized");
 const result = await model.generateContent(prompt);
 return result.response.text();
};

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
 const urls = [
 `https://api-inference.huggingface.co/models/${model}`,
 ];

 for (const url of urls) {
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
 console.log(`[AI] HF model ${model} failed: ${text}`);
 continue;
 }

 console.log("[AI DEBUG] HF Raw Output:", text.slice(0, 500));

 const hfResponse = parseJSONSafe(text);
 const generatedText = Array.isArray(hfResponse) ? hfResponse?.generated_text : null;

 if (generatedText) {
 return generatedText;
 }

 return text;

 } catch (err) {
 console.warn("[AI] HF error:", err.message);
 lastError = err.message;
 }
 }
 }
 throw new Error("All Hugging Face models failed. " + lastError);
};

export const generateQuizQuestions = async (topic, numQuestions = 5) => {
 const prompt = `Generate ${numQuestions} multiple-choice quiz questions on ${topic}.
Each question must have exactly 4 options and a correctAnswer that matches one of the options.
Return ONLY valid JSON (no markdown, no commentary). Format:
[
 {"questionText":"...","options":["A","B","C","D"],"correctAnswer":"B"}
]`;

 try {
 let text = "";

 console.log("[AI] Trying OpenAI...");
 try {
 text = await generateWithOpenAI(prompt);
 } catch (e) {
 console.warn("[AI] OpenAI failed:", e.message);
 }

 if (!text && genAI) {
 console.log("[AI] Trying Gemini...");
 try {
 text = await generateWithGemini(prompt);
 } catch (e) {
 console.warn("[AI] Gemini failed:", e.message);
 }
 }

 if (!text && HF_KEY) {
 console.log("[AI] Trying Hugging Face...");
 try {
 text = await generateWithHuggingFace(prompt);
 } catch (e) {
 console.warn("[AI] Hugging Face failed:", e.message);
 }
 }

 const parsed = parseJSONSafe(text);
 if (Array.isArray(parsed) && parsed.length) {
 console.log("[AI] ✅ Parsed valid quiz JSON");
 return parsed;
 }

 console.warn("[AI] ❌ Could not parse AI JSON, returning fallback");
 return sampleQuestions(topic, numQuestions);
 } catch (err) {
 console.warn("[AI] Generation error:", err.message);
 return sampleQuestions(topic, numQuestions);
 }
};

export const generateExplanation = async (question, correctAnswer) => {
 const prompt = `Explain briefly and clearly why "${correctAnswer}" is the correct answer to: "${question}".
Keep it under 2 sentences. Avoid code fences, return plain text.`;

 try {
 let text = "";

 console.log("[AI] Trying OpenAI explanation...");
 try {
 text = await generateWithOpenAI(prompt);
 } catch (e) {
 console.warn("[AI] OpenAI failed (explain):", e.message);
 }

 if (!text && genAI) {
 console.log("[AI] Trying Gemini explanation...");
 try {
 text = await generateWithGemini(prompt);
 } catch (e) {
 console.warn("[AI] Gemini failed (explain):", e.message);
 }
 }

 if (!text && HF_KEY) {
 console.log("[AI] Trying Hugging Face explanation...");
 try {
 text = await generateWithHuggingFace(prompt);
 } catch (e) {
 console.warn("[AI] Hugging Face failed (explain):", e.message);
 }
 }

 return text?.trim()
 ? text.trim()
 : `The correct answer is "${correctAnswer}" because it best matches the concept in the question.`;
 } catch (err) {
 console.warn("[AI] Explanation error:", err.message);
 return `The correct answer is "${correctAnswer}" because it best matches the concept in the question.`;
 }
};