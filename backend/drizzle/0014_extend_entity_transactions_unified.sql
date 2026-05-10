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

ALTER TABLE "entity_transactions"
ADD COLUMN IF NOT EXISTS "category" "transaction_category";

ALTER TABLE "entity_transactions"
ADD COLUMN IF NOT EXISTS "quantity" numeric(12, 2);

ALTER TABLE "entity_transactions"
ADD COLUMN IF NOT EXISTS "unit" text;

ALTER TABLE "entity_transactions"
ADD COLUMN IF NOT EXISTS "metadata" jsonb;

UPDATE "entity_transactions"
SET "category" = 'other'
WHERE "category" IS NULL;

ALTER TABLE "entity_transactions"
ALTER COLUMN "category" SET NOT NULL;

CREATE INDEX IF NOT EXISTS "entity_transactions_category_idx"
ON "entity_transactions" ("category");
