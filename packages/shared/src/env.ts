import { z } from "zod";

const serverEnvSchema = z.object({
  SUPABASE_URL: z.string().url().default("https://riyzydfvosbumpfqolcs.supabase.co"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).default("development_service_role_key_placeholder"),
  DATABASE_URL: z.string().min(1).default("postgresql://postgres:postgres@127.0.0.1:54322/postgres"),
  GEMINI_API_KEY: z.string().min(1).default("development_gemini_api_key_placeholder"),
  TELEGRAM_BOT_TOKEN: z.string().min(1).default("development_telegram_bot_token_placeholder"),
  TELEGRAM_WEBHOOK_SECRET: z.string().min(1).default("development_telegram_webhook_secret_placeholder"),
  TELEGRAM_BOT_USERNAME: z.string().min(1).default("MurmurDevBot"),
  JWT_LINK_SECRET: z.string().min(16).default("development_jwt_link_secret_32bytes_long"),
  API_URL: z.string().url().default("https://murmur-86lm.onrender.com"),
  WEB_URL: z.string().url().default("https://murmur-web-9eot.onrender.com"),
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

const clientEnvSchema = z.object({
  VITE_SUPABASE_URL: z.string().url().default("https://riyzydfvosbumpfqolcs.supabase.co"),
  VITE_SUPABASE_ANON_KEY: z.string().min(1).default("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpeXp5ZGZ2b3NidW1wZnFvbGNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAyNDM5MjUsImV4cCI6MjEwNTgxOTkyNX0.FtSmjc8n3CdauAfoztKXUL7ghJi1sw34f08cfE6PTpc"),
  VITE_API_URL: z.string().url().default("https://murmur-86lm.onrender.com"),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;
export type ClientEnv = z.infer<typeof clientEnvSchema>;

export function parseServerEnv(env: Record<string, string | undefined>): ServerEnv {
  return serverEnvSchema.parse(env);
}

export function parseClientEnv(env: Record<string, string | undefined>): ClientEnv {
  return clientEnvSchema.parse(env);
}
