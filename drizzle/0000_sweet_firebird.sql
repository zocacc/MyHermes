CREATE TYPE "public"."capture_status" AS ENUM('queued', 'processing', 'completed', 'needs_review', 'failed');--> statement-breakpoint
CREATE TYPE "public"."item_status" AS ENUM('active');--> statement-breakpoint
CREATE TYPE "public"."item_type" AS ENUM('note', 'task', 'reminder');--> statement-breakpoint
CREATE TABLE "captures" (
	"id" text PRIMARY KEY NOT NULL,
	"external_update_id" text NOT NULL,
	"user_id" text NOT NULL,
	"chat_id" text NOT NULL,
	"kind" text NOT NULL,
	"raw_text" text NOT NULL,
	"locale" text NOT NULL,
	"time_zone" text NOT NULL,
	"status" "capture_status" NOT NULL,
	"received_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "items" (
	"id" text PRIMARY KEY NOT NULL,
	"capture_id" text NOT NULL,
	"type" "item_type" NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"due_at" timestamp with time zone,
	"status" "item_status" NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_capture_id_captures_id_fk" FOREIGN KEY ("capture_id") REFERENCES "public"."captures"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "captures_external_update_id_unique" ON "captures" USING btree ("external_update_id");--> statement-breakpoint
CREATE INDEX "captures_status_idx" ON "captures" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "items_capture_id_unique" ON "items" USING btree ("capture_id");