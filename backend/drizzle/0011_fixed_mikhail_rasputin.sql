CREATE TYPE "public"."entity_category" AS ENUM('customer', 'supplier', 'staff', 'student', 'member', 'teacher', 'trainer');--> statement-breakpoint
CREATE TYPE "public"."staff_role" AS ENUM('teacher', 'staff', 'trainer');--> statement-breakpoint
CREATE TYPE "public"."transaction_category" AS ENUM('item', 'fees', 'supply', 'salary', 'payment', 'membership', 'other');--> statement-breakpoint
CREATE TABLE "business_inventory" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"product_name" text NOT NULL,
	"quantity" numeric(12, 2) DEFAULT '0' NOT NULL,
	"unit" text DEFAULT 'pcs' NOT NULL,
	"purchase_price" numeric(12, 2) DEFAULT '0' NOT NULL,
	"selling_price" numeric(12, 2) DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "businesses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" integer NOT NULL,
	"name" text NOT NULL,
	"type" "category_type" NOT NULL,
	"address" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "entities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"name" text NOT NULL,
	"mobile" text NOT NULL,
	"address" text,
	"category" "entity_category" NOT NULL,
	"total_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"reminder_enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "entity_member_details" (
	"entity_id" uuid PRIMARY KEY NOT NULL,
	"membership_type" text NOT NULL,
	"joining_date" date NOT NULL
);
--> statement-breakpoint
CREATE TABLE "entity_staff_details" (
	"entity_id" uuid PRIMARY KEY NOT NULL,
	"role" "staff_role" NOT NULL,
	"salary" numeric(12, 2) DEFAULT '0' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "entity_student_details" (
	"entity_id" uuid PRIMARY KEY NOT NULL,
	"class" text NOT NULL,
	"roll_number" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "entity_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_id" uuid NOT NULL,
	"category" "transaction_category" NOT NULL,
	"title" text NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"quantity" numeric(12, 2),
	"unit" text,
	"metadata" jsonb,
	"type" "transaction_type" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "supplier_inventory_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"supplier_id" uuid NOT NULL,
	"inventory_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP TABLE "categories" CASCADE;--> statement-breakpoint
DROP TABLE "items" CASCADE;--> statement-breakpoint
DROP TABLE "parties" CASCADE;--> statement-breakpoint
DROP TABLE "student_details" CASCADE;--> statement-breakpoint
DROP TABLE "transactions" CASCADE;--> statement-breakpoint
ALTER TABLE "business_inventory" ADD CONSTRAINT "business_inventory_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entities" ADD CONSTRAINT "entities_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entity_member_details" ADD CONSTRAINT "entity_member_details_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entity_staff_details" ADD CONSTRAINT "entity_staff_details_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entity_student_details" ADD CONSTRAINT "entity_student_details_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entity_transactions" ADD CONSTRAINT "entity_transactions_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_inventory_links" ADD CONSTRAINT "supplier_inventory_links_supplier_id_entities_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."entities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_inventory_links" ADD CONSTRAINT "supplier_inventory_links_inventory_id_business_inventory_id_fk" FOREIGN KEY ("inventory_id") REFERENCES "public"."business_inventory"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "business_inventory_business_id_idx" ON "business_inventory" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "businesses_user_id_idx" ON "businesses" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "businesses_active_by_user_idx" ON "businesses" USING btree ("user_id","deleted_at");--> statement-breakpoint
CREATE INDEX "entities_business_id_idx" ON "entities" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "entities_category_idx" ON "entities" USING btree ("category");--> statement-breakpoint
CREATE INDEX "entity_transactions_entity_id_idx" ON "entity_transactions" USING btree ("entity_id");--> statement-breakpoint
CREATE INDEX "entity_transactions_created_at_idx" ON "entity_transactions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "entity_transactions_category_idx" ON "entity_transactions" USING btree ("category");--> statement-breakpoint
CREATE INDEX "supplier_inventory_unique_idx" ON "supplier_inventory_links" USING btree ("supplier_id","inventory_id");--> statement-breakpoint
DROP TYPE "public"."party_type";