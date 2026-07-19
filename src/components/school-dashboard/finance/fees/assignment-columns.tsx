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
  lang?: string,
  col?: Record<string, string>,
  currency: string = "USD"
): ColumnDef<FeeAssignmentRow>[] => {
  return [
    {
      accessorKey: "studentName",
      id: "studentName",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={col?.student || "Student"}
        />
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
      meta: { label: col?.student || "Student", variant: "text" },
      enableColumnFilter: true,
    },
    {
      accessorKey: "feeStructureName",
      id: "feeStructureName",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={col?.feeStructure || "Fee Structure"}
        />
      ),
      meta: { label: col?.feeStructure || "Fee Structure", variant: "text" },
    },
    {
      accessorKey: "academicYear",
      id: "academicYear",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={col?.academicYear || "Academic Year"}
        />
      ),
      meta: { label: col?.academicYear || "Academic Year", variant: "text" },
    },
    {
      accessorKey: "finalAmount",
      id: "finalAmount",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={col?.finalAmount || "Final Amount"}
        />
      ),
      cell: ({ getValue }) => (
        <span className="text-end font-medium tabular-nums">
          {formatCurrency(
            getValue<number>(),
            (lang || "en") as Locale,
            currency
          )}
        </span>
      ),
      meta: { label: col?.finalAmount || "Final Amount", variant: "text" },
    },
    {
      accessorKey: "totalDiscount",
      id: "totalDiscount",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={col?.discount || "Discount"}
        />
      ),
      cell: ({ getValue }) => {
        const val = getValue<number>()
        if (val === 0) return <span className="text-muted-foreground">-</span>
        return (
          <span className="text-green-600 tabular-nums">
            -{formatCurrency(val, (lang || "en") as Locale, currency)}
          </span>
        )
      },
      meta: { label: col?.discount || "Discount", variant: "text" },
    },
    {
      accessorKey: "paidAmount",
      id: "paidAmount",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={col?.paid || "Paid"} />
      ),
      cell: ({ getValue }) => (
        <span className="tabular-nums">
          {formatCurrency(
            getValue<number>(),
            (lang || "en") as Locale,
            currency
          )}
        </span>
      ),
      meta: { label: col?.paid || "Paid", variant: "text" },
    },
    {
      accessorKey: "status",
      id: "status",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={col?.status || "Status"}
        />
      ),
      cell: ({ getValue }) => {
        const status = getValue<string>()
        const color = STATUS_COLORS[status as keyof typeof STATUS_COLORS] ?? ""
        const statusLabels: Record<string, string | undefined> = {
          PENDING: col?.pending,
          PARTIAL: col?.partial,
          PAID: col?.paid,
          OVERDUE: col?.overdue,
          CANCELLED: col?.cancelled,
        }
        return (
          <Badge variant="outline" className={color}>
            {statusLabels[status] || status.replace(/_/g, " ")}
          </Badge>
        )
      },
      meta: {
        label: col?.status || "Status",
        variant: "select",
        options: [
          { label: col?.pending || "Pending", value: "PENDING" },
          { label: col?.partial || "Partial", value: "PARTIAL" },
          { label: col?.paid || "Paid", value: "PAID" },
          { label: col?.overdue || "Overdue", value: "OVERDUE" },
          { label: col?.cancelled || "Cancelled", value: "CANCELLED" },
        ],
      },
      enableColumnFilter: true,
    },
    {
      accessorKey: "createdAt",
      id: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={col?.created || "Created"}
        />
      ),
      cell: ({ getValue }) => (
        <span className="text-muted-foreground text-xs tabular-nums">
          {new Date(getValue<string>()).toLocaleDateString(
            lang === "ar" ? "ar-SA" : "en-US"
          )}
        </span>
      ),
      meta: { label: col?.created || "Created", variant: "text" },
    },
    {
      id: "actions",
      header: () => (
        <span className="sr-only">{col?.actions || "Actions"}</span>
      ),
      cell: ({ row }) => {
        const assignment = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <Ellipsis className="h-4 w-4" />
                <span className="sr-only">{col?.actions || "Actions"}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{col?.actions || "Actions"}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link
                  href={`/${lang}/finance/fees/assignments/${assignment.id}`}
                >
                  {col?.view || "View"}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/${lang}/finance/fees/payments/new`}>
                  {col?.recordPayment || "Record Payment"}
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
