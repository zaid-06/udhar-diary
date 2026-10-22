import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AppLayoutContext } from "@/layout/AppLayout";
import { formatInr } from "@/shared/lib/format-currency";
import { formatDateTime } from "@/shared/lib/format-date-time";
import { type EntityConfig } from "@/components/entity/types";
import { fetchCustomers, settleCustomerPayment, toggleCustomerReminder, type Customer } from "./api";
import { fetchInventory, type InventoryItem } from "@/modules/inventory/api";
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
  const { activeBusinessId } = useOutletContext<AppLayoutContext>();
  const [amount, setAmount] = useState("");
  const [quantity, setQuantity] = useState("");
  const [title, setTitle] = useState("");
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!activeBusinessId) {
      setInventory([]);
      return;
    }

    fetchInventory(activeBusinessId)
      .then((items) => {
        if (!cancelled) setInventory(items);
      })
      .catch(() => {
        if (!cancelled) setInventory([]);
      });

    return () => {
      cancelled = true;
    };
  }, [activeBusinessId]);

  const matchingProducts = useMemo(() => {
    const query = title.trim().toLocaleLowerCase();
    if (!query) return [];
    const uniqueNames = new Set<string>();
    return inventory
      .map(({ productName }) => productName.trim())
      .filter((name) => {
        const normalizedName = name.toLocaleLowerCase();
        if (!normalizedName.startsWith(query) || uniqueNames.has(normalizedName)) return false;
        uniqueNames.add(normalizedName);
        return true;
      });
  }, [inventory, title]);

  const selectedProduct = useMemo(() => {
    const normalizedTitle = title.trim().toLocaleLowerCase();
    if (!normalizedTitle) return undefined;
    return inventory.find(
      (product) => product.productName.trim().toLocaleLowerCase() === normalizedTitle,
    );
  }, [inventory, title]);

  const numericQuantity = Number(quantity);
  const calculatedAmount = selectedProduct && quantity.trim() && Number.isFinite(numericQuantity) && numericQuantity > 0
    ? Number((numericQuantity * selectedProduct.sellingPrice).toFixed(2))
    : undefined;
  const displayedAmount = selectedProduct
    ? calculatedAmount === undefined ? "" : String(calculatedAmount)
    : amount;

  const selectProduct = (productName: string) => {
    setTitle(productName);
    setSuggestionsOpen(false);
    setActiveSuggestion(-1);
  };

  return (
    <div className="-mt-1 space-y-2">
      <p className="text-sm font-semibold">Add Entry</p>
      <div className="relative">
        <Input
          placeholder="Title (item/fees)"
          value={title}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={suggestionsOpen && matchingProducts.length > 0}
          aria-controls="inventory-product-suggestions"
          onFocus={() => setSuggestionsOpen(true)}
          onChange={(event) => {
            setTitle(event.target.value);
            setSuggestionsOpen(true);
            setActiveSuggestion(-1);
          }}
          onKeyDown={(event) => {
            if (!suggestionsOpen || matchingProducts.length === 0) return;
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setActiveSuggestion((current) => (current + 1) % matchingProducts.length);
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setActiveSuggestion((current) => current <= 0 ? matchingProducts.length - 1 : current - 1);
            } else if (event.key === "Enter" && activeSuggestion >= 0) {
              event.preventDefault();
              selectProduct(matchingProducts[activeSuggestion]);
            } else if (event.key === "Escape") {
              setSuggestionsOpen(false);
            }
          }}
          onBlur={() => {
            window.setTimeout(() => setSuggestionsOpen(false), 100);
          }}
        />
        {suggestionsOpen && matchingProducts.length > 0 ? (
          <ul
            id="inventory-product-suggestions"
            role="listbox"
            aria-label="Inventory products"
            className="absolute inset-x-0 top-full z-20 mt-1 max-h-48 overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
          >
            {matchingProducts.map((productName, index) => (
              <li key={productName} role="option" aria-selected={activeSuggestion === index}>
                <button
                  type="button"
                  className={`w-full rounded-sm px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground ${activeSuggestion === index ? "bg-accent text-accent-foreground" : ""}`}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => selectProduct(productName)}
                >
                  {productName}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <div className="flex gap-2">
        <Input
          type="number"
          min="0"
          step="any"
          placeholder="Quantity"
          aria-label="Quantity"
          value={quantity}
          onChange={(event) => setQuantity(event.target.value)}
        />
        <Input
          type="number"
          min="0"
          step="0.01"
          placeholder="Amount"
          aria-label="Amount"
          value={displayedAmount}
          readOnly={Boolean(selectedProduct)}
          onChange={(event) => setAmount(event.target.value)}
        />
        <Button
          onClick={async () => {
            const numeric = Number(displayedAmount);
            if (!Number.isFinite(numeric) || numeric <= 0) return;
            await createTransaction({
              partyId: item.id,
              type: "credit",
              title: title || "Entry",
              amount: numeric,
            });
            setAmount("");
            setQuantity("");
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
    { name: "itemName", label: "Item Name", type: "text" },
    { name: "price", label: "Price", type: "number" },
  ],
  getRowId: (item) => item.id,
  search: (item, q) =>
    item.name.toLowerCase().includes(q) || item.mobileNumber.toLowerCase().includes(q),
  list: async (ctx) => fetchCustomers(ctx.categoryId),
  create: async (ctx, values) => {
    const categoryType = ctx.activeBusiness?.type ?? "shop";
    const createdParty = await createParty({
      categoryId: ctx.categoryId,
      name: values.name,
      mobile: values.mobile,
      type: categoryType === "shop" ? "customer" : categoryType === "institute" ? "student" : "member",
    });

    const itemName = values.itemName?.trim();
    const price = Number(values.price);
    if (itemName && Number.isFinite(price) && price > 0) {
      await createTransaction({
        partyId: createdParty.id,
        type: "credit",
        title: itemName,
        amount: price,
      });
    }
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

