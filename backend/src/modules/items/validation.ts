import { z } from "zod";

export const createItemSchema = z
  .object({
    partyId: z.coerce.number().int().positive(),
    name: z.string().trim().min(1, "name is required").max(200).optional(),
    itemName: z.string().trim().min(1, "name is required").max(200).optional(),
    amount: z.coerce.number().positive("amount must be greater than 0"),
  })
  .superRefine((value, ctx) => {
    if (!value.name && !value.itemName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "name is required",
        path: ["name"],
      });
    }
  })
  .transform((value) => ({
    partyId: value.partyId,
    name: value.name ?? value.itemName!,
    amount: value.amount,
  }));

export const itemPartyParamsSchema = z.object({
  partyId: z.coerce.number().int().positive(),
});

export type CreateItemInput = z.infer<typeof createItemSchema>;
