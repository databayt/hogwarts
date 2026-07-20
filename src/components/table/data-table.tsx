// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

"use client"

import * as React from "react"
import { flexRender, type Table as TanstackTable } from "@tanstack/react-table"

import "@/components/table/types" // Import type augmentation for ColumnMeta.align

import { cn } from "@/lib/utils"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DataTableLoadMore } from "@/components/table/data-table-load-more"
import { DataTablePagination } from "@/components/table/data-table-pagination"
import {
  useTableTranslations,
  type TableTranslations,
} from "@/components/table/use-table-translations"
import { getCommonPinningStyles } from "@/components/table/utils"

interface DataTableProps<TData> extends React.ComponentProps<"div"> {
  table: TanstackTable<TData>
  actionBar?: React.ReactNode
  paginationMode?: "pagination" | "load-more"
  hasMore?: boolean
  isLoading?: boolean
  onLoadMore?: () => void
  getRowClassName?: (row: TData) => string | undefined
  translations?: TableTranslations
}

function DataTableInner<TData>({
  table,
  actionBar,
  children,
  className,
  paginationMode = "pagination",
  hasMore = false,
  isLoading = false,
  onLoadMore,
  getRowClassName,
  translations,
  ...props
}: DataTableProps<TData>) {
  const t = useTableTranslations(translations)

  // KEEP pageSize IN STEP WITH THE LOADED ROWS (load-more mode only).
  //
  // Call sites size their single page with `initialState.pagination.pageSize =
  // data.length`. But TanStack reads `initialState` ONCE, on the first render —
  // it is not reactive. So after "load more" grew `data` from 20 to 40, pageSize
  // stayed pinned at 20: the extra rows were fetched, stored, and then silently
  // clipped by the pagination row model. The button appeared to do nothing.
  //
  // Re-syncing here fixes every load-more table at once, and works no matter how
  // the caller built its table instance.
  const coreRowCount = table.getCoreRowModel().rows.length
  const currentPageSize = table.getState().pagination.pageSize

  React.useEffect(() => {
    if (paginationMode !== "load-more") return
    if (coreRowCount > 0 && currentPageSize !== coreRowCount) {
      table.setPageSize(coreRowCount)
    }
  }, [paginationMode, coreRowCount, currentPageSize, table])

  return (
    <div className={cn("flex w-full flex-col gap-2.5", className)} {...props}>
      {children}
      <div className="overflow-x-auto rounded-md">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const meta = header.column.columnDef.meta as
                    | { align?: "start" | "center" | "end" }
                    | undefined
                  const alignClass =
                    meta?.align === "end"
                      ? "text-end"
                      : meta?.align === "center"
                        ? "text-center"
                        : ""
                  return (
                    <TableHead
                      key={header.id}
                      colSpan={header.colSpan}
                      className={alignClass}
                      style={{
                        ...getCommonPinningStyles({ column: header.column }),
                      }}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={getRowClassName?.(row.original)}
                >
                  {row.getVisibleCells().map((cell) => {
                    const meta = cell.column.columnDef.meta as
                      | { align?: "start" | "center" | "end" }
                      | undefined
                    const alignClass =
                      meta?.align === "end"
                        ? "text-end"
                        : meta?.align === "center"
                          ? "text-center"
                          : ""
                    return (
                      <TableCell
                        key={cell.id}
                        className={alignClass}
                        style={{
                          ...getCommonPinningStyles({ column: cell.column }),
                        }}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={table.getAllColumns().length}
                  className="h-24 text-center"
                >
                  {t.noResults}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex flex-col gap-2.5">
        {paginationMode === "pagination" ? (
          <DataTablePagination table={table} />
        ) : (
          <DataTableLoadMore
            table={table}
            hasMore={hasMore}
            isLoading={isLoading}
            onLoadMore={onLoadMore}
            translations={translations}
          />
        )}
        {actionBar &&
          table.getFilteredSelectedRowModel().rows.length > 0 &&
          actionBar}
      </div>
    </div>
  )
}

// NOT memoized, deliberately.
//
// Everything this component renders — rows, headers, selection — is read off
// the TanStack `table` object, which is referentially STABLE and mutates in
// place. A shallow prop compare therefore cannot see new rows arriving, so
// React.memo here would skip the very re-render that shows them.
//
// It only ever "worked" because `onLoadMore` used to get a fresh identity on
// every parent render, accidentally busting the memo each time. Once that
// callback was stabilized the bug surfaced: "load more" fetched rows that were
// never painted. Correctness beats a memo that was never actually holding.
export const DataTable = DataTableInner
