import { type FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type AddItemFormValues = {
  itemName: string;
  amount: number;
};

type AddItemFormProps = {
  onSubmit: (values: AddItemFormValues) => Promise<void>;
  isSubmitting?: boolean;
  initialValues?: AddItemFormValues | null;
};

export function AddItemForm({ onSubmit, isSubmitting = false, initialValues = null }: AddItemFormProps) {
  const [itemName, setItemName] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!initialValues) return;
    setItemName(initialValues.itemName);
    setAmount(String(initialValues.amount));
  }, [initialValues]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const parsedAmount = Number(amount);
    if (!itemName.trim() || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Enter valid item name and amount.");
      return;
    }

    try {
      await onSubmit({
        itemName: itemName.trim(),
        amount: parsedAmount,
      });
      setItemName("");
      setAmount("");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to add item.";
      setError(message);
    }
  };

  return (
    <form className="space-y-2 rounded-lg border p-3" onSubmit={handleSubmit}>
      <h4 className="text-sm font-medium">Add Item</h4>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="item-name">Item Name</Label>
          <Input
            id="item-name"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            placeholder="Rice, Milk, etc."
            disabled={isSubmitting}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="item-amount">Amount</Label>
          <Input
            id="item-amount"
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            disabled={isSubmitting}
          />
        </div>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="flex justify-end">
        <Button type="submit" variant="secondary" disabled={isSubmitting}>
          {isSubmitting ? "Adding…" : "Add Item"}
        </Button>
      </div>
    </form>
  );
}
