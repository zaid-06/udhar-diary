DO $$ BEGIN
 CREATE TYPE "public"."supplier_transaction_type" AS ENUM('given', 'taken');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "inventory" (
  "id" serial PRIMARY KEY NOT NULL,
  "category_id" integer NOT NULL,
  "product_name" text NOT NULL,
  "quantity" numeric(12, 2) DEFAULT '0' NOT NULL,
  "unit" text DEFAULT 'pcs' NOT NULL,
  "purchase_price" numeric(12, 2) DEFAULT '0' NOT NULL,
  "selling_price" numeric(12, 2) DEFAULT '0' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "suppliers" (
  "id" serial PRIMARY KEY NOT NULL,
  "category_id" integer NOT NULL,
  "name" text NOT NULL,
  "mobile" text NOT NULL,
  "address" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "supplier_transactions" (
  "id" serial PRIMARY KEY NOT NULL,
  "supplier_id" integer NOT NULL,
  "amount" numeric(12, 2) NOT NULL,
  "type" "supplier_transaction_type" NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "staff" (
  "id" serial PRIMARY KEY NOT NULL,
  "category_id" integer NOT NULL,
  "name" text NOT NULL,
  "mobile" text NOT NULL,
  "role" text NOT NULL,
  "salary" numeric(12, 2) DEFAULT '0' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "staff_salary_logs" (
  "id" serial PRIMARY KEY NOT NULL,
  "staff_id" integer NOT NULL,
  "amount" numeric(12, 2) NOT NULL,
  "date" timestamp with time zone DEFAULT now() NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

DO $$ BEGIN
 ALTER TABLE "inventory" ADD CONSTRAINT "inventory_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "supplier_transactions" ADD CONSTRAINT "supplier_transactions_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "staff" ADD CONSTRAINT "staff_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "staff_salary_logs" ADD CONSTRAINT "staff_salary_logs_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
