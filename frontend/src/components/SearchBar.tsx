import { Input } from "@/components/ui/input";

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
};

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <Input
      placeholder="Search by name or mobile..."
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-9 min-w-0 w-full flex-1 sm:max-w-56"
    />
  );
}
