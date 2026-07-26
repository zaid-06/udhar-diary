import { type ReactNode } from "react";
import { SearchBar } from "@/components/SearchBar";
import { Button } from "@/components/ui/button";

type EntityToolbarProps = {
  searchValue: string;
  onSearchChange: (value: string) => void;
  addLabel: string;
  onAddClick: () => void;
  extraActions?: ReactNode;
};

export function EntityToolbar({
  searchValue,
  onSearchChange,
  addLabel,
  onAddClick,
  extraActions,
}: EntityToolbarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <SearchBar value={searchValue} onChange={onSearchChange} />
      <div className="flex items-center gap-2">
        <Button type="button" onClick={onAddClick}>
          + {addLabel}
        </Button>
        {extraActions}
      </div>
    </div>
  );
}

