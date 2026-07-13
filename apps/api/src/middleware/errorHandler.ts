import type { Request, Response, NextFunction } from "express";
import createError from "http-errors";
import { logger } from "../config.js";

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (createError.isHttpError(err)) {
    res.status(err.status).json({ error: err.message, code: err.status });
    return;
  }

  logger.error(err);
  res.status(500).json({ error: "Internal server error", code: 500 });
}
