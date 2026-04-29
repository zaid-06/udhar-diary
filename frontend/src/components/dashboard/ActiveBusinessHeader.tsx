import { ChevronDown } from "lucide-react";

type ActiveBusinessHeaderProps = {
  businessName: string | null;
  onClick: () => void;
};

export function ActiveBusinessHeader({ businessName, onClick }: ActiveBusinessHeaderProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex w-fit items-center gap-1 rounded-md px-1 py-1 text-left transition-colors hover:bg-muted/60 hover:text-primary"
    >
      <h1 className="text-2xl font-bold tracking-tight text-foreground">
        {businessName ?? "Select a business from sidebar"}
      </h1>
      <ChevronDown className="size-4 text-muted-foreground" />
    </button>
  );
}
