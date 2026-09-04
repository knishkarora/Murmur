import { Bot } from "grammy";
import crypto from "node:crypto";
import { eq, and, gt, isNull } from "drizzle-orm";
import { env, logger } from "./config.js";
import { db } from "./db/index.js";
import { linkTokens, telegramAccounts, profiles, messages } from "./db/schema.js";
import { generateReply } from "./services/aiService.js";
import {
  assembleUserContext,
  storeMessageEmbedding,
  triggerMemoryExtractionAndSummary,
} from "./services/contextService.js";

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

bot.on("message:text", async (ctx) => {
  const telegramUserId = ctx.from.id;
  const userText = ctx.message.text;

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

    const [insertedUserMsg] = await db
      .insert(messages)
      .values({
        userId,
        role: "user",
        content: userText,
        createdAt: new Date(),
      })
      .returning({ id: messages.id });

    if (insertedUserMsg) {
      void storeMessageEmbedding(insertedUserMsg.id, userId, userText);
    }

    const aiContext = await assembleUserContext(userId, userText);
    const aiReplyText = await generateReply(aiContext, userText);

    const [insertedAiMsg] = await db
      .insert(messages)
      .values({
        userId,
        role: "assistant",
        content: aiReplyText,
        createdAt: new Date(),
      })
      .returning({ id: messages.id });

    if (insertedAiMsg) {
      void storeMessageEmbedding(insertedAiMsg.id, userId, aiReplyText);
    }

    await ctx.reply(aiReplyText);

    void triggerMemoryExtractionAndSummary(userId);
  } catch (err) {
    logger.error(
      { err, telegramUserId },
      "Error handling incoming Telegram message"
    );
    await ctx.reply(
      "I'm having a brief moment — please try again in a minute. Your progress still counts."
    );
  }
});

bot.catch((err) => {
  logger.error(
    { err: err.error, ctx: err.ctx },
    "Error in Grammy bot error boundary"
  );
});
