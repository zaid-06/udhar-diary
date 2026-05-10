import { and, eq, gt, sql } from "drizzle-orm";
import { db } from "../db/client.js";
import { entities } from "../db/schema.js";
import { type ReminderChannel } from "../services/reminder/index.js";

const fetchAllEntitiesWithTotals = async () => {
  return db
    .select({
      id: entities.id,
      name: entities.name,
      mobileNumber: entities.mobile,
      totalAmount: sql<number>`${entities.totalAmount}::float8`,
    })
    .from(entities)
    .where(and(eq(entities.reminderEnabled, true), gt(entities.totalAmount, "0")));
};

/**
 * Daily job: all entities with reminders enabled and pending total > 0.
 */
export const runPaymentReminderJob = async (sendReminder: ReminderChannel): Promise<void> => {
  const rows = await fetchAllEntitiesWithTotals();

  for (const row of rows) {
    await sendReminder({
      customerId: row.id,
      customerName: row.name,
      mobileNumber: row.mobileNumber,
      amount: row.totalAmount,
    });
  }
};
