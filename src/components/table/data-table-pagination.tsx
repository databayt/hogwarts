// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import * as React from "react"
import type { Table } from "@tanstack/react-table"
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface DataTablePaginationProps<TData> extends React.ComponentProps<"div"> {
  table: Table<TData>
  pageSizeOptions?: number[]
  labels?: {
    rowsSelected?: string // "{selected} of {total} row(s) selected."
    rowsPerPage?: string
    pageOf?: string // "Page {current} of {total}"
    goToFirstPage?: string
    goToPreviousPage?: string
    goToNextPage?: string
    goToLastPage?: string
  }
}

function DataTablePaginationInner<TData>({
  table,
  pageSizeOptions = [10, 20, 30, 40, 50],
  labels = {},
  className,
  ...props
}: DataTablePaginationProps<TData>) {
  const selectedCount = table.getFilteredSelectedRowModel().rows.length
  const totalRowCount = table.getFilteredRowModel().rows.length
  const currentPage = table.getState().pagination.pageIndex + 1
  const pageCount = table.getPageCount()

  const rowsSelectedText = labels.rowsSelected
    ? labels.rowsSelected
        .replace("{selected}", String(selectedCount))
        .replace("{total}", String(totalRowCount))
    : `${selectedCount} of ${totalRowCount} row(s) selected.`

  const pageOfText = labels.pageOf
    ? labels.pageOf
        .replace("{current}", String(currentPage))
        .replace("{total}", String(pageCount))
    : `Page ${currentPage} of ${pageCount}`

  return (
    <div
      className={cn(
        "flex w-full flex-col-reverse items-center justify-between gap-4 overflow-auto p-1 sm:flex-row sm:gap-8",
        className
      )}
      {...props}
    >
      <div className="text-muted-foreground muted flex-1 whitespace-nowrap">
        {rowsSelectedText}
      </div>
      <div className="flex flex-col-reverse items-center gap-4 sm:flex-row sm:gap-6 lg:gap-8">
        <div className="flex items-center gap-2">
          <p className="muted font-medium whitespace-nowrap">
            {labels.rowsPerPage ?? "Rows per page"}
          </p>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => {
              table.setPageSize(Number(value))
            }}
          >
            <SelectTrigger className="h-8 w-[4.5rem] [&[data-size]]:h-8">
              <SelectValue placeholder={table.getState().pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {pageSizeOptions.map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="muted flex items-center justify-center font-medium">
          {pageOfText}
        </div>
        <div className="flex items-center gap-2">
          <Button
            aria-label={labels.goToFirstPage ?? "Go to first page"}
            variant="outline"
            size="icon"
            className="hidden size-8 lg:flex"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronsLeft className="rtl:rotate-180" />
          </Button>
          <Button
            aria-label={labels.goToPreviousPage ?? "Go to previous page"}
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="rtl:rotate-180" />
          </Button>
          <Button
            aria-label={labels.goToNextPage ?? "Go to next page"}
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronRight className="rtl:rotate-180" />
          </Button>
          <Button
            aria-label={labels.goToLastPage ?? "Go to last page"}
            variant="outline"
            size="icon"
            className="hidden size-8 lg:flex"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <ChevronsRight className="rtl:rotate-180" />
          </Button>
        </div>
      </div>
    </div>
  )
}

export const DataTablePagination = React.memo(
  DataTablePaginationInner
) as typeof DataTablePaginationInner
