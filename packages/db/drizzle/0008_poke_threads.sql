ALTER TABLE "threads" ADD COLUMN "kind" text DEFAULT 'office' NOT NULL;--> statement-breakpoint
ALTER TABLE "threads" ADD COLUMN "a_bot_id" text;--> statement-breakpoint
ALTER TABLE "threads" ADD COLUMN "b_bot_id" text;--> statement-breakpoint
ALTER TABLE "threads" ALTER COLUMN "bot_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "threads" DROP CONSTRAINT "threads_bot_id_unique";--> statement-breakpoint
ALTER TABLE "threads" ADD CONSTRAINT "threads_a_bot_id_bots_id_fk" FOREIGN KEY ("a_bot_id") REFERENCES "public"."bots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threads" ADD CONSTRAINT "threads_b_bot_id_bots_id_fk" FOREIGN KEY ("b_bot_id") REFERENCES "public"."bots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "threads_office_bot" ON "threads" USING btree ("bot_id") WHERE "kind" = 'office';--> statement-breakpoint
CREATE UNIQUE INDEX "threads_poke_pair" ON "threads" USING btree ("a_bot_id","b_bot_id") WHERE "kind" = 'poke';
