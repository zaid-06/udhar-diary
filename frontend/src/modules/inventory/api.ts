import { api } from "@/services/api";

type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
};

export type InventoryItem = {
  id: string;
  categoryId: string;
  productName: string;
  quantity: number;
  unit: string;
  purchasePrice: number;
  sellingPrice: number;
  createdAt: string;
  lowStock: boolean;
};

type InventoryApiItem = {
  id: string;
  businessId: string;
  productName: string;
  quantity: number;
  unit: string;
  purchasePrice: number;
  sellingPrice: number;
  createdAt: string;
};

const mapInventory = (row: InventoryApiItem): InventoryItem => ({
  id: row.id,
  categoryId: row.businessId,
  productName: row.productName,
  quantity: row.quantity,
  unit: row.unit,
  purchasePrice: row.purchasePrice,
  sellingPrice: row.sellingPrice,
  createdAt: row.createdAt,
  lowStock: row.quantity <= 5,
});

export const fetchInventory = async (categoryId: string) => {
  const { data } = await api.get<ApiEnvelope<InventoryApiItem[]>>("/v1/inventory", {
    params: { businessId: categoryId },
  });
  return data.data.map(mapInventory);
};

export const createInventory = async (payload: Omit<InventoryItem, "id" | "createdAt" | "lowStock">) => {
  const { data } = await api.post<ApiEnvelope<InventoryApiItem>>("/v1/inventory", {
    businessId: payload.categoryId,
    productName: payload.productName,
    quantity: payload.quantity,
    unit: payload.unit,
    purchasePrice: payload.purchasePrice,
    sellingPrice: payload.sellingPrice,
  });
  return mapInventory(data.data);
};

export const updateInventory = async (
  id: string,
  payload: Partial<Pick<InventoryItem, "productName" | "quantity" | "unit" | "purchasePrice" | "sellingPrice">>,
) => {
  const { data } = await api.patch<ApiEnvelope<InventoryApiItem>>(`/v1/inventory/${id}`, payload);
  return mapInventory(data.data);
};

export const deleteInventory = async (id: string) => {
  await api.delete(`/v1/inventory/${id}`);
};

const dataUrlToFile = (dataUrl: string, filename: string): File => {
  const [header, base64] = dataUrl.split(",");
  const mime = /data:(.*?);/.exec(header)?.[1] ?? "image/jpeg";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new File([bytes], filename, { type: mime });
};

export type ExtractSlipResult = {
  purchaseDate: string;
  inventory: InventoryApiItem[];
};

export const extractInventorySlip = async (businessId: string, imageDataUrl: string) => {
  const file = dataUrlToFile(imageDataUrl, `slip-${Date.now()}.jpg`);
  const formData = new FormData();
  formData.append("file", file);
  formData.append("businessId", businessId);

  const { data } = await api.post<ApiEnvelope<ExtractSlipResult>>(
    "/v1/inventory/extract-slip",
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    },
  );
  return data.data;
};

