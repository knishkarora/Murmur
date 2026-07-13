import { parseServerEnv } from "@companion/shared/env";
import pino from "pino";

export const env = parseServerEnv(process.env);

export const logger = pino({
  level: env.NODE_ENV === "development" ? "debug" : "info",
  transport: env.NODE_ENV === "development" ? { target: "pino-pretty" } : undefined,
});
