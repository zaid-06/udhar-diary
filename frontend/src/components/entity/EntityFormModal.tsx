import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {fields.map((field) => (
            <div key={field.name} className="space-y-1">
              <Label>{field.label}</Label>
              <Input
                type={field.type}
                placeholder={field.placeholder}
                value={values[field.name] ?? ""}
                onChange={(event) => setValues((prev) => ({ ...prev, [field.name]: event.target.value }))}
                disabled={submitting}
              />
            </div>
          ))}
          <Button
            type="button"
            disabled={submitting}
            onClick={async () => {
              setSubmitting(true);
              try {
                await onSubmit(values);
                setValues({});
                onOpenChange(false);
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {submitting ? "Saving..." : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

