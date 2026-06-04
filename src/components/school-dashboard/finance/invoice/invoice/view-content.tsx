"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { formatCurrency, formatDate } from "@/lib/i18n-format"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import type { Locale } from "@/components/internationalization/config"
import {
  DownloadInvoiceButton,
  SendInvoiceButton,
} from "../download-invoice"

interface InvoiceViewProps {
  invoice: any | null
  dictionary?: any
  lang?: Locale
}

export default function ViewInvoiceModalContent({
  invoice,
  dictionary,
  lang = "en",
}: InvoiceViewProps) {
  const iv = (dictionary as any)?.finance?.invoiceView as
    | Record<string, string>
    | undefined

  if (!invoice) {
    return (
      <div className="text-muted-foreground p-8 text-center">
        {iv?.notFound || "Invoice not found"}
      </div>
    )
  }

  return (
    <div className="w-full max-w-3xl">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="mb-1 text-xl font-bold">{iv?.invoice || "Invoice"}</h1>
          <p className="text-muted-foreground text-xs">#{invoice.invoice_no}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge>{invoice.status}</Badge>
          <DownloadInvoiceButton
            invoice={invoice}
            lang={lang}
            label={iv?.downloadPdf || "Download PDF"}
          />
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
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-6">
        <div>
          <h2 className="mb-2 font-semibold">{iv?.from || "From"}</h2>
          <p>{invoice.from?.name}</p>
          <p className="text-muted-foreground text-sm">{invoice.from?.email}</p>
        </div>
        <div>
          <h2 className="mb-2 font-semibold">{iv?.to || "To"}</h2>
          <p>{invoice.to?.name}</p>
          <p className="text-muted-foreground text-sm">{invoice.to?.email}</p>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-6 text-sm">
        <div>
          <span className="font-medium">
            {iv?.invoiceDate || "Invoice Date"}
          </span>
          <p>{formatDate(invoice.invoice_date, lang)}</p>
        </div>
        <div>
          <span className="font-medium">{iv?.dueDate || "Due Date"}</span>
          <p>{formatDate(invoice.due_date, lang)}</p>
        </div>
      </div>

      <Separator className="my-6" />

      <table className="mb-6 w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="py-2 text-start">{iv?.item || "Item"}</th>
            <th className="py-2 text-end">{iv?.qty || "Qty"}</th>
            <th className="py-2 text-end">{iv?.price || "Price"}</th>
            <th className="py-2 text-end">{iv?.total || "Total"}</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items?.map((item: any) => {
            const itemTotal = item.quantity * item.price
            return (
              <tr key={item.id} className="border-b">
                <td className="py-2">{item.item_name}</td>
                <td className="py-2 text-end">{item.quantity}</td>
                <td className="py-2 text-end">
                  {formatCurrency(item.price, lang)}
                </td>
                <td className="py-2 text-end">
                  {formatCurrency(itemTotal, lang)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <div className="flex justify-end">
        <div className="w-56">
          {invoice.discount != null && Number(invoice.discount) > 0 && (
            <div className="flex justify-between py-1 text-sm">
              <span>{iv?.discount || "Discount"}</span>
              <span>-{formatCurrency(Number(invoice.discount), lang)}</span>
            </div>
          )}
          {invoice.tax_percentage != null &&
            Number(invoice.tax_percentage) > 0 && (
              <div className="flex justify-between py-1 text-sm">
                <span>
                  {iv?.tax || "Tax"} ({Number(invoice.tax_percentage)}%)
                </span>
                <span>
                  {formatCurrency(
                    (Number(invoice.sub_total) *
                      Number(invoice.tax_percentage)) /
                      100,
                    lang
                  )}
                </span>
              </div>
            )}
          <div className="flex justify-between border-t py-2">
            <span className="font-medium">{iv?.total || "Total"}</span>
            <span className="font-bold">
              {formatCurrency(Number(invoice.total), lang)}
            </span>
          </div>
        </div>
      </div>

      {invoice.notes && (
        <div className="mt-6">
          <h3 className="mb-1 text-sm font-medium">{iv?.notes || "Notes"}</h3>
          <p className="text-muted-foreground text-sm">{invoice.notes}</p>
        </div>
      )}
    </div>
  )
}
