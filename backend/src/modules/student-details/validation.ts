import { z } from "zod";

export const createStudentDetailsSchema = z.object({
  partyId: z.coerce.number().int().positive(),
  class: z.string().trim().min(1, "class is required").max(80),
  rollNumber: z.string().trim().min(1, "rollNumber is required").max(80),
});

export const updateStudentDetailsSchema = z
  .object({
    class: z.string().trim().min(1, "class is required").max(80).optional(),
    rollNumber: z.string().trim().min(1, "rollNumber is required").max(80).optional(),
  })
  .refine((input) => input.class !== undefined || input.rollNumber !== undefined, {
    message: "At least one field is required",
  });

export const studentDetailsPartyParamsSchema = z.object({
  partyId: z.coerce.number().int().positive(),
});

export type CreateStudentDetailsInput = z.infer<typeof createStudentDetailsSchema>;
export type UpdateStudentDetailsInput = z.infer<typeof updateStudentDetailsSchema>;
