import { z } from "zod";

export const createTransactionSchema = z.object({
  partyId: z.coerce.number().int().positive(),
  type: z.enum(["credit", "debit"]),
  title: z.string().trim().min(1).max(200),
  amount: z.coerce.number().positive(),
});

export const createPaymentSchema = z.object({
  partyId: z.coerce.number().int().positive(),
  amount: z.coerce.number().positive(),
});

export const transactionPartyParamsSchema = z.object({
  partyId: z.coerce.number().int().positive(),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
