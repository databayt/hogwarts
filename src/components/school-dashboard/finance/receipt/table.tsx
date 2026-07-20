// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Data Table Component for Receipts
 * Follows Hogwarts table pattern
 */

"use client"

import * as React from "react"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useDictionary } from "@/components/internationalization/use-dictionary"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  /** Current search box value — controlled by the parent (server-driven search). */
  searchValue?: string
  /** Debounced by the parent; fires the server search across the whole dataset. */
  onSearchChange?: (value: string) => void
  /** True row count in the DB for the current search/status scope (honest total,
   * independent of how many rows `data` currently holds). */
  total?: number
}

function DataTableInner<TData, TValue>({
  columns,
  data,
  searchValue = "",
  onSearchChange,
  total,
}: DataTableProps<TData, TValue>) {
  const { dictionary } = useDictionary()
  const rp = (dictionary as any)?.finance?.receiptPage as
    | Record<string, string>
    | undefined
  const [sorting, setSorting] = React.useState<SortingState>([])

  // Filtering by merchant used to run client-side over `data` (getFilteredRowModel),
  // but `data` only ever holds one server page (limit defaults to 50, max 100) —
  // a school with more receipts than that could never reach row 51+ via search.
  // Search is now pushed to the server (see actions.ts `getReceipts({ search })`);
  // this table just renders whatever page the server already filtered.
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Input
          placeholder={rp?.filterByMerchant || "Filter by merchant..."}
          value={searchValue}
          onChange={(event) => onSearchChange?.(event.target.value)}
          className="max-w-sm"
        />
        {typeof total === "number" && (
          <span className="text-muted-foreground text-sm">
            {rp?.totalReceipts || "Total Receipts"}: {total}
          </span>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
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
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  {rp?.noReceiptsFound || "No receipts found."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          {rp?.previous || "Previous"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          {rp?.next || "Next"}
        </Button>
      </div>
    </div>
  )
}

export const DataTable = React.memo(DataTableInner) as typeof DataTableInner
