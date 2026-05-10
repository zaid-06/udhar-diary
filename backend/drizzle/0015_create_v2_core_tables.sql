DO $$ BEGIN
  CREATE TYPE "entity_category" AS ENUM (
    'customer',
    'supplier',
    'staff',
    'student',
    'member',
    'teacher',
    'trainer'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "staff_role" AS ENUM ('teacher', 'staff', 'trainer');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "transaction_type" AS ENUM ('credit', 'debit');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "category_type" AS ENUM ('shop', 'institute', 'gym');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "transaction_category" AS ENUM (
    'item',
    'fees',
    'supply',
    'salary',
    'payment',
    'membership',
    'other'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "businesses" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "name" text NOT NULL,
  "type" "category_type" NOT NULL,
  "address" text NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "deleted_at" timestamp with time zone
);

CREATE INDEX IF NOT EXISTS "businesses_user_id_idx" ON "businesses" ("user_id");
CREATE INDEX IF NOT EXISTS "businesses_active_by_user_idx" ON "businesses" ("user_id", "deleted_at");

CREATE TABLE IF NOT EXISTS "entities" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "business_id" uuid NOT NULL REFERENCES "businesses"("id") ON DELETE cascade,
  "name" text NOT NULL,
  "mobile" text NOT NULL,
  "category" "entity_category" NOT NULL,
  "total_amount" numeric(12, 2) NOT NULL DEFAULT '0',
  "reminder_enabled" boolean NOT NULL DEFAULT true,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "entities_business_id_idx" ON "entities" ("business_id");
CREATE INDEX IF NOT EXISTS "entities_category_idx" ON "entities" ("category");

CREATE TABLE IF NOT EXISTS "entity_transactions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "entity_id" uuid NOT NULL REFERENCES "entities"("id") ON DELETE cascade,
  "type" "transaction_type" NOT NULL,
  "category" "transaction_category" NOT NULL DEFAULT 'other',
  "title" text NOT NULL,
  "amount" numeric(12, 2) NOT NULL,
  "quantity" numeric(12, 2),
  "unit" text,
  "metadata" jsonb,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "entity_transactions_entity_id_idx" ON "entity_transactions" ("entity_id");
CREATE INDEX IF NOT EXISTS "entity_transactions_created_at_idx" ON "entity_transactions" ("created_at");
CREATE INDEX IF NOT EXISTS "entity_transactions_category_idx" ON "entity_transactions" ("category");

CREATE TABLE IF NOT EXISTS "business_inventory" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "business_id" uuid NOT NULL REFERENCES "businesses"("id") ON DELETE cascade,
  "product_name" text NOT NULL,
  "quantity" numeric(12, 2) NOT NULL DEFAULT '0',
  "unit" text NOT NULL DEFAULT 'pcs',
  "purchase_price" numeric(12, 2) NOT NULL DEFAULT '0',
  "selling_price" numeric(12, 2) NOT NULL DEFAULT '0',
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "business_inventory_business_id_idx" ON "business_inventory" ("business_id");

CREATE TABLE IF NOT EXISTS "supplier_inventory_links" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "supplier_id" uuid NOT NULL REFERENCES "entities"("id") ON DELETE cascade,
  "inventory_id" uuid NOT NULL REFERENCES "business_inventory"("id") ON DELETE cascade,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "supplier_inventory_unique_idx" ON "supplier_inventory_links" ("supplier_id", "inventory_id");

CREATE TABLE IF NOT EXISTS "entity_student_details" (
  "entity_id" uuid PRIMARY KEY REFERENCES "entities"("id") ON DELETE cascade,
  "class" text NOT NULL,
  "roll_number" text NOT NULL
);

CREATE TABLE IF NOT EXISTS "entity_staff_details" (
  "entity_id" uuid PRIMARY KEY REFERENCES "entities"("id") ON DELETE cascade,
  "role" "staff_role" NOT NULL,
  "salary" numeric(12, 2) NOT NULL DEFAULT '0'
);

CREATE TABLE IF NOT EXISTS "entity_member_details" (
  "entity_id" uuid PRIMARY KEY REFERENCES "entities"("id") ON DELETE cascade,
  "membership_type" text NOT NULL,
  "joining_date" date NOT NULL
);
