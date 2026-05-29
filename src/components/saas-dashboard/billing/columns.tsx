"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { ColumnDef } from "@tanstack/react-table"

import { formatCurrency, formatDate, formatDateRange } from "@/lib/i18n-format"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ErrorToast, SuccessToast } from "@/components/atom/toast"
import type { Locale } from "@/components/internationalization/config"
import { invoiceUpdateStatus } from "@/components/saas-dashboard/billing/actions"
import { DataTableColumnHeader } from "@/components/table/data-table-column-header"

export type InvoiceRow = {
  id: string
  number: string
  tenantName: string
  periodStart: string | null
  periodEnd: string | null
  amount: number
  status: string
  createdAt: string
}

export function getInvoiceColumns(
  lang: Locale,
  dictionary?: any
): ColumnDef<InvoiceRow>[] {
  const c = dictionary?.operator?.billing?.columns
  return [
    {
      accessorKey: "number",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={c?.invoice || "Invoice"}
        />
      ),
      meta: {
        label: c?.invoice || "Invoice",
        variant: "text",
        placeholder: c?.searchNumber || "Search number",
      },
    },
    {
      accessorKey: "tenantName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={c?.school || "School"} />
      ),
      meta: {
        label: c?.school || "School",
        variant: "text",
        placeholder: c?.searchSchool || "Search school",
      },
    },
    {
      id: "period",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={c?.period || "Period"} />
      ),
      cell: ({ row }) => {
        const { periodStart, periodEnd } = row.original
        if (!periodStart || !periodEnd) return "-"
        return (
          <span className="tabular-nums">
            {formatDateRange(periodStart, periodEnd, lang)}
          </span>
        )
      },
      meta: {
        label: c?.period || "Period",
        variant: "text",
        placeholder: c?.periodPlaceholder || "e.g. 2025-01",
      },
    },
    {
      accessorKey: "amount",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={c?.amount || "Amount"} />
      ),
      cell: ({ getValue }) => (
        <span className="tabular-nums">
          {formatCurrency(getValue<number>() / 100, lang)}
        </span>
      ),
      meta: { label: c?.amount || "Amount", variant: "number" },
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={c?.status || "Status"} />
      ),
      meta: {
        label: c?.status || "Status",
        variant: "select",
        options: [
          { label: c?.draft || "Draft", value: "draft" },
          { label: c?.open || "Open", value: "open" },
          { label: c?.paid || "Paid", value: "paid" },
          {
            label: c?.uncollectible || "Uncollectible",
            value: "uncollectible",
          },
          { label: c?.void || "Void", value: "void" },
        ],
      },
      cell: ({ getValue }) => {
        const v = (getValue<string>() ?? "").toLowerCase()
        const variant =
          v === "paid"
            ? "default"
            : v === "open"
              ? "secondary"
              : v === "draft"
                ? "outline"
                : "destructive"
        const statusLabels: Record<string, string> = {
          draft: c?.draft || "Draft",
          open: c?.open || "Open",
          paid: c?.paid || "Paid",
          uncollectible: c?.uncollectible || "Uncollectible",
          void: c?.void || "Void",
        }
        const label = statusLabels[v] || v.charAt(0).toUpperCase() + v.slice(1)
        return (
          <Badge
            variant={
              variant as "default" | "secondary" | "outline" | "destructive"
            }
          >
            {label}
          </Badge>
        )
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={c?.created || "Created"}
        />
      ),
      meta: { label: c?.created || "Created", variant: "text" },
      cell: ({ getValue }) => (
        <span className="text-muted-foreground text-xs tabular-nums">
          {formatDate(getValue<string>(), lang)}
        </span>
      ),
    },
    {
      id: "actions",
      header: () => <span className="sr-only">{c?.actions || "Actions"}</span>,
      cell: ({ row }) => {
        const inv = row.original as InvoiceRow
        return (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                try {
                  const result = await invoiceUpdateStatus({
                    id: inv.id,
                    status: "paid",
                  })
                  if (result.success) {
                    SuccessToast(
                      c?.invoiceMarkedPaid || "Invoice marked as paid"
                    )
                  } else {
                    ErrorToast(result.error.message)
                  }
                } catch (e) {
                  ErrorToast(
                    e instanceof Error ? e.message : c?.failed || "Failed"
                  )
                }
              }}
            >
              {c?.markPaid || "Mark paid"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                try {
                  const result = await invoiceUpdateStatus({
                    id: inv.id,
                    status: "void",
                  })
                  if (result.success) {
                    SuccessToast(
                      c?.invoiceVoided || "Invoice voided successfully"
                    )
                  } else {
                    ErrorToast(result.error.message)
                  }
                } catch (e) {
                  ErrorToast(
                    e instanceof Error ? e.message : c?.failed || "Failed"
                  )
                }
              }}
            >
              {c?.void || "Void"}
            </Button>
          </div>
        )
      },
    },
  ]
}
