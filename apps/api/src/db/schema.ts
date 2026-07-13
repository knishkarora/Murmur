import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  integer,
  pgEnum,
  uniqueIndex,
  index,
  vector,
  bigint,
} from "drizzle-orm/pg-core";

export const messageRoleEnum = pgEnum("message_role", ["user", "assistant", "system"]);
export const actionStatusEnum = pgEnum("action_status", ["pending", "done", "skipped"]);
export const toneEnum = pgEnum("tone", ["friendly", "direct", "encouraging"]);

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().unique(),
  name: text("name"),
  timezone: text("timezone").notNull().default("Asia/Kolkata"),
  onboardingDone: boolean("onboarding_done").notNull().default(false),
  conversationSummary: text("conversation_summary"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const telegramAccounts = pgTable("telegram_accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().unique(),
  telegramUserId: bigint("telegram_user_id", { mode: "number" }).notNull().unique(),
  chatId: bigint("chat_id", { mode: "number" }).notNull(),
  linkedAt: timestamp("linked_at", { withTimezone: true }).notNull().defaultNow(),
});

export const userPreferences = pgTable("user_preferences", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().unique(),
  morningHour: integer("morning_hour").notNull().default(8),
  eveningHour: integer("evening_hour").notNull().default(20),
  weeklyDay: integer("weekly_day").notNull().default(0),
  tone: toneEnum("tone").notNull().default("friendly"),
});

export const userMemories = pgTable(
  "user_memories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    key: text("key").notNull(),
    value: text("value").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("user_memories_user_key_idx").on(table.userId, table.key)],
);

export const conversations = pgTable("conversations", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  type: text("type").notNull().default("general"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    conversationId: uuid("conversation_id"),
    role: messageRoleEnum("role").notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("messages_user_created_idx").on(table.userId, table.createdAt)],
);

export const messageEmbeddings = pgTable(
  "message_embeddings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    messageId: uuid("message_id").notNull().unique(),
    userId: uuid("user_id").notNull(),
    embedding: vector("embedding", { dimensions: 768 }),
  },
  (table) => [index("message_embeddings_embedding_idx").using("hnsw", table.embedding.op("vector_cosine_ops"))],
);

export const dailyActions = pgTable(
  "daily_actions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    content: text("content").notNull(),
    status: actionStatusEnum("status").notNull().default("pending"),
    scheduledFor: timestamp("scheduled_for", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("daily_actions_user_scheduled_idx").on(table.userId, table.scheduledFor)],
);

export const weeklySummaries = pgTable("weekly_summaries", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  weekStart: timestamp("week_start", { withTimezone: true }).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const jobRuns = pgTable(
  "job_runs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    jobType: text("job_type").notNull(),
    userId: uuid("user_id").notNull(),
    runDate: text("run_date").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("job_runs_unique_idx").on(table.jobType, table.userId, table.runDate)],
);

export const webhookEvents = pgTable("webhook_events", {
  updateId: bigint("update_id", { mode: "number" }).primaryKey(),
  processedAt: timestamp("processed_at", { withTimezone: true }).notNull().defaultNow(),
});

export const linkTokens = pgTable("link_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
});
