import { isAxiosError } from "axios";

export function getErrorMessage(error: unknown, fallback = "Something went wrong"): string {
  if (isAxiosError(error)) {
    const apiMessage =
      (error.response?.data as { message?: string } | undefined)?.message ?? error.message;
    return String(apiMessage || fallback);
  }

  if (error instanceof Error) {
    return error.message || fallback;
  }

  return fallback;
}
