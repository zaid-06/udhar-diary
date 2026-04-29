import { EntityPage } from "@/components/entity/EntityPage";
import { inventoryConfig } from "../config";

export default function InventoryPage() {
  return <EntityPage config={inventoryConfig} />;
}

