import { Router } from "express";
import { eq, asc } from "drizzle-orm";
import createError from "http-errors";
import { z } from "zod";
import { db } from "../db/index.js";
import { messages, conversations } from "../db/schema.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { logger } from "../config.js";
import { assembleUserContext, triggerMemoryExtractionAndSummary } from "../services/contextService.js";
import { generateReply, embedText } from "../services/aiService.js";
import { messageEmbeddings } from "../db/schema.js";

import { devMockStore, type MockMessage } from "../db/devStore.js";

const router = Router();

const sendMessageSchema = z.object({
  content: z.string().min(1, "Message cannot be empty"),
  conversationId: z.string().uuid().optional(),
});

// GET /me/messages - Fetch conversation history
router.get("/me/messages", requireAuth, async (req: AuthedRequest, res, next) => {
  const userId = req.userId!;

  if (userId === "00000000-0000-0000-0000-000000000001") {
    res.json({
      status: "ok",
      messages: devMockStore.messages,
    });
    return;
  }

  try {
    const list = await db
      .select()
      .from(messages)
      .where(eq(messages.userId, userId))
      .orderBy(asc(messages.createdAt))
      .limit(100);

    res.json({
      status: "ok",
      messages: list,
    });
  } catch (err) {
    logger.error({ err, userId }, "Failed to fetch messages");
    next(createError(500, "Failed to retrieve messages"));
  }
});

// POST /me/messages - Send message from web interface, run AI context pipeline, return assistant reply
router.post("/me/messages", requireAuth, async (req: AuthedRequest, res, next) => {
  const userId = req.userId!;
  const parsed = sendMessageSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      status: "error",
      message: "Invalid message payload",
      errors: parsed.error.issues,
    });
    return;
  }

  const { content } = parsed.data;

  if (userId === "00000000-0000-0000-0000-000000000001") {
    const userMsg: MockMessage = {
      id: `msg-${Date.now()}`,
      userId,
      role: "user",
      content,
      createdAt: new Date().toISOString(),
    };
    const replyReplies = [
      "That is a great direction! Keeping your daily action small and focused builds long-term compounding consistency.",
      "Got it! I have recorded this in your memory bank. What is the single next task you want to check off today?",
      "Excellent reflection. Progress doesn't require burnout — just intentional, steady execution.",
    ];
    const assistantMsg: MockMessage = {
      id: `msg-${Date.now() + 1}`,
      userId,
      role: "assistant",
      content:
        replyReplies[Math.floor(Math.random() * replyReplies.length)] ||
        "Keep compounding your daily momentum!",
      createdAt: new Date().toISOString(),
    };
    devMockStore.messages.push(userMsg, assistantMsg);
    res.status(201).json({
      status: "ok",
      userMessage: userMsg,
      assistantMessage: assistantMsg,
    });
    return;
  }

  try {
    // 1. Insert user message
    const [userMsg] = await db
      .insert(messages)
      .values({
        userId,
        role: "user",
        content,
      })
      .returning();

    if (!userMsg) {
      throw new Error("Failed to insert user message");
    }

    // Background embedding creation for user message
    embedText(content)
      .then(async (embedding) => {
        if (embedding.length > 0) {
          await db.insert(messageEmbeddings).values({
            messageId: userMsg.id,
            userId,
            embedding,
          });
        }
      })
      .catch((err) => {
        logger.error({ err, messageId: userMsg.id }, "Failed to store user message embedding");
      });

    // 2. Assemble 4-layer context memory
    const assembledContext = await assembleUserContext(userId, content);

    // 3. Generate Gemini response
    const replyText = await generateReply(assembledContext, content);

    // 4. Save assistant reply
    const [assistantMsg] = await db
      .insert(messages)
      .values({
        userId,
        role: "assistant",
        content: replyText,
      })
      .returning();

    if (!assistantMsg) {
      throw new Error("Failed to insert assistant reply");
    }

    // Background embedding creation for assistant message
    embedText(replyText)
      .then(async (embedding) => {
        if (embedding.length > 0) {
          await db.insert(messageEmbeddings).values({
            messageId: assistantMsg.id,
            userId,
            embedding,
          });
        }
      })
      .catch((err) => {
        logger.error({ err, messageId: assistantMsg.id }, "Failed to store assistant message embedding");
      });

    // Background memory extraction
    triggerMemoryExtractionAndSummary(userId).catch((memErr) => {
      logger.error({ memErr, userId }, "Background memory extraction failed after web chat message");
    });

    res.status(201).json({
      status: "ok",
      userMessage: userMsg,
      assistantMessage: assistantMsg,
    });
  } catch (err) {
    logger.error({ err, userId }, "Failed to process web message");
    next(createError(500, "Failed to process message"));
  }
});

export default router;
