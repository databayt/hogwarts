/**
 * Table Utilities
 * Consolidated utility functions for the central table block
 */

import type { Column, Table } from "@tanstack/react-table"
import { createParser } from "nuqs/server"
import { z } from "zod"

import { dataTableConfig } from "@/components/table/config"
import type {
  ExtendedColumnFilter,
  ExtendedColumnSort,
  FilterOperator,
  FilterVariant,
} from "@/components/table/types"

// ============================================================================
// Column Pinning Styles
// ============================================================================

export function getCommonPinningStyles<TData>({
  column,
  withBorder = false,
}: {
  column: Column<TData>
  withBorder?: boolean
}): React.CSSProperties {
  const isPinned = column.getIsPinned()
  const isLastLeftPinnedColumn =
    isPinned === "left" && column.getIsLastColumn("left")
  const isFirstRightPinnedColumn =
    isPinned === "right" && column.getIsFirstColumn("right")

  return {
    boxShadow: withBorder
      ? isLastLeftPinnedColumn
        ? "-4px 0 4px -4px var(--border) inset"
        : isFirstRightPinnedColumn
          ? "4px 0 4px -4px var(--border) inset"
          : undefined
      : undefined,
    left: isPinned === "left" ? `${column.getStart("left")}px` : undefined,
    right: isPinned === "right" ? `${column.getAfter("right")}px` : undefined,
    opacity: isPinned ? 0.97 : 1,
    position: isPinned ? "sticky" : "relative",
    background: isPinned ? "var(--background)" : "var(--background)",
    width: column.getSize(),
    zIndex: isPinned ? 1 : 0,
  }
}

// ============================================================================
// Filter Operators
// ============================================================================

export function getFilterOperators(filterVariant: FilterVariant) {
  const operatorMap: Record<
    FilterVariant,
    { label: string; value: FilterOperator }[]
  > = {
    text: dataTableConfig.textOperators,
    number: dataTableConfig.numericOperators,
    range: dataTableConfig.numericOperators,
    date: dataTableConfig.dateOperators,
    dateRange: dataTableConfig.dateOperators,
    boolean: dataTableConfig.booleanOperators,
    select: dataTableConfig.selectOperators,
    multiSelect: dataTableConfig.multiSelectOperators,
  }

  return operatorMap[filterVariant] ?? dataTableConfig.textOperators
}

export function getDefaultFilterOperator(filterVariant: FilterVariant) {
  const operators = getFilterOperators(filterVariant)

  return operators[0]?.value ?? (filterVariant === "text" ? "iLike" : "eq")
}

export function getValidFilters<TData>(
  filters: ExtendedColumnFilter<TData>[]
): ExtendedColumnFilter<TData>[] {
  return filters.filter(
    (filter) =>
      filter.operator === "isEmpty" ||
      filter.operator === "isNotEmpty" ||
      (Array.isArray(filter.value)
        ? filter.value.length > 0
        : filter.value !== "" &&
          filter.value !== null &&
          filter.value !== undefined)
  )
}

// ============================================================================
// Query State Parsers
// ============================================================================

const sortingItemSchema = z.object({
  id: z.string(),
  desc: z.boolean(),
})

export const getSortingStateParser = <TData>(
  columnIds?: string[] | Set<string>
) => {
  const validKeys = columnIds
    ? columnIds instanceof Set
      ? columnIds
      : new Set(columnIds)
    : null

  return createParser({
    parse: (value) => {
      try {
        const parsed = JSON.parse(value)
        const result = z.array(sortingItemSchema).safeParse(parsed)

        if (!result.success) return null

        if (validKeys && result.data.some((item) => !validKeys.has(item.id))) {
          return null
        }

        return result.data as ExtendedColumnSort<TData>[]
      } catch {
        return null
      }
    },
    serialize: (value) => JSON.stringify(value),
    eq: (a, b) =>
      a.length === b.length &&
      a.every(
        (item, index) =>
          item.id === b[index]?.id && item.desc === b[index]?.desc
      ),
  })
}

const filterItemSchema = z.object({
  id: z.string(),
  value: z.union([z.string(), z.array(z.string())]),
  variant: z.enum(dataTableConfig.filterVariants),
  operator: z.enum(dataTableConfig.operators),
  filterId: z.string(),
})

export type FilterItemSchema = z.infer<typeof filterItemSchema>

export const getFiltersStateParser = <TData>(
  columnIds?: string[] | Set<string>
) => {
  const validKeys = columnIds
    ? columnIds instanceof Set
      ? columnIds
      : new Set(columnIds)
    : null

  return createParser({
    parse: (value) => {
      try {
        const parsed = JSON.parse(value)
        const result = z.array(filterItemSchema).safeParse(parsed)

        if (!result.success) return null

        if (validKeys && result.data.some((item) => !validKeys.has(item.id))) {
          return null
        }

        return result.data as ExtendedColumnFilter<TData>[]
      } catch {
        return null
      }
    },
    serialize: (value) => JSON.stringify(value),
    eq: (a, b) =>
      a.length === b.length &&
      a.every(
        (filter, index) =>
          filter.id === b[index]?.id &&
          filter.value === b[index]?.value &&
          filter.variant === b[index]?.variant &&
          filter.operator === b[index]?.operator
      ),
  })
}

// ============================================================================
// Export Utilities
// ============================================================================

export function exportTableToCSV<TData>(
  table: Table<TData>,
  opts: {
    filename?: string
    excludeColumns?: string[]
    onlySelected?: boolean
  } = {}
): void {
  const { filename = "table", excludeColumns = [], onlySelected = false } = opts

  const headers = table
    .getAllLeafColumns()
    .map((column) => column.id)
    .filter((id) => !excludeColumns.includes(id))

  const csvContent = [
    headers.join(","),
    ...(onlySelected
      ? table.getFilteredSelectedRowModel().rows
      : table.getRowModel().rows
    ).map((row) =>
      headers
        .map((header) => {
          const cellValue = row.getValue(header)
          return typeof cellValue === "string"
            ? `"${cellValue.replace(/"/g, '""')}"`
            : cellValue
        })
        .join(",")
    ),
  ].join("\n")

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })

  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.setAttribute("href", url)
  link.setAttribute("download", `${filename}.csv`)
  link.style.visibility = "hidden"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
