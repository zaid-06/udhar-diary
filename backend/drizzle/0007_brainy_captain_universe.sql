CREATE TYPE "public"."category_type" AS ENUM('shop', 'institute', 'gym');--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "type" "category_type";--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "address" text;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
UPDATE "categories"
SET "type" = CASE
  WHEN "name" IN ('shop', 'institute', 'gym') THEN "name"::"category_type"
  ELSE 'shop'::"category_type"
END
WHERE "type" IS NULL;--> statement-breakpoint
UPDATE "categories"
SET "address" = ''
WHERE "address" IS NULL;--> statement-breakpoint
ALTER TABLE "categories" ALTER COLUMN "type" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "categories" ALTER COLUMN "address" SET NOT NULL;--> statement-breakpoint
CREATE INDEX "categories_user_id_idx" ON "categories" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "categories_active_by_user_idx" ON "categories" USING btree ("user_id","deleted_at");