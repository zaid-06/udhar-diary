import { type ReactNode } from "react";
import { type Category } from "@/modules/categories/api/categories.api";

export type EntityModuleKey = "customers" | "inventory" | "suppliers" | "staff";

export type EntityFieldConfig = {
  name: string;
  label: string;
  type: "text" | "number";
  placeholder?: string;
};

export type EntityColumnConfig<TItem> = {
  key: string;
  label: string;
  className?: string;
  render?: (item: TItem, actions: { reload: () => Promise<void> }) => ReactNode;
};

export type EntityPageContext = {
  categoryId: number;
  activeBusiness: Category | null;
};

export type EntityDetailsConfig<TItem, TDetails> = {
  title: (item: TItem) => string;
  subtitle?: (item: TItem) => string;
  loadDetails?: (item: TItem) => Promise<TDetails | null>;
  logsPosition?: "middle" | "bottom";
  renderSummary: (item: TItem, details: TDetails | null) => ReactNode;
  renderLogs?: (item: TItem, details: TDetails | null) => ReactNode;
  renderEntry?: (
    item: TItem,
    details: TDetails | null,
    actions: { reload: () => Promise<void> },
  ) => ReactNode;
  renderActionBar?: (
    item: TItem,
    details: TDetails | null,
    actions: { reload: () => Promise<void>; close: () => void },
  ) => ReactNode;
};

export type EntityConfig<TItem, TDetails = unknown> = {
  module: EntityModuleKey;
  title: string;
  subtitle: string;
  addLabel: string;
  columns: EntityColumnConfig<TItem>[];
  formFields: EntityFieldConfig[];
  getRowId: (item: TItem) => number;
  search: (item: TItem, query: string) => boolean;
  list: (ctx: EntityPageContext) => Promise<TItem[]>;
  create: (ctx: EntityPageContext, values: Record<string, string>) => Promise<void>;
  details: EntityDetailsConfig<TItem, TDetails>;
};


