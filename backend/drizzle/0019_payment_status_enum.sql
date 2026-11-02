DO $$ BEGIN
  CREATE TYPE public.payment_status AS ENUM ('unpaid', 'paid', 'partial');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint

ALTER TABLE "entity_transactions"
ADD COLUMN IF NOT EXISTS "payment_status" public.payment_status NOT NULL DEFAULT 'unpaid';--> statement-breakpoint

ALTER TABLE "entity_transactions"
ALTER COLUMN "payment_status" DROP DEFAULT;--> statement-breakpoint

ALTER TABLE "entity_transactions"
ALTER COLUMN "payment_status" TYPE public.payment_status
USING CASE
  WHEN "payment_status"::text IN ('unpaid', 'paid', 'partial')
    THEN "payment_status"::text::public.payment_status
  ELSE 'unpaid'::public.payment_status
END;--> statement-breakpoint

ALTER TABLE "entity_transactions"
ALTER COLUMN "payment_status" SET DEFAULT 'unpaid';
