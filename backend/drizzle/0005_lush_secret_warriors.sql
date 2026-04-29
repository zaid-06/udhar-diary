ALTER TABLE "customers" ADD COLUMN "total_amount" numeric(12, 2) DEFAULT '0' NOT NULL;

UPDATE "customers" AS c
SET "total_amount" = COALESCE((
  SELECT SUM(i."amount")
  FROM "items" AS i
  WHERE i."customer_id" = c."id"
), 0);