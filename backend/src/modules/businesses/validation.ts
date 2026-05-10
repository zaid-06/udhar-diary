import { z } from "zod";

export const businessTypeSchema = z.enum(["shop", "institute", "gym"]);

export const createBusinessSchema = z.object({
  name: z.string().trim().min(1, "name required"),
  type: businessTypeSchema,
  address: z.string().trim().min(1),
});

export const updateBusinessSchema = z
  .object({
    name: z.string().trim().min(1).optional(),
    address: z.string().trim().min(1).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  });

export type CreateBusinessInput = z.infer<typeof createBusinessSchema>;
export type UpdateBusinessInput = z.infer<typeof updateBusinessSchema>;
