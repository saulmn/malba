CREATE TABLE "cash_withdrawals" (
	"id" serial PRIMARY KEY NOT NULL,
	"workspace_id" integer NOT NULL,
	"register_session_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"reason" text NOT NULL,
	"description" text,
	"balance_before" numeric(12, 2) NOT NULL,
	"balance_after" numeric(12, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "user_id" integer;--> statement-breakpoint
ALTER TABLE "cash_withdrawals" ADD CONSTRAINT "cash_withdrawals_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_withdrawals" ADD CONSTRAINT "cash_withdrawals_register_session_id_register_sessions_id_fk" FOREIGN KEY ("register_session_id") REFERENCES "public"."register_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_withdrawals" ADD CONSTRAINT "cash_withdrawals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;