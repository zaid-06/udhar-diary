import { z } from "zod";

export const createStaffSchema = z.object({
  categoryId: z.coerce.number().int().positive(),
  name: z.string().trim().min(2),
  mobile: z.string().trim().min(10),
  role: z.string().trim().min(2),
  salary: z.coerce.number().min(0),
});

export const staffQuerySchema = z.object({
  categoryId: z.coerce.number().int().positive(),
});

export const createStaffSalaryLogSchema = z.object({
  amount: z.coerce.number().positive(),
  date: z.string().datetime().optional(),
});

export type CreateStaffInput = z.infer<typeof createStaffSchema>;
export type CreateStaffSalaryLogInput = z.infer<typeof createStaffSalaryLogSchema>;
