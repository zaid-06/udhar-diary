import { EntityPage } from "@/components/entity/EntityPage";
import { inventoryConfig } from "../config";
import { InventoryImageCapture } from "../components/InventoryImageCapture";

export default function InventoryPage() {
  return (
    <EntityPage
      config={inventoryConfig}
      toolbarExtra={({ businessId, reloadList }) => (
        <InventoryImageCapture businessId={businessId} onSuccess={reloadList} />
      )}
    />
  );
}
