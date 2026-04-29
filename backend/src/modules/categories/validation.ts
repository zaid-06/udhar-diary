import { z } from "zod";

export const createCategorySchema = z.object({
  type: z.enum(["shop", "institute", "gym"]),
  name: z.string().trim().min(1, "Business name is required").max(160),
  address: z.string().trim().min(1, "Address is required").max(500),
});

export const updateCategorySchema = z
  .object({
    name: z.string().trim().min(1, "Business name is required").max(160).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((input) => input.name !== undefined || input.isActive !== undefined, {
    message: "At least one field is required",
  });

export const categoryIdParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
