import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { type EntityDetailsConfig } from "./types";

type EntityDetailsModalProps<TItem, TDetails> = {
  open: boolean;
  item: TItem | null;
  details: TDetails | null;
  loading: boolean;
  config: EntityDetailsConfig<TItem, TDetails>;
  onReload: () => Promise<void>;
  onOpenChange: (open: boolean) => void;
};

export function EntityDetailsModal<TItem, TDetails>({
  open,
  item,
  details,
  loading,
  config,
  onReload,
  onOpenChange,
}: EntityDetailsModalProps<TItem, TDetails>) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[90vh] max-w-[calc(100%-1rem)] flex-col gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-4xl">
        {item ? (
          <>
            <div className="sticky top-0 z-10 border-b bg-card/95 px-4 py-3 backdrop-blur">
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-3">
                  <DialogTitle>{config.title(item)}</DialogTitle>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Close details"
                    onClick={() => onOpenChange(false)}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
                {config.subtitle ? <DialogDescription>{config.subtitle(item)}</DialogDescription> : null}
              </div>
            </div>
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
              <Card className="rounded-2xl border border-border/70">
                <CardContent className="p-4">
                  {loading ? <p className="text-sm text-muted-foreground">Loading...</p> : config.renderSummary(item, details)}
                </CardContent>
              </Card>
              {config.renderLogs && (config.logsPosition ?? "middle") !== "bottom" ? (
                <Card className="rounded-2xl border border-border/70">
                  <CardContent className="p-4">{config.renderLogs(item, details)}</CardContent>
                </Card>
              ) : null}
              {config.renderEntry ? (
                <Card className="rounded-2xl border border-border/70">
                  <CardContent className="p-4">
                    {config.renderEntry(item, details, {
                      reload: onReload,
                    })}
                  </CardContent>
                </Card>
              ) : null}
              {config.renderLogs && (config.logsPosition ?? "middle") === "bottom" ? (
                <Card className="rounded-2xl border border-border/70">
                  <CardContent className="p-4">{config.renderLogs(item, details)}</CardContent>
                </Card>
              ) : null}
            </div>
            {config.renderActionBar ? (
              <div className="sticky bottom-0 border-t bg-card/95 px-4 py-3 backdrop-blur">
                {config.renderActionBar(item, details, {
                  reload: onReload,
                  close: () => onOpenChange(false),
                })}
              </div>
            ) : null}
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

