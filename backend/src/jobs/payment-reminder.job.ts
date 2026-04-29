import { and, eq, gt, sql } from "drizzle-orm";
import { db } from "../db/client.js";
import { parties } from "../db/schema.js";
import { type ReminderChannel } from "../services/reminder/index.js";

const fetchAllPartiesWithTotals = async () => {
  return db
    .select({
      id: parties.id,
      name: parties.name,
      mobileNumber: parties.mobile,
      totalAmount: sql<number>`${parties.totalAmount}::float8`,
    })
    .from(parties)
    .where(and(eq(parties.reminderEnabled, true), gt(parties.totalAmount, "0")));
};

/**
 * Daily job: all parties with reminders enabled and pending total > 0.
 */
export const runPaymentReminderJob = async (sendReminder: ReminderChannel): Promise<void> => {
  const rows = await fetchAllPartiesWithTotals();

  for (const row of rows) {
    await sendReminder({
      customerId: row.id,
      customerName: row.name,
      mobileNumber: row.mobileNumber,
      amount: row.totalAmount,
    });
  }
};
