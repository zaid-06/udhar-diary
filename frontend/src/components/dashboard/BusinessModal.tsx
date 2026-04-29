import { type FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type BusinessType } from "@/modules/categories/api/categories.api";

type BusinessModalProps = {
  open: boolean;
  isSubmitting: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: { type: BusinessType; name: string; address: string }) => Promise<void>;
};

export function BusinessModal({ open, isSubmitting, onOpenChange, onSubmit }: BusinessModalProps) {
  const [type, setType] = useState<BusinessType>("shop");
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");

  useEffect(() => {
    if (!open) {
      setType("shop");
      setName("");
      setAddress("");
    }
  }, [open]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    await onSubmit({
      type,
      name: name.trim(),
      address: address.trim(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Business</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="business-type">Type</Label>
            <select
              id="business-type"
              value={type}
              onChange={(event) => setType(event.target.value as BusinessType)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              required
            >
              <option value="shop">Shop</option>
              <option value="institute">Institute</option>
              <option value="gym">Gym</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="business-name">Business Name</Label>
            <Input
              id="business-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="ABC Coaching"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="business-address">Address</Label>
            <Input
              id="business-address"
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              placeholder="Main Road"
              required
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Business"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}


