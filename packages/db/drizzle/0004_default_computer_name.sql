ALTER TABLE "computers" ALTER COLUMN "name" SET DEFAULT 'Default computer';--> statement-breakpoint
UPDATE "computers" SET "name" = 'Default computer' WHERE "is_default" = true AND "name" = 'Desk';
