"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import * as React from "react"
// Marking Dashboard Data Table
import { useMemo, useState } from "react"
import type {
  MarkingResult,
  QuestionBank,
  Student,
  StudentAnswer,
} from "@prisma/client"
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnFiltersState,
  type SortingState,
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
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { getColumns } from "./columns"

type MarkingQueueItem = StudentAnswer & {
  student: Student
  question: QuestionBank
  markingResult?: MarkingResult | null
}

interface MarkingTableProps {
  data: MarkingQueueItem[]
  dictionary: Dictionary
  /** True schoolId-scoped row count, independent of the (max 100) loaded
   * queue in `data`. Falls back to `data.length` when the caller doesn't know
   * the true total, preserving prior behavior for sub-filtered tabs. */
  totalCount?: number
}

function MarkingTableInner({
  data,
  dictionary,
  totalCount,
}: MarkingTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState("")

  const dict = dictionary.marking
  const columns = useMemo(() => getColumns(dictionary), [dictionary])

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Input
          placeholder={dict.table.search}
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
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
                  {dict.table.noSubmissions}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-muted-foreground text-sm">
          {/* Denominator prefers the true schoolId-scoped count over data.length
              — data is capped at 100 (see content.tsx), so data.length alone
              silently understated how many submissions exist once a school
              passed that cap. Search only ever runs against the loaded `data`
              (a fixed working queue, not the full archive), so once totalCount
              exceeds data.length this line itself is the "limited results"
              signal — e.g. "Showing 100 of 452 submissions". */}
          {dict.table.showing} {table.getFilteredRowModel().rows.length}{" "}
          {dict.table.of} {totalCount ?? data.length} {dict.table.submissions}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            {dict.table.previous}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            {dict.table.next}
          </Button>
        </div>
      </div>
    </div>
  )
}

export const MarkingTable = React.memo(MarkingTableInner)
