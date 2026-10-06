import { eq, desc, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import {
  messages,
  profiles,
  userMemories,
  messageEmbeddings,
} from "../db/schema.js";
import {
  embedText,
  extractMemories,
  summarizeConversation,
  type AiContext,
} from "./aiService.js";
import { logger } from "../config.js";

export async function assembleUserContext(
  userId: string,
  userMessage: string,
  includeSemanticRecall: boolean = false
): Promise<AiContext> {
  // Layer 1: Short-term Buffer (Last 20 messages)
  const recentMsgRows = await db
    .select({
      role: messages.role,
      content: messages.content,
    })
    .from(messages)
    .where(eq(messages.userId, userId))
    .orderBy(desc(messages.createdAt))
    .limit(20);

  const recentMessages = recentMsgRows.reverse();

  // Layer 2: Rolling Summary & Placement Attributes (profiles)
  const profileRows = await db
    .select({
      conversationSummary: profiles.conversationSummary,
      branch: profiles.branch,
      targetRole: profiles.targetRole,
      focusArea: profiles.focusArea,
      timeline: profiles.timeline,
      primaryGoal: profiles.primaryGoal,
    })
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .limit(1);

  const userProfile = profileRows[0];
  const conversationSummary = userProfile?.conversationSummary ?? null;

  // Layer 3: Structured Memories (user_memories KV facts + profile placement facts)
  const memoryRows = await db
    .select({ key: userMemories.key, value: userMemories.value })
    .from(userMemories)
    .where(eq(userMemories.userId, userId));

  const allMemories: { key: string; value: string }[] = [...memoryRows];
  if (userProfile?.branch) allMemories.push({ key: "Branch / Degree", value: userProfile.branch });
  if (userProfile?.targetRole) allMemories.push({ key: "Target Role", value: userProfile.targetRole });
  if (userProfile?.focusArea) allMemories.push({ key: "Current Focus", value: userProfile.focusArea });
  if (userProfile?.timeline) allMemories.push({ key: "Placement Timeline", value: userProfile.timeline });
  if (userProfile?.primaryGoal) allMemories.push({ key: "Primary Goal / Expectation", value: userProfile.primaryGoal });

  // Layer 4: Semantic Recall (optional, bypassed on fast interactive chat to preserve Gemini RPM/RPD)
  let semanticRecalls: string[] = [];
  if (includeSemanticRecall) {
    try {
      const messageVector = await embedText(userMessage);
      if (messageVector.length > 0) {
        const vectorStr = `[${messageVector.join(",")}]`;

        const recallRows = await db
          .select({
            content: messages.content,
          })
          .from(messageEmbeddings)
          .innerJoin(messages, eq(messageEmbeddings.messageId, messages.id))
          .where(eq(messageEmbeddings.userId, userId))
          .orderBy(sql`${messageEmbeddings.embedding} <=> ${vectorStr}::vector`)
          .limit(5);

        semanticRecalls = recallRows.map((r) => r.content);
      }
    } catch (err) {
      logger.error({ err }, "Failed to query semantic vector recall");
    }
  }

  return {
    recentMessages,
    conversationSummary,
    memories: allMemories,
    semanticRecalls,
  };
}

export async function storeMessageEmbedding(
  messageId: string,
  userId: string,
  content: string
): Promise<void> {
  if (!content || !content.trim()) return;
  try {
    const vectorValues = await embedText(content);
    if (vectorValues.length > 0) {
      await db
        .insert(messageEmbeddings)
        .values({
          messageId,
          userId,
          embedding: vectorValues,
        })
        .onConflictDoNothing({ target: messageEmbeddings.messageId });
    }
  } catch (err) {
    logger.error({ err, messageId, userId }, "Failed to generate and store message embedding");
  }
}

export async function triggerMemoryExtractionAndSummary(userId: string): Promise<void> {
  try {
    const recentMsgRows = await db
      .select({ role: messages.role, content: messages.content })
      .from(messages)
      .where(eq(messages.userId, userId))
      .orderBy(desc(messages.createdAt))
      .limit(10);

    if (recentMsgRows.length === 0) return;

    const recentText = recentMsgRows
      .reverse()
      .map((m) => `${m.role}: ${m.content}`)
      .join("\n");

    const extractedFacts = await extractMemories(recentText);
    for (const fact of extractedFacts) {
      await db
        .insert(userMemories)
        .values({
          userId,
          key: fact.key,
          value: fact.value,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [userMemories.userId, userMemories.key],
          set: {
            value: fact.value,
            updatedAt: new Date(),
          },
        });
    }

    const profileRows = await db
      .select({ conversationSummary: profiles.conversationSummary })
      .from(profiles)
      .where(eq(profiles.userId, userId))
      .limit(1);

    const existingSummary = profileRows[0]?.conversationSummary ?? null;
    const newSummary = await summarizeConversation(recentText, existingSummary);

    await db
      .update(profiles)
      .set({ conversationSummary: newSummary })
      .where(eq(profiles.userId, userId));
  } catch (err) {
    logger.error({ err, userId }, "Error during memory extraction and summary update");
  }
}
