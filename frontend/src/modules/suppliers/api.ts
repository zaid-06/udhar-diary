import { api } from "@/services/api";

type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
};

export type Supplier = {
  id: string;
  categoryId: string;
  name: string;
  mobile: string;
  address?: string;
  createdAt: string;
  outstandingBalance: number;
};

export type SupplierTransaction = {
  id: string;
  supplierId: string;
  amount: number;
  type: "given" | "taken";
  createdAt: string;
};

type EntityRow = {
  id: string;
  businessId: string;
  name: string;
  mobile: string;
  address?: string | null;
  totalAmount: number;
  createdAt: string;
};

const mapSupplier = (row: EntityRow): Supplier => ({
  id: row.id,
  categoryId: row.businessId,
  name: row.name,
  mobile: row.mobile,
  address: row.address ?? "",
  createdAt: row.createdAt,
  outstandingBalance: row.totalAmount,
});

export const fetchSuppliers = async (categoryId: string) => {
  const { data } = await api.get<ApiEnvelope<EntityRow[]>>("/v1/entities", {
    params: { businessId: categoryId, category: "supplier" },
  });
  return data.data.map(mapSupplier);
};

export const createSupplier = async (payload: {
  categoryId: string;
  name: string;
  mobile: string;
  address?: string;
}) => {
  const { data } = await api.post<ApiEnvelope<EntityRow>>("/v1/entities", {
    businessId: payload.categoryId,
    name: payload.name,
    mobile: payload.mobile,
    address: payload.address?.trim() || undefined,
    category: "supplier",
  });
  return mapSupplier(data.data);
};

export const createSupplierTransaction = async (
  supplierId: string,
  payload: { amount: number; type: "given" | "taken" },
) => {
  const requestType = payload.type === "taken" ? "credit" : "debit";
  const requestCategory = payload.type === "taken" ? "supply" : "payment";
  const title = payload.type === "taken" ? "Supply received" : "Payment to supplier";

  const { data } = await api.post<
    ApiEnvelope<{
      id: string;
      entityId: string;
      amount: number;
      type: "credit" | "debit";
      createdAt: string;
    }>
  >("/v1/transactions", {
    entityId: supplierId,
    type: requestType,
    category: requestCategory,
    title,
    amount: payload.amount,
  });

  return {
    id: data.data.id,
    supplierId: data.data.entityId,
    amount: data.data.amount,
    type: data.data.type === "credit" ? "taken" : "given",
    createdAt: data.data.createdAt,
  } satisfies SupplierTransaction;
};

export const fetchSupplierTransactions = async (supplierId: string) => {
  const { data } = await api.get<
    ApiEnvelope<
      Array<{
        id: string;
        entityId: string;
        amount: number;
        type: "credit" | "debit";
        createdAt: string;
      }>
    >
  >("/v1/transactions", {
    params: { entityId: supplierId },
  });

  return data.data.map(
    (row) =>
      ({
        id: row.id,
        supplierId: row.entityId,
        amount: row.amount,
        type: row.type === "credit" ? "taken" : "given",
        createdAt: row.createdAt,
      }) satisfies SupplierTransaction,
  );
};

