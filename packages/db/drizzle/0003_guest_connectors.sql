CREATE TABLE "guest_connectors" (
	"id" text PRIMARY KEY NOT NULL,
	"bot_id" text NOT NULL,
	"workspace_id" text NOT NULL,
	"user_id" text NOT NULL,
	"kind" text NOT NULL,
	"token_hash" text NOT NULL,
	"online" boolean DEFAULT false NOT NULL,
	"last_seen_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "guest_connectors_bot_id_unique" UNIQUE("bot_id")
);
--> statement-breakpoint
ALTER TABLE "bots" ADD COLUMN "guest_kind" text DEFAULT 'off' NOT NULL;--> statement-breakpoint
ALTER TABLE "guest_connectors" ADD CONSTRAINT "guest_connectors_bot_id_bots_id_fk" FOREIGN KEY ("bot_id") REFERENCES "public"."bots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guest_connectors" ADD CONSTRAINT "guest_connectors_workspace_id_organization_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guest_connectors" ADD CONSTRAINT "guest_connectors_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;