"use client"

import { Download, ReceiptText } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export interface InvoiceItem {
  id: string
  date: string
  amount: string
  status: "paid" | "refunded" | "open" | "void"
  invoiceUrl?: string
  description?: string
}

interface InvoiceHistoryProps {
  className?: string
  title?: string
  description?: string
  invoices: InvoiceItem[]
  onDownload?: (invoiceId: string) => void
}

export function InvoiceHistory({
  className,
  title = "Invoice History",
  description = "Your past invoices and payment receipts.",
  invoices,
  onDownload,
}: InvoiceHistoryProps) {
  if (!invoices) return null

  const statusBadge = (status: InvoiceItem["status"]) => {
    switch (status) {
      case "paid":
        return (
          <Badge className="border-emerald-700/40 bg-emerald-600 text-emerald-50">
            Paid
          </Badge>
        )
      case "refunded":
        return <Badge variant="secondary">Refunded</Badge>
      case "open":
        return <Badge variant="outline">Open</Badge>
      case "void":
        return <Badge variant="outline">Void</Badge>
    }
  }

  return (
    <div className={cn("w-full", className)}>
      {(title || description) && (
        <div className="mb-4">
          {title && (
            <h3 className="flex items-center gap-2 text-lg font-semibold">
              <ReceiptText className="text-primary h-4 w-4" />
              {title}
            </h3>
          )}
          {description && (
            <p className="text-muted-foreground text-sm">{description}</p>
          )}
        </div>
      )}
      <div className="rounded-md border">
        <Table>
          <TableCaption className="sr-only">
            List of past invoices with dates, amounts, status and download
            actions
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px] px-6">Date</TableHead>
              <TableHead className="px-6">Description</TableHead>
              <TableHead className="px-6 text-end">Amount</TableHead>
              <TableHead className="px-6 text-end">Status</TableHead>
              <TableHead className="px-6 text-end">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-muted-foreground h-24 text-center"
                >
                  No invoices yet
                </TableCell>
              </TableRow>
            )}
            {invoices.map((inv) => (
              <TableRow key={inv.id} className="group">
                <TableCell className="text-muted-foreground px-6">
                  {inv.date}
                </TableCell>
                <TableCell className="max-w-[320px] px-6">
                  <div
                    className="truncate"
                    title={inv.description || "Invoice"}
                  >
                    {inv.description || "Invoice"}
                  </div>
                </TableCell>
                <TableCell className="px-6 text-end font-medium">
                  {inv.amount}
                </TableCell>
                <TableCell className="px-6 text-end">
                  {statusBadge(inv.status)}
                </TableCell>
                <TableCell className="px-6 text-end">
                  <button
                    className="hover:bg-muted rounded-md p-2 transition-colors"
                    onClick={() =>
                      inv.invoiceUrl
                        ? window.open(
                            inv.invoiceUrl,
                            "_blank",
                            "noopener,noreferrer"
                          )
                        : onDownload?.(inv.id)
                    }
                    aria-label={`Download invoice ${inv.id}`}
                  >
                    <Download className="text-muted-foreground h-4 w-4" />
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
