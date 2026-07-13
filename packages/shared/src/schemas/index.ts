import { z } from "zod";

export const profileSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  name: z.string().nullable(),
  timezone: z.string().default("Asia/Kolkata"),
  onboardingDone: z.boolean().default(false),
  conversationSummary: z.string().nullable(),
  createdAt: z.string().datetime(),
});

export const userPreferencesSchema = z.object({
  userId: z.string().uuid(),
  morningHour: z.number().min(0).max(23).default(8),
  eveningHour: z.number().min(0).max(23).default(20),
  weeklyDay: z.number().min(0).max(6).default(0),
  tone: z.enum(["friendly", "direct", "encouraging"]).default("friendly"),
});

export const messageSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  role: z.enum(["user", "assistant", "system"]),
  content: z.string(),
  createdAt: z.string().datetime(),
});

export const dailyActionSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  content: z.string(),
  status: z.enum(["pending", "done", "skipped"]),
  scheduledFor: z.string().datetime(),
});

export const memoryFactSchema = z.object({
  key: z.string(),
  value: z.string(),
});

export const memoryExtractSchema = z.object({
  memories: z.array(memoryFactSchema),
});

export const linkTokenResponseSchema = z.object({
  url: z.string().url(),
  expiresAt: z.string().datetime(),
});

export type Profile = z.infer<typeof profileSchema>;
export type UserPreferences = z.infer<typeof userPreferencesSchema>;
export type Message = z.infer<typeof messageSchema>;
export type DailyAction = z.infer<typeof dailyActionSchema>;
export type MemoryExtract = z.infer<typeof memoryExtractSchema>;
