import { type ReactNode, useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Header } from "@/layout/Header";
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
    businesses,
    activeBusinessId,
    activeBusiness,
    onSwitchBusiness,
    onOpenCreateBusiness,
  } = useOutletContext<AppLayoutContext>();

  const [rows, setRows] = useState<TItem[]>([]);
  const [search, setSearch] = useState("");
  const [openAdd, setOpenAdd] = useState(false);
  const [selected, setSelected] = useState<TItem | null>(null);
  const [details, setDetails] = useState<TDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const context = useMemo(
    () => ({
      categoryId: activeBusinessId ?? "",
      activeBusiness,
    }),
    [activeBusinessId, activeBusiness],
  );

  const loadList = async () => {
    if (!activeBusinessId) return;
    const data = await config.list(context);
    setRows(data);
  };

  useEffect(() => {
    void loadList();
  }, [activeBusinessId]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => config.search(row, q));
  }, [rows, search, config]);

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
      <Header
        businesses={businesses}
        activeBusinessId={activeBusinessId}
        activeModule={config.module}
        onSwitchBusiness={onSwitchBusiness}
        onCreateBusiness={onOpenCreateBusiness}
      />

      <EntityToolbar
        searchValue={search}
        onSearchChange={setSearch}
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
          <EntityTable
            rows={filteredRows}
            columns={config.columns}
            onRowClick={openDetails}
            onReload={loadList}
          />
        </CardContent>
      </Card>

      <EntityFormModal
        open={openAdd}
        onOpenChange={setOpenAdd}
        title={config.addLabel}
        fields={config.formFields}
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
          if (!selected || !config.details.loadDetails) return;
          const loaded = await config.details.loadDetails(selected);
          setDetails(loaded);
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
