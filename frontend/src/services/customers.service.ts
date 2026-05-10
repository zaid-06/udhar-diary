import { fetchPartiesByCategory, togglePartyReminder, type Party } from "./parties.service";
import { createPaymentTransaction } from "./transactions.service";

export type Customer = {
  id: string;
  name: string;
  mobileNumber: string;
  reminderEnabled: boolean;
  createdAt: string;
  totalAmount: number;
};

const mapPartyToCustomer = (party: Party): Customer => ({
  id: party.id,
  name: party.name,
  mobileNumber: party.mobile,
  reminderEnabled: party.reminderEnabled,
  createdAt: party.createdAt,
  totalAmount: party.totalAmount,
});

export async function fetchCustomers(categoryId: string): Promise<Customer[]> {
  const parties = await fetchPartiesByCategory(categoryId);
  return parties.map(mapPartyToCustomer);
}

export async function settleCustomerPayment(customerId: string, totalAmount: number): Promise<void> {
  await createPaymentTransaction(customerId, totalAmount);
}

export type PayCustomerResponse = {
  message: string;
  customer: {
    id: string;
    totalAmount: number;
  };
};

export async function payCustomerAmount(
  customerId: string,
  amount: number,
): Promise<PayCustomerResponse> {
  await createPaymentTransaction(customerId, amount);
  return {
    message: "Payment recorded",
    customer: {
      id: customerId,
      totalAmount: 0,
    },
  };
}

export type ToggleReminderResponse = {
  id: string;
  reminderEnabled: boolean;
};

export async function toggleCustomerReminder(customerId: string): Promise<ToggleReminderResponse> {
  return togglePartyReminder(customerId);
}

