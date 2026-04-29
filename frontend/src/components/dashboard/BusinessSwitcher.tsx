import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type Category } from "@/services/categories.service";

type BusinessSwitcherProps = {
  businesses: Category[];
  activeBusinessId: number | null;
  onSwitchBusiness: (businessId: number) => void;
  onCreateBusiness: () => void;
};

export function BusinessSwitcher({
  businesses,
  activeBusinessId,
  onSwitchBusiness,
  onCreateBusiness,
}: BusinessSwitcherProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const activeBusiness = useMemo(
    () => businesses.find((business) => business.id === activeBusinessId) ?? null,
    [businesses, activeBusinessId],
  );

  useEffect(() => {
    if (!open) return;
    const handleOutsideClick = (event: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex w-fit items-center gap-1 rounded-md px-1 py-1 text-left text-2xl font-bold tracking-tight text-foreground transition-colors hover:bg-muted/60 hover:text-primary"
      >
        <span>{activeBusiness?.name ?? "Select a business from sidebar"}</span>
        <ChevronDown className="size-4 text-muted-foreground" />
      </button>

      {open ? (
        <div className="absolute left-0 top-[calc(100%+8px)] z-40 w-[320px] rounded-2xl border border-border/60 bg-card/95 p-2 shadow-2xl backdrop-blur">
          <div className="max-h-80 space-y-1 overflow-auto pr-1">
            {businesses.map((business) => {
              const isActive = business.id === activeBusinessId;
              return (
                <button
                  key={business.id}
                  type="button"
                  onClick={() => {
                    onSwitchBusiness(business.id);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition-colors ${
                    isActive ? "bg-primary/10 text-primary" : "hover:bg-muted/80"
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{business.name}</span>
                    <span className="block text-xs capitalize text-muted-foreground">{business.type}</span>
                  </span>
                  {isActive ? <Check className="size-4 shrink-0" /> : null}
                </button>
              );
            })}
          </div>

          <div className="mt-2 border-t border-border/70 pt-2">
            <Button
              type="button"
              variant="ghost"
              className="w-full justify-start gap-2"
              onClick={() => {
                setOpen(false);
                onCreateBusiness();
              }}
            >
              <Plus className="size-4" />
              Create New Business
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
