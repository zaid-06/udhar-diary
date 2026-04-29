import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db/client.js";
import { account, session, user, verification } from "../db/schema.js";
import { env } from "../utils/env.js";

export const auth = betterAuth({
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  /** SPA (different port) + API origin for cookie / CSRF checks. */
  trustedOrigins: [env.FRONTEND_URL, env.BETTER_AUTH_URL],
  emailAndPassword: {
    enabled: true,
  },
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user,
      session,
      account,
      verification,
    },
  }),
});
