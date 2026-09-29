ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "branch" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "target_role" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "focus_area" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "timeline" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "primary_goal" text;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD COLUMN IF NOT EXISTS "evening_notification_enabled" boolean DEFAULT false NOT NULL;