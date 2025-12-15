import * as React from "react"
import type { Table } from "@tanstack/react-table"
import { Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"

interface DataTableLoadMoreProps<TData> extends React.ComponentProps<"div"> {
  table: Table<TData>
  hasMore?: boolean
  isLoading?: boolean
  onLoadMore?: () => void
}

function DataTableLoadMoreInner<TData>({
  table,
  hasMore = false,
  isLoading = false,
  onLoadMore,
  className,
  ...props
}: DataTableLoadMoreProps<TData>) {
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
          {selectedRows} of {totalRows} row(s) selected.
        </div>
      )}

      {hasMore && (
        <button
          type="button"
          onClick={onLoadMore}
          disabled={isLoading}
          className="text-foreground flex items-center gap-2 text-sm hover:underline disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading...
            </>
          ) : (
            "Load More"
          )}
        </button>
      )}
    </div>
  )
}

export const DataTableLoadMore = React.memo(
  DataTableLoadMoreInner
) as typeof DataTableLoadMoreInner
