import { formatDateTime } from "@/lib/format-date-time";
import { formatInr } from "@/lib/format-currency";
import { type Transaction } from "@/services/transactions.service";
import { type CustomerItem } from "@/services/items.service";

type TransactionsListProps = {
  activeTab: "transactions" | "history";
  transactions: Transaction[];
  items: CustomerItem[];
};

export function TransactionsList({ activeTab, transactions, items }: TransactionsListProps) {
  if (activeTab === "history") {
    return (
      <div className="rounded-xl border border-border/70">
        {!items.length ? (
          <p className="p-4 text-sm text-muted-foreground">No history available.</p>
        ) : (
          <div className="divide-y">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3">
                <div>
                  <p className="text-sm font-medium">{item.itemName}</p>
                  <p className="text-xs text-muted-foreground">{formatDateTime(item.createdAt)}</p>
                </div>
                <p className="text-sm font-semibold text-green-600">{formatInr(Number(item.amount))}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/70">
      {!transactions.length ? (
        <p className="p-4 text-sm text-muted-foreground">No transactions yet.</p>
      ) : (
        <div className="divide-y">
          {transactions.map((entry) => (
            <div key={entry.id} className="grid grid-cols-[1fr_auto] items-center gap-2 p-3 sm:grid-cols-[1fr_auto_auto]">
              <div>
                <p className="text-sm font-medium">{entry.title}</p>
                <p className="text-xs text-muted-foreground">{formatDateTime(entry.createdAt)}</p>
              </div>
              <span className={`text-xs font-medium capitalize ${entry.type === "credit" ? "text-green-600" : "text-red-600"}`}>
                {entry.type}
              </span>
              <p className={`text-sm font-semibold ${entry.type === "credit" ? "text-green-600" : "text-red-600"}`}>
                {entry.type === "debit" ? "-" : "+"}
                {formatInr(Number(entry.amount))}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
