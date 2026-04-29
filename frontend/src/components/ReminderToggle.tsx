import { Bell, BellOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/shared/lib/utils";

type ReminderToggleProps = {
  enabled: boolean;
  loading?: boolean;
  onToggle: () => void;
  className?: string;
};

export function ReminderToggle({
  enabled,
  loading = false,
  onToggle,
  className,
}: ReminderToggleProps) {
  return (
    <Tooltip>
      <TooltipTrigger>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onToggle}
          disabled={loading}
          className={cn("transition-colors", className)}
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          ) : enabled ? (
            <Bell className="size-4 text-primary" />
          ) : (
            <BellOff className="size-4 text-muted-foreground" />
          )}
          <span className="sr-only">{enabled ? "Reminder ON" : "Reminder OFF"}</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>{enabled ? "Reminder ON" : "Reminder OFF"}</TooltipContent>
    </Tooltip>
  );
}

