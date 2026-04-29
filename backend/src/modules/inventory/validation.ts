import { z } from "zod";

export const createInventorySchema = z.object({
  categoryId: z.coerce.number().int().positive(),
  productName: z.string().trim().min(1),
  quantity: z.coerce.number().min(0),
  unit: z.string().trim().min(1).default("pcs"),
  purchasePrice: z.coerce.number().min(0),
  sellingPrice: z.coerce.number().min(0),
});

export const updateInventorySchema = z.object({
  productName: z.string().trim().min(1).optional(),
  quantity: z.coerce.number().min(0).optional(),
  unit: z.string().trim().min(1).optional(),
  purchasePrice: z.coerce.number().min(0).optional(),
  sellingPrice: z.coerce.number().min(0).optional(),
});

export const inventoryQuerySchema = z.object({
  categoryId: z.coerce.number().int().positive(),
});

export type CreateInventoryInput = z.infer<typeof createInventorySchema>;
export type UpdateInventoryInput = z.infer<typeof updateInventorySchema>;
