import { createAuthClient } from "better-auth/react";

const baseURL = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

/**
 * Better Auth browser client â€” calls `/api/auth/*` on the API with cookies (`credentials: "include"`).
 */
export const authClient = createAuthClient({
  baseURL,
  sessionOptions: {
    refetchOnWindowFocus: true,
  },
});

