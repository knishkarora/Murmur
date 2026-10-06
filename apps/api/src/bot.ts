import { Bot } from "grammy";
import crypto from "node:crypto";
import { eq, and, gt, isNull } from "drizzle-orm";
import { env, logger } from "./config.js";
import { db } from "./db/index.js";
import { linkTokens, telegramAccounts, profiles, messages } from "./db/schema.js";
import { generateReply } from "./services/aiService.js";
import { assembleUserContext, triggerMemoryExtractionAndSummary } from "./services/contextService.js";
import { runEmbeddingBackfillJob } from "./services/cronService.js";

export const bot = new Bot(env.TELEGRAM_BOT_TOKEN);

bot.command("start", async (ctx) => {
  const payload = ctx.match;
  if (!payload || !payload.startsWith("link_")) {
    await ctx.reply(
      "Welcome to Murmur! To connect your Telegram account, please click 'Connect Telegram' from your Murmur web dashboard."
    );
    return;
  }

  const rawToken = payload.substring(5);
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  const now = new Date();

  try {
    const existingTokens = await db
      .select()
      .from(linkTokens)
      .where(
        and(
          eq(linkTokens.tokenHash, tokenHash),
          isNull(linkTokens.usedAt),
          gt(linkTokens.expiresAt, now)
        )
      )
      .limit(1);

    const [tokenRecord] = existingTokens;
    if (!tokenRecord) {
      await ctx.reply(
        "⚠️ Invalid or expired connection link. Please request a new link from your Murmur web dashboard."
      );
      return;
    }

    const userId = tokenRecord.userId;
    const telegramUserId = ctx.from?.id;
    const chatId = ctx.chat.id;

    if (!telegramUserId) {
      await ctx.reply("⚠️ Could not verify Telegram user ID.");
      return;
    }

    await db
      .insert(telegramAccounts)
      .values({
        userId,
        telegramUserId,
        chatId,
        linkedAt: now,
      })
      .onConflictDoUpdate({
        target: telegramAccounts.userId,
        set: {
          telegramUserId,
          chatId,
          linkedAt: now,
        },
      });

    await db
      .update(linkTokens)
      .set({ usedAt: now })
      .where(eq(linkTokens.id, tokenRecord.id));

    await db
      .update(profiles)
      .set({ onboardingDone: true })
      .where(eq(profiles.userId, userId));

    logger.info(
      { userId, telegramUserId, chatId },
      "Successfully linked Telegram account"
    );

    await ctx.reply(
      "🎉 Account successfully linked! Welcome to Murmur. Your Telegram account is now connected to your dashboard."
    );
  } catch (err) {
    logger.error({ err }, "Error handling Telegram link command");
    await ctx.reply(
      "⚠️ An unexpected error occurred while linking your account. Please try again."
    );
  }
});

interface PendingMessageQueue {
  texts: string[];
  timer: NodeJS.Timeout;
  lastCtx: any;
  userId: string;
}

const userQueues = new Map<number, PendingMessageQueue>();

bot.on("message:text", async (ctx) => {
  const telegramUserId = ctx.from.id;
  const userText = ctx.message.text.trim();

  if (userText.startsWith("/")) return;

  try {
    const accounts = await db
      .select({ userId: telegramAccounts.userId })
      .from(telegramAccounts)
      .where(eq(telegramAccounts.telegramUserId, telegramUserId))
      .limit(1);

    const [account] = accounts;
    if (!account) {
      await ctx.reply(
        "👋 Welcome! Your Telegram account is not linked to Murmur yet. Please open your web dashboard and click 'Connect Telegram' to link your account."
      );
      return;
    }

    const userId = account.userId;

    // Immediately signal typing feedback in Telegram client
    void ctx.replyWithChatAction("typing");

    const existingQueue = userQueues.get(telegramUserId);

    if (existingQueue) {
      clearTimeout(existingQueue.timer);
      existingQueue.texts.push(userText);
      existingQueue.lastCtx = ctx;

      // Gentle flood warning if user sends excessive burst of messages
      if (existingQueue.texts.length === 5) {
        void ctx.reply("💭 Processing your thoughts, one moment...");
      }

      existingQueue.timer = setTimeout(
        () => void processPendingBatch(telegramUserId),
        2500
      );
    } else {
      const timer = setTimeout(
        () => void processPendingBatch(telegramUserId),
        2500
      );
      userQueues.set(telegramUserId, {
        texts: [userText],
        timer,
        lastCtx: ctx,
        userId,
      });
    }
  } catch (err) {
    logger.error(
      { err, telegramUserId },
      "Error initiating Telegram message queue"
    );
  }
});

async function processPendingBatch(telegramUserId: number): Promise<void> {
  const queue = userQueues.get(telegramUserId);
  if (!queue) return;
  userQueues.delete(telegramUserId);

  const { texts, lastCtx, userId } = queue;
  const combinedUserText = texts.join("\n");

  try {
    // 1. Persist user message to Postgres (accessible immediately to recent-messages context)
    await db.insert(messages).values({
      userId,
      role: "user",
      content: combinedUserText,
      createdAt: new Date(),
    });

    // 2. Build context using Postgres recent history + placement facts (0 API calls)
    const aiContext = await assembleUserContext(userId, combinedUserText);

    // 3. Generate response using 1 single Gemini call (maxOutputTokens: 2048)
    const aiReplyText = await generateReply(aiContext, combinedUserText);

    // 4. Persist assistant reply to Postgres
    await db.insert(messages).values({
      userId,
      role: "assistant",
      content: aiReplyText,
      createdAt: new Date(),
    });

    // 5. Send reply to Telegram
    await lastCtx.reply(aiReplyText);

    // 6. Schedule post-conversation sync (sliding 2.5m inactivity debounce)
    schedulePostConversationSync(userId);

    logger.info(
      { userId, telegramUserId, messageCount: texts.length },
      "Successfully processed and delivered debounced AI reply"
    );
  } catch (err) {
    logger.error(
      { err, telegramUserId, userId },
      "Error processing debounced AI reply"
    );
    try {
      await lastCtx.reply(
        "I'm having a brief moment — please try again in a minute. Your progress still counts."
      );
    } catch {
      // Ignore secondary network reply errors
    }
  }
}

const sessionSyncTimers = new Map<string, NodeJS.Timeout>();

function schedulePostConversationSync(userId: string): void {
  const existingTimer = sessionSyncTimers.get(userId);
  if (existingTimer) {
    clearTimeout(existingTimer);
  }

  // Sliding 2.5-minute (150,000 ms) inactivity timer:
  // Fires while the Render free-tier container is guaranteed to be awake (12.5 mins before sleep cutoff)
  const timer = setTimeout(async () => {
    sessionSyncTimers.delete(userId);
    try {
      logger.info({ userId }, "Executing post-conversation embedding and memory consolidation");
      await runEmbeddingBackfillJob(50);
      await triggerMemoryExtractionAndSummary(userId);
      logger.info({ userId }, "Post-conversation embedding and memory consolidation finished");
    } catch (err) {
      logger.error({ err, userId }, "Failed in post-conversation consolidation");
    }
  }, 150000);

  sessionSyncTimers.set(userId, timer);
}

bot.catch((err) => {
  logger.error(
    { err: err.error, ctx: err.ctx },
    "Error in Grammy bot error boundary"
  );
});
