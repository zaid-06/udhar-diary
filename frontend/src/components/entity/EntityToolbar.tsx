import { type ReactNode } from "react";
import { SearchBar } from "@/components/SearchBar";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";

type EntityToolbarProps = {
  searchValue: string;
  onSearchChange: (value: string) => void;
  sortValue: string;
  sortOptions: { value: string; label: string }[];
  onSortChange: (value: string) => void;
  addLabel: string;
  onAddClick: () => void;
  extraActions?: ReactNode;
};

export function EntityToolbar({
  searchValue,
  onSearchChange,
  sortValue,
  sortOptions,
  onSortChange,
  addLabel,
  onAddClick,
  extraActions,
}: EntityToolbarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
        <SearchBar value={searchValue} onChange={onSearchChange} />
        {sortOptions.length > 0 ? (
          <div className="flex h-9 items-center gap-1">
            <label htmlFor="entity-sort" className="shrink-0 text-sm text-muted-foreground">Sort By</label>
            <div className="relative">
              <select
                id="entity-sort"
                value={sortValue}
                onChange={(event) => onSortChange(event.target.value)}
                className="h-9 min-w-32 appearance-none rounded-lg border border-input bg-card py-1 pl-2.5 pr-9 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            </div>
          </div>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        <Button type="button" onClick={onAddClick}>
          + {addLabel}
        </Button>
        {extraActions}
      </div>
    </div>
  );
}

