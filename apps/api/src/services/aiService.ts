import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  SYSTEM_PROMPT,
  DAILY_ACTION_PROMPT,
  WEEKLY_SUMMARY_PROMPT,
  MEMORY_EXTRACT_PROMPT,
} from "@companion/shared/prompts";
import { memoryExtractSchema } from "@companion/shared/schemas";
import { env } from "../config.js";
import { logger } from "../config.js";

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

// Priority Waterfall:
// 1. Top Priority: gemini-1.5-flash-8b (Fastest, 50% cheaper, lowest latency, minimal token consumption)
// 2. Universal Fallback: gemini-1.5-flash (Universally active across all Google AI Studio tiers)
// 3. Extended Fallback: gemini-2.0-flash
const CANDIDATE_MODELS = [
  process.env.GEMINI_MODEL,
  "gemini-1.5-flash-8b",
  "gemini-1.5-flash",
  "gemini-2.0-flash",
].filter(Boolean) as string[];

const EMBEDDING_MODEL = "text-embedding-004";

export interface AiContext {
  recentMessages: { role: string; content: string }[];
  conversationSummary: string | null;
  memories: { key: string; value: string }[];
  semanticRecalls: string[];
}

function buildPrompt(context: AiContext, userMessage: string): string {
  const parts = [SYSTEM_PROMPT, ""];

  if (context.conversationSummary) {
    parts.push("Conversation summary so far:", context.conversationSummary, "");
  }

  if (context.memories.length > 0) {
    parts.push("Known facts about this user:");
    for (const m of context.memories) {
      parts.push(`- ${m.key}: ${m.value}`);
    }
    parts.push("");
  }

  if (context.semanticRecalls.length > 0) {
    parts.push("Relevant past messages:");
    for (const r of context.semanticRecalls) {
      parts.push(`- ${r}`);
    }
    parts.push("");
  }

  if (context.recentMessages.length > 0) {
    parts.push("Recent conversation:");
    for (const msg of context.recentMessages) {
      parts.push(`${msg.role}: ${msg.content}`);
    }
    parts.push("");
  }

  parts.push(`user: ${userMessage}`);
  return parts.join("\n");
}

async function callGemini(prompt: string): Promise<string> {
  let lastError: any = null;

  for (const modelName of CANDIDATE_MODELS) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 1024 },
      });

      const text = result.response.text();
      return text.slice(0, 4096);
    } catch (err: any) {
      lastError = err;
      const status = err?.status || err?.statusCode;
      const msg = err?.message || "";
      logger.warn(
        { model: modelName, status, error: msg },
        "Gemini candidate attempt failed, falling back to next candidate model"
      );
      continue;
    }
  }

  throw lastError || new Error("All Gemini candidate models failed");
}

export async function generateReply(context: AiContext, userMessage: string): Promise<string> {
  const prompt = buildPrompt(context, userMessage);
  try {
    return await callGemini(prompt);
  } catch (err) {
    logger.error({ err }, "All Gemini reply models failed");
    return "I'm having a brief moment — please try again in a minute. Your progress still counts.";
  }
}

export async function generateDailyAction(context: AiContext): Promise<string> {
  const prompt = [SYSTEM_PROMPT, "", DAILY_ACTION_PROMPT, "", buildPrompt(context, "What should I do today?")].join(
    "\n",
  );
  try {
    return await callGemini(prompt);
  } catch (err) {
    logger.error({ err }, "All Gemini daily action models failed");
    return "Spend 15 minutes today reviewing your primary resume project or practicing one core technical concept.";
  }
}

export async function generateWeeklySummary(context: AiContext, summaryStats?: string): Promise<string> {
  const requestText = summaryStats
    ? `Summarize my week. Here are my recorded actions for this past week:\n${summaryStats}`
    : "Summarize my week.";
  const prompt = [SYSTEM_PROMPT, "", WEEKLY_SUMMARY_PROMPT, "", buildPrompt(context, requestText)].join("\n");
  try {
    return await callGemini(prompt);
  } catch (err) {
    logger.error({ err }, "All Gemini weekly summary models failed");
    return "Great effort this past week. Every consistent step, no matter how small, compounds toward your placement goals.";
  }
}

export async function extractMemories(recentText: string): Promise<{ key: string; value: string }[]> {
  const prompt = [MEMORY_EXTRACT_PROMPT, "", recentText].join("\n");
  try {
    const raw = await callGemini(prompt);
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return [];
    const parsed = memoryExtractSchema.safeParse(JSON.parse(jsonMatch[0]));
    return parsed.success ? parsed.data.memories : [];
  } catch {
    return [];
  }
}

export async function embedText(text: string): Promise<number[]> {
  const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });
  const result = await model.embedContent(text);
  return result.embedding.values;
}

export async function summarizeConversation(recentText: string, existingSummary: string | null): Promise<string> {
  const prompt = [
    "Summarize this conversation concisely for future context (max 200 words).",
    existingSummary ? `Previous summary: ${existingSummary}` : "",
    "",
    recentText,
  ].join("\n");
  return callGemini(prompt);
}
