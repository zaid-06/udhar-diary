import { useQuery } from "@tanstack/react-query";
import { fetchCustomers } from "@/services/customers.service";

export const customersQueryKey = ["customers"] as const;

export function useCustomers(categoryId: number | null, enabled = true) {
  return useQuery({
    queryKey: [...customersQueryKey, categoryId],
    queryFn: () => fetchCustomers(categoryId as number),
    enabled: enabled && categoryId !== null,
  });
}

