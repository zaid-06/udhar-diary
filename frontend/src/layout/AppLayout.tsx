import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Menu } from "lucide-react";
import { Outlet, useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Sidebar } from "@/layout/Sidebar";
import { Button } from "@/components/ui/button";
import { BusinessModal } from "@/components/dashboard/BusinessModal";
import { BusinessDetailsDialog } from "@/components/dashboard/BusinessDetailsDialog";
import { useAuth } from "@/shared/auth/useAuth";
import { categoriesQueryKey, useCategories } from "@/modules/categories/hooks/useCategories";
import { createCategory, deleteCategory, updateCategory, type Category } from "@/modules/categories/api/categories.api";
import { getErrorMessage } from "@/shared/lib/get-error-message";
import { getInitialTheme, setThemePreference, type ThemeMode } from "@/shared/lib/theme";

const SIDEBAR_COLLAPSED_STORAGE_KEY = "dashboardSidebarCollapsed";

type AppModule = "customers" | "inventory" | "suppliers" | "staff";

export type AppLayoutContext = {
  businesses: Category[];
  activeBusinessId: number | null;
  activeBusiness: Category | null;
  activeModule: AppModule;
  onSwitchBusiness: (businessId: number) => void;
  onOpenCreateBusiness: () => void;
};

export function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { businessId } = useParams<{ businessId: string }>();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY) === "true";
  });
  const [theme, setTheme] = useState<ThemeMode>(() => getInitialTheme());
  const [businessModalOpen, setBusinessModalOpen] = useState(false);
  const [detailsBusiness, setDetailsBusiness] = useState<Category | null>(null);
  const [editBusinessName, setEditBusinessName] = useState("");
  const [isSavingDetails, setIsSavingDetails] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const activeBusinessId = Number.isFinite(Number(businessId)) ? Number(businessId) : null;
  const { data: businesses = [] } = useCategories(!!user);
  const activeBusiness = useMemo(
    () => businesses.find((business) => business.id === activeBusinessId) ?? null,
    [businesses, activeBusinessId],
  );

  const activeModule = useMemo<AppModule>(() => {
    const last = location.pathname.split("/").filter(Boolean).at(-1);
    if (last === "inventory" || last === "suppliers" || last === "staff") return last;
    return "customers";
  }, [location.pathname]);

  const createBusinessMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: async (createdBusiness) => {
      await queryClient.invalidateQueries({ queryKey: categoriesQueryKey });
      setBusinessModalOpen(false);
      navigate(`/business/${createdBusiness.id}/${activeModule}`);
      toast.success("Business created.");
    },
  });

  const updateBusinessMutation = useMutation({
    mutationFn: ({ categoryId, payload }: { categoryId: number; payload: { name?: string; isActive?: boolean } }) =>
      updateCategory(categoryId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: categoriesQueryKey });
      toast.success("Business updated.");
    },
  });

  const deleteBusinessMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: async (_, deletedId) => {
      await queryClient.invalidateQueries({ queryKey: categoriesQueryKey });
      setDetailsBusiness(null);
      if (activeBusinessId === deletedId) {
        const next = businesses.find((business) => business.id !== deletedId);
        if (next) navigate(`/business/${next.id}/${activeModule}`);
      }
      toast.success("Business deleted.");
    },
  });

  const onSwitchBusiness = (nextBusinessId: number) => {
    navigate(`/business/${nextBusinessId}/${activeModule}`);
    setSidebarOpen(false);
  };

  const contextValue: AppLayoutContext = {
    businesses,
    activeBusinessId,
    activeBusiness,
    activeModule,
    onSwitchBusiness,
    onOpenCreateBusiness: () => setBusinessModalOpen(true),
  };

  return (
    <div className={`min-h-svh bg-gradient-to-b from-background to-muted/40 ${isSidebarCollapsed ? "md:pl-[70px]" : "md:pl-60"}`}>
      <Sidebar
        isOpen={sidebarOpen}
        isCollapsed={isSidebarCollapsed}
        userName={user?.name}
        userEmail={user?.email}
        theme={theme}
        signingOut={signingOut}
        businesses={businesses}
        activeBusinessId={activeBusinessId}
        onNavigateDashboard={() => setSidebarOpen(false)}
        onOpenCreateBusiness={() => setBusinessModalOpen(true)}
        onSwitchBusiness={onSwitchBusiness}
        onToggleTheme={() => {
          const nextTheme: ThemeMode = theme === "dark" ? "light" : "dark";
          setTheme(nextTheme);
          setThemePreference(nextTheme);
        }}
        onLogout={async () => {
          setSigningOut(true);
          try {
            await logout();
            navigate("/login", { replace: true });
          } finally {
            setSigningOut(false);
          }
        }}
        onClose={() => setSidebarOpen(false)}
        onToggleCollapse={() => {
          setIsSidebarCollapsed((prev) => {
            const next = !prev;
            if (typeof window !== "undefined") {
              window.localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, String(next));
            }
            return next;
          });
        }}
        onOpenBusinessDetails={(business) => setDetailsBusiness(business)}
        onUpdateBusiness={async (categoryId, payload) => {
          await updateBusinessMutation.mutateAsync({ categoryId, payload });
        }}
        onDeleteBusiness={async (categoryId) => {
          await deleteBusinessMutation.mutateAsync(categoryId);
        }}
      />

      <main className="flex min-h-svh flex-col overflow-auto px-4 py-4 md:px-8">
        <div className="mb-3 flex items-center md:hidden">
          <Button variant="outline" size="icon-sm" onClick={() => setSidebarOpen(true)} aria-label="Open sidebar">
            <Menu className="size-4" />
          </Button>
        </div>
        <Outlet context={contextValue} />
      </main>

      <BusinessModal
        open={businessModalOpen}
        isSubmitting={createBusinessMutation.isPending}
        onOpenChange={setBusinessModalOpen}
        onSubmit={async (input) => {
          try {
            await createBusinessMutation.mutateAsync(input);
          } catch (error) {
            toast.error(getErrorMessage(error, "Failed to create business."));
          }
        }}
      />
      <BusinessDetailsDialog
        business={detailsBusiness}
        editBusinessName={editBusinessName}
        isSaving={isSavingDetails}
        onOpenChange={(open) => {
          if (!open) setDetailsBusiness(null);
        }}
        onEditBusinessNameChange={setEditBusinessName}
        onToggleStatus={async () => {
          if (!detailsBusiness) return;
          setIsSavingDetails(true);
          try {
            await updateBusinessMutation.mutateAsync({
              categoryId: detailsBusiness.id,
              payload: { isActive: !detailsBusiness.isActive },
            });
            setDetailsBusiness({
              ...detailsBusiness,
              isActive: !detailsBusiness.isActive,
            });
          } finally {
            setIsSavingDetails(false);
          }
        }}
        onSaveName={async () => {
          if (!detailsBusiness) return;
          const trimmedName = editBusinessName.trim();
          if (!trimmedName || trimmedName === detailsBusiness.name) return;
          setIsSavingDetails(true);
          try {
            await updateBusinessMutation.mutateAsync({
              categoryId: detailsBusiness.id,
              payload: { name: trimmedName },
            });
            setDetailsBusiness({
              ...detailsBusiness,
              name: trimmedName,
            });
          } finally {
            setIsSavingDetails(false);
          }
        }}
        onDelete={async () => {
          if (!detailsBusiness) return;
          const shouldDelete = window.confirm(`Delete "${detailsBusiness.name}"? This is a soft delete.`);
          if (!shouldDelete) return;
          setIsSavingDetails(true);
          try {
            await deleteBusinessMutation.mutateAsync(detailsBusiness.id);
          } finally {
            setIsSavingDetails(false);
          }
        }}
      />
    </div>
  );
}

