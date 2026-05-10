import { api } from "@/services/api";

export type BusinessType = "shop" | "institute" | "gym";

export type Category = {
  id: string;
  userId: number;
  type: BusinessType;
  name: string;
  address: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type CreateCategoryInput = {
  type: BusinessType;
  name: string;
  address: string;
};

export type UpdateCategoryInput = {
  name?: string;
  isActive?: boolean;
};

type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
};

export const fetchCategories = async (): Promise<Category[]> => {
  const response = await api.get<ApiEnvelope<Category[]>>("/v1/businesses");
  return response.data.data;
};

export const createCategory = async (payload: CreateCategoryInput): Promise<Category> => {
  const response = await api.post<ApiEnvelope<Category>>("/v1/businesses", payload);
  return response.data.data;
};

export const updateCategory = async (
  categoryId: string | number,
  payload: UpdateCategoryInput,
): Promise<Category> => {
  const nextPayload: { name?: string; address?: string } = {
    ...(payload.name !== undefined ? { name: payload.name } : {}),
  };
  const response = await api.patch<ApiEnvelope<Category>>(`/v1/businesses/${categoryId}`, nextPayload);
  return response.data.data;
};

export const deleteCategory = async (categoryId: string | number): Promise<void> => {
  await api.delete(`/v1/businesses/${categoryId}`);
};

