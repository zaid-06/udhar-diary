import { z } from "zod";

export const transactionCategorySchema = z.enum([
  "item",
  "fees",
  "supply",
  "salary",
  "payment",
  "membership",
  "other",
]);

export const createEntityTransactionSchema = z.object({
  entityId: z.string().uuid(),
  category: transactionCategorySchema,
  title: z.string().trim().min(1),
  amount: z.coerce.number().positive("amount > 0"),
  quantity: z.coerce.number().positive().optional(),
  unit: z.string().trim().min(1).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  type: z.enum(["credit", "debit"]),
});

export const entityIdQuerySchema = z.object({
  entityId: z.string().uuid(),
});

export const transactionIdParamsSchema = z.object({
  transactionId: z.string().uuid(),
});

export type CreateEntityTransactionInput = z.infer<typeof createEntityTransactionSchema>;
