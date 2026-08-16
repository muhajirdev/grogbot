DELETE FROM "user_model_credentials" a USING "user_model_credentials" b
WHERE a."workspace_id" = b."workspace_id"
  AND a."provider" = b."provider"
  AND a."id" < b."id";--> statement-breakpoint
DELETE FROM "secrets" a USING "secrets" b
WHERE a."workspace_id" = b."workspace_id"
  AND a."kind" = b."kind"
  AND a."id" < b."id";--> statement-breakpoint
DROP INDEX IF EXISTS "user_model_credentials_user_workspace_provider";--> statement-breakpoint
DROP INDEX IF EXISTS "secrets_user_workspace_kind";--> statement-breakpoint
CREATE UNIQUE INDEX "user_model_credentials_workspace_provider" ON "user_model_credentials" ("workspace_id","provider");--> statement-breakpoint
CREATE UNIQUE INDEX "secrets_workspace_kind" ON "secrets" ("workspace_id","kind");--> statement-breakpoint
CREATE TABLE "workspace_models" (
	"workspace_id" text PRIMARY KEY NOT NULL,
	"default_model" text NOT NULL,
	"updated_by" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "workspace_models" ADD CONSTRAINT "workspace_models_workspace_id_organization_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_models" ADD CONSTRAINT "workspace_models_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
