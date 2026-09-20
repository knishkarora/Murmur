import { Router } from "express";
import { eq } from "drizzle-orm";
import createError from "http-errors";
import { updatePreferencesSchema } from "@companion/shared/schemas";
import { db } from "../db/index.js";
import { userPreferences } from "../db/schema.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { logger } from "../config.js";

const router = Router();

// GET /me/preferences: Fetch notification and schedule preferences
router.get("/me/preferences", requireAuth, async (req: AuthedRequest, res, next) => {
  const userId = req.userId!;
  try {
    const existing = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId))
      .limit(1);

    if (existing.length > 0) {
      res.json({
        status: "ok",
        preferences: existing[0],
      });
      return;
    }

    // Return defaults if no preferences configured yet
    res.json({
      status: "ok",
      preferences: {
        userId,
        morningHour: 8,
        eveningHour: 20,
        weeklyDay: 0,
        tone: "friendly",
      },
    });
  } catch (err) {
    logger.error({ err, userId }, "Failed to fetch user preferences");
    next(createError(500, "Failed to retrieve user preferences"));
  }
});

// PATCH /me/preferences: Update morningHour, eveningHour, weeklyDay, or tone
router.patch("/me/preferences", requireAuth, async (req: AuthedRequest, res, next) => {
  const userId = req.userId!;
  const parsed = updatePreferencesSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      status: "error",
      message: "Invalid preferences format",
      errors: parsed.error.issues,
    });
    return;
  }

  try {
    const [updated] = await db
      .insert(userPreferences)
      .values({
        userId,
        ...parsed.data,
      })
      .onConflictDoUpdate({
        target: userPreferences.userId,
        set: {
          ...parsed.data,
        },
      })
      .returning();

    logger.info({ userId, updated }, "Updated user preferences successfully");
    res.json({
      status: "ok",
      preferences: updated,
    });
  } catch (err) {
    logger.error({ err, userId }, "Failed to update user preferences");
    next(createError(500, "Failed to update user preferences"));
  }
});

export default router;
