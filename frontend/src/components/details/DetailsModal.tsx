import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ReminderToggle } from "@/components/ReminderToggle";
import { SummaryCard } from "./SummaryCard";
import { TransactionsList } from "./TransactionsList";
import { AddEntryForm } from "./AddEntryForm";
import { type Customer, settleCustomerPayment, toggleCustomerReminder } from "@/services/customers.service";
import { addItemToCustomer, fetchCustomerItems, type CustomerItem } from "@/services/items.service";
import {
  createPaymentTransaction,
  createTransaction,
  fetchTransactionsByParty,
  type Transaction,
} from "@/services/transactions.service";
import { fetchStudentDetails, type StudentDetails } from "@/services/student-details.service";
import { getErrorMessage } from "@/lib/get-error-message";

type DetailsModalProps = {
  open: boolean;
  party: Customer | null;
  partyType: "customer" | "student" | "member";
  onOpenChange: (open: boolean) => void;
  onDataChanged: () => Promise<void>;
};

export function DetailsModal({ open, party, partyType, onOpenChange, onDataChanged }: DetailsModalProps) {
  const [activeTab, setActiveTab] = useState<"transactions" | "history">("transactions");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [items, setItems] = useState<CustomerItem[]>([]);
  const [studentDetails, setStudentDetails] = useState<StudentDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [totalAmount, setTotalAmount] = useState(0);

  const partyTypeLabel = useMemo(() => {
    if (partyType === "student") return "Student";
    if (partyType === "member") return "Member";
    return "Customer";
  }, [partyType]);

  const refreshDetails = async () => {
    if (!party) return;
    setLoading(true);
    try {
      const [txRows, itemRows, student] = await Promise.all([
        fetchTransactionsByParty(party.id),
        partyType === "customer" ? fetchCustomerItems(party.id) : Promise.resolve([]),
        partyType === "student" ? fetchStudentDetails(party.id) : Promise.resolve(null),
      ]);

      setTransactions([...txRows].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)));
      setItems([...itemRows].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)));
      setStudentDetails(student);
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to load details."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!party) return;
    setReminderEnabled(party.reminderEnabled);
    setTotalAmount(Number(party.totalAmount));
    setActiveTab("transactions");
    void refreshDetails();
  }, [party, partyType]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex h-[90vh] max-w-[calc(100%-1rem)] flex-col gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-4xl"
      >
        {party ? (
          <>
            <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-card/95 px-4 py-3 backdrop-blur">
              <div>
                <h2 className="text-lg font-bold">{party.name}</h2>
                <p className="text-sm text-muted-foreground">{party.mobileNumber}</p>
              </div>
              <div className="flex items-center gap-2">
                <ReminderToggle
                  enabled={reminderEnabled}
                  loading={submitting}
                  onToggle={async () => {
                    setSubmitting(true);
                    try {
                      const updated = await toggleCustomerReminder(party.id);
                      setReminderEnabled(updated.reminderEnabled);
                      await onDataChanged();
                    } finally {
                      setSubmitting(false);
                    }
                  }}
                />
                <Button type="button" variant="ghost" size="icon-sm" onClick={() => onOpenChange(false)}>
                  <X className="size-4" />
                </Button>
              </div>
            </div>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
              <SummaryCard
                totalAmount={totalAmount}
                createdAt={party.createdAt}
                partyTypeLabel={partyTypeLabel}
                studentDetails={studentDetails}
              />

              <div className="rounded-2xl border border-border/70 p-2">
                <div className="mb-2 flex items-center gap-2">
                  <Button
                    type="button"
                    variant={activeTab === "transactions" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setActiveTab("transactions")}
                  >
                    Transactions
                  </Button>
                  <Button
                    type="button"
                    variant={activeTab === "history" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setActiveTab("history")}
                  >
                    History
                  </Button>
                </div>
                {loading ? (
                  <p className="p-3 text-sm text-muted-foreground">Loading...</p>
                ) : (
                  <TransactionsList activeTab={activeTab} transactions={transactions} items={items} />
                )}
              </div>

              <AddEntryForm
                partyType={partyType}
                isSubmitting={submitting}
                onAddEntry={async ({ title, amount }) => {
                  setSubmitting(true);
                  try {
                    if (partyType === "customer") {
                      await addItemToCustomer({
                        partyId: party.id,
                        itemName: title ?? "Item",
                        amount,
                      });
                    } else {
                      await createTransaction({
                        partyId: party.id,
                        type: "credit",
                        title: partyType === "student" ? "Monthly Fees" : "Gym Fees",
                        amount,
                      });
                    }
                    await onDataChanged();
                    await refreshDetails();
                    setTotalAmount((prev) => prev + amount);
                    toast.success("Entry added.");
                  } catch (error) {
                    toast.error(getErrorMessage(error, "Failed to add entry."));
                  } finally {
                    setSubmitting(false);
                  }
                }}
                onReceivePayment={async (amount) => {
                  setSubmitting(true);
                  try {
                    await createPaymentTransaction(party.id, amount);
                    await onDataChanged();
                    await refreshDetails();
                    setTotalAmount((prev) => Math.max(0, prev - amount));
                    toast.success("Payment recorded.");
                  } catch (error) {
                    toast.error(getErrorMessage(error, "Failed to record payment."));
                  } finally {
                    setSubmitting(false);
                  }
                }}
              />
            </div>

            <div className="sticky bottom-0 flex items-center justify-between gap-3 border-t bg-card/95 px-4 py-3 backdrop-blur">
              <Button
                type="button"
                variant="outline"
                disabled={submitting || totalAmount <= 0}
                onClick={async () => {
                  setSubmitting(true);
                  try {
                    await settleCustomerPayment(party.id, totalAmount);
                    await onDataChanged();
                    setTotalAmount(0);
                    toast.success("Payment settled.");
                  } catch (error) {
                    toast.error(getErrorMessage(error, "Failed to settle payment."));
                  } finally {
                    setSubmitting(false);
                  }
                }}
              >
                Settle Payment
              </Button>
              <ReminderToggle
                enabled={reminderEnabled}
                loading={submitting}
                onToggle={async () => {
                  setSubmitting(true);
                  try {
                    const updated = await toggleCustomerReminder(party.id);
                    setReminderEnabled(updated.reminderEnabled);
                    await onDataChanged();
                  } finally {
                    setSubmitting(false);
                  }
                }}
              />
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
