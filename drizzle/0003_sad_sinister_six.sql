ALTER TABLE "register_sessions" ADD COLUMN "expected_balance" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "register_sessions" ADD COLUMN "difference" numeric(12, 2);