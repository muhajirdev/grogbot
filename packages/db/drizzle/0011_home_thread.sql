DROP INDEX IF EXISTS "threads_office_bot";--> statement-breakpoint
ALTER TABLE "bots" ADD COLUMN "home_thread_id" text;--> statement-breakpoint
UPDATE "bots" SET "home_thread_id" = (
  SELECT "id" FROM "threads"
  WHERE "threads"."bot_id" = "bots"."id" AND "threads"."kind" = 'office'
  ORDER BY "threads"."created_at" ASC
  LIMIT 1
);--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bots" ADD CONSTRAINT "bots_home_thread_id_threads_id_fk" FOREIGN KEY ("home_thread_id") REFERENCES "public"."threads"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "bots_home_thread_id_unique" ON "bots" USING btree ("home_thread_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "threads_bot_id" ON "threads" USING btree ("bot_id");
