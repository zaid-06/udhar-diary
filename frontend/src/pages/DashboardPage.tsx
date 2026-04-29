import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useOutletContext } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Header } from "@/layout/Header";
import type { AppLayoutContext } from "@/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { customersQueryKey, useCustomers } from "@/hooks/useCustomers";
import { formatInr } from "@/lib/format-currency";
import { getErrorMessage } from "@/lib/get-error-message";
import { toggleCustomerReminder, type Customer } from "@/services/customers.service";
import { SearchBar } from "@/components/SearchBar";
import { AddCustomerModal } from "@/components/AddCustomerModal";
import { ReminderToggle } from "@/components/ReminderToggle";
import { DetailsModal } from "@/components/details/DetailsModal";

const PAGE_SIZE = 8;

const partyByCategory = {
  shop: { singular: "customer", plural: "Customers", partyType: "customer" as const },
  institute: { singular: "student", plural: "Students", partyType: "student" as const },
  gym: { singular: "member", plural: "Members", partyType: "member" as const },
};

export function DashboardPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { businesses, activeBusinessId, activeBusiness, onSwitchBusiness, onOpenCreateBusiness } =
    useOutletContext<AppLayoutContext>();

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedParty, setSelectedParty] = useState<Customer | null>(null);

  const { data: customers, isPending, isError, error, refetch } = useCustomers(activeBusinessId, !!user);

  const audience = activeBusiness ? partyByCategory[activeBusiness.type] : partyByCategory.shop;

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

  const reminderMutation = useMutation({
    mutationFn: toggleCustomerReminder,
    onSuccess: async () => {
      await refetch();
    },
  });

  return (
    <div className="space-y-4">
      <Header
        businesses={businesses}
        activeBusinessId={activeBusinessId}
        activeModule="customers"
        onSwitchBusiness={onSwitchBusiness}
        onCreateBusiness={onOpenCreateBusiness}
      />

      {!activeBusiness ? (
        <Card className="border border-dashed border-border/70">
          <CardContent className="p-6 text-sm text-muted-foreground">Select a business from sidebar</CardContent>
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
            await queryClient.invalidateQueries({ queryKey: [...customersQueryKey, activeBusinessId] });
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
                      onClick={() => setSelectedParty(row)}
                      className="cursor-pointer hover:bg-muted/60"
                    >
                      <TableCell className="pl-6 font-medium">{row.name}</TableCell>
                      <TableCell>{row.mobileNumber}</TableCell>
                      <TableCell className="pr-6 text-right">{formatInr(Number(row.totalAmount))}</TableCell>
                      <TableCell className="pr-6 text-right">
                        <div
                          onClick={(event) => event.stopPropagation()}
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
                  Showing {(safePage - 1) * PAGE_SIZE + 1}-{Math.min(safePage * PAGE_SIZE, filteredRows.length)} of {" "}
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

      <DetailsModal
        open={!!selectedParty}
        party={selectedParty}
        partyType={audience.partyType}
        onOpenChange={(open) => {
          if (!open) setSelectedParty(null);
        }}
        onDataChanged={async () => {
          await refetch();
          await queryClient.invalidateQueries({ queryKey: [...customersQueryKey, activeBusinessId] });
        }}
      />
    </div>
  );
}
