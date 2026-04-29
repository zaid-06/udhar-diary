import { useQuery } from "@tanstack/react-query";
import { fetchCustomerItems } from "@/services/items.service";

export const customerItemsQueryKey = (customerId: number) =>
  ["customer-items", customerId] as const;

export function useCustomerItems(customerId: number | null, enabled = true) {
  return useQuery({
    queryKey: customerId ? customerItemsQueryKey(customerId) : ["customer-items", "none"],
    queryFn: () => fetchCustomerItems(customerId as number),
    enabled: enabled && customerId !== null,
  });
}
