import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Menu } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import { categoriesQueryKey, useCategories } from "@/hooks/useCategories";
import { customersQueryKey, useCustomers } from "@/hooks/useCustomers";
import { formatInr } from "@/lib/format-currency";
import { getErrorMessage } from "@/lib/get-error-message";
import { getInitialTheme, setThemePreference, type ThemeMode } from "@/lib/theme";
import { createCategory, deleteCategory, updateCategory, type Category } from "@/services/categories.service";
import { toggleCustomerReminder, type Customer } from "@/services/customers.service";
import { SearchBar } from "@/components/SearchBar";
import { AddCustomerModal } from "@/components/AddCustomerModal";
import { ReminderToggle } from "@/components/ReminderToggle";
import { BusinessModal } from "@/components/dashboard/BusinessModal";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { BusinessDetailsDialog } from "@/components/dashboard/BusinessDetailsDialog";
import { DetailsModal } from "@/components/details/DetailsModal";
import { Header } from "@/layout/Header";

const PAGE_SIZE = 8;
const BUSINESS_STORAGE_KEY = "selectedBusinessId";
const RECENT_BUSINESS_STORAGE_KEY = "recentBusinessIds";
const SIDEBAR_COLLAPSED_STORAGE_KEY = "dashboardSidebarCollapsed";

const partyByCategory = {
  shop: { singular: "customer", plural: "Customers" },
  institute: { singular: "student", plural: "Students" },
  gym: { singular: "member", plural: "Members" },
} as const;

