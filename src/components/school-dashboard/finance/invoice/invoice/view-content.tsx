// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Full-page invoice detail: an action toolbar (hidden in print) above the
// print-first InvoiceSheet, plus the linked-payments card. Server component —
// only the toolbar buttons are client leaves.
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { formatCurrency, formatDate } from "@/lib/i18n-format"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Locale } from "@/components/internationalization/config"

import {
  DownloadInvoiceButton,
  MarkInvoicePaidButton,
  SendInvoiceButton,
} from "../download-invoice"
import { InvoicePrintButton } from "../invoice-print-button"
import { InvoiceShareDialog } from "../invoice-share-dialog"
import { InvoiceSheet } from "../invoice-sheet"

interface LinkedPayment {
  id: string
  paymentNumber: string
  amount: number
  currency: string | null
  paymentDate: Date | string
  paymentMethod: string
  status: string
}

interface InvoiceViewProps {
  invoice: any | null
  dictionary?: any
  lang?: Locale
}

export default function ViewInvoiceContent({
  invoice,
  dictionary,
  lang = "en",
}: InvoiceViewProps) {
  const iv = (dictionary as any)?.finance?.invoiceView as
    | Record<string, string>
    | undefined
  const share = (dictionary as any)?.finance?.invoiceShare as
    | Record<string, string>
    | undefined

  if (!invoice) {
    return (
      <div className="text-muted-foreground p-8 text-center">
        {iv?.notFound || "Invoice not found"}
      </div>
    )
  }

  const linkedPayments: LinkedPayment[] = invoice.linkedPayments ?? []
  const isDraft = invoice.wizardStep != null

  return (
    <div className="mx-auto w-full max-w-3xl pb-12">
      {/* Toolbar — never printed */}
      <div className="flex flex-wrap items-center justify-between gap-2 py-4 print:hidden">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/${lang}/finance/invoice`}>
            <ArrowLeft className="me-2 h-4 w-4 rtl:rotate-180" />
            {iv?.back || "Back"}
          </Link>
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          <InvoicePrintButton label={share?.print || "Print"} />
          <DownloadInvoiceButton
            invoice={invoice}
            lang={lang}
            label={iv?.downloadPdf || "Download PDF"}
          />
          {invoice.id && !isDraft && (
            <InvoiceShareDialog
              invoiceId={invoice.id}
              invoiceNo={invoice.invoice_no}
              schoolName={invoice.schoolName ?? invoice.from?.name ?? null}
              initialToken={invoice.shareToken ?? null}
              initialIsPublic={Boolean(invoice.isPublic)}
              recipientEmail={invoice.to?.email ?? null}
              recipientPhone={invoice.recipientPhone ?? null}
              lang={lang}
              dictionary={dictionary}
            />
          )}
          {invoice.id && (
            <SendInvoiceButton
              invoiceId={invoice.id}
              invoiceNo={invoice.invoice_no}
              label={iv?.send || "Send"}
              subjectPrefix={iv?.invoice || "Invoice"}
              sentLabel={iv?.invoiceSent || "Invoice sent"}
              errorLabel={iv?.sendFailed || "Failed to send invoice"}
            />
          )}
          {invoice.id && invoice.status !== "PAID" && (
            <MarkInvoicePaidButton
              invoiceId={invoice.id}
              label={iv?.markPaid || "Mark paid"}
              paidLabel={iv?.invoicePaidToast || "Invoice marked as paid"}
              errorLabel={iv?.markPaidFailed || "Failed to mark invoice paid"}
            />
          )}
        </div>
      </div>

      {/* The document itself */}
      <div className="border-border bg-background border shadow-sm print:border-0 print:shadow-none">
        <InvoiceSheet
          data={{
            invoice_no: invoice.invoice_no,
            invoice_date: invoice.invoice_date,
            due_date: invoice.due_date,
            currency: invoice.currency || "USD",
            status: invoice.status,
            sub_total: Number(invoice.sub_total),
            discount:
              invoice.discount != null ? Number(invoice.discount) : null,
            tax_percentage:
              invoice.tax_percentage != null
                ? Number(invoice.tax_percentage)
                : null,
            total: Number(invoice.total),
            amountPaid: Number(invoice.amountPaid ?? 0),
            notes: invoice.notes ?? null,
            from: invoice.from ?? { name: "" },
            to: invoice.to ?? { name: "" },
            items: (invoice.items ?? []).map(
              (item: {
                id: string
                item_name: string
                quantity: number
                price: number
                total: number
              }) => ({
                id: item.id,
                item_name: item.item_name,
                quantity: item.quantity,
                price: Number(item.price),
                total: Number(item.total),
              })
            ),
            schoolName: invoice.schoolName ?? null,
            schoolLogo: invoice.schoolLogo ?? null,
            schoolEmail: invoice.schoolEmail ?? null,
          }}
          dictionary={dictionary}
          lang={lang}
        />
      </div>

      {/* Linked fee payments — screen only */}
      {linkedPayments.length > 0 && (
        <Card className="mt-6 print:hidden">
          <CardHeader>
            <CardTitle className="text-sm">
              {iv?.linkedPayments || "Linked Payments"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="py-2 text-start">
                    {iv?.paymentNumber || "Payment #"}
                  </th>
                  <th className="py-2 text-start">
                    {iv?.paymentDate || "Date"}
                  </th>
                  <th className="py-2 text-start">
                    {iv?.paymentMethod || "Method"}
                  </th>
                  <th className="py-2 text-end">
                    {iv?.paymentAmount || "Amount"}
                  </th>
                </tr>
              </thead>
              <tbody>
                {linkedPayments.map((p) => (
                  <tr key={p.id} className="border-b last:border-0">
                    <td className="py-2 font-mono text-xs">
                      {p.paymentNumber}
                    </td>
                    <td className="py-2">{formatDate(p.paymentDate, lang)}</td>
                    <td className="py-2">{p.paymentMethod}</td>
                    <td className="py-2 text-end font-medium">
                      {formatCurrency(
                        p.amount,
                        lang,
                        p.currency ?? invoice.currency ?? "USD"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
