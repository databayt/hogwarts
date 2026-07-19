"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import Link from "next/link"
import { ColumnDef } from "@tanstack/react-table"
import { Eye, Pencil, Trash2 } from "lucide-react"

import { formatDate } from "@/lib/i18n-format"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { ActionMenu, ActionMenuItem } from "@/components/atom/action-menu"
import type { Locale } from "@/components/internationalization/config"
import { DataTableColumnHeader } from "@/components/table/data-table-column-header"

import type { InvoiceRow } from "./types"

export type { InvoiceRow }

export interface InvoiceColumnCallbacks {
  onDelete?: (row: InvoiceRow) => void
}

const getStatusBadge = (status: string, ic?: Record<string, string>) => {
  const statusConfig = {
    PAID: {
      variant: "default" as const,
      className: "bg-green-100 text-green-800 hover:bg-green-100",
    },
    UNPAID: {
      variant: "secondary" as const,
      className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
    },
    OVERDUE: {
      variant: "destructive" as const,
      className: "bg-red-100 text-red-800 hover:bg-red-100",
    },
    CANCELLED: {
      variant: "outline" as const,
      className: "bg-gray-100 text-gray-800 hover:bg-gray-100",
    },
    PARTIAL: {
      variant: "outline" as const,
      className: "bg-blue-100 text-blue-800 hover:bg-blue-100",
    },
  }

  const config =
    statusConfig[status as keyof typeof statusConfig] || statusConfig.UNPAID

  const labels: Record<string, string | undefined> = {
    PAID: ic?.paid,
    UNPAID: ic?.unpaid,
    OVERDUE: ic?.overdue,
    CANCELLED: ic?.cancelled,
    PARTIAL: ic?.partial,
  }

  return (
    <Badge variant={config.variant} className={config.className}>
      {labels[status] ?? status}
    </Badge>
  )
}

export const getInvoiceColumns = (
  lang?: Locale,
  callbacks?: InvoiceColumnCallbacks,
  ic?: Record<string, string>
): ColumnDef<InvoiceRow>[] => [
  {
    accessorKey: "invoice_no",
    id: "invoice_no",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={ic?.invoiceHash || "Invoice #"}
      />
    ),
    meta: { label: ic?.invoiceHash || "Invoice #", variant: "text" },
    enableColumnFilter: true,
  },
  {
    accessorKey: "client_name",
    id: "client_name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={ic?.client || "Client"} />
    ),
    meta: { label: ic?.client || "Client", variant: "text" },
    enableColumnFilter: true,
  },
  {
    accessorKey: "total",
    id: "total",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={ic?.total || "Total"} />
    ),
    cell: ({ row }) => {
      const invoice = row.original
      return (
        <span className="font-medium">
          {new Intl.NumberFormat(lang || "ar", {
            style: "currency",
            currency: invoice.currency,
          }).format(invoice.total)}
        </span>
      )
    },
    meta: { label: ic?.total || "Total", variant: "text" },
  },
  {
    accessorKey: "status",
    id: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={ic?.status || "Status"} />
    ),
    cell: ({ row }) => getStatusBadge(row.original.status, ic),
    meta: {
      label: ic?.status || "Status",
      variant: "select",
      options: [
        { label: ic?.paid || "Paid", value: "PAID" },
        { label: ic?.unpaid || "Unpaid", value: "UNPAID" },
        { label: ic?.overdue || "Overdue", value: "OVERDUE" },
        { label: ic?.cancelled || "Cancelled", value: "CANCELLED" },
        { label: ic?.partial || "Partial", value: "PARTIAL" },
      ],
    },
    enableColumnFilter: true,
  },
  {
    accessorKey: "due_date",
    id: "due_date",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={ic?.dueDate || "Due Date"}
      />
    ),
    cell: ({ getValue }) => (
      <span className="text-muted-foreground text-xs tabular-nums">
        {formatDate(getValue<string>(), lang || "ar")}
      </span>
    ),
    meta: { label: ic?.dueDate || "Due Date", variant: "text" },
  },
  {
    accessorKey: "createdAt",
    id: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={ic?.created || "Created"} />
    ),
    cell: ({ getValue }) => (
      <span className="text-muted-foreground text-xs tabular-nums">
        {formatDate(getValue<string>(), lang || "ar")}
      </span>
    ),
    meta: { label: ic?.created || "Created", variant: "text" },
  },
  {
    id: "actions",
    header: () => <span className="sr-only">{ic?.actions || "Actions"}</span>,
    cell: ({ row }) => {
      const invoice = row.original

      const onDelete = () => {
        callbacks?.onDelete?.(invoice)
      }

      return (
        <ActionMenu srLabel={ic?.openMenu || "Open menu"}>
          <DropdownMenuLabel>{ic?.actions || "Actions"}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <ActionMenuItem
            icon={Eye}
            label={ic?.view || "View"}
            href={`/${lang}/finance/invoice/invoice/view/${invoice.id}`}
          />
          <ActionMenuItem
            icon={Pencil}
            label={ic?.edit || "Edit"}
            href={`/${lang}/finance/invoice/invoice/edit/${invoice.id}`}
          />
          <ActionMenuItem
            icon={Trash2}
            label={ic?.delete || "Delete"}
            onClick={onDelete}
            variant="destructive"
          />
        </ActionMenu>
      )
    },
    enableSorting: false,
    enableColumnFilter: false,
  },
]

// NOTE: Do NOT export pre-generated columns. Always use getInvoiceColumns()
// inside useMemo in client components to avoid SSR hook issues.
