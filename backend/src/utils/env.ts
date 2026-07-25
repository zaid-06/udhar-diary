import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  PORT: z.coerce.number().int().positive().default(5000),

  DATABASE_URL: z.string().url(),

  BETTER_AUTH_SECRET: z
    .string()
    .min(32, "BETTER_AUTH_SECRET must be at least 32 characters"),

  BETTER_AUTH_URL: z.string().url().default("http://localhost:5000"),

  FRONTEND_URL: z.string().url().default("http://localhost:3000"),

  // 👇 Add this
  AI_SERVICE_URL: z.string().url(),

  PAYMENT_REMINDER_CRON: z.string().min(1).default("0 9 * * *"),

  PAYMENT_REMINDER_ENABLED: z.coerce.boolean().default(true),

  PAYMENT_REMINDER_TIMEZONE: z.string().min(1).default("UTC"),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error(
    "Invalid environment variables:",
    parsedEnv.error.flatten().fieldErrors,
  );
  throw new Error("Invalid environment variables");
}

export const env = parsedEnv.data;
