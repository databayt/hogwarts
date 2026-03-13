"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import Link from "next/link"
import { ColumnDef } from "@tanstack/react-table"
import { Ellipsis } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DataTableColumnHeader } from "@/components/table/data-table-column-header"

import { STATUS_COLORS } from "./config"

export type FeeAssignmentRow = {
  id: string
  studentName: string
  studentId: string
  feeStructureName: string
  academicYear: string
  finalAmount: number
  totalDiscount: number
  paidAmount: number
  status: string // PENDING, PARTIAL, PAID, OVERDUE, CANCELLED
  createdAt: string
}

export const getFeeAssignmentColumns = (
  lang?: string
): ColumnDef<FeeAssignmentRow>[] => {
  return [
    {
      accessorKey: "studentName",
      id: "studentName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Student" />
      ),
      cell: ({ row }) => {
        const assignment = row.original
        return (
          <Link
            href={`/${lang}/profile/${assignment.studentId}`}
            className="font-medium hover:underline"
          >
            {assignment.studentName}
          </Link>
        )
      },
      meta: { label: "Student", variant: "text" },
      enableColumnFilter: true,
    },
    {
      accessorKey: "feeStructureName",
      id: "feeStructureName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Fee Structure" />
      ),
      meta: { label: "Fee Structure", variant: "text" },
    },
    {
      accessorKey: "academicYear",
      id: "academicYear",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Academic Year" />
      ),
      meta: { label: "Academic Year", variant: "text" },
    },
    {
      accessorKey: "finalAmount",
      id: "finalAmount",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Final Amount" />
      ),
      cell: ({ getValue }) => (
        <span className="text-end font-medium tabular-nums">
          $
          {getValue<number>().toLocaleString(undefined, {
            minimumFractionDigits: 2,
          })}
        </span>
      ),
      meta: { label: "Final Amount", variant: "text" },
    },
    {
      accessorKey: "totalDiscount",
      id: "totalDiscount",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Discount" />
      ),
      cell: ({ getValue }) => {
        const val = getValue<number>()
        if (val === 0) return <span className="text-muted-foreground">-</span>
        return (
          <span className="text-green-600 tabular-nums">
            -$
            {val.toLocaleString(undefined, {
              minimumFractionDigits: 2,
            })}
          </span>
        )
      },
      meta: { label: "Discount", variant: "text" },
    },
    {
      accessorKey: "paidAmount",
      id: "paidAmount",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Paid" />
      ),
      cell: ({ getValue }) => (
        <span className="tabular-nums">
          $
          {getValue<number>().toLocaleString(undefined, {
            minimumFractionDigits: 2,
          })}
        </span>
      ),
      meta: { label: "Paid", variant: "text" },
    },
    {
      accessorKey: "status",
      id: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ getValue }) => {
        const status = getValue<string>()
        const color = STATUS_COLORS[status as keyof typeof STATUS_COLORS] ?? ""
        return (
          <Badge variant="outline" className={color}>
            {status.replace(/_/g, " ")}
          </Badge>
        )
      },
      meta: {
        label: "Status",
        variant: "select",
        options: [
          { label: "Pending", value: "PENDING" },
          { label: "Partial", value: "PARTIAL" },
          { label: "Paid", value: "PAID" },
          { label: "Overdue", value: "OVERDUE" },
          { label: "Cancelled", value: "CANCELLED" },
        ],
      },
      enableColumnFilter: true,
    },
    {
      accessorKey: "createdAt",
      id: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Created" />
      ),
      cell: ({ getValue }) => (
        <span className="text-muted-foreground text-xs tabular-nums">
          {new Date(getValue<string>()).toLocaleDateString(
            lang === "ar" ? "ar-SA" : "en-US"
          )}
        </span>
      ),
      meta: { label: "Created", variant: "text" },
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => {
        const assignment = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <Ellipsis className="h-4 w-4" />
                <span className="sr-only">Actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link
                  href={`/${lang}/finance/fees/assignments/${assignment.id}`}
                >
                  View
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href={`/${lang}/finance/fees/assignments/${assignment.id}/payment`}
                >
                  Record Payment
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
      enableSorting: false,
      enableColumnFilter: false,
    },
  ]
}

// NOTE: Do NOT export pre-generated columns. Always use getFeeAssignmentColumns()
// inside useMemo in client components to avoid SSR hook issues.
