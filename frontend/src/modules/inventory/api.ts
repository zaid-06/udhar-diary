import { api } from "@/services/api";

export type InventoryItem = {
  id: number;
  categoryId: number;
  productName: string;
  quantity: number;
  unit: string;
  purchasePrice: number;
  sellingPrice: number;
  createdAt: string;
  lowStock: boolean;
};

export const fetchInventory = async (categoryId: number) => {
  const { data } = await api.get<InventoryItem[]>("/v1/inventory", { params: { categoryId } });
  return data;
};

export const createInventory = async (payload: Omit<InventoryItem, "id" | "createdAt" | "lowStock">) => {
  const { data } = await api.post<InventoryItem>("/v1/inventory", payload);
  return data;
};

export const updateInventory = async (
  id: number,
  payload: Partial<Pick<InventoryItem, "productName" | "quantity" | "unit" | "purchasePrice" | "sellingPrice">>,
) => {
  const { data } = await api.patch<InventoryItem>(`/v1/inventory/${id}`, payload);
  return data;
};

export const deleteInventory = async (id: number) => {
  await api.delete(`/v1/inventory/${id}`);
};
