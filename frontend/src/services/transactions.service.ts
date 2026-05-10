import { api } from "./api";

type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
};

export type CreateTransactionInput = {
  partyId: string;
  type: "credit" | "debit";
  category?: "item" | "fees" | "supply" | "salary" | "payment" | "membership" | "other";
  title: string;
  amount: number;
  quantity?: number;
  unit?: string;
  metadata?: Record<string, unknown>;
};

export type Transaction = {
  id: string;
  partyId: string;
  type: "credit" | "debit";
  category: "item" | "fees" | "supply" | "salary" | "payment" | "membership" | "other";
  title: string;
  amount: number;
  quantity?: number | null;
  unit?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
};

export async function createTransaction(input: CreateTransactionInput) {
  const { data } = await api.post<ApiEnvelope<Transaction>>("/v1/transactions", {
    entityId: input.partyId,
    type: input.type,
    category: input.category ?? "other",
    title: input.title,
    amount: input.amount,
    quantity: input.quantity,
    unit: input.unit,
    metadata: input.metadata,
  });
  return data.data;
}

export async function fetchTransactionsByParty(partyId: string): Promise<Transaction[]> {
  const { data } = await api.get<ApiEnvelope<Array<{
    id: string;
    entityId: string;
    type: "credit" | "debit";
    category: Transaction["category"];
    title: string;
    amount: number;
    quantity?: number | null;
    unit?: string | null;
    metadata?: Record<string, unknown> | null;
    createdAt: string;
  }>>>("/v1/transactions", { params: { entityId: partyId } });

  return data.data.map((row) => ({
    id: row.id,
    partyId: row.entityId,
    type: row.type,
    category: row.category,
    title: row.title,
    amount: row.amount,
    quantity: row.quantity,
    unit: row.unit,
    metadata: row.metadata,
    createdAt: row.createdAt,
  }));
}

export async function createPaymentTransaction(partyId: string, amount: number) {
  const { data } = await api.post<ApiEnvelope<Transaction>>("/v1/transactions", {
    entityId: partyId,
    type: "debit",
    category: "payment",
    title: "Payment received",
    amount,
  });
  return data.data;
}

