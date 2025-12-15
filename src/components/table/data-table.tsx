import type * as React from "react"
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
import { getCommonPinningStyles } from "@/components/table/utils"

interface DataTableProps<TData> extends React.ComponentProps<"div"> {
  table: TanstackTable<TData>
  actionBar?: React.ReactNode
  paginationMode?: "pagination" | "load-more"
  hasMore?: boolean
  isLoading?: boolean
  onLoadMore?: () => void
}

export function DataTable<TData>({
  table,
  actionBar,
  children,
  className,
  paginationMode = "pagination",
  hasMore = false,
  isLoading = false,
  onLoadMore,
  ...props
}: DataTableProps<TData>) {
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
                  No results.
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
          />
        )}
        {actionBar &&
          table.getFilteredSelectedRowModel().rows.length > 0 &&
          actionBar}
      </div>
    </div>
  )
}
