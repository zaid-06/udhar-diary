import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { type Category } from "@/modules/categories/api/categories.api";

type BusinessDetailsDialogProps = {
  business: Category | null;
  editBusinessName: string;
  isSaving: boolean;
  onOpenChange: (open: boolean) => void;
  onEditBusinessNameChange: (value: string) => void;
  onToggleStatus: () => Promise<void>;
  onSaveName: () => Promise<void>;
  onDelete: () => Promise<void>;
};

export function BusinessDetailsDialog({
  business,
  editBusinessName,
  isSaving,
  onOpenChange,
  onEditBusinessNameChange,
  onToggleStatus,
  onSaveName,
  onDelete,
}: BusinessDetailsDialogProps) {
  return (
    <Dialog open={!!business} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[calc(100%-2rem)] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Business Details</DialogTitle>
        </DialogHeader>
        {business ? (
          <div className="space-y-3">
            <div className="rounded-lg border border-border/70 bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground">Business Name</p>
              <Input
                value={editBusinessName}
                onChange={(event) => onEditBusinessNameChange(event.target.value)}
                className="mt-1 h-9"
              />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-border/70 p-3">
                <p className="text-xs text-muted-foreground">Type</p>
                <p className="text-sm font-medium capitalize">{business.type}</p>
              </div>
              <div className="rounded-lg border border-border/70 p-3">
                <p className="text-xs text-muted-foreground">Status</p>
                <p className="text-sm font-medium">{business.isActive ? "Active" : "Inactive"}</p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="mt-2"
                  disabled={isSaving}
                  onClick={() => void onToggleStatus()}
                >
                  {business.isActive ? "Set Inactive" : "Set Active"}
                </Button>
              </div>
            </div>
            <div className="rounded-lg border border-border/70 p-3">
              <p className="text-xs text-muted-foreground">Address</p>
              <p className="text-sm font-medium">{business.address}</p>
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button type="button" variant="outline" disabled={isSaving} onClick={() => void onSaveName()}>
                {isSaving ? "Saving..." : "Save Name"}
              </Button>
              <Button type="button" variant="destructive" disabled={isSaving} onClick={() => void onDelete()}>
                Delete Business
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}


