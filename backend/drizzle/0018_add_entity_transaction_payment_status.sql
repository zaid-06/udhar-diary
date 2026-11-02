ALTER TABLE "entity_transactions"
ADD COLUMN IF NOT EXISTS "payment_status" text NOT NULL DEFAULT 'unpaid';--> statement-breakpoint

UPDATE "entity_transactions"
SET "payment_status" = 'paid'
WHERE "type" = 'debit' OR "category" = 'payment';
