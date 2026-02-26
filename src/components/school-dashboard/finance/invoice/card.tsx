"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useLocale } from "@/components/internationalization/use-locale"

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
  const { locale } = useLocale()
  const currencyCode = invoice.currency || "USD"
  const amount = new Intl.NumberFormat(locale, {
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
