import { api } from "./api";

export type CreateTransactionInput = {
  partyId: number;
  type: "credit" | "debit";
  title: string;
  amount: number;
};

export type Transaction = {
  id: number;
  partyId: number;
  type: "credit" | "debit";
  title: string;
  amount: number;
  createdAt: string;
};

export async function createTransaction(input: CreateTransactionInput) {
  const { data } = await api.post("/v1/transactions", input);
  return data;
}

export async function fetchTransactionsByParty(partyId: number): Promise<Transaction[]> {
  const { data } = await api.get<Transaction[]>(`/v1/transactions/${partyId}`);
  return data;
}

export async function createPaymentTransaction(partyId: number, amount: number) {
  const { data } = await api.post("/v1/transactions/payment", { partyId, amount });
  return data;
}

