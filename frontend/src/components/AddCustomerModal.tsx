import { type FormEvent, useMemo, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getErrorMessage } from "@/lib/get-error-message";
import { type BusinessType } from "@/services/categories.service";
import { addItemToCustomer } from "@/services/items.service";
import { createParty } from "@/services/parties.service";
import { createTransaction } from "@/services/transactions.service";

const baseSchema = z.object({
  name: z.string().trim().min(2, "Name is required"),
  mobile: z.string().trim().regex(/^\+?[0-9]{10,15}$/, "Enter a valid mobile number"),
});

type AddCustomerModalProps = {
  categoryId: number | null;
  categoryType: BusinessType | null;
  entityLabel?: string;
  onCreated: () => Promise<void> | void;
};

export function AddCustomerModal({ categoryId, categoryType, entityLabel = "Customer", onCreated }: AddCustomerModalProps) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [itemName, setItemName] = useState("");
  const [amountOrFees, setAmountOrFees] = useState("");
  const [studentClass, setStudentClass] = useState("");
  const [rollNumber, setRollNumber] = useState("");

  const schema = useMemo(() => {
    if (categoryType === "institute") {
      return baseSchema.extend({
        class: z.string().trim().min(1, "Class is required"),
        rollNumber: z.string().trim().min(1, "Roll Number is required"),
        fees: z.coerce.number().positive("Fees must be greater than 0"),
      });
    }
    if (categoryType === "gym") {
      return baseSchema.extend({ fees: z.coerce.number().positive("Gym fees must be greater than 0") });
    }
    return baseSchema.extend({
      itemName: z.string().trim().min(1, "Item name is required"),
      amount: z.coerce.number().positive("Amount must be greater than 0"),
    });
  }, [categoryType]);

  const reset = () => {
    setName("");
    setMobile("");
    setItemName("");
    setAmountOrFees("");
    setStudentClass("");
    setRollNumber("");
    setError(null);
    setFieldErrors({});
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    const parsed = schema.safeParse({
      name,
      mobile,
      class: studentClass,
      rollNumber,
      itemName,
      amount: amountOrFees,
      fees: amountOrFees,
    });

    if (!parsed.success) {
      const errors: Record<string, string> = {};
      const flattened = parsed.error.flatten().fieldErrors;
      for (const [key, messages] of Object.entries(flattened)) {
        if (messages?.length) errors[key] = messages[0] as string;
      }
      setFieldErrors(errors);
      return;
    }

    if (!categoryId || !categoryType) {
      toast.error("Please select a business first.");
      return;
    }

    setSubmitting(true);
    try {
      const data = parsed.data as {
        name: string;
        mobile: string;
        class?: string;
        rollNumber?: string;
        itemName?: string;
        amount?: number;
        fees?: number;
      };

      const party = await createParty({
        name: data.name,
        mobile: data.mobile,
        categoryId,
        type: categoryType === "shop" ? "customer" : categoryType === "institute" ? "student" : "member",
        ...(categoryType === "institute" ? { class: data.class, rollNumber: data.rollNumber } : {}),
      });

      if (categoryType === "shop") {
        await addItemToCustomer({ partyId: party.id, itemName: data.itemName ?? "", amount: data.amount ?? 0 });
      } else if (categoryType === "institute") {
        await createTransaction({ partyId: party.id, type: "credit", title: "Monthly Fees", amount: data.fees ?? 0 });
      } else {
        await createTransaction({ partyId: party.id, type: "credit", title: "Gym Fees", amount: data.fees ?? 0 });
      }

      await onCreated();
      toast.success(`${entityLabel} created successfully.`);
      setOpen(false);
      reset();
    } catch (e) {
      const message = getErrorMessage(e, `Failed to create ${entityLabel.toLowerCase()}.`);
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { setOpen(nextOpen); if (!nextOpen) reset(); }}>
      <Button onClick={() => setOpen(true)} disabled={!categoryId || !categoryType}>
        + Add {entityLabel}
      </Button>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add {entityLabel}</DialogTitle>
          <DialogDescription>Fill details and first entry in one step.</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-3 rounded-lg border p-3">
            <p className="text-sm font-medium">{entityLabel} Details</p>
            <div className="space-y-1">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} disabled={submitting} />
              {fieldErrors.name ? <p className="text-xs text-destructive">{fieldErrors.name}</p> : null}
            </div>
            <div className="space-y-1">
              <Label htmlFor="mobile">Mobile Number</Label>
              <Input id="mobile" value={mobile} onChange={(e) => setMobile(e.target.value)} disabled={submitting} />
              {fieldErrors.mobile ? <p className="text-xs text-destructive">{fieldErrors.mobile}</p> : null}
            </div>
            {categoryType === "institute" ? (
              <>
                <div className="space-y-1">
                  <Label htmlFor="class">Class</Label>
                  <Input id="class" value={studentClass} onChange={(e) => setStudentClass(e.target.value)} disabled={submitting} />
                  {fieldErrors.class ? <p className="text-xs text-destructive">{fieldErrors.class}</p> : null}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="rollNumber">Roll Number</Label>
                  <Input id="rollNumber" value={rollNumber} onChange={(e) => setRollNumber(e.target.value)} disabled={submitting} />
                  {fieldErrors.rollNumber ? <p className="text-xs text-destructive">{fieldErrors.rollNumber}</p> : null}
                </div>
              </>
            ) : null}
          </div>

          <div className="space-y-3 rounded-lg border p-3">
            <p className="text-sm font-medium">{categoryType === "shop" ? "First Item Details" : "First Fee Entry"}</p>
            {categoryType === "shop" ? (
              <div className="space-y-1">
                <Label htmlFor="itemName">Item Name</Label>
                <Input id="itemName" value={itemName} onChange={(e) => setItemName(e.target.value)} disabled={submitting} />
                {fieldErrors.itemName ? <p className="text-xs text-destructive">{fieldErrors.itemName}</p> : null}
              </div>
            ) : null}
            <div className="space-y-1">
              <Label htmlFor="amount">{categoryType === "shop" ? "Amount" : categoryType === "institute" ? "Fees (First Entry)" : "Gym Fees"}</Label>
              <Input id="amount" type="number" min="0" step="0.01" value={amountOrFees} onChange={(e) => setAmountOrFees(e.target.value)} disabled={submitting} />
              {fieldErrors.amount || fieldErrors.fees ? <p className="text-xs text-destructive">{fieldErrors.amount ?? fieldErrors.fees}</p> : null}
            </div>
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <DialogFooter>
            <Button type="submit" disabled={submitting}>{submitting ? "Creating..." : `Create ${entityLabel}`}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
