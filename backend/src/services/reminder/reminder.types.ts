export type ReminderPayload = {
  customerId: number | string;
  customerName: string;
  mobileNumber: string;
  amount: number;
};

export type ReminderChannel = (payload: ReminderPayload) => Promise<void>;
