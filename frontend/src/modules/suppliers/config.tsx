import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatInr } from "@/lib/format-currency";
import { formatDateTime } from "@/lib/format-date-time";
import { type EntityConfig } from "@/components/entity/types";
import {
  createSupplier,
  createSupplierTransaction,
  fetchSuppliers,
  fetchSupplierTransactions,
  type Supplier,
  type SupplierTransaction,
} from "./api";

type SupplierDetails = {
  transactions: SupplierTransaction[];
};

function SupplierEntrySection({
  item,
  reload,
}: {
  item: Supplier;
  reload: () => Promise<void>;
}) {
  const [amount, setAmount] = useState("");
  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold">Add Supplier Payment</p>
      <div className="flex gap-2">
        <Input type="number" placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <Button
          variant="outline"
          onClick={async () => {
            await createSupplierTransaction(item.id, { amount: Number(amount || 0), type: "taken" });
            setAmount("");
            await reload();
          }}
        >
          Taken
        </Button>
        <Button
          variant="outline"
          onClick={async () => {
            await createSupplierTransaction(item.id, { amount: Number(amount || 0), type: "given" });
            setAmount("");
            await reload();
          }}
        >
          Given
        </Button>
      </div>
    </div>
  );
}

export const suppliersConfig: EntityConfig<Supplier, SupplierDetails> = {
  module: "suppliers",
  title: "Suppliers",
  subtitle: "Manage suppliers and outstanding balances.",
  addLabel: "Add Supplier",
  columns: [
    { key: "name", label: "Name", className: "pl-6 font-medium" },
    { key: "mobile", label: "Mobile" },
    { key: "outstandingBalance", label: "Balance", className: "pr-6 text-right", render: (item) => formatInr(item.outstandingBalance) },
  ],
  formFields: [
    { name: "name", label: "Name", type: "text" },
    { name: "mobile", label: "Mobile", type: "text" },
    { name: "address", label: "Address", type: "text" },
  ],
  getRowId: (item) => item.id,
  search: (item, q) => item.name.toLowerCase().includes(q) || item.mobile.toLowerCase().includes(q),
  list: async (ctx) => fetchSuppliers(ctx.categoryId),
  create: async (ctx, values) => {
    await createSupplier({
      categoryId: ctx.categoryId,
      name: values.name,
      mobile: values.mobile,
      address: values.address,
    });
  },
  details: {
    title: (item) => item.name,
    subtitle: (item) => item.mobile,
    loadDetails: async (item) => ({ transactions: await fetchSupplierTransactions(item.id) }),
    renderSummary: (item) => (
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs text-muted-foreground">Outstanding Balance</p>
          <p className="font-semibold">{formatInr(item.outstandingBalance)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Address</p>
          <p className="font-medium">{item.address}</p>
        </div>
      </div>
    ),
    renderLogs: (_, details) => (
      <div className="space-y-2">
        <p className="text-sm font-semibold">Transactions</p>
        {!details?.transactions.length ? (
          <p className="text-sm text-muted-foreground">No supplier transactions.</p>
        ) : (
          details.transactions.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between rounded-lg border p-2 text-sm">
              <p className="capitalize">{tx.type}</p>
              <p className="text-xs text-muted-foreground">{formatDateTime(tx.createdAt)}</p>
              <p className="font-semibold">{formatInr(tx.amount)}</p>
            </div>
          ))
        )}
      </div>
    ),
    renderEntry: (item, _, { reload }) => <SupplierEntrySection item={item} reload={reload} />,
  },
};
