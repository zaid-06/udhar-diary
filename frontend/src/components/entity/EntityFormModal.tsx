import { type FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/shared/lib/get-error-message";
import { type EntityFieldConfig } from "./types";

type EntityFormModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  fields: EntityFieldConfig[];
  onSubmit: (values: Record<string, string>) => Promise<void>;
};

export function EntityFormModal({ open, onOpenChange, title, fields, onSubmit }: EntityFormModalProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) setValues({});
  }, [open]);

  const getFieldValue = (field: EntityFieldConfig) =>
    values[field.name] ?? (field.type === "select" ? field.options?.[0]?.value ?? "" : "");

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const nextValues = fields.reduce<Record<string, string>>((acc, field) => {
      acc[field.name] = getFieldValue(field);
      return acc;
    }, {});

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
          {fields.map((field) => (
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
          ))}
          <Button type="submit" disabled={submitting}>
            {submitting ? "Saving..." : "Save"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
