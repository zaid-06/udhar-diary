export type ReminderPayload = {
  customerId: number;
  customerName: string;
  mobileNumber: string;
  amount: number;
};

export type ReminderChannel = (payload: ReminderPayload) => Promise<void>;