export function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [theme, setTheme] = useState<ThemeMode>(() => getInitialTheme());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [businessModalOpen, setBusinessModalOpen] = useState(false);
  const [selectedBusinessId, setSelectedBusinessId] = useState<number | null>(null);
  const [recentBusinessIds, setRecentBusinessIds] = useState<number[]>([]);
  const [detailsBusiness, setDetailsBusiness] = useState<Category | null>(null);
  const [editBusinessName, setEditBusinessName] = useState("");
  const [isSavingDetails, setIsSavingDetails] = useState(false);
  const [selectedParty, setSelectedParty] = useState<Customer | null>(null);

  const { data: businesses } = useCategories(!!user);
  const { data: customers, isPending, isError, error, refetch } = useCustomers(selectedBusinessId, !!user);

  const activeBusiness = useMemo(
    () => businesses?.find((business) => business.id === selectedBusinessId) ?? null,
    [businesses, selectedBusinessId],
  );
  const audience = activeBusiness ? partyByCategory[activeBusiness.type] : partyByCategory.shop;
  const orderedBusinesses = useMemo(() => {
    if (!businesses?.length) return [];
    const idRank = new Map(recentBusinessIds.map((id, idx) => [id, idx]));
    return [...businesses].sort((a, b) => {
      const ra = idRank.has(a.id) ? (idRank.get(a.id) as number) : Number.MAX_SAFE_INTEGER;
      const rb = idRank.has(b.id) ? (idRank.get(b.id) as number) : Number.MAX_SAFE_INTEGER;
      if (ra !== rb) return ra - rb;
      return a.name.localeCompare(b.name);
    });
  }, [businesses, recentBusinessIds]);

  const filteredRows = useMemo(() => {
    const rows = customers ?? [];
    const query = searchTerm.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter(
      (row) => row.name.toLowerCase().includes(query) || row.mobileNumber.toLowerCase().includes(query),
    );
  }, [customers, searchTerm]);

  const totalOutstanding = useMemo(
    () => filteredRows.reduce((sum, row) => sum + Number(row.totalAmount), 0),
    [filteredRows],
  );
  const pageCount = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, pageCount);
  const paginatedRows = filteredRows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const createBusinessMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: async (createdBusiness) => {
      await queryClient.invalidateQueries({ queryKey: categoriesQueryKey });
      setSelectedBusinessId(createdBusiness.id);
      setRecentBusinessIds((prev) =>
        [createdBusiness.id, ...prev.filter((id) => id !== createdBusiness.id)].slice(0, 20),
      );
      setBusinessModalOpen(false);
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
    onSuccess: async (_, id) => {
      await queryClient.invalidateQueries({ queryKey: categoriesQueryKey });
      if (selectedBusinessId === id) setSelectedBusinessId(null);
      toast.success("Business deleted.");
    },
  });

  const reminderMutation = useMutation({
    mutationFn: toggleCustomerReminder,
    onSuccess: async () => {
      await refetch();
    },
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedCollapsed = window.localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY);
    if (storedCollapsed) setIsSidebarCollapsed(storedCollapsed === "true");

    const storedBusinessId = Number(window.localStorage.getItem(BUSINESS_STORAGE_KEY));
    if (!Number.isNaN(storedBusinessId) && storedBusinessId > 0) {
      setSelectedBusinessId(storedBusinessId);
    }

  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, String(isSidebarCollapsed));
    if (selectedBusinessId) {
      window.localStorage.setItem(BUSINESS_STORAGE_KEY, String(selectedBusinessId));
    }
    window.localStorage.setItem(RECENT_BUSINESS_STORAGE_KEY, JSON.stringify(recentBusinessIds));
  }, [isSidebarCollapsed, selectedBusinessId, recentBusinessIds]);

  useEffect(() => {
    if (!businesses?.length) return;
    const exists = selectedBusinessId && businesses.some((business) => business.id === selectedBusinessId);
    if (!exists) setSelectedBusinessId(businesses[0].id);
  }, [businesses, selectedBusinessId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const rawRecent = window.localStorage.getItem(RECENT_BUSINESS_STORAGE_KEY);
      const parsed = rawRecent ? (JSON.parse(rawRecent) as number[]) : [];
      if (Array.isArray(parsed)) {
        setRecentBusinessIds(parsed.filter((id) => Number.isInteger(id)));
      }
    } catch {
      // ignore malformed localStorage data
    }
  }, []);

  useEffect(() => {
    setEditBusinessName(detailsBusiness?.name ?? "");
  }, [detailsBusiness]);

  const markBusinessAsRecent = (businessId: number) => {
    setRecentBusinessIds((prev) => [businessId, ...prev.filter((id) => id !== businessId)].slice(0, 20));
  };

  const handleBusinessSwitch = (businessId: number) => {
    setSelectedBusinessId(businessId);
    markBusinessAsRecent(businessId);
    setSidebarOpen(false);
  };

  const handleOpenDetails = (party: Customer) => {
    setSelectedParty(party);
  };

  return (
    <div
      className={`min-h-svh bg-gradient-to-b from-background to-muted/40 ${
        isSidebarCollapsed ? "md:pl-[70px]" : "md:pl-60"
      }`}
    >
      <Sidebar
        isOpen={sidebarOpen}
        isCollapsed={isSidebarCollapsed}
        userName={user?.name}
        userEmail={user?.email}
        theme={theme}
        signingOut={false}
        businesses={businesses ?? []}
        activeBusinessId={selectedBusinessId}
        onNavigateDashboard={() => setSidebarOpen(false)}
        onOpenCreateBusiness={() => setBusinessModalOpen(true)}
        onSwitchBusiness={handleBusinessSwitch}
        onToggleTheme={() => {
          const nextTheme: ThemeMode = theme === "dark" ? "light" : "dark";
          setTheme(nextTheme);
          setThemePreference(nextTheme);
        }}
        onLogout={async () => {
          await logout();
          navigate("/login", { replace: true });
        }}
        onClose={() => setSidebarOpen(false)}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        onOpenBusinessDetails={(business) => setDetailsBusiness(business)}
        onUpdateBusiness={async (categoryId, payload) => {
          await updateBusinessMutation.mutateAsync({ categoryId, payload });
        }}
        onDeleteBusiness={async (categoryId) => {
          await deleteBusinessMutation.mutateAsync(categoryId);
        }}
      />

      <div className="space-y-4 px-4 py-4 md:px-8">
        <div className="flex items-center md:hidden">
          <Button variant="outline" size="icon-sm" onClick={() => setSidebarOpen(true)} aria-label="Open sidebar">
            <Menu className="size-4" />
          </Button>
        </div>

        <Header
          businesses={orderedBusinesses}
          activeBusinessId={selectedBusinessId}
          activeModule="customers"
          onSwitchBusiness={handleBusinessSwitch}
          onCreateBusiness={() => setBusinessModalOpen(true)}
        />

        {!activeBusiness ? (
          <Card className="border border-dashed border-border/70">
            <CardContent className="p-6 text-sm text-muted-foreground">
              Select a business from sidebar
            </CardContent>
          </Card>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <SearchBar
            value={searchTerm}
            onChange={(value) => {
              setSearchTerm(value);
              setCurrentPage(1);
            }}
          />
          <AddCustomerModal
            categoryId={activeBusiness?.id ?? null}
            categoryType={activeBusiness?.type ?? null}
            entityLabel={audience.singular.charAt(0).toUpperCase() + audience.singular.slice(1)}
            onCreated={async () => {
              await refetch();
              await queryClient.invalidateQueries({ queryKey: [...customersQueryKey, selectedBusinessId] });
            }}
          />
        </div>

        <Card className="border-0 shadow-md ring-1 ring-border/60">
          <CardHeader className="border-b border-border/60 bg-card pb-0">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>{audience.plural}</CardTitle>
                <CardDescription>
                  Outstanding amounts per {audience.singular}, highest first. Welcome back, {user?.name ?? "Owner"}.
                </CardDescription>
              </div>
              <div className="rounded-lg bg-green-100 px-4 py-1 text-green-700">
                <p className="text-base font-bold">{formatInr(totalOutstanding)}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isPending ? (
              <p className="p-6 text-sm text-muted-foreground">Loading...</p>
            ) : isError ? (
              <p className="p-6 text-sm text-destructive">{getErrorMessage(error, "Could not load data.")}</p>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-6">Name</TableHead>
                      <TableHead>Mobile</TableHead>
                      <TableHead className="pr-6 text-right">Amount</TableHead>
                      <TableHead className="pr-6 text-right">Reminder</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedRows.map((row) => (
                      <TableRow
                        key={row.id}
                        onClick={() => handleOpenDetails(row)}
                        className="cursor-pointer hover:bg-muted/60"
                      >
                        <TableCell className="pl-6 font-medium">{row.name}</TableCell>
                        <TableCell>{row.mobileNumber}</TableCell>
                        <TableCell className="pr-6 text-right">{formatInr(Number(row.totalAmount))}</TableCell>
                        <TableCell className="pr-6 text-right">
                          <div
                            onClick={(event) => {
                              event.stopPropagation();
                            }}
                            className="inline-flex"
                          >
                            <ReminderToggle
                              enabled={row.reminderEnabled}
                              loading={reminderMutation.isPending}
                              onToggle={() => void reminderMutation.mutateAsync(row.id)}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="flex items-center justify-between border-t px-6 py-3">
                  <p className="text-xs text-muted-foreground">
                    Showing {(safePage - 1) * PAGE_SIZE + 1}-{Math.min(safePage * PAGE_SIZE, filteredRows.length)} of{" "}
                    {filteredRows.length}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={safePage <= 1}
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    >
                      Prev
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      Page {safePage} / {pageCount}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={safePage >= pageCount}
                      onClick={() => setCurrentPage((prev) => Math.min(pageCount, prev + 1))}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <BusinessModal
        open={businessModalOpen}
        isSubmitting={createBusinessMutation.isPending}
        onOpenChange={setBusinessModalOpen}
        onSubmit={async (input) => {
          try {
            await createBusinessMutation.mutateAsync(input);
          } catch (mutationError) {
            toast.error(getErrorMessage(mutationError, "Failed to create business."));
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
            setDetailsBusiness(null);
          } finally {
            setIsSavingDetails(false);
          }
        }}
      />
      <DetailsModal
        open={!!selectedParty}
        party={selectedParty}
        partyType={activeBusiness ? (activeBusiness.type === "shop" ? "customer" : activeBusiness.type === "institute" ? "student" : "member") : "customer"}
        onOpenChange={(open) => {
          if (!open) setSelectedParty(null);
        }}
        onDataChanged={async () => {
          await refetch();
          await queryClient.invalidateQueries({ queryKey: [...customersQueryKey, selectedBusinessId] });
        }}
      />
    </div>
  );
}
