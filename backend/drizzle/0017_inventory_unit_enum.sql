DO $$ BEGIN
  CREATE TYPE "inventory_unit" AS ENUM (
    'pcs',
    'kg',
    'gram',
    'liter',
    'ml',
    'meter',
    'cm',
    'boxes',
    'set',
    'dozen',
    'packet',
    'bag',
    'roll'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint

ALTER TABLE "business_inventory"
  ALTER COLUMN "unit" DROP DEFAULT;--> statement-breakpoint

ALTER TABLE "business_inventory"
  ALTER COLUMN "unit" TYPE "inventory_unit"
  USING CASE
    WHEN lower(trim("unit")) IN (
      'pcs',
      'kg',
      'gram',
      'liter',
      'ml',
      'meter',
      'cm',
      'boxes',
      'set',
      'dozen',
      'packet',
      'bag',
      'roll'
    )
    THEN lower(trim("unit"))::"inventory_unit"
    ELSE 'pcs'::"inventory_unit"
  END;--> statement-breakpoint

ALTER TABLE "business_inventory"
  ALTER COLUMN "unit" SET DEFAULT 'pcs';--> statement-breakpoint
