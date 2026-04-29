import { api } from "@/services/api";

export type Supplier = {
  id: number;
  categoryId: number;
  name: string;
  mobile: string;
  address: string;
  createdAt: string;
  outstandingBalance: number;
};

export type SupplierTransaction = {
  id: number;
  supplierId: number;
  amount: number;
  type: "given" | "taken";
  createdAt: string;
};

export const fetchSuppliers = async (categoryId: number) => {
  const { data } = await api.get<Supplier[]>("/v1/suppliers", { params: { categoryId } });
  return data;
};

export const createSupplier = async (payload: {
  categoryId: number;
  name: string;
  mobile: string;
  address: string;
}) => {
  const { data } = await api.post<Supplier>("/v1/suppliers", payload);
  return data;
};

export const createSupplierTransaction = async (
  supplierId: number,
  payload: { amount: number; type: "given" | "taken" },
) => {
  const { data } = await api.post<SupplierTransaction>(`/v1/suppliers/${supplierId}/transactions`, payload);
  return data;
};

export const fetchSupplierTransactions = async (supplierId: number) => {
  const { data } = await api.get<SupplierTransaction[]>(`/v1/suppliers/${supplierId}/transactions`);
  return data;
};

