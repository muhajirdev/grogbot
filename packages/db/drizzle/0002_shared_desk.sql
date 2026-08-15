ALTER TABLE "computers" ADD COLUMN "name" text DEFAULT 'Desk' NOT NULL;--> statement-breakpoint
ALTER TABLE "computers" ADD COLUMN "is_default" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "bots" ADD COLUMN "computer_id" text;--> statement-breakpoint
UPDATE "bots" SET "computer_id" = "computers"."id" FROM "computers" WHERE "computers"."bot_id" = "bots"."id";--> statement-breakpoint
UPDATE "computers" SET "is_default" = true
WHERE "id" IN (
  SELECT DISTINCT ON ("workspace_id") "id" FROM "computers" ORDER BY "workspace_id", "created_at" ASC
);--> statement-breakpoint
UPDATE "computers" SET "name" = 'Desk' WHERE "is_default" = true;--> statement-breakpoint
UPDATE "computers" SET "name" = 'Computer' WHERE "is_default" = false;--> statement-breakpoint
ALTER TABLE "bots" ALTER COLUMN "computer_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "bots" ADD CONSTRAINT "bots_computer_id_computers_id_fk" FOREIGN KEY ("computer_id") REFERENCES "public"."computers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "computers" DROP CONSTRAINT "computers_bot_id_bots_id_fk";--> statement-breakpoint
ALTER TABLE "computers" DROP CONSTRAINT "computers_bot_id_unique";--> statement-breakpoint
ALTER TABLE "computers" DROP COLUMN "bot_id";
