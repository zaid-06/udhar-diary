import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { AppLayoutContext } from "@/layout/AppLayout";
import { EntityToolbar } from "./EntityToolbar";
import { EntityFormModal } from "./EntityFormModal";
import { EntityTable } from "./EntityTable";
import { EntityDetailsModal } from "./EntityDetailsModal";
import { type EntityConfig } from "./types";

type EntityPageProps<TItem, TDetails> = {
  config: EntityConfig<TItem, TDetails>;
  toolbarExtra?: ReactNode | ((ctx: EntityToolbarExtraContext) => ReactNode);
  beforeCard?: ReactNode;
};

export type EntityToolbarExtraContext = {
  businessId: string | null;
  reloadList: () => Promise<void>;
};

export function EntityPage<TItem, TDetails>({
  config,
  toolbarExtra,
  beforeCard,
}: EntityPageProps<TItem, TDetails>) {
  const {
    activeBusinessId,
    activeBusiness,
  } = useOutletContext<AppLayoutContext>();

  const [rows, setRows] = useState<TItem[]>([]);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState(config.sortOptions?.[0]?.value ?? "");
  const [openAdd, setOpenAdd] = useState(false);
  const [selected, setSelected] = useState<TItem | null>(null);
  const [details, setDetails] = useState<TDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [listLoading, setListLoading] = useState(true);
  const [listBusinessId, setListBusinessId] = useState<string | null>(null);
  const listRequestId = useRef(0);

  const context = useMemo(
    () => ({
      categoryId: activeBusinessId ?? "",
      activeBusiness,
    }),
    [activeBusinessId, activeBusiness],
  );

  const loadList = async () => {
    const requestId = ++listRequestId.current;
    if (!activeBusinessId) {
      setRows([]);
      setListBusinessId(null);
      setListLoading(false);
      return;
    }

    setListLoading(true);
    try {
      const data = await config.list(context);
      if (requestId === listRequestId.current) setRows(data);
    } finally {
      if (requestId === listRequestId.current) {
        setListBusinessId(activeBusinessId);
        setListLoading(false);
      }
    }
  };

  useEffect(() => {
    void loadList();
    return () => {
      listRequestId.current += 1;
    };
  }, [activeBusinessId]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => config.search(row, q));
  }, [rows, search, config]);

  const sortedRows = useMemo(() => {
    const comparator = config.sortOptions?.find((option) => option.value === sortBy)?.compare;
    return comparator ? [...filteredRows].sort(comparator) : filteredRows;
  }, [filteredRows, config, sortBy]);

  const openDetails = async (item: TItem) => {
    setSelected(item);
    if (!config.details.loadDetails) return;
    setDetailsLoading(true);
    try {
      const loaded = await config.details.loadDetails(item);
      setDetails(loaded);
    } finally {
      setDetailsLoading(false);
    }
  };

  const resolvedToolbarExtra =
    typeof toolbarExtra === "function"
      ? toolbarExtra({ businessId: activeBusinessId, reloadList: loadList })
      : toolbarExtra;

  return (
    <div className="space-y-4">
      <EntityToolbar
        searchValue={search}
        onSearchChange={setSearch}
        sortValue={sortBy}
        sortOptions={config.sortOptions ?? []}
        onSortChange={setSortBy}
        addLabel={config.addLabel}
        onAddClick={() => setOpenAdd(true)}
        extraActions={resolvedToolbarExtra}
      />

      {beforeCard}

      <Card className="border-0 shadow-md ring-1 ring-border/60">
        <CardHeader className="border-b border-border/60 bg-card pb-0">
          <CardTitle>{config.title}</CardTitle>
          <CardDescription>{config.subtitle}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {listLoading || listBusinessId !== activeBusinessId ? (
            <div className="flex min-h-40 items-center justify-center" role="status" aria-live="polite">
              <Loader2 className="size-6 animate-spin text-muted-foreground" aria-hidden="true" />
              <span className="sr-only">Loading {config.title.toLowerCase()}</span>
            </div>
          ) : (
            <EntityTable
              rows={sortedRows}
              columns={config.columns}
              onRowClick={openDetails}
              onReload={loadList}
            />
          )}
        </CardContent>
      </Card>

      <EntityFormModal
        open={openAdd}
        onOpenChange={setOpenAdd}
        title={config.addLabel}
        fields={config.formFields}
        inventoryEntry={config.inventoryEntry}
        inventoryProduct={config.inventoryProduct}
        inventoryBusinessId={activeBusinessId}
        onSubmit={async (values) => {
          await config.create(context, values);
          await loadList();
        }}
      />

      <EntityDetailsModal
        open={!!selected}
        item={selected}
        details={details}
        loading={detailsLoading}
        config={config.details}
        onReload={async () => {
          if (selected && config.details.loadDetails) {
            const loaded = await config.details.loadDetails(selected);
            setDetails(loaded);
          }
          await loadList();
        }}
        onOpenChange={(open) => {
          if (!open) {
            setSelected(null);
            setDetails(null);
          }
        }}
      />
    </div>
  );
}
