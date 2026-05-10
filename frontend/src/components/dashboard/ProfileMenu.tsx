import { useState } from "react";
import { Moon, Plus, Sun, UserCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { type ThemeMode } from "@/shared/lib/theme";
import { type Category } from "@/modules/categories/api/categories.api";

type ProfileMenuProps = {
  collapsed?: boolean;
  userName?: string | null;
  userEmail?: string | null;
  theme: ThemeMode;
  signingOut: boolean;
  businesses: Category[];
  activeBusinessId: string | null;
  onOpenCreateBusiness: () => void;
  onSwitchBusiness: (businessId: string) => void;
  onToggleTheme: () => void;
  onLogout: () => void;
};

export function ProfileMenu({
  collapsed = false,
  userName,
  userEmail,
  theme,
  signingOut,
  businesses,
  activeBusinessId,
  onOpenCreateBusiness,
  onSwitchBusiness,
  onToggleTheme,
  onLogout,
}: ProfileMenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className={`flex w-full items-center rounded-lg px-2 py-2 text-left hover:bg-muted/80 ${
          collapsed ? "justify-center" : "gap-3"
        }`}
        onClick={() => setOpen(true)}
        title={collapsed ? userName ?? "Profile" : undefined}
      >
        <UserCircle2 className="size-8 text-muted-foreground" />
        {!collapsed ? (
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium">{userName ?? "Profile"}</span>
            <span className="block truncate text-xs text-muted-foreground">{userEmail}</span>
          </span>
        ) : null}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-full max-w-[calc(100%-2rem)] sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Profile & Business Controls</DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            <div className="rounded-lg border border-border/70 bg-muted/40 p-4">
              <p className="text-base font-semibold">{userName ?? "Owner"}</p>
              <p className="mt-1 text-sm text-muted-foreground">{userEmail}</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Button
                variant="outline"
                className="h-10 justify-start"
                onClick={() => {
                  setOpen(false);
                  onOpenCreateBusiness();
                }}
              >
                <Plus className="size-4" />
                Create New Business
              </Button>

              <Button variant="outline" className="h-10 justify-start" onClick={onToggleTheme}>
                {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
                Toggle {theme === "dark" ? "Light" : "Dark"} Mode
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="switch-business" className="text-sm">
                Switch Business
              </Label>
              <select
                id="switch-business"
                value={activeBusinessId ?? ""}
                onChange={(event) => onSwitchBusiness(event.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {businesses.length === 0 ? (
                  <option value="" disabled>
                    No business available
                  </option>
                ) : (
                  businesses.map((business) => (
                    <option key={business.id} value={business.id}>
                      {business.name} ({business.type})
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="flex justify-end">
              <Button variant="destructive" onClick={onLogout} disabled={signingOut}>
                {signingOut ? "Signing out..." : "Logout"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}


