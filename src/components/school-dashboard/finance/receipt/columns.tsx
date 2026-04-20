// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Data Table Columns for Receipts
 * Follows Hogwarts table pattern with client-side column generation
 */

"use client"

import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { ar, enUS } from "date-fns/locale"
import { Eye, RefreshCw, Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { ActionMenu, ActionMenuItem } from "@/components/atom/action-menu"

import { ExpenseReceipt } from "./types"

export function getColumns(
  fd?: Record<string, any> | null,
  rp?: Record<string, string> | null,
  locale: string = "en"
): ColumnDef<ExpenseReceipt>[] {
  const dateFnsLocale = locale === "ar" ? ar : enUS
  return [
    {
      accessorKey: "fileName",
      header: rp?.fileName || "File Name",
      cell: ({ row }) => {
        const receipt = row.original
        return (
          <div className="font-medium">
            {receipt.fileDisplayName || receipt.fileName}
          </div>
        )
      },
    },
    {
      accessorKey: "merchantName",
      header: rp?.merchant || "Merchant",
      cell: ({ row }) => {
        const merchantName = row.getValue("merchantName") as string | null
        return merchantName || <span className="text-muted-foreground">--</span>
      },
    },
    {
      accessorKey: "transactionDate",
      header: fd?.date || "Date",
      cell: ({ row }) => {
        const date = row.getValue("transactionDate") as Date | null
        return date ? (
          format(new Date(date), "PP", { locale: dateFnsLocale })
        ) : (
          <span className="text-muted-foreground">--</span>
        )
      },
    },
    {
      accessorKey: "transactionAmount",
      header: fd?.amount || "Amount",
      cell: ({ row }) => {
        const amount = row.getValue("transactionAmount") as number | null
        const currency = row.original.currency || "USD"
        return amount !== null ? (
          <span className="font-semibold">
            {currency} {amount.toFixed(2)}
          </span>
        ) : (
          <span className="text-muted-foreground">--</span>
        )
      },
    },
    {
      accessorKey: "status",
      header: fd?.status || "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string

        const statusConfig = {
          pending: {
            label: fd?.pending || "Pending",
            variant: "secondary" as const,
          },
          processing: {
            label: rp?.processing || "Processing",
            variant: "default" as const,
          },
          processed: {
            label: rp?.processed || "Processed",
            variant: "default" as const,
          },
          error: {
            label: fd?.error || "Error",
            variant: "destructive" as const,
          },
        }

        const config =
          statusConfig[status as keyof typeof statusConfig] ||
          statusConfig.pending

        return <Badge variant={config.variant}>{config.label}</Badge>
      },
    },
    {
      accessorKey: "uploadedAt",
      header: rp?.uploaded || "Uploaded",
      cell: ({ row }) => {
        const date = row.getValue("uploadedAt") as Date
        return format(new Date(date), "PP", { locale: dateFnsLocale })
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const receipt = row.original

        return (
          <ActionMenu srLabel={rp?.openMenu || "Open menu"}>
            <DropdownMenuLabel>{fd?.actions || "Actions"}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <ActionMenuItem
              icon={Eye}
              label={rp?.viewDetails || "View Details"}
              onClick={() => {
                // View details - will be handled by parent component
                window.location.href = `/receipts/${receipt.id}`
              }}
            />
            {receipt.status === "error" && (
              <DropdownMenuItem
                onClick={() => {
                  // Handle retry - this would call retryReceiptExtraction
                  console.log("Retry extraction for:", receipt.id)
                }}
              >
                <RefreshCw className="me-2 h-4 w-4" />
                {rp?.retryExtraction || "Retry Extraction"}
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <ActionMenuItem
              icon={Trash2}
              label={fd?.delete || "Delete"}
              onClick={() => {
                // Handle delete - this would call deleteReceipt
                console.log("Delete receipt:", receipt.id)
              }}
              variant="destructive"
            />
          </ActionMenu>
        )
      },
    },
  ]
}
