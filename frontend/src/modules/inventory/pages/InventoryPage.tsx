import { useEffect, useMemo, useState } from "react";
import { EntityPage } from "@/components/entity/EntityPage";
import { inventoryConfig } from "../config";
import { InventoryImageCapture } from "../components/InventoryImageCapture";
import {
  defaultInventoryUnitOptions,
  fetchInventoryUnitTypes,
  type InventoryUnitOption,
} from "../api";

export default function InventoryPage() {
  const [unitOptions, setUnitOptions] = useState<InventoryUnitOption[]>(defaultInventoryUnitOptions);

  useEffect(() => {
    let cancelled = false;

    fetchInventoryUnitTypes()
      .then((options) => {
        if (!cancelled && options.length) setUnitOptions(options);
      })
      .catch(() => {
        if (!cancelled) setUnitOptions(defaultInventoryUnitOptions);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const config = useMemo(
    () => ({
      ...inventoryConfig,
      formFields: inventoryConfig.formFields.map((field) =>
        field.name === "unit" ? { ...field, options: unitOptions } : field,
      ),
    }),
    [unitOptions],
  );

  return (
    <EntityPage
      config={config}
      toolbarExtra={({ businessId, reloadList }) => (
        <InventoryImageCapture businessId={businessId} onSuccess={reloadList} />
      )}
    />
  );
}
