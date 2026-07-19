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
  // P2.2 — ATM-deposit shares the offline-purple bucket with bank transfer.
  ATM_DEPOSIT: "bg-purple-500/10 text-purple-500",
  CREDIT_CARD: "bg-blue-500/10 text-blue-500",
  DEBIT_CARD: "bg-blue-500/10 text-blue-500",
  // P3.4 — wallet + Gulf rails get their own colour buckets so reconciliation
  // glances can spot the mix at a glance.
  APPLE_PAY: "bg-black/10 text-black dark:bg-white/10 dark:text-white",
  GOOGLE_PAY: "bg-sky-500/10 text-sky-500",
  MADA: "bg-emerald-600/10 text-emerald-600",
  KNET: "bg-amber-600/10 text-amber-600",
  UPI: "bg-orange-500/10 text-orange-500",
  NET_BANKING: "bg-purple-500/10 text-purple-500",
  WALLET: "bg-orange-500/10 text-orange-500",
  OTHER: "bg-gray-500/10 text-gray-500",
}

export const getPaymentColumns = (
  lang?: string,
  col?: Record<string, string>,
  currency: string = "USD"
): ColumnDef<PaymentRow>[] => {
  return [
    {
      accessorKey: "paymentNumber",
      id: "paymentNumber",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={col?.paymentNumber || "Payment #"}
        />
      ),
      cell: ({ getValue }) => (
        <span className="font-mono text-sm">{getValue<string>()}</span>
      ),
      meta: { label: col?.paymentNumber || "Payment #", variant: "text" },
    },
    {
      accessorKey: "studentName",
      id: "studentName",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={col?.student || "Student"}
        />
      ),
      cell: ({ getValue }) => (
        <span className="font-medium">{getValue<string>()}</span>
      ),
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
      accessorKey: "amount",
      id: "amount",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={col?.amount || "Amount"}
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
      meta: { label: col?.amount || "Amount", variant: "text" },
    },
    {
      accessorKey: "paymentDate",
      id: "paymentDate",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={col?.paymentDate || "Payment Date"}
        />
      ),
      cell: ({ getValue }) => (
        <span className="text-muted-foreground text-xs tabular-nums">
          {new Date(getValue<string>()).toLocaleDateString(
            lang === "ar" ? "ar-SA" : "en-US"
          )}
        </span>
      ),
      meta: { label: col?.paymentDate || "Payment Date", variant: "text" },
    },
    {
      accessorKey: "paymentMethod",
      id: "paymentMethod",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={col?.method || "Method"}
        />
      ),
      cell: ({ getValue }) => {
        const method = getValue<string>()
        const color = PAYMENT_METHOD_COLORS[method] ?? ""
        const methodLabels: Record<string, string | undefined> = {
          CASH: col?.cash,
          CHEQUE: col?.cheque,
          BANK_TRANSFER: col?.bankTransfer,
          CREDIT_CARD: col?.creditCard,
          DEBIT_CARD: col?.debitCard,
          UPI: col?.upi,
          NET_BANKING: col?.netBanking,
          WALLET: col?.wallet,
          OTHER: col?.other,
        }
        return (
          <Badge variant="outline" className={color}>
            {methodLabels[method] || method.replace(/_/g, " ")}
          </Badge>
        )
      },
      meta: {
        label: col?.method || "Method",
        variant: "select",
        options: [
          { label: col?.cash || "Cash", value: "CASH" },
          { label: col?.cheque || "Cheque", value: "CHEQUE" },
          {
            label: col?.bankTransfer || "Bank Transfer",
            value: "BANK_TRANSFER",
          },
          { label: col?.creditCard || "Credit Card", value: "CREDIT_CARD" },
          { label: col?.debitCard || "Debit Card", value: "DEBIT_CARD" },
          { label: col?.upi || "UPI", value: "UPI" },
          { label: col?.netBanking || "Net Banking", value: "NET_BANKING" },
          { label: col?.wallet || "Wallet", value: "WALLET" },
          { label: col?.other || "Other", value: "OTHER" },
        ],
      },
      enableColumnFilter: true,
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
          SUCCESS: col?.success,
          FAILED: col?.failed,
          CANCELLED: col?.cancelled,
          REFUNDED: col?.refunded,
        }
        return (
          <Badge variant="outline" className={color}>
            {statusLabels[status] || status}
          </Badge>
        )
      },
      meta: {
        label: col?.status || "Status",
        variant: "select",
        options: [
          { label: col?.pending || "Pending", value: "PENDING" },
          { label: col?.success || "Success", value: "SUCCESS" },
          { label: col?.failed || "Failed", value: "FAILED" },
          { label: col?.cancelled || "Cancelled", value: "CANCELLED" },
          { label: col?.refunded || "Refunded", value: "REFUNDED" },
        ],
      },
      enableColumnFilter: true,
    },
    {
      accessorKey: "receiptNumber",
      id: "receiptNumber",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={col?.receiptNumber || "Receipt #"}
        />
      ),
      cell: ({ getValue }) => {
        const val = getValue<string>()
        return val ? (
          <span className="font-mono text-sm">{val}</span>
        ) : (
          <span className="text-muted-foreground">-</span>
        )
      },
      meta: { label: col?.receiptNumber || "Receipt #", variant: "text" },
    },
    {
      id: "actions",
      header: () => (
        <span className="sr-only">{col?.actions || "Actions"}</span>
      ),
      cell: ({ row }) => {
        const payment = row.original
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
                <Link href={`/${lang}/finance/fees/payments/${payment.id}`}>
                  {col?.view || "View"}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href={`/api/payment/${payment.id}/receipt`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {col?.viewReceipt || "View Receipt"}
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
