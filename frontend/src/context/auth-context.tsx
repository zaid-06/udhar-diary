import { createContext, useCallback, useMemo, type ReactNode } from "react";
import { authClient } from "@/lib/auth-client";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  emailVerified?: boolean;
};

export type LoginInput = { email: string; password: string; rememberMe?: boolean };
export type RegisterInput = { name: string; email: string; password: string };

type GetSessionData = {
  user: SessionUser;
  session: Record<string, unknown>;
} | null;

export const AuthContext = createContext<{
  user: SessionUser | null;
  session: Record<string, unknown> | null;
  isLoading: boolean;
  sessionError: Error | null;
  refetchSession: () => Promise<void>;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
} | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data, isPending, error, refetch } = authClient.useSession();

  const sessionPayload = data as GetSessionData;
  const user = sessionPayload?.user ?? null;
  const session = sessionPayload?.session ?? null;
  const isLoading = isPending;
  const sessionError = error as Error | null;

  const refetchSession = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const login = useCallback(
    async (input: LoginInput) => {
      const res = await authClient.signIn.email({
        email: input.email,
        password: input.password,
        rememberMe: input.rememberMe,
      });
      if (res.error) {
        throw new Error(res.error.message ?? "Sign in failed");
      }
      await refetch();
    },
    [refetch],
  );

  const register = useCallback(
    async (input: RegisterInput) => {
      const res = await authClient.signUp.email({
        email: input.email,
        password: input.password,
        name: input.name,
      });
      if (res.error) {
        throw new Error(res.error.message ?? "Registration failed");
      }
      await refetch();
    },
    [refetch],
  );

  const logout = useCallback(async () => {
    await authClient.signOut();
    await refetch();
  }, [refetch]);

  const value = useMemo(
    () => ({
      user,
      session,
      isLoading,
      sessionError,
      refetchSession,
      login,
      register,
      logout,
    }),
    [user, session, isLoading, sessionError, refetchSession, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
