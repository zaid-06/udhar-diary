import { type FormEvent, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/shared/lib/get-error-message";
import { fetchInventory, type InventoryItem } from "@/modules/inventory/api";
import { type EntityFieldConfig } from "./types";

type EntityFormModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  fields: EntityFieldConfig[];
  inventoryEntry?: boolean;
  inventoryBusinessId?: string | null;
  onSubmit: (values: Record<string, string>) => Promise<void>;
};

export function EntityFormModal({
  open,
  onOpenChange,
  title,
  fields,
  inventoryEntry = false,
  inventoryBusinessId,
  onSubmit,
}: EntityFormModalProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<InventoryItem>();
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      setValues({});
      setSelectedProduct(undefined);
      setSuggestionsOpen(false);
    }
  }, [open]);

  useEffect(() => {
    let cancelled = false;
    if (!open || !inventoryEntry || !inventoryBusinessId) {
      setInventory([]);
      return;
    }

    fetchInventory(inventoryBusinessId)
      .then((items) => {
        if (!cancelled) setInventory(items);
      })
      .catch(() => {
        if (!cancelled) setInventory([]);
      });

    return () => {
      cancelled = true;
    };
  }, [open, inventoryEntry, inventoryBusinessId]);

  const getFieldValue = (field: EntityFieldConfig) =>
    values[field.name] ?? (field.type === "select" ? field.options?.[0]?.value ?? "" : "");

  const itemName = values.itemName ?? "";
  const matchingProducts = useMemo(() => {
    const query = itemName.trim().toLocaleLowerCase();
    if (!query) return [];
    const uniqueNames = new Set<string>();
    return inventory
      .map((product) => product.productName.trim())
      .filter((name) => {
        const normalizedName = name.toLocaleLowerCase();
        if (!normalizedName.startsWith(query) || uniqueNames.has(normalizedName)) return false;
        uniqueNames.add(normalizedName);
        return true;
      });
  }, [inventory, itemName]);

  const quantity = Number(values.quantity);
  const calculatedAmount = selectedProduct && values.quantity?.trim() && Number.isFinite(quantity) && quantity > 0
    ? String(Number((quantity * selectedProduct.sellingPrice).toFixed(2)))
    : undefined;

  const updateItemName = (value: string) => {
    setValues((previous) => ({ ...previous, itemName: value, amount: "" }));
    setSelectedProduct(undefined);
    setSuggestionsOpen(true);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const nextValues = fields.reduce<Record<string, string>>((acc, field) => {
      acc[field.name] = getFieldValue(field);
      return acc;
    }, {});
    if (selectedProduct && itemName.trim().toLocaleLowerCase() === selectedProduct.productName.trim().toLocaleLowerCase()) {
      nextValues.amount = calculatedAmount ?? values.amount ?? "";
      nextValues.inventoryUnit = selectedProduct.unit;
    }

    setSubmitting(true);
    try {
      await onSubmit(nextValues);
      setValues({});
      onOpenChange(false);
      toast.success(`${title} saved.`);
    } catch (error) {
      toast.error(getErrorMessage(error, `Failed to save ${title.toLowerCase()}.`));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form className="space-y-3" onSubmit={handleSubmit}>
          {fields.map((field) => {
            if (inventoryEntry && ["quantity", "amount"].includes(field.name)) return null;

            if (inventoryEntry && field.name === "itemName") {
              return (
                <div key={field.name} className="space-y-1">
                  <Label htmlFor={`entity-field-${field.name}`}>{field.label}</Label>
                  <div className="relative">
                    <Input
                      id={`entity-field-${field.name}`}
                      type="text"
                      placeholder={field.placeholder ?? "Title (item/fees)"}
                      value={itemName}
                      onFocus={() => setSuggestionsOpen(true)}
                      onChange={(event) => updateItemName(event.target.value)}
                      onBlur={() => window.setTimeout(() => setSuggestionsOpen(false), 100)}
                      disabled={submitting}
                    />
                    {suggestionsOpen && matchingProducts.length > 0 ? (
                      <ul role="listbox" aria-label="Inventory products" className="absolute inset-x-0 top-full z-20 mt-1 max-h-48 overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
                        {matchingProducts.map((productName) => (
                          <li key={productName} role="option">
                            <button
                              type="button"
                              className="w-full rounded-sm px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                              onMouseDown={(event) => event.preventDefault()}
                              onClick={() => {
                                setValues((previous) => ({ ...previous, itemName: productName, amount: "" }));
                                setSelectedProduct(inventory.find((product) => product.productName.trim().toLocaleLowerCase() === productName.toLocaleLowerCase()));
                                setSuggestionsOpen(false);
                              }}
                            >
                              {productName}
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="Quantity"
                      aria-label="Quantity"
                      value={getFieldValue({ name: "quantity", label: "Quantity", type: "number" })}
                      onChange={(event) => setValues((previous) => ({ ...previous, quantity: event.target.value }))}
                      disabled={submitting}
                    />
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Amount"
                      aria-label="Amount"
                      value={selectedProduct ? calculatedAmount ?? "" : getFieldValue({ name: "amount", label: "Amount", type: "number" })}
                      readOnly={Boolean(selectedProduct)}
                      onChange={(event) => setValues((previous) => ({ ...previous, amount: event.target.value }))}
                      disabled={submitting}
                    />
                  </div>
                </div>
              );
            }

            return (
            <div key={field.name} className="space-y-1">
              <Label htmlFor={`entity-field-${field.name}`}>{field.label}</Label>
              {field.type === "select" ? (
                <select
                  id={`entity-field-${field.name}`}
                  value={getFieldValue(field)}
                  onChange={(event) => setValues((prev) => ({ ...prev, [field.name]: event.target.value }))}
                  disabled={submitting || !field.options?.length}
                  className="h-8 w-full rounded-lg border border-input bg-popover px-2.5 py-1 text-sm text-popover-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50"
                  style={{
                    backgroundColor: "var(--popover)",
                    color: "var(--popover-foreground)",
                  }}
                  required
                >
                  {(field.options ?? []).map((option) => (
                    <option
                      key={option.value}
                      value={option.value}
                      style={{
                        backgroundColor: "var(--popover)",
                        color: "var(--popover-foreground)",
                      }}
                    >
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : (
                <Input
                  id={`entity-field-${field.name}`}
                  type={field.type}
                  placeholder={field.placeholder}
                  value={values[field.name] ?? ""}
                  onChange={(event) => setValues((prev) => ({ ...prev, [field.name]: event.target.value }))}
                  disabled={submitting}
                />
              )}
            </div>
            );
          })}
          <Button type="submit" disabled={submitting}>
            {submitting ? "Saving..." : "Save"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
