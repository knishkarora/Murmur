import type { Request, Response, NextFunction } from "express";
import { createClient } from "@supabase/supabase-js";
import createError from "http-errors";
import { env } from "../config.js";

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

export interface AuthedRequest extends Request {
  userId?: string;
}

export async function requireAuth(req: AuthedRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return next(createError(401, "Missing authorization token"));
  }

  const token = header.slice(7);
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return next(createError(401, "Invalid or expired token"));
  }

  req.userId = data.user.id;
  next();
}

export { supabase };
