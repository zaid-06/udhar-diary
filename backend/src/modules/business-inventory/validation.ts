import { z } from "zod";

export const createBusinessInventorySchema = z.object({
  businessId: z.string().uuid(),
  productName: z.string().trim().min(1),
  quantity: z.coerce.number().min(0),
  unit: z.string().trim().min(1).default("pcs"),
  purchasePrice: z.coerce.number().min(0),
  sellingPrice: z.coerce.number().min(0),
});

export const updateBusinessInventorySchema = z.object({
  productName: z.string().trim().min(1).optional(),
  quantity: z.coerce.number().min(0).optional(),
  unit: z.string().trim().min(1).optional(),
  purchasePrice: z.coerce.number().min(0).optional(),
  sellingPrice: z.coerce.number().min(0).optional(),
});

export const businessInventoryQuerySchema = z.object({
  businessId: z.string().uuid(),
});

export const supplierInventoryLinkSchema = z.object({
  supplierId: z.string().uuid(),
  inventoryId: z.string().uuid(),
});

export type CreateBusinessInventoryInput = z.infer<typeof createBusinessInventorySchema>;
export type UpdateBusinessInventoryInput = z.infer<typeof updateBusinessInventorySchema>;
