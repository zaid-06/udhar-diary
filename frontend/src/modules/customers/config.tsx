import { useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatInr } from "@/shared/lib/format-currency";
import { formatDateTime } from "@/shared/lib/format-date-time";
import { type EntityConfig } from "@/components/entity/types";
import { fetchCustomers, settleCustomerPayment, toggleCustomerReminder, type Customer } from "./api";
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
    <div className="-mt-1 space-y-2">
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
    {
      key: "reminderEnabled",
      label: "Reminder",
      className: "pr-6 text-right",
      render: (item, { reload }) => (
        <button
          type="button"
          className="ml-auto inline-flex items-center justify-center rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label={item.reminderEnabled ? "Turn reminder off" : "Turn reminder on"}
          onClick={async (event) => {
            event.stopPropagation();
            await toggleCustomerReminder(item.id);
            await reload();
          }}
        >
          {item.reminderEnabled ? (
            <Bell className="size-4 text-emerald-600" aria-hidden />
          ) : (
            <BellOff className="size-4" aria-hidden />
          )}
        </button>
      ),
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
    title: () => "Customer Details",
    logsPosition: "bottom",
    loadDetails: async (item) => ({
      transactions: await fetchTransactionsByParty(item.id),
    }),
    renderSummary: (item) => (
      <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-xs text-muted-foreground">Name</p>
          <p className="font-medium">{item.name}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Mobile</p>
          <p className="font-medium">{item.mobileNumber}</p>
        </div>
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
      <div className="-mt-1 space-y-2">
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

