"use client"

import { cn } from "@/lib/utils"
import {
    Table,
    TableBody,
    TableCell,
    TableCaption,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, Download, ReceiptText } from "lucide-react"
import { Button } from "@/components/ui/button"

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
                return <Badge className="bg-emerald-600 text-emerald-50 border-emerald-700/40">Paid</Badge>
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
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <ReceiptText className="h-4 w-4 text-primary" />
                            {title}
                        </h3>
                    )}
                    {description && (
                        <p className="text-sm text-muted-foreground">
                            {description}
                        </p>
                    )}
                </div>
            )}
            <div className="rounded-md border">
                <Table>
                    <TableCaption className="sr-only">List of past invoices with dates, amounts, status and download actions</TableCaption>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[120px]">Date</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead className="text-end">Amount</TableHead>
                            <TableHead className="text-end">Status</TableHead>
                            <TableHead className="text-end">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {invoices.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                    No invoices yet
                                </TableCell>
                            </TableRow>
                        )}
                        {invoices.map((inv) => (
                            <TableRow key={inv.id} className="group">
                                <TableCell className="text-muted-foreground">
                                    <div className="inline-flex items-center gap-2">
                                        <CalendarDays className="h-3.5 w-3.5" />
                                        {inv.date}
                                    </div>
                                </TableCell>
                                <TableCell className="max-w-[320px]">
                                    <div className="truncate" title={inv.description || "Invoice"}>
                                        {inv.description || "Invoice"}
                                    </div>
                                </TableCell>
                                <TableCell className="text-end font-medium">
                                    {inv.amount}
                                </TableCell>
                                <TableCell className="text-end">
                                    {statusBadge(inv.status)}
                                </TableCell>
                                <TableCell className="text-end">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 text-xs"
                                        onClick={() =>
                                            inv.invoiceUrl
                                                ? window.open(inv.invoiceUrl, "_blank", "noopener,noreferrer")
                                                : onDownload?.(inv.id)
                                        }
                                        aria-label={`Download invoice ${inv.id}`}
                                    >
                                        <Download className="h-3.5 w-3.5" />
                                        Download
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}


