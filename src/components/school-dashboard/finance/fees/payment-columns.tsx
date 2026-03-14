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

export type PaymentRow = {
  id: string
  paymentNumber: string
  studentName: string
  feeStructureName: string
  amount: number
  paymentDate: string
  paymentMethod: string
  status: string // PENDING, SUCCESS, FAILED, CANCELLED, REFUNDED
  receiptNumber: string
  createdAt: string
}

const PAYMENT_METHOD_COLORS: Record<string, string> = {
  CASH: "bg-green-500/10 text-green-500",
  CHEQUE: "bg-gray-500/10 text-gray-500",
  BANK_TRANSFER: "bg-purple-500/10 text-purple-500",
  CREDIT_CARD: "bg-blue-500/10 text-blue-500",
  DEBIT_CARD: "bg-blue-500/10 text-blue-500",
  UPI: "bg-orange-500/10 text-orange-500",
  NET_BANKING: "bg-purple-500/10 text-purple-500",
  WALLET: "bg-orange-500/10 text-orange-500",
  OTHER: "bg-gray-500/10 text-gray-500",
}

export const getPaymentColumns = (lang?: string): ColumnDef<PaymentRow>[] => {
  return [
    {
      accessorKey: "paymentNumber",
      id: "paymentNumber",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Payment #" />
      ),
      cell: ({ getValue }) => (
        <span className="font-mono text-sm">{getValue<string>()}</span>
      ),
      meta: { label: "Payment #", variant: "text" },
    },
    {
      accessorKey: "studentName",
      id: "studentName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Student" />
      ),
      cell: ({ getValue }) => (
        <span className="font-medium">{getValue<string>()}</span>
      ),
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
      accessorKey: "paymentDate",
      id: "paymentDate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Payment Date" />
      ),
      cell: ({ getValue }) => (
        <span className="text-muted-foreground text-xs tabular-nums">
          {new Date(getValue<string>()).toLocaleDateString(
            lang === "ar" ? "ar-SA" : "en-US"
          )}
        </span>
      ),
      meta: { label: "Payment Date", variant: "text" },
    },
    {
      accessorKey: "paymentMethod",
      id: "paymentMethod",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Method" />
      ),
      cell: ({ getValue }) => {
        const method = getValue<string>()
        const color = PAYMENT_METHOD_COLORS[method] ?? ""
        return (
          <Badge variant="outline" className={color}>
            {method.replace(/_/g, " ")}
          </Badge>
        )
      },
      meta: {
        label: "Method",
        variant: "select",
        options: [
          { label: "Cash", value: "CASH" },
          { label: "Cheque", value: "CHEQUE" },
          { label: "Bank Transfer", value: "BANK_TRANSFER" },
          { label: "Credit Card", value: "CREDIT_CARD" },
          { label: "Debit Card", value: "DEBIT_CARD" },
          { label: "UPI", value: "UPI" },
          { label: "Net Banking", value: "NET_BANKING" },
          { label: "Wallet", value: "WALLET" },
          { label: "Other", value: "OTHER" },
        ],
      },
      enableColumnFilter: true,
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
            {status}
          </Badge>
        )
      },
      meta: {
        label: "Status",
        variant: "select",
        options: [
          { label: "Pending", value: "PENDING" },
          { label: "Success", value: "SUCCESS" },
          { label: "Failed", value: "FAILED" },
          { label: "Cancelled", value: "CANCELLED" },
          { label: "Refunded", value: "REFUNDED" },
        ],
      },
      enableColumnFilter: true,
    },
    {
      accessorKey: "receiptNumber",
      id: "receiptNumber",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Receipt #" />
      ),
      cell: ({ getValue }) => {
        const val = getValue<string>()
        return val ? (
          <span className="font-mono text-sm">{val}</span>
        ) : (
          <span className="text-muted-foreground">-</span>
        )
      },
      meta: { label: "Receipt #", variant: "text" },
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => {
        const payment = row.original
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
                <Link href={`/${lang}/finance/fees/payments/${payment.id}`}>
                  View
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href={`/${lang}/finance/fees/payments/${payment.id}/receipt`}
                >
                  View Receipt
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

// NOTE: Do NOT export pre-generated columns. Always use getPaymentColumns()
// inside useMemo in client components to avoid SSR hook issues.
