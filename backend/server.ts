import { pool } from "./src/db/client.js";
import { env } from "./src/utils/env.js";
import { app } from "./src/app.js";
import { startPaymentReminderCron } from "./src/jobs/payment-reminder.cron.js";

app.listen(env.PORT, () => {
  console.log(`Server running on port ${env.PORT}`);

  void pool
    .query("SELECT 1")
    .then(() => {
      console.log("Database: connected.");
    })
    .catch((e: NodeJS.ErrnoException & { message: string }) => {
      if (e.code === "ECONNREFUSED") {
        console.error(
          "\n[database] Connection refused — PostgreSQL is not accepting connections.\n" +
            "  1) From the repo root, start Postgres:  docker compose up -d\n" +
            "  2) Apply schema:                    cd backend && npm run db:migrate\n" +
            "  3) Check DATABASE_URL in backend/.env matches your Postgres( default: postgres:postgres@db:5432/udhar_diary)\n",
        );
      } else {
        console.error("[database] Connection failed:", e.message);
      }
    });

  startPaymentReminderCron();
});
