import { SearchBar } from "@/components/SearchBar";
import { Button } from "@/components/ui/button";

type EntityToolbarProps = {
  searchValue: string;
  onSearchChange: (value: string) => void;
  addLabel: string;
  onAddClick: () => void;
};

export function EntityToolbar({
  searchValue,
  onSearchChange,
  addLabel,
  onAddClick,
}: EntityToolbarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <SearchBar value={searchValue} onChange={onSearchChange} />
      <Button type="button" onClick={onAddClick}>
        + {addLabel}
      </Button>
    </div>
  );
}

