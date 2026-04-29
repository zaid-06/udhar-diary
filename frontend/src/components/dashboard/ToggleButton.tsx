import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

type ToggleButtonProps = {
  collapsed: boolean;
  onToggle: () => void;
};

export function ToggleButton({ collapsed, onToggle }: ToggleButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      size="icon-sm"
      className="hidden md:inline-flex"
      onClick={(event) => {
        event.stopPropagation();
        onToggle();
      }}
      aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
    >
      {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
    </Button>
  );
}

