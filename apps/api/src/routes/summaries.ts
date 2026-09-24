import { Router } from "express";
import { eq, desc } from "drizzle-orm";
import createError from "http-errors";
import { db } from "../db/index.js";
import { weeklySummaries } from "../db/schema.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { logger } from "../config.js";

import { devMockStore } from "../db/devStore.js";

const router = Router();

// GET /me/summaries - Fetch user's weekly summaries
router.get("/me/summaries", requireAuth, async (req: AuthedRequest, res, next) => {
  const userId = req.userId!;

  if (userId === "00000000-0000-0000-0000-000000000001") {
    res.json({
      status: "ok",
      summaries: devMockStore.summaries,
    });
    return;
  }

  try {
    const summaries = await db
      .select()
      .from(weeklySummaries)
      .where(eq(weeklySummaries.userId, userId))
      .orderBy(desc(weeklySummaries.weekStart))
      .limit(20);

    res.json({
      status: "ok",
      summaries,
    });
  } catch (err) {
    logger.error({ err, userId }, "Failed to fetch weekly summaries");
    next(createError(500, "Failed to retrieve weekly summaries"));
  }
});

export default router;
