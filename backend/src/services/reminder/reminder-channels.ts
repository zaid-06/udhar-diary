import { type ReminderChannel, type ReminderPayload } from "./reminder.types.js";

const formatInr = (amount: number): string =>
  amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const buildMessage = (payload: ReminderPayload): string => {
  const amountLabel = formatInr(payload.amount);
  return `Dear ${payload.customerName}, please pay ₹${amountLabel}`;
};

/**
 * Default channel: logs reminders. Replace or add {@link createSmsReminderChannel} when ready.
 */
export const createConsoleReminderChannel = (): ReminderChannel => {
  return async (payload) => {
    console.log(buildMessage(payload));
  };
};

export type SmsReminderConfig = {
  fromId: string;
  apiKey: string;
};

/**
 * Placeholder for Twilio, MSG91, or other SMS providers.
 * Implement and return from your factory when credentials are available.
 */
export const createSmsReminderChannel = (_config: SmsReminderConfig): ReminderChannel => {
  return async (payload) => {
    const message = buildMessage(payload);
    void message;
    void _config;
    throw new Error("SMS reminder channel is not implemented yet");
  };
};
