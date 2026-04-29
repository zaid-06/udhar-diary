import { z } from "zod";

const partyTypeSchema = z.enum(["customer", "student", "member"]);

export const createPartySchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    mobile: z
      .string()
      .trim()
      .regex(/^\+?[0-9]{10,15}$/, "mobile must be 10-15 digits"),
    categoryId: z.coerce.number().int().positive(),
    type: partyTypeSchema,
    class: z.string().trim().min(1).max(80).optional(),
    rollNumber: z.string().trim().min(1).max(80).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.type === "student") {
      if (!value.class) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "class is required when type is student",
          path: ["class"],
        });
      }
      if (!value.rollNumber) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "rollNumber is required when type is student",
          path: ["rollNumber"],
        });
      }
    }
  });

export const getPartiesQuerySchema = z.object({
  categoryId: z.coerce.number().int().positive(),
});

export const togglePartyReminderParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export type CreatePartyInput = z.infer<typeof createPartySchema>;
