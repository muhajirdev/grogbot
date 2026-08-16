ALTER TABLE "bots" ADD COLUMN "model" text DEFAULT '' NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "user_model_credentials_user_workspace_provider" ON "user_model_credentials" ("user_id","workspace_id","provider");--> statement-breakpoint
CREATE UNIQUE INDEX "secrets_user_workspace_kind" ON "secrets" ("user_id","workspace_id","kind");
