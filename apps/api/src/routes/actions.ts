import { Router } from "express";
import { eq, and, desc } from "drizzle-orm";
import createError from "http-errors";
import { z } from "zod";
import { db } from "../db/index.js";
import { dailyActions } from "../db/schema.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { logger } from "../config.js";

import { devMockStore, type MockAction } from "../db/devStore.js";

const router = Router();

const createActionSchema = z.object({
  content: z.string().min(1, "Action content cannot be empty"),
  scheduledFor: z.string().datetime().optional(),
});

const updateActionSchema = z.object({
  content: z.string().min(1).optional(),
  status: z.enum(["pending", "done", "skipped"]).optional(),
});

// GET /me/actions - Fetch user's daily actions
router.get("/me/actions", requireAuth, async (req: AuthedRequest, res, next) => {
  const userId = req.userId!;

  if (userId === "00000000-0000-0000-0000-000000000001") {
    res.json({
      status: "ok",
      actions: devMockStore.actions,
    });
    return;
  }

  try {
    const actions = await db
      .select()
      .from(dailyActions)
      .where(eq(dailyActions.userId, userId))
      .orderBy(desc(dailyActions.scheduledFor), desc(dailyActions.createdAt))
      .limit(50);

    res.json({
      status: "ok",
      actions,
    });
  } catch (err) {
    logger.error({ err, userId }, "Failed to fetch daily actions");
    next(createError(500, "Failed to retrieve daily actions"));
  }
});

// POST /me/actions - Create a new daily action
router.post("/me/actions", requireAuth, async (req: AuthedRequest, res, next) => {
  const userId = req.userId!;
  const parsed = createActionSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      status: "error",
      message: "Invalid action data",
      errors: parsed.error.issues,
    });
    return;
  }

  if (userId === "00000000-0000-0000-0000-000000000001") {
    const newAct: MockAction = {
      id: `act-${Date.now()}`,
      userId,
      content: parsed.data.content,
      status: "pending",
      scheduledFor: parsed.data.scheduledFor || new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    devMockStore.actions.unshift(newAct);
    res.status(201).json({
      status: "ok",
      action: newAct,
    });
    return;
  }

  try {
    const scheduledFor = parsed.data.scheduledFor ? new Date(parsed.data.scheduledFor) : new Date();

    const [created] = await db
      .insert(dailyActions)
      .values({
        userId,
        content: parsed.data.content,
        status: "pending",
        scheduledFor,
      })
      .returning();

    res.status(201).json({
      status: "ok",
      action: created,
    });
  } catch (err) {
    logger.error({ err, userId }, "Failed to create daily action");
    next(createError(500, "Failed to create action"));
  }
});

// PATCH /me/actions/:id - Update action status or content
router.patch("/me/actions/:id", requireAuth, async (req: AuthedRequest, res, next) => {
  const userId = req.userId!;
  const actionId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (!actionId) {
    res.status(400).json({ error: "Missing action ID", code: "BAD_REQUEST" });
    return;
  }
  const parsed = updateActionSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      status: "error",
      message: "Invalid update data",
      errors: parsed.error.issues,
    });
    return;
  }

  if (userId === "00000000-0000-0000-0000-000000000001") {
    const item = devMockStore.actions.find((a) => a.id === actionId);
    if (!item) {
      res.status(404).json({ error: "Action not found", code: "NOT_FOUND" });
      return;
    }
    if (parsed.data.content) item.content = parsed.data.content;
    if (parsed.data.status) item.status = parsed.data.status;
    res.json({
      status: "ok",
      action: item,
    });
    return;
  }

  try {
    const [updated] = await db
      .update(dailyActions)
      .set(parsed.data)
      .where(and(eq(dailyActions.id, actionId), eq(dailyActions.userId, userId)))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Action not found", code: "NOT_FOUND" });
      return;
    }

    res.json({
      status: "ok",
      action: updated,
    });
  } catch (err) {
    logger.error({ err, userId, actionId }, "Failed to update action");
    next(createError(500, "Failed to update action"));
  }
});

// POST /me/actions/:id/complete - Toggle or mark action done
router.post("/me/actions/:id/complete", requireAuth, async (req: AuthedRequest, res, next) => {
  const userId = req.userId!;
  const actionId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (!actionId) {
    res.status(400).json({ error: "Missing action ID", code: "BAD_REQUEST" });
    return;
  }

  if (userId === "00000000-0000-0000-0000-000000000001") {
    const item = devMockStore.actions.find((a) => a.id === actionId);
    if (!item) {
      res.status(404).json({ error: "Action not found", code: "NOT_FOUND" });
      return;
    }
    item.status = item.status === "done" ? "pending" : "done";
    res.json({
      status: "ok",
      action: item,
    });
    return;
  }

  try {
    const [action] = await db
      .select()
      .from(dailyActions)
      .where(and(eq(dailyActions.id, actionId), eq(dailyActions.userId, userId)))
      .limit(1);

    if (!action) {
      res.status(404).json({ error: "Action not found", code: "NOT_FOUND" });
      return;
    }

    const nextStatus = action.status === "done" ? "pending" : "done";

    const [updated] = await db
      .update(dailyActions)
      .set({ status: nextStatus })
      .where(and(eq(dailyActions.id, actionId), eq(dailyActions.userId, userId)))
      .returning();

    res.json({
      status: "ok",
      action: updated,
    });
  } catch (err) {
    logger.error({ err, userId, actionId }, "Failed to complete action");
    next(createError(500, "Failed to complete action"));
  }
});

export default router;
