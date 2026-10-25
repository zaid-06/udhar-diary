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
    <Routes>
      <Route path="/dashboard" element={<BusinessEntryRedirect />} />
      <Route element={<AppLayout />}>
        <Route path="/business/:businessId/customers" element={<Suspense fallback={<ModuleLoading />}><CustomersPage /></Suspense>} />
        <Route path="/business/:businessId/inventory" element={<Suspense fallback={<ModuleLoading />}><InventoryPage /></Suspense>} />
        <Route path="/business/:businessId/suppliers" element={<Suspense fallback={<ModuleLoading />}><SuppliersPage /></Suspense>} />
        <Route path="/business/:businessId/staff" element={<Suspense fallback={<ModuleLoading />}><StaffPage /></Suspense>} />
      </Route>
    </Routes>
  );
}

function ModuleLoading() {
  return (
    <div className="flex min-h-64 items-center justify-center" role="status" aria-live="polite">
      <span className="sr-only">Loading module</span>
      <span className="size-7 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-primary" aria-hidden="true" />
    </div>
  );
}

