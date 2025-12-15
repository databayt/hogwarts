"use client"

import { ColumnDef } from "@tanstack/react-table"

import { formatCurrency, formatDate } from "@/lib/i18n-format"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ErrorToast, SuccessToast } from "@/components/atom/toast"
import type { Locale } from "@/components/internationalization/config"
import { DataTableColumnHeader } from "@/components/table/data-table-column-header"

import { reviewReceipt } from "./actions"
import type { ReceiptRow } from "./types"

// Re-export for backward compatibility
export type { ReceiptRow }

export function getReceiptColumns(lang: Locale): ColumnDef<ReceiptRow>[] {
  return [
    {
      id: "r_schoolName",
      accessorKey: "schoolName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="School" />
      ),
      enableColumnFilter: true,
      meta: { label: "School", variant: "text" },
    },
    {
      id: "r_invoice",
      accessorKey: "invoiceNumber",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Invoice" />
      ),
      enableColumnFilter: true,
      meta: { label: "Invoice", variant: "text" },
    },
    {
      accessorKey: "fileName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="File" />
      ),
      cell: ({ row }) => {
        const fileName = row.original.fileName
        const fileUrl = row.original.fileUrl
        if (fileUrl) {
          return (
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              {fileName || "View File"}
            </a>
          )
        }
        return (
          <span className="text-muted-foreground">{fileName || "No file"}</span>
        )
      },
      meta: { label: "File", variant: "text" },
    },
    {
      accessorKey: "amount",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Amount" />
      ),
      cell: ({ getValue }) => (
        <span className="tabular-nums">
          {formatCurrency(getValue<number>() / 100, lang)}
        </span>
      ),
      meta: { label: "Amount", variant: "number" },
    },
    {
      id: "r_status",
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      enableColumnFilter: true,
      cell: ({ getValue }) => {
        const v = (getValue<string>() ?? "").toLowerCase()
        const variant =
          v === "approved"
            ? "default"
            : v === "pending"
              ? "secondary"
              : "destructive"
        const label = v.charAt(0).toUpperCase() + v.slice(1)
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
      meta: {
        label: "Status",
        variant: "select",
        options: [
          { label: "Pending", value: "pending" },
          { label: "Approved", value: "approved" },
          { label: "Rejected", value: "rejected" },
        ],
      },
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => {
        const r = row.original as ReceiptRow
        return (
          <div className="flex gap-2">
            {r.status === "pending" && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    try {
                      const notes =
                        prompt("Approval notes (optional)") || undefined
                      const result = await reviewReceipt({
                        receiptId: r.id,
                        status: "approved",
                        notes,
                      })
                      if (result.success) {
                        SuccessToast("Receipt approved successfully")
                        window.location.reload()
                      } else {
                        ErrorToast(
                          result.error?.message || "Failed to approve receipt"
                        )
                      }
                    } catch (e) {
                      ErrorToast(
                        e instanceof Error ? e.message : "Approve failed"
                      )
                    }
                  }}
                >
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={async () => {
                    try {
                      const notes =
                        prompt("Rejection reason (optional)") || undefined
                      const result = await reviewReceipt({
                        receiptId: r.id,
                        status: "rejected",
                        notes,
                      })
                      if (result.success) {
                        SuccessToast("Receipt rejected successfully")
                        window.location.reload()
                      } else {
                        ErrorToast(
                          result.error?.message || "Failed to reject receipt"
                        )
                      }
                    } catch (e) {
                      ErrorToast(
                        e instanceof Error ? e.message : "Reject failed"
                      )
                    }
                  }}
                >
                  Reject
                </Button>
              </>
            )}
            {r.status !== "pending" && (
              <span className="text-muted-foreground text-xs">
                {r.status === "approved" ? "Approved" : "Rejected"}
                {r.reviewedAt && ` on ${formatDate(r.reviewedAt, lang)}`}
              </span>
            )}
          </div>
        )
      },
    },
  ]
}
