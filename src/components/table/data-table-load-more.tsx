// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

"use client"

import * as React from "react"
import type { Table } from "@tanstack/react-table"
import { Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  interpolate,
  useTableTranslations,
  type TableTranslations,
} from "@/components/table/use-table-translations"

interface DataTableLoadMoreProps<TData> extends React.ComponentProps<"div"> {
  table: Table<TData>
  hasMore?: boolean
  isLoading?: boolean
  onLoadMore?: () => void
  translations?: TableTranslations
}

function DataTableLoadMoreInner<TData>({
  table,
  hasMore = false,
  isLoading = false,
  onLoadMore,
  translations,
  className,
  ...props
}: DataTableLoadMoreProps<TData>) {
  const t = useTableTranslations(translations)
  const totalRows = table.getFilteredRowModel().rows.length
  const selectedRows = table.getFilteredSelectedRowModel().rows.length

  return (
    <div
      className={cn(
        "flex w-full items-center justify-center gap-4 overflow-auto p-1",
        className
      )}
      {...props}
    >
      {selectedRows > 0 && (
        <div className="text-muted-foreground muted whitespace-nowrap">
          {interpolate(t.rowsSelected, {
            selected: selectedRows,
            total: totalRows,
          })}
        </div>
      )}

      {hasMore && (
        <button
          type="button"
          onClick={onLoadMore}
          disabled={isLoading}
          aria-busy={isLoading}
          className="text-foreground flex items-center gap-2 text-sm hover:underline disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {t.loading}
            </>
          ) : (
            t.loadMore
          )}
        </button>
      )}
    </div>
  )
}

// NOT memoized — same reason as DataTable: the selected/total counts are read
// off the mutable, referentially-stable `table` object, so a shallow prop
// compare would freeze this row's counts.
export const DataTableLoadMore = DataTableLoadMoreInner
