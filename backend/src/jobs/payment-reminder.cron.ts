import cron from "node-cron";
import { env } from "../utils/env.js";
import { createConsoleReminderChannel } from "../services/reminder/index.js";
import { runPaymentReminderJob } from "./payment-reminder.job.js";

/**
 * Schedules the daily payment reminder. Swap {@link createConsoleReminderChannel} for SMS when ready.
 */
export const startPaymentReminderCron = (): void => {
  if (!env.PAYMENT_REMINDER_ENABLED) {
    return;
  }

  const channel = createConsoleReminderChannel();

  cron.schedule(
    env.PAYMENT_REMINDER_CRON,
    () => {
      void runPaymentReminderJob(channel).catch((error) => {
        console.error("[payment-reminder] job failed", error);
      });
    },
    { timezone: env.PAYMENT_REMINDER_TIMEZONE },
  );

  console.log(
    `[payment-reminder] scheduled (${env.PAYMENT_REMINDER_CRON}, tz=${env.PAYMENT_REMINDER_TIMEZONE})`,
  );
};
