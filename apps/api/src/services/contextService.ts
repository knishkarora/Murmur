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
  userMessage: string
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

  // Layer 2: Rolling Summary (profiles.conversationSummary)
  const profileRows = await db
    .select({ conversationSummary: profiles.conversationSummary })
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .limit(1);

  const conversationSummary = profileRows[0]?.conversationSummary ?? null;

  // Layer 3: Structured Memories (user_memories KV facts)
  const memoryRows = await db
    .select({ key: userMemories.key, value: userMemories.value })
    .from(userMemories)
    .where(eq(userMemories.userId, userId));

  // Layer 4: Semantic Recall (Top 5 similar historical messages via pgvector)
  let semanticRecalls: string[] = [];
  try {
    const messageVector = await embedText(userMessage);
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
  } catch (err) {
    logger.error({ err }, "Failed to query semantic vector recall");
  }

  return {
    recentMessages,
    conversationSummary,
    memories: memoryRows,
    semanticRecalls,
  };
}

export async function storeMessageEmbedding(
  messageId: string,
  userId: string,
  content: string
): Promise<void> {
  try {
    const vectorValues = await embedText(content);
    await db.insert(messageEmbeddings).values({
      messageId,
      userId,
      embedding: vectorValues,
    });
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
