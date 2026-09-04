import { Bot } from "grammy";
import crypto from "node:crypto";
import { eq, and, gt, isNull } from "drizzle-orm";
import { env, logger } from "./config.js";
import { db } from "./db/index.js";
import { linkTokens, telegramAccounts, profiles } from "./db/schema.js";

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

bot.catch((err) => {
  logger.error(
    { err: err.error, ctx: err.ctx },
    "Error in Grammy bot error boundary"
  );
});
