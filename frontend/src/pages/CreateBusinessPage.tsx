import { type FormEvent, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { categoriesQueryKey } from "@/hooks/useCategories";
import { createCategory, type BusinessType } from "@/services/categories.service";
import { getErrorMessage } from "@/lib/get-error-message";

const businessTypes: { value: BusinessType; label: string }[] = [
  { value: "shop", label: "Shop" },
  { value: "institute", label: "Institute" },
  { value: "gym", label: "Gym" },
];

export function CreateBusinessPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [type, setType] = useState<BusinessType>("shop");
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState<string | null>(null);

  const createBusinessMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: categoriesQueryKey });
      toast.success("Business created successfully.");
      navigate("/dashboard", { replace: true });
    },
  });

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    try {
      await createBusinessMutation.mutateAsync({
        type,
        name: name.trim(),
        address: address.trim(),
      });
    } catch (err) {
      const message = getErrorMessage(err, "Could not create business.");
      setError(message);
      toast.error(message);
    }
  };

  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-xl border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle>Create Business</CardTitle>
          <CardDescription>
            Add your first business to start using dashboard features.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4">
            {error ? (
              <p className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            ) : null}

            <div className="grid gap-2">
              <Label htmlFor="business-type">Business Type</Label>
              <select
                id="business-type"
                value={type}
                onChange={(e) => setType(e.target.value as BusinessType)}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                required
              >
                {businessTypes.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="business-name">Business Name</Label>
              <Input
                id="business-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Zaid General Store"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="business-address">Address</Label>
              <Input
                id="business-address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Main Market, City"
                required
              />
            </div>

            <Button type="submit" disabled={createBusinessMutation.isPending}>
              {createBusinessMutation.isPending ? "Creating..." : "Create Business"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
