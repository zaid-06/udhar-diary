import { api } from "@/services/api";

export type BusinessType = "shop" | "institute" | "gym";

export type Category = {
  id: number;
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

export const fetchCategories = async (): Promise<Category[]> => {
  const response = await api.get<Category[]>("/v1/categories");
  return response.data;
};

export const createCategory = async (payload: CreateCategoryInput): Promise<Category> => {
  const response = await api.post<Category>("/v1/categories", payload);
  return response.data;
};

export const updateCategory = async (
  categoryId: number,
  payload: UpdateCategoryInput,
): Promise<Category> => {
  const response = await api.patch<Category>(`/v1/categories/${categoryId}`, payload);
  return response.data;
};

export const deleteCategory = async (categoryId: number): Promise<void> => {
  await api.delete(`/v1/categories/${categoryId}`);
};

