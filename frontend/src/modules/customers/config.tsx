import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatInr } from "@/lib/format-currency";
import { formatDateTime } from "@/lib/format-date-time";
import { type EntityConfig } from "@/components/entity/types";
import { fetchCustomers, settleCustomerPayment, type Customer } from "./api";
import { createParty } from "@/services/parties.service";
import { createTransaction, fetchTransactionsByParty, type Transaction } from "@/services/transactions.service";

type CustomerDetails = {
  transactions: Transaction[];
};

function CustomerEntrySection({
  item,
  reload,
}: {
  item: Customer;
  reload: () => Promise<void>;
}) {
  const [amount, setAmount] = useState("");
  const [title, setTitle] = useState("");

  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold">Add Entry</p>
      <Input placeholder="Title (item/fees)" value={title} onChange={(e) => setTitle(e.target.value)} />
      <div className="flex gap-2">
        <Input type="number" placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <Button
          onClick={async () => {
            const numeric = Number(amount);
            if (!Number.isFinite(numeric) || numeric <= 0) return;
            await createTransaction({
              partyId: item.id,
              type: "credit",
              title: title || "Entry",
              amount: numeric,
            });
            setAmount("");
            setTitle("");
            await reload();
          }}
        >
          + Add
        </Button>
      </div>
    </div>
  );
}

export const customerConfig: EntityConfig<Customer, CustomerDetails> = {
  module: "customers",
  title: "Customers",
  subtitle: "Manage customers, students, or members with outstanding balances.",
  addLabel: "Add Customer",
  columns: [
    { key: "name", label: "Name", className: "pl-6 font-medium" },
    { key: "mobileNumber", label: "Mobile" },
    {
      key: "totalAmount",
      label: "Amount",
      className: "pr-6 text-right",
      render: (item) => formatInr(Number(item.totalAmount)),
    },
  ],
  formFields: [
    { name: "name", label: "Name", type: "text" },
    { name: "mobile", label: "Mobile", type: "text" },
  ],
  getRowId: (item) => item.id,
  search: (item, q) =>
    item.name.toLowerCase().includes(q) || item.mobileNumber.toLowerCase().includes(q),
  list: async (ctx) => fetchCustomers(ctx.categoryId),
  create: async (ctx, values) => {
    const categoryType = ctx.activeBusiness?.type ?? "shop";
    await createParty({
      categoryId: ctx.categoryId,
      name: values.name,
      mobile: values.mobile,
      type: categoryType === "shop" ? "customer" : categoryType === "institute" ? "student" : "member",
    });
  },
  details: {
    title: (item) => item.name,
    subtitle: (item) => item.mobileNumber,
    loadDetails: async (item) => ({
      transactions: await fetchTransactionsByParty(item.id),
    }),
    renderSummary: (item) => (
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs text-muted-foreground">Outstanding</p>
          <p className="font-semibold">{formatInr(Number(item.totalAmount))}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Created</p>
          <p className="font-medium">{formatDateTime(item.createdAt)}</p>
        </div>
      </div>
    ),
    renderLogs: (_, details) => (
      <div className="space-y-2">
        <p className="text-sm font-semibold">Transactions</p>
        {!details?.transactions.length ? (
          <p className="text-sm text-muted-foreground">No transactions.</p>
        ) : (
          details.transactions.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between rounded-lg border p-2 text-sm">
              <div>
                <p className="font-medium">{tx.title}</p>
                <p className="text-xs text-muted-foreground">{formatDateTime(tx.createdAt)}</p>
              </div>
              <p className={tx.type === "credit" ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
                {tx.type === "debit" ? "-" : "+"}
                {formatInr(Number(tx.amount))}
              </p>
            </div>
          ))
        )}
      </div>
    ),
    renderEntry: (item, _, { reload }) => (
      <CustomerEntrySection item={item} reload={reload} />
    ),
    renderActionBar: (item, _, { reload, close }) => (
      <div className="flex justify-end">
        <Button
          variant="outline"
          onClick={async () => {
            await settleCustomerPayment(item.id, Number(item.totalAmount));
            await reload();
            close();
          }}
        >
          Settle Payment
        </Button>
      </div>
    ),
  },
};
