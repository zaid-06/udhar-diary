import { lazy, Suspense, useMemo } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useCategories } from "@/modules/categories/hooks/useCategories";
import { useAuth } from "@/shared/auth/useAuth";
import { AppLayout } from "@/layout/AppLayout";

const CustomersPage = lazy(() => import("@/modules/customers/pages/CustomersPage"));
const InventoryPage = lazy(() => import("@/modules/inventory/pages/InventoryPage"));
const SuppliersPage = lazy(() => import("@/modules/suppliers/pages/SuppliersPage"));
const StaffPage = lazy(() => import("@/modules/staff/pages/StaffPage"));

function BusinessEntryRedirect() {
  const { user } = useAuth();
  const { data: businesses, isPending } = useCategories(!!user);

  const targetBusinessId = useMemo(() => {
    if (!businesses?.length) return null;
    const stored = window.localStorage.getItem("selectedBusinessId");
    const exists = businesses.some((business) => business.id === stored);
    return exists ? stored : businesses[0].id;
  }, [businesses]);

  if (isPending) return <div className="p-6 text-sm text-muted-foreground">Loading...</div>;
  if (!targetBusinessId) return <Navigate to="/business/create" replace />;
  return <Navigate to={`/business/${targetBusinessId}/customers`} replace />;
}

export function BusinessRoutes() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading module...</div>}>
      <Routes>
        <Route path="/dashboard" element={<BusinessEntryRedirect />} />
        <Route element={<AppLayout />}>
          <Route path="/business/:businessId/customers" element={<CustomersPage />} />
          <Route path="/business/:businessId/inventory" element={<InventoryPage />} />
          <Route path="/business/:businessId/suppliers" element={<SuppliersPage />} />
          <Route path="/business/:businessId/staff" element={<StaffPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

