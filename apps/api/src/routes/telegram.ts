import { Router } from "express";
import crypto from "node:crypto";
import { webhookCallback } from "grammy";
import { eq } from "drizzle-orm";
import { env, logger } from "../config.js";
import { db } from "../db/index.js";
import { linkTokens, webhookEvents } from "../db/schema.js";
import { bot } from "../bot.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";

const router = Router();

// POST /me/telegram/link - Authenticated endpoint to generate short-lived Telegram link token
router.post("/me/telegram/link", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized", code: "UNAUTHORIZED" });
      return;
    }

    const rawToken = crypto.randomBytes(16).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes TTL

    await db.insert(linkTokens).values({
      userId,
      tokenHash,
      expiresAt,
    });

    const url = `https://t.me/${env.TELEGRAM_BOT_USERNAME}?start=link_${rawToken}`;

    res.json({
      url,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

// POST /webhooks/telegram - Webhook endpoint for Telegram Bot API updates
router.post("/webhooks/telegram", async (req, res, next) => {
  const secretHeader = req.headers["x-telegram-bot-api-secret-token"];
  
  if (secretHeader !== env.TELEGRAM_WEBHOOK_SECRET) {
    logger.warn({ secretHeader }, "Unauthorized Telegram webhook attempt - secret mismatch");
    res.status(401).json({ error: "Invalid webhook secret token", code: "UNAUTHORIZED" });
    return;
  }

  const updateId = req.body?.update_id;
  if (typeof updateId === "number") {
    try {
      const existing = await db
        .select()
        .from(webhookEvents)
        .where(eq(webhookEvents.updateId, updateId))
        .limit(1);

      if (existing.length > 0) {
        logger.debug({ updateId }, "Discarding duplicate Telegram update_id");
        res.status(200).json({ ok: true, duplicate: true });
        return;
      }

      await db.insert(webhookEvents).values({
        updateId,
        processedAt: new Date(),
      });
    } catch (dbErr) {
      logger.error({ dbErr, updateId }, "Failed to record webhook update_id in database");
    }
  }

  const handleWebhook = webhookCallback(bot, "express");
  return handleWebhook(req, res);
});

export default router;
