import { Router } from "express";
import { eq } from "drizzle-orm";
import createError from "http-errors";
import { z } from "zod";
import { db } from "../db/index.js";
import { profiles, userPreferences, telegramAccounts } from "../db/schema.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { logger } from "../config.js";

import { devMockStore } from "../db/devStore.js";

const router = Router();

const updateProfileSchema = z.object({
  name: z.string().nullable().optional(),
  timezone: z.string().optional(),
  onboardingDone: z.boolean().optional(),
});

// GET /me/profile - Fetch combined user profile, preferences, and Telegram link status
router.get("/me/profile", requireAuth, async (req: AuthedRequest, res, next) => {
  const userId = req.userId!;

  if (userId === "00000000-0000-0000-0000-000000000001") {
    res.json({
      status: "ok",
      profile: devMockStore.profile,
      preferences: devMockStore.preferences,
      telegramLinked: devMockStore.telegramLinked,
      telegramLinkedAt: devMockStore.telegramLinkedAt,
    });
    return;
  }

  try {
    let [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);

    if (!profile) {
      const [newProfile] = await db
        .insert(profiles)
        .values({
          userId,
          name: "Mio",
          timezone: "Asia/Kolkata",
          onboardingDone: false,
        })
        .returning();
      profile = newProfile;
    }

    const [prefs] = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId))
      .limit(1);

    const [telegram] = await db
      .select({ id: telegramAccounts.id, linkedAt: telegramAccounts.linkedAt })
      .from(telegramAccounts)
      .where(eq(telegramAccounts.userId, userId))
      .limit(1);

    res.json({
      status: "ok",
      profile,
      preferences: prefs || {
        morningHour: 8,
        eveningHour: 20,
        weeklyDay: 0,
        tone: "friendly",
      },
      telegramLinked: Boolean(telegram),
      telegramLinkedAt: telegram?.linkedAt || null,
    });
  } catch (err) {
    logger.error({ err, userId }, "Failed to fetch user profile");
    next(createError(500, "Failed to retrieve user profile"));
  }
});

// PATCH /me/profile - Update profile details (name, timezone, onboarding status)
router.patch("/me/profile", requireAuth, async (req: AuthedRequest, res, next) => {
  const userId = req.userId!;
  const parsed = updateProfileSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      status: "error",
      message: "Invalid profile data",
      errors: parsed.error.issues,
    });
    return;
  }

  if (userId === "00000000-0000-0000-0000-000000000001") {
    if (parsed.data.name !== undefined) devMockStore.profile.name = parsed.data.name || "Mio";
    if (parsed.data.timezone !== undefined) devMockStore.profile.timezone = parsed.data.timezone;
    if (parsed.data.onboardingDone !== undefined) devMockStore.profile.onboardingDone = parsed.data.onboardingDone;
    res.json({
      status: "ok",
      profile: devMockStore.profile,
    });
    return;
  }

  try {
    const [updated] = await db
      .insert(profiles)
      .values({
        userId,
        ...parsed.data,
      })
      .onConflictDoUpdate({
        target: profiles.userId,
        set: {
          ...parsed.data,
        },
      })
      .returning();

    res.json({
      status: "ok",
      profile: updated,
    });
  } catch (err) {
    logger.error({ err, userId }, "Failed to update user profile");
    next(createError(500, "Failed to update profile"));
  }
});

export default router;
