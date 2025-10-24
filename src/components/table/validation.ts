/**
 * Table Validation Schemas
 * Zod schemas for table-related inputs
 */

import { z } from "zod";
import { dataTableConfig } from "@/components/table/config";

// ============================================================================
// Pagination Validation
// ============================================================================

export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  perPage: z.number().int().positive().max(100).default(20),
});

export const seeMorePaginationSchema = z.object({
  loadedCount: z.number().int().nonnegative().default(0),
  batchSize: z.number().int().positive().max(100).default(20),
});

export type PaginationInput = z.infer<typeof paginationSchema>;
export type SeeMorePaginationInput = z.infer<typeof seeMorePaginationSchema>;

// ============================================================================
// Sorting Validation
// ============================================================================

export const sortingItemSchema = z.object({
  id: z.string().min(1),
  desc: z.boolean(),
});

export const sortingSchema = z.array(sortingItemSchema);

export type SortingInput = z.infer<typeof sortingSchema>;

// ============================================================================
// Filtering Validation
// ============================================================================

export const filterItemSchema = z.object({
  id: z.string().min(1),
  value: z.union([z.string(), z.array(z.string())]),
  variant: z.enum(dataTableConfig.filterVariants),
  operator: z.enum(dataTableConfig.operators),
  filterId: z.string(),
});

export const filterSchema = z.array(filterItemSchema);

export type FilterInput = z.infer<typeof filterItemSchema>;
export type FiltersInput = z.infer<typeof filterSchema>;

// ============================================================================
// Search Params Validation
// ============================================================================

export const tableSearchParamsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  perPage: z.coerce.number().int().positive().max(100).default(20),
  sort: z.string().optional(),
  filters: z.string().optional(),
});

export const seeMoreSearchParamsSchema = z.object({
  loadedCount: z.coerce.number().int().nonnegative().default(0),
  batchSize: z.coerce.number().int().positive().max(100).default(20),
  sort: z.string().optional(),
  filters: z.string().optional(),
});

export type TableSearchParams = z.infer<typeof tableSearchParamsSchema>;
export type SeeMoreSearchParams = z.infer<typeof seeMoreSearchParamsSchema>;

// ============================================================================
// Export Validation
// ============================================================================

export const exportOptionsSchema = z.object({
  filename: z.string().min(1).default("export"),
  excludeColumns: z.array(z.string()).default([]),
  onlySelected: z.boolean().default(false),
  format: z.enum(["csv", "json", "excel"]).default("csv"),
});

export type ExportOptions = z.infer<typeof exportOptionsSchema>;
