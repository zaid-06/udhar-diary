import { Button } from "@/components/ui/button";
import { formatInr } from "@/shared/lib/format-currency";
import { type EntityConfig } from "@/components/entity/types";
import { createInventory, deleteInventory, fetchInventory, type InventoryItem } from "./api";

export const inventoryConfig: EntityConfig<InventoryItem, null> = {
  module: "inventory",
  title: "Inventory",
  subtitle: "Track products, stock, and pricing.",
  addLabel: "Add Product",
  columns: [
    { key: "productName", label: "Product Name", className: "pl-6 font-medium" },
    { key: "quantity", label: "Quantity", render: (item) => `${item.quantity} ${item.unit}` },
    { key: "sellingPrice", label: "Price", render: (item) => formatInr(item.sellingPrice) },
    {
      key: "lowStock",
      label: "Stock Status",
      className: "pr-6 text-right",
      render: (item) => (
        <span className={item.lowStock ? "text-red-600 text-xs font-medium" : "text-green-600 text-xs font-medium"}>
          {item.lowStock ? "Low" : "Healthy"}
        </span>
      ),
    },
  ],
  formFields: [
    { name: "productName", label: "Product Name", type: "text" },
    { name: "quantity", label: "Quantity", type: "number" },
    { name: "unit", label: "Unit", type: "text", placeholder: "kg / pcs" },
    { name: "purchasePrice", label: "Purchase Price", type: "number" },
    { name: "sellingPrice", label: "Selling Price", type: "number" },
  ],
  getRowId: (item) => item.id,
  search: (item, q) => item.productName.toLowerCase().includes(q),
  list: async (ctx) => fetchInventory(ctx.categoryId),
  create: async (ctx, values) => {
    await createInventory({
      categoryId: ctx.categoryId,
      productName: values.productName,
      quantity: Number(values.quantity || 0),
      unit: values.unit || "pcs",
      purchasePrice: Number(values.purchasePrice || 0),
      sellingPrice: Number(values.sellingPrice || 0),
    });
  },
  details: {
    title: (item) => item.productName,
    subtitle: (item) => `Qty: ${item.quantity} ${item.unit}`,
    renderSummary: (item) => (
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs text-muted-foreground">Selling Price</p>
          <p className="font-medium">{formatInr(item.sellingPrice)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Purchase Price</p>
          <p className="font-medium">{formatInr(item.purchasePrice)}</p>
        </div>
      </div>
    ),
    renderLogs: () => <p className="text-sm text-muted-foreground">Inventory activity log can be extended here.</p>,
    renderEntry: () => <p className="text-sm text-muted-foreground">Use edit API for stock updates.</p>,
    renderActionBar: (item, _, { reload, close }) => (
      <div className="flex justify-end">
        <Button
          variant="destructive"
          onClick={async () => {
            await deleteInventory(item.id);
            await reload();
            close();
          }}
        >
          Delete Product
        </Button>
      </div>
    ),
  },
};

