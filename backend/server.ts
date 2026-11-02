import { pool } from "./src/db/client.js";
import { env } from "./src/utils/env.js";
import { app } from "./src/app.js";
import { startPaymentReminderCron } from "./src/jobs/payment-reminder.cron.js";

const startServer = async () => {
  try {
    await pool.query("SELECT 1");
    const existingPaymentStatusColumn = await pool.query(`
      SELECT udt_name
      FROM information_schema.columns
      WHERE table_schema = current_schema()
        AND table_name = 'entity_transactions'
        AND column_name = 'payment_status'
      LIMIT 1
    `);
    await pool.query(`
      DO $$ BEGIN
        CREATE TYPE public.payment_status AS ENUM ('unpaid', 'paid', 'partial');
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$
    `);
    await pool.query(`
      ALTER TABLE "entity_transactions"
      ADD COLUMN IF NOT EXISTS "payment_status" public.payment_status NOT NULL DEFAULT 'unpaid'
    `);
    if (existingPaymentStatusColumn.rowCount === 0) {
      await pool.query(`
        UPDATE "entity_transactions"
        SET "payment_status" = 'paid'
        WHERE "type" = 'debit' OR "category" = 'payment'
      `);
    } else if (existingPaymentStatusColumn.rows[0].udt_name !== "payment_status") {
      await pool.query(`
        ALTER TABLE "entity_transactions"
        ALTER COLUMN "payment_status" DROP DEFAULT
      `);
      await pool.query(`
        ALTER TABLE "entity_transactions"
        ALTER COLUMN "payment_status" TYPE public.payment_status
        USING CASE
          WHEN "payment_status"::text IN ('unpaid', 'paid', 'partial')
            THEN "payment_status"::text::public.payment_status
          ELSE 'unpaid'::public.payment_status
        END
      `);
      await pool.query(`
        ALTER TABLE "entity_transactions"
        ALTER COLUMN "payment_status" SET DEFAULT 'unpaid'
      `);
    }
    console.log("Database: connected; transaction payment status is ready.");

    app.listen(env.PORT, () => {
      console.log(`Server running on port ${env.PORT}`);
    });
    startPaymentReminderCron();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[database] Startup failed:", message);
    process.exitCode = 1;
  }
};

void startServer();
