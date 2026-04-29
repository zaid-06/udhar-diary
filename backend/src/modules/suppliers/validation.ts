import { z } from "zod";

export const createSupplierSchema = z.object({
  categoryId: z.coerce.number().int().positive(),
  name: z.string().trim().min(2),
  mobile: z.string().trim().min(10),
  address: z.string().trim().min(2),
});

export const suppliersQuerySchema = z.object({
  categoryId: z.coerce.number().int().positive(),
});

export const createSupplierTransactionSchema = z.object({
  amount: z.coerce.number().positive(),
  type: z.enum(["given", "taken"]),
});

export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;
export type CreateSupplierTransactionInput = z.infer<typeof createSupplierTransactionSchema>;
