CREATE TYPE "public"."post_kind" AS ENUM('article', 'case_study');--> statement-breakpoint
CREATE TYPE "public"."post_status" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
ALTER TYPE "public"."role" ADD VALUE 'editor' BEFORE 'admin';--> statement-breakpoint
CREATE TABLE "posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" "post_kind" DEFAULT 'article' NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"subtitle" text,
	"excerpt" text,
	"cover_image_url" text,
	"cover_alt" text,
	"body_json" jsonb,
	"body_html" text,
	"body_text" text,
	"reading_minutes" integer DEFAULT 1 NOT NULL,
	"tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"status" "post_status" DEFAULT 'draft' NOT NULL,
	"published_at" timestamp with time zone,
	"featured" boolean DEFAULT false NOT NULL,
	"author_id" uuid,
	"seo_title" text,
	"seo_description" text,
	"canonical_url" text,
	"noindex" boolean DEFAULT false NOT NULL,
	"client_org" text,
	"period" text,
	"outcomes" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "posts_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "posts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_author_id_profiles_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "posts_kind_status_published_at_idx" ON "posts" USING btree ("kind","status","published_at");--> statement-breakpoint
CREATE INDEX "posts_tags_idx" ON "posts" USING gin ("tags");--> statement-breakpoint
CREATE UNIQUE INDEX "posts_slug_idx" ON "posts" USING btree ("slug");