import { Router } from "express";
import { eq, desc } from "drizzle-orm";
import createError from "http-errors";
import { db } from "../db/index.js";
import { userMemories } from "../db/schema.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { logger } from "../config.js";

import { devMockStore } from "../db/devStore.js";

const router = Router();

// GET /me/memories - Fetch user's stored memory facts
router.get("/me/memories", requireAuth, async (req: AuthedRequest, res, next) => {
  const userId = req.userId!;

  if (userId === "00000000-0000-0000-0000-000000000001") {
    res.json({
      status: "ok",
      memories: devMockStore.memories,
    });
    return;
  }

  try {
    const memories = await db
      .select()
      .from(userMemories)
      .where(eq(userMemories.userId, userId))
      .orderBy(desc(userMemories.updatedAt))
      .limit(50);

    res.json({
      status: "ok",
      memories,
    });
  } catch (err) {
    logger.error({ err, userId }, "Failed to fetch user memories");
    next(createError(500, "Failed to retrieve memories"));
  }
});

export default router;
