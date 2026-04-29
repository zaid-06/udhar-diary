import { z } from "zod";

export const updateUserNameSchema = z.object({
  name: z.string().trim().min(2).max(120),
});
