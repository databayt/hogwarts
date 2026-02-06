/**
 * Data Table Columns for Receipts
 * Follows Hogwarts table pattern with client-side column generation
 */

"use client"

import Link from "next/link"
import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { Ellipsis, Eye, RefreshCw, Trash2 } from "lucide-react"

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

import { ExpenseReceipt } from "./types"

export function getColumns(): ColumnDef<ExpenseReceipt>[] {
  return [
    {
      accessorKey: "fileName",
      header: "File Name",
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
      header: "Merchant",
      cell: ({ row }) => {
        const merchantName = row.getValue("merchantName") as string | null
        return merchantName || <span className="text-muted-foreground">—</span>
      },
    },
    {
      accessorKey: "transactionDate",
      header: "Date",
      cell: ({ row }) => {
        const date = row.getValue("transactionDate") as Date | null
        return date ? (
          format(new Date(date), "PP")
        ) : (
          <span className="text-muted-foreground">—</span>
        )
      },
    },
    {
      accessorKey: "transactionAmount",
      header: "Amount",
      cell: ({ row }) => {
        const amount = row.getValue("transactionAmount") as number | null
        const currency = row.original.currency || "USD"
        return amount !== null ? (
          <span className="font-semibold">
            {currency} {amount.toFixed(2)}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string

        const statusConfig = {
          pending: { label: "Pending", variant: "secondary" as const },
          processing: { label: "Processing", variant: "default" as const },
          processed: { label: "Processed", variant: "default" as const },
          error: { label: "Error", variant: "destructive" as const },
        }

        const config =
          statusConfig[status as keyof typeof statusConfig] ||
          statusConfig.pending

        return <Badge variant={config.variant}>{config.label}</Badge>
      },
    },
    {
      accessorKey: "uploadedAt",
      header: "Uploaded",
      cell: ({ row }) => {
        const date = row.getValue("uploadedAt") as Date
        return format(new Date(date), "PP")
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const receipt = row.original

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <Ellipsis className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  // View details - will be handled by parent component
                  window.location.href = `/receipts/${receipt.id}`
                }}
              >
                <Eye className="me-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              {receipt.status === "error" && (
                <DropdownMenuItem
                  onClick={() => {
                    // Handle retry - this would call retryReceiptExtraction
                    console.log("Retry extraction for:", receipt.id)
                  }}
                >
                  <RefreshCw className="me-2 h-4 w-4" />
                  Retry Extraction
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => {
                  // Handle delete - this would call deleteReceipt
                  console.log("Delete receipt:", receipt.id)
                }}
              >
                <Trash2 className="me-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
}
