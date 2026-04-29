import { useQuery } from "@tanstack/react-query";
import { fetchCategories } from "@/services/categories.service";

export const categoriesQueryKey = ["categories"];

export const useCategories = (enabled: boolean) =>
  useQuery({
    queryKey: categoriesQueryKey,
    queryFn: fetchCategories,
    enabled,
  });
