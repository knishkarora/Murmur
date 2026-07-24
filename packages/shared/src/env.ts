import { z } from "zod";

const serverEnvSchema = z.object({
  SUPABASE_URL: z.string().url().default("http://127.0.0.1:54321"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).default("development_service_role_key_placeholder"),
  DATABASE_URL: z.string().min(1).default("postgresql://postgres:postgres@127.0.0.1:54322/postgres"),
  GEMINI_API_KEY: z.string().min(1).default("development_gemini_api_key_placeholder"),
  TELEGRAM_BOT_TOKEN: z.string().min(1).default("development_telegram_bot_token_placeholder"),
  TELEGRAM_WEBHOOK_SECRET: z.string().min(1).default("development_telegram_webhook_secret_placeholder"),
  JWT_LINK_SECRET: z.string().min(16).default("development_jwt_link_secret_32bytes_long"),
  API_URL: z.string().url().default("http://localhost:3001"),
  WEB_URL: z.string().url().default("http://localhost:5173"),
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

const clientEnvSchema = z.object({
  VITE_SUPABASE_URL: z.string().url().default("http://127.0.0.1:54321"),
  VITE_SUPABASE_ANON_KEY: z.string().min(1).default("development_anon_key_placeholder"),
  VITE_API_URL: z.string().url().default("http://localhost:3001"),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;
export type ClientEnv = z.infer<typeof clientEnvSchema>;

export function parseServerEnv(env: Record<string, string | undefined>): ServerEnv {
  return serverEnvSchema.parse(env);
}

export function parseClientEnv(env: Record<string, string | undefined>): ClientEnv {
  return clientEnvSchema.parse(env);
}
