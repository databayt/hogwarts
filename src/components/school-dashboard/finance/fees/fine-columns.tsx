"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import Link from "next/link"
import { ColumnDef } from "@tanstack/react-table"
import { Ellipsis } from "lucide-react"

import { formatCurrency } from "@/lib/i18n-format"
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
import type { Locale } from "@/components/internationalization/config"
import { DataTableColumnHeader } from "@/components/table/data-table-column-header"

import { STATUS_COLORS } from "./config"

export type FineRow = {
  id: string
  studentName: string
  studentId: string
  fineType: string
  amount: number
  reason: string
  dueDate: string
  isPaid: boolean
  isWaived: boolean
  createdAt: string
}

export const getFineColumns = (lang?: string): ColumnDef<FineRow>[] => {
  return [
    {
      accessorKey: "studentName",
      id: "studentName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Student" />
      ),
      cell: ({ row }) => {
        const fine = row.original
        return (
          <Link
            href={`/${lang}/profile/${fine.studentId}`}
            className="font-medium hover:underline"
          >
            {fine.studentName}
          </Link>
        )
      },
      meta: { label: "Student", variant: "text" },
      enableColumnFilter: true,
    },
    {
      accessorKey: "fineType",
      id: "fineType",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Fine Type" />
      ),
      cell: ({ getValue }) => (
        <Badge variant="outline">{getValue<string>().replace(/_/g, " ")}</Badge>
      ),
      meta: { label: "Fine Type", variant: "text" },
      enableColumnFilter: true,
    },
    {
      accessorKey: "amount",
      id: "amount",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Amount" />
      ),
      cell: ({ getValue }) => (
        <span className="text-end font-medium tabular-nums">
          {formatCurrency(getValue<number>(), (lang || "en") as Locale)}
        </span>
      ),
      meta: { label: "Amount", variant: "text" },
    },
    {
      accessorKey: "reason",
      id: "reason",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Reason" />
      ),
      cell: ({ getValue }) => (
        <span className="max-w-[200px] truncate" title={getValue<string>()}>
          {getValue<string>()}
        </span>
      ),
      meta: { label: "Reason", variant: "text" },
    },
    {
      accessorKey: "dueDate",
      id: "dueDate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Due Date" />
      ),
      cell: ({ getValue }) => {
        const val = getValue<string>()
        if (!val) return <span className="text-muted-foreground">-</span>
        return (
          <span className="text-muted-foreground text-xs tabular-nums">
            {new Date(val).toLocaleDateString(
              lang === "ar" ? "ar-SA" : "en-US"
            )}
          </span>
        )
      },
      meta: { label: "Due Date", variant: "text" },
    },
    {
      id: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        const fine = row.original
        if (fine.isWaived) {
          return (
            <Badge variant="outline" className={STATUS_COLORS.CANCELLED}>
              Waived
            </Badge>
          )
        }
        if (fine.isPaid) {
          return (
            <Badge variant="outline" className={STATUS_COLORS.PAID}>
              Paid
            </Badge>
          )
        }
        // Check if overdue
        const isOverdue = fine.dueDate && new Date(fine.dueDate) < new Date()
        if (isOverdue) {
          return (
            <Badge variant="outline" className={STATUS_COLORS.OVERDUE}>
              Overdue
            </Badge>
          )
        }
        return (
          <Badge variant="outline" className={STATUS_COLORS.PENDING}>
            Pending
          </Badge>
        )
      },
      meta: {
        label: "Status",
        variant: "select",
        options: [
          { label: "Pending", value: "PENDING" },
          { label: "Paid", value: "PAID" },
          { label: "Waived", value: "WAIVED" },
          { label: "Overdue", value: "OVERDUE" },
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
        const fine = row.original
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
                <Link href={`/${lang}/finance/fees/fines/${fine.id}`}>
                  View
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/${lang}/finance/fees/fines/${fine.id}/edit`}>
                  Edit
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

// NOTE: Do NOT export pre-generated columns. Always use getFineColumns()
// inside useMemo in client components to avoid SSR hook issues.
