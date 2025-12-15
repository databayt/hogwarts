"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import type { Invoice } from "./types"

type InvoiceSummaryCardProps = {
  invoice: Pick<
    Invoice,
    "invoice_no" | "invoice_date" | "due_date" | "total" | "currency" | "status"
  > & {
    clientName?: string
  }
}

export function InvoiceSummaryCard({ invoice }: InvoiceSummaryCardProps) {
  const currencyCode = invoice.currency || "USD"
  const amount = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
  }).format(invoice.total)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invoice {invoice.invoice_no}</CardTitle>
      </CardHeader>
      <CardContent className="text-muted-foreground space-y-1 text-sm">
        <div>Client: {invoice.clientName ?? "—"}</div>
        <div>Date: {new Date(invoice.invoice_date).toLocaleDateString()}</div>
        <div>Due: {new Date(invoice.due_date).toLocaleDateString()}</div>
        <div>Total: {amount}</div>
        <div>Status: {invoice.status}</div>
      </CardContent>
    </Card>
  )
}
