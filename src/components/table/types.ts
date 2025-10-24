/**
 * Table Types
 * Consolidated type definitions for the central table block
 */

import type { ColumnSort, Row, RowData } from "@tanstack/react-table";
import type { DataTableConfig } from "@/components/table/config";
import type { FilterItemSchema } from "@/components/table/utils";

// ============================================================================
// TanStack Table Module Augmentation
// ============================================================================

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    label?: string;
    placeholder?: string;
    variant?: FilterVariant;
    options?: Option[];
    range?: [number, number];
    unit?: string;
    icon?: React.FC<React.SVGProps<SVGSVGElement>>;
  }
}

// ============================================================================
// Core Types
// ============================================================================

export interface Option {
  label: string;
  value: string;
  count?: number;
  icon?: React.FC<React.SVGProps<SVGSVGElement>>;
}

export type FilterOperator = DataTableConfig["operators"][number];
export type FilterVariant = DataTableConfig["filterVariants"][number];
export type JoinOperator = DataTableConfig["joinOperators"][number];

export interface ExtendedColumnSort<TData> extends Omit<ColumnSort, "id"> {
  id: Extract<keyof TData, string>;
}

export interface ExtendedColumnFilter<TData> extends FilterItemSchema {
  id: Extract<keyof TData, string>;
}

export interface DataTableRowAction<TData> {
  row: Row<TData>;
  variant: "update" | "delete";
}

// ============================================================================
// Utility Types
// ============================================================================

export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

export type EmptyProps<T extends React.ElementType> = Omit<
  React.ComponentProps<T>,
  keyof React.ComponentProps<T>
>;

export interface SearchParams {
  [key: string]: string | string[] | undefined;
}

// ============================================================================
// Pagination Types (NEW)
// ============================================================================

export type PaginationType = "pages" | "seeMore";

export interface SeeMorePaginationState {
  loadedCount: number;
  batchSize: number;
  hasMore: boolean;
  total?: number;
}

export interface ServerPaginationResult<TData> {
  data: TData[];
  hasMore: boolean;
  total: number;
}
