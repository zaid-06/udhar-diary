import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AddEntryFormProps = {
  partyType: "customer" | "student" | "member";
  isSubmitting: boolean;
  onAddEntry: (payload: { title?: string; amount: number }) => Promise<void>;
  onReceivePayment: (amount: number) => Promise<void>;
};

export function AddEntryForm({
  partyType,
  isSubmitting,
  onAddEntry,
  onReceivePayment,
}: AddEntryFormProps) {
  const [entryTitle, setEntryTitle] = useState("");
  const [entryAmount, setEntryAmount] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");

  const addEntryLabel = partyType === "customer" ? "Item Name" : "Fees";

  return (
    <div className="space-y-3 rounded-2xl border border-border/70 p-4">
      <h4 className="text-sm font-semibold">Add Entry</h4>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {partyType === "customer" ? (
          <div className="space-y-1">
            <Label htmlFor="entry-title">{addEntryLabel}</Label>
            <Input
              id="entry-title"
              value={entryTitle}
              onChange={(event) => setEntryTitle(event.target.value)}
              placeholder="Enter item name"
              disabled={isSubmitting}
            />
          </div>
        ) : null}
        <div className="space-y-1">
          <Label htmlFor="entry-amount">Amount</Label>
          <Input
            id="entry-amount"
            type="number"
            min="0"
            step="0.01"
            value={entryAmount}
            onChange={(event) => setEntryAmount(event.target.value)}
            placeholder="0.00"
            disabled={isSubmitting}
          />
        </div>
      </div>
      <Button
        type="button"
        disabled={isSubmitting}
        onClick={async () => {
          const amount = Number(entryAmount);
          if (!Number.isFinite(amount) || amount <= 0) return;
          if (partyType === "customer" && !entryTitle.trim()) return;
          await onAddEntry({
            title: partyType === "customer" ? entryTitle.trim() : undefined,
            amount,
          });
          setEntryAmount("");
          setEntryTitle("");
        }}
      >
        + Add Entry
      </Button>

      <div className="pt-2">
        <h4 className="text-sm font-semibold">Receive Payment</h4>
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto]">
          <Input
            type="number"
            min="0"
            step="0.01"
            value={paymentAmount}
            onChange={(event) => setPaymentAmount(event.target.value)}
            placeholder="Amount"
            disabled={isSubmitting}
          />
          <Button
            type="button"
            variant="secondary"
            disabled={isSubmitting}
            onClick={async () => {
              const amount = Number(paymentAmount);
              if (!Number.isFinite(amount) || amount <= 0) return;
              await onReceivePayment(amount);
              setPaymentAmount("");
            }}
          >
            Mark as Paid
          </Button>
        </div>
      </div>
    </div>
  );
}
