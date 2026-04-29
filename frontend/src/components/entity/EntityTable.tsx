import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { type EntityColumnConfig } from "./types";

type EntityTableProps<TItem> = {
  rows: TItem[];
  columns: EntityColumnConfig<TItem>[];
  onRowClick: (item: TItem) => void;
  onReload: () => Promise<void>;
};

export function EntityTable<TItem>({ rows, columns, onRowClick, onReload }: EntityTableProps<TItem>) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((column) => (
            <TableHead key={column.key} className={column.className}>
              {column.label}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row, index) => (
          <TableRow key={index} className="cursor-pointer hover:bg-muted/60" onClick={() => onRowClick(row)}>
            {columns.map((column) => (
              <TableCell key={column.key} className={column.className}>
                {column.render
                  ? column.render(row, { reload: onReload })
                  : String((row as Record<string, unknown>)[column.key] ?? "")}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

