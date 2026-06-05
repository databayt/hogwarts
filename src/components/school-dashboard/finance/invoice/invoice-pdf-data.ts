// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { InvoiceData } from "@/components/file/generate/types"
import type { Locale } from "@/components/internationalization/config"

/** Minimal shape of the UserInvoice (+ relations) needed to render a PDF. */
export interface InvoiceForPdf {
  invoice_no: string
  invoice_date: string | Date
  due_date: string | Date
  status: string
  currency?: string | null
  sub_total: number | string
  discount?: number | string | null
  tax_percentage?: number | string | null
  total: number | string
  notes?: string | null
  from?: { name?: string | null; email?: string | null } | null
  to?: { name?: string | null; email?: string | null } | null
  items?: Array<{
    item_name: string
    quantity: number
    price: number | string
  }> | null
}

// UserInvoice status (PAID/UNPAID/OVERDUE/CANCELLED, + PARTIAL/SENT once the
// schema adds them) → the template's display status.
export const INVOICE_STATUS_MAP: Record<string, InvoiceData["status"]> = {
  PAID: "paid",
  UNPAID: "pending",
  PARTIAL: "pending",
  OVERDUE: "overdue",
  CANCELLED: "cancelled",
  SENT: "pending",
}

/** Adapter: UserInvoice → the @react-pdf InvoiceTemplate's InvoiceData. */
export function mapInvoiceToInvoiceData(
  invoice: InvoiceForPdf,
  lang: Locale
): InvoiceData {
  const items = (invoice.items ?? []).map((it) => ({
    description: it.item_name,
    quantity: it.quantity,
    unitPrice: Number(it.price),
    total: it.quantity * Number(it.price),
  }))
  const subtotal = Number(invoice.sub_total)
  const taxPct =
    invoice.tax_percentage != null ? Number(invoice.tax_percentage) : 0
  const discount = invoice.discount != null ? Number(invoice.discount) : 0

  return {
    // DocumentMetadata — the "from" address is the school's billing identity.
    schoolName: invoice.from?.name ?? "",
    schoolEmail: invoice.from?.email ?? undefined,
    issueDate: new Date(invoice.invoice_date),
    locale: lang === "ar" ? "ar" : "en",
    // Invoice
    invoiceNumber: invoice.invoice_no,
    dueDate: new Date(invoice.due_date),
    status: INVOICE_STATUS_MAP[invoice.status] ?? "pending",
    clientName: invoice.to?.name ?? "",
    clientEmail: invoice.to?.email ?? undefined,
    items,
    subtotal,
    taxAmount: taxPct > 0 ? (subtotal * taxPct) / 100 : undefined,
    discount: discount > 0 ? discount : undefined,
    total: Number(invoice.total),
    notes: invoice.notes ?? undefined,
    currency: invoice.currency ?? "USD",
  }
}
