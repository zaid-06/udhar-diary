import { z } from "zod";

export const entityCategorySchema = z.enum([
  "customer",
  "supplier",
  "staff",
  "student",
  "member",
  "teacher",
  "trainer",
]);

export const createEntitySchema = z.object({
  businessId: z.string().uuid(),
  name: z.string().trim().min(1, "name required"),
  mobile: z.string().trim().min(5),
  address: z.string().trim().optional(),
  category: entityCategorySchema,
  reminderEnabled: z.boolean().optional(),
  studentDetails: z
    .object({
      class: z.string().trim().min(1),
      rollNumber: z.string().trim().min(1),
    })
    .optional(),
  staffDetails: z
    .object({
      role: z.enum(["teacher", "staff", "trainer"]),
      salary: z.coerce.number().min(0),
    })
    .optional(),
  memberDetails: z
    .object({
      membershipType: z.string().trim().min(1),
      joiningDate: z.coerce.date(),
    })
    .optional(),
});

export const updateEntitySchema = z.object({
  name: z.string().trim().min(1).optional(),
  mobile: z.string().trim().min(5).optional(),
  address: z.string().trim().optional(),
  reminderEnabled: z.boolean().optional(),
});

export const entityBusinessQuerySchema = z.object({
  businessId: z.string().uuid().optional(),
  category: entityCategorySchema.optional(),
  search: z.string().trim().optional(),
});

export type CreateEntityInput = z.infer<typeof createEntitySchema>;
export type UpdateEntityInput = z.infer<typeof updateEntitySchema>;
