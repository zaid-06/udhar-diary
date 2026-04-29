import { type ReactNode } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";

type EntityDetailsModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle: string;
  summaryGrid: ReactNode;
  logsSection: ReactNode;
  addEntrySection: ReactNode;
  actionBar: ReactNode;
};

export function EntityDetailsModal({
  open,
  onOpenChange,
  title,
  subtitle,
  summaryGrid,
  logsSection,
  addEntrySection,
  actionBar,
}: EntityDetailsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[90vh] max-w-[calc(100%-1rem)] flex-col gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-4xl">
        <div className="sticky top-0 z-10 border-b bg-card/95 px-4 py-3 backdrop-blur">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">{title}</DialogTitle>
            <DialogDescription>{subtitle}</DialogDescription>
          </DialogHeader>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
          <Card className="rounded-2xl border border-border/70">
            <CardContent className="p-4">{summaryGrid}</CardContent>
          </Card>

          <Card className="rounded-2xl border border-border/70">
            <CardContent className="p-4">{logsSection}</CardContent>
          </Card>

          <Card className="rounded-2xl border border-border/70">
            <CardContent className="p-4">{addEntrySection}</CardContent>
          </Card>
        </div>

        <div className="sticky bottom-0 border-t bg-card/95 px-4 py-3 backdrop-blur">{actionBar}</div>
      </DialogContent>
    </Dialog>
  );
}
