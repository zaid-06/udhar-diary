export function formatDateTime(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);

  return date.toLocaleString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
