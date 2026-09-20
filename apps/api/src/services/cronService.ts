import cron, { type ScheduledTask } from "node-cron";
import { toZonedTime, formatInTimeZone } from "date-fns-tz";
import { subDays } from "date-fns";
import { eq, and, gte, isNull, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import {
  profiles,
  userPreferences,
  telegramAccounts,
  dailyActions,
  weeklySummaries,
  jobRuns,
  messages,
  messageEmbeddings,
} from "../db/schema.js";
import { bot } from "../bot.js";
import { logger } from "../config.js";
import {
  assembleUserContext,
  storeMessageEmbedding,
  triggerMemoryExtractionAndSummary,
} from "./contextService.js";
import { generateDailyAction, generateWeeklySummary } from "./aiService.js";

export const INDIA_TIMEZONE = "Asia/Kolkata";

/**
 * Runs the daily morning action generation job for Indian students whose chosen morningHour (default 8 AM IST) matches now.
 */
export async function runDailyMorningJob(referenceDate: Date = new Date()): Promise<{
  processed: number;
  skipped: number;
  errors: number;
}> {
  const zoned = toZonedTime(referenceDate, INDIA_TIMEZONE);
  const currentIstHour = zoned.getHours();
  const localDateStr = formatInTimeZone(referenceDate, INDIA_TIMEZONE, "yyyy-MM-dd");

  logger.info(
    { currentIstHour, localDateStr },
    "Starting daily_morning cron job runner for India (IST)"
  );

  // Directly query users whose preferred morningHour (default 8) matches the current IST hour
  const matchingUsers = await db
    .select({
      userId: profiles.userId,
      name: profiles.name,
      morningHour: userPreferences.morningHour,
      chatId: telegramAccounts.chatId,
    })
    .from(profiles)
    .leftJoin(userPreferences, eq(profiles.userId, userPreferences.userId))
    .leftJoin(telegramAccounts, eq(profiles.userId, telegramAccounts.userId))
    .where(sql`COALESCE(${userPreferences.morningHour}, 8) = ${currentIstHour}`);

  let processed = 0;
  let skipped = 0;
  let errors = 0;

  for (const user of matchingUsers) {
    // Idempotency lock via job_runs
    try {
      const insertedLock = await db
        .insert(jobRuns)
        .values({
          jobType: "daily_morning",
          userId: user.userId,
          runDate: localDateStr,
        })
        .onConflictDoNothing()
        .returning({ id: jobRuns.id });

      if (insertedLock.length === 0) {
        logger.debug(
          { userId: user.userId, date: localDateStr },
          "daily_morning job already ran today for user; skipping"
        );
        skipped++;
        continue;
      }

      // Generate action via 4-layer memory context
      const context = await assembleUserContext(user.userId, "What should I do today?");
      const actionText = await generateDailyAction(context);

      // Persist daily action
      await db.insert(dailyActions).values({
        userId: user.userId,
        content: actionText,
        status: "pending",
        scheduledFor: referenceDate,
      });

      // Send to Telegram if account is linked
      if (user.chatId) {
        try {
          await bot.api.sendMessage(
            user.chatId,
            `☀️ **Good morning!** Here is your focus for today:\n\n${actionText}`,
            { parse_mode: "Markdown" }
          );
        } catch (tgErr) {
          logger.warn(
            { err: tgErr, userId: user.userId, chatId: user.chatId },
            "Markdown send failed, falling back to plain text"
          );
          try {
            await bot.api.sendMessage(
              user.chatId,
              `☀️ Good morning! Here is your focus for today:\n\n${actionText}`
            );
          } catch (fallbackErr) {
            logger.error(
              { err: fallbackErr, userId: user.userId },
              "Failed to dispatch daily morning action via Telegram"
            );
          }
        }
      }

      processed++;
      logger.info({ userId: user.userId }, "Successfully generated and delivered daily morning action");
    } catch (err) {
      errors++;
      logger.error({ err, userId: user.userId }, "Error processing daily_morning job for user");
    }
  }

  logger.info(
    { processed, skipped, errors, totalMatched: matchingUsers.length },
    "Finished daily_morning cron job runner"
  );
  return { processed, skipped, errors };
}

/**
 * Runs the weekly planner and summary generation job on Sunday 6:00 PM IST (or user's preferred weeklyDay).
 */
export async function runWeeklyPlannerJob(referenceDate: Date = new Date()): Promise<{
  processed: number;
  skipped: number;
  errors: number;
}> {
  const zoned = toZonedTime(referenceDate, INDIA_TIMEZONE);
  const currentIstHour = zoned.getHours();
  const currentIstDay = zoned.getDay(); // 0 is Sunday
  const localDateStr = formatInTimeZone(referenceDate, INDIA_TIMEZONE, "yyyy-MM-dd");

  logger.info(
    { currentIstHour, currentIstDay, localDateStr },
    "Starting weekly_planner cron job runner for India (IST)"
  );

  // Weekly summaries run at 18:00 (6 PM) IST on the user's chosen day (default 0 = Sunday)
  if (currentIstHour !== 18) {
    logger.debug({ currentIstHour }, "Not 18:00 (6 PM) IST; skipping weekly_planner");
    return { processed: 0, skipped: 0, errors: 0 };
  }

  const matchingUsers = await db
    .select({
      userId: profiles.userId,
      name: profiles.name,
      weeklyDay: userPreferences.weeklyDay,
      chatId: telegramAccounts.chatId,
    })
    .from(profiles)
    .leftJoin(userPreferences, eq(profiles.userId, userPreferences.userId))
    .leftJoin(telegramAccounts, eq(profiles.userId, telegramAccounts.userId))
    .where(sql`COALESCE(${userPreferences.weeklyDay}, 0) = ${currentIstDay}`);

  let processed = 0;
  let skipped = 0;
  let errors = 0;

  for (const user of matchingUsers) {
    try {
      const insertedLock = await db
        .insert(jobRuns)
        .values({
          jobType: "weekly_planner",
          userId: user.userId,
          runDate: localDateStr,
        })
        .onConflictDoNothing()
        .returning({ id: jobRuns.id });

      if (insertedLock.length === 0) {
        logger.debug(
          { userId: user.userId, date: localDateStr },
          "weekly_planner job already ran today for user; skipping"
        );
        skipped++;
        continue;
      }

      // Query past 7 days' actions
      const sevenDaysAgo = subDays(referenceDate, 7);
      const pastActions = await db
        .select({
          content: dailyActions.content,
          status: dailyActions.status,
        })
        .from(dailyActions)
        .where(
          and(
            eq(dailyActions.userId, user.userId),
            gte(dailyActions.scheduledFor, sevenDaysAgo)
          )
        );

      const completedCount = pastActions.filter((a) => a.status === "done").length;
      const totalCount = pastActions.length;
      const statsSummary = [
        `Total tasks scheduled: ${totalCount}`,
        `Tasks completed: ${completedCount}`,
        ...pastActions.map((a) => `- [${a.status}] ${a.content}`),
      ].join("\n");

      const context = await assembleUserContext(user.userId, "Summarize my week.");
      const summaryText = await generateWeeklySummary(context, statsSummary);

      // Persist weekly summary
      await db.insert(weeklySummaries).values({
        userId: user.userId,
        weekStart: sevenDaysAgo,
        content: summaryText,
        createdAt: referenceDate,
      });

      // Send to Telegram if linked
      if (user.chatId) {
        try {
          await bot.api.sendMessage(
            user.chatId,
            `📅 **Your Weekly Summary & Reflection:**\n\n${summaryText}`,
            { parse_mode: "Markdown" }
          );
        } catch (tgErr) {
          logger.warn(
            { err: tgErr, userId: user.userId, chatId: user.chatId },
            "Markdown weekly summary send failed, falling back to plain text"
          );
          try {
            await bot.api.sendMessage(
              user.chatId,
              `📅 Your Weekly Summary & Reflection:\n\n${summaryText}`
            );
          } catch (fallbackErr) {
            logger.error(
              { err: fallbackErr, userId: user.userId },
              "Failed to dispatch weekly summary via Telegram"
            );
          }
        }
      }

      processed++;
      logger.info({ userId: user.userId }, "Successfully generated and delivered weekly summary");
    } catch (err) {
      errors++;
      logger.error({ err, userId: user.userId }, "Error processing weekly_planner job for user");
    }
  }

  logger.info(
    { processed, skipped, errors, totalMatched: matchingUsers.length },
    "Finished weekly_planner cron job runner"
  );
  return { processed, skipped, errors };
}

/**
 * Runs rolling conversation summarization for active student chats.
 */
export async function runMemorySummarizeJob(): Promise<{ processed: number; errors: number }> {
  logger.info("Starting nightly memory_summarize cron job runner");

  const activeUsers = await db
    .selectDistinct({ userId: messages.userId })
    .from(messages);

  let processed = 0;
  let errors = 0;

  for (const row of activeUsers) {
    try {
      await triggerMemoryExtractionAndSummary(row.userId);
      processed++;
    } catch (err) {
      errors++;
      logger.error({ err, userId: row.userId }, "Error updating rolling summary for user");
    }
  }

  logger.info({ processed, errors }, "Finished memory_summarize cron job runner");
  return { processed, errors };
}

/**
 * Runs vector calculations on unprocessed messages.
 */
export async function runEmbeddingBackfillJob(limit = 50): Promise<{
  backfilled: number;
  errors: number;
}> {
  logger.info({ limit }, "Starting embedding_backfill cron job runner");

  let backfilled = 0;
  let errors = 0;

  try {
    const unEmbedded = await db
      .select({
        id: messages.id,
        userId: messages.userId,
        content: messages.content,
      })
      .from(messages)
      .leftJoin(messageEmbeddings, eq(messages.id, messageEmbeddings.messageId))
      .where(isNull(messageEmbeddings.id))
      .limit(limit);

    for (const msg of unEmbedded) {
      try {
        await storeMessageEmbedding(msg.id, msg.userId, msg.content);
        backfilled++;
      } catch (err) {
        errors++;
        logger.error({ err, messageId: msg.id }, "Failed to backfill embedding for message");
      }
    }
  } catch (err) {
    logger.error({ err }, "Error querying messages for embedding backfill");
  }

  logger.info({ backfilled, errors }, "Finished embedding_backfill cron job runner");
  return { backfilled, errors };
}

/**
 * Initializes recurring background cron automations pinned to Asia/Kolkata (IST).
 */
export function initScheduler(): {
  hourlyTask: ScheduledTask;
  memoryTask: ScheduledTask;
  backfillTask: ScheduledTask;
} {
  logger.info("Registering background cron automation schedules for Asia/Kolkata (IST)...");

  // Hourly runner: evaluates morning tasks and weekly summaries for matching users in IST
  const hourlyTask = cron.schedule(
    "0 * * * *",
    async () => {
      logger.info("Hourly IST cron tick fired");
      try {
        await runDailyMorningJob();
        await runWeeklyPlannerJob();
      } catch (err) {
        logger.error({ err }, "Error in hourly cron task");
      }
    },
    { timezone: INDIA_TIMEZONE }
  );

  // Nightly at 2:00 AM IST: Memory rolling summary aggregation
  const memoryTask = cron.schedule(
    "0 2 * * *",
    async () => {
      logger.info("Nightly 2:00 AM IST memory_summarize cron tick fired");
      try {
        await runMemorySummarizeJob();
      } catch (err) {
        logger.error({ err }, "Error in memory_summarize cron task");
      }
    },
    { timezone: INDIA_TIMEZONE }
  );

  // Nightly at 3:00 AM IST: Vector embedding backfill
  const backfillTask = cron.schedule(
    "0 3 * * *",
    async () => {
      logger.info("Nightly 3:00 AM IST embedding_backfill cron tick fired");
      try {
        await runEmbeddingBackfillJob();
      } catch (err) {
        logger.error({ err }, "Error in embedding_backfill cron task");
      }
    },
    { timezone: INDIA_TIMEZONE }
  );

  logger.info("Background cron automations initialized for IST (hourly, 02:00 IST, 03:00 IST)");
  return { hourlyTask, memoryTask, backfillTask };
}
