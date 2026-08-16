CREATE TABLE "site_stats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"label" text NOT NULL,
	"value" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	CONSTRAINT "site_stats_key_unique" UNIQUE("key")
);
--> statement-breakpoint
ALTER TABLE "site_stats" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "site_stats" ADD CONSTRAINT "site_stats_updated_by_profiles_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;