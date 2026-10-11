import { z } from "zod";
import { inventoryUnitValues } from "../../db/schema.js";

export const inventoryUnitSchema = z.enum(inventoryUnitValues);
export const inventoryUnitOptions = inventoryUnitValues.map((value) => ({
  value,
  label: value,
}));

export const createBusinessInventorySchema = z.object({
  businessId: z.string().uuid(),
  productName: z.string().trim().min(1),
  quantity: z.coerce.number().min(0),
  unit: inventoryUnitSchema.default("pcs"),
  purchasePrice: z.coerce.number().min(0),
  sellingPrice: z.coerce.number().min(0),
});

export const updateBusinessInventorySchema = z.object({
  productName: z.string().trim().min(1).optional(),
  quantity: z.coerce.number().min(0).optional(),
  unit: inventoryUnitSchema.optional(),
  purchasePrice: z.coerce.number().min(0).optional(),
  sellingPrice: z.coerce.number().min(0).optional(),
});
export const invoiceItemSchema = z.object({
  product_name: z.string().trim().min(1),
  quantity: z.coerce.number().min(0),
  unit: z.string().trim().min(1),
  purchase_price: z.coerce.number().min(0),
});

export const extractSlipResponseSchema = z.object({
  purchase_date: z.string(),
  items: z.array(invoiceItemSchema),
});

export type InvoiceItem = z.infer<typeof invoiceItemSchema>;

export type ExtractSlipResponse = z.infer<typeof extractSlipResponseSchema>;

export const businessInventoryQuerySchema = z.object({
  businessId: z.string().uuid(),
});

export const supplierInventoryLinkSchema = z.object({
  supplierId: z.string().uuid(),
  inventoryId: z.string().uuid(),
});

export type CreateBusinessInventoryInput = z.infer<
  typeof createBusinessInventorySchema
>;
export type UpdateBusinessInventoryInput = z.infer<
  typeof updateBusinessInventorySchema
>;
