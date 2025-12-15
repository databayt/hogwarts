"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"

import { formatCurrency, formatDate } from "@/lib/i18n-format"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import type { Locale } from "@/components/internationalization/config"

interface InvoiceViewProps {
  invoiceId: string
  dictionary?: any
  lang?: Locale
}

export default function ViewInvoiceModalContent({
  invoiceId,
  dictionary,
  lang = "en",
}: InvoiceViewProps) {
  const [invoice, setInvoice] = useState<any | null>(null)

  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch(`/api/invoice/${invoiceId}`)
        if (res.ok) {
          const json = await res.json()
          setInvoice(json)
        }
      } catch (_) {}
    }
    run()
  }, [invoiceId])

  if (!invoice) return <div>Loading...</div>

  return (
    <div className="w-full max-w-3xl">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="mb-1 text-xl font-bold">Invoice</h1>
          <p className="text-muted-foreground text-xs">#{invoice.invoice_no}</p>
        </div>
        <Badge>{invoice.status}</Badge>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-6">
        <div>
          <h2 className="mb-2 font-semibold">From</h2>
          <p>{invoice.from.name}</p>
          <p className="text-muted-foreground text-sm">{invoice.from.email}</p>
        </div>
        <div>
          <h2 className="mb-2 font-semibold">To</h2>
          <p>{invoice.to.name}</p>
          <p className="text-muted-foreground text-sm">{invoice.to.email}</p>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-6 text-sm">
        <div>
          <span className="font-medium">Invoice Date</span>
          <p>{formatDate(invoice.invoice_date, lang)}</p>
        </div>
        <div>
          <span className="font-medium">Due Date</span>
          <p>{formatDate(invoice.due_date, lang)}</p>
        </div>
      </div>

      <Separator className="my-6" />

      <table className="mb-6 w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="py-2 text-left">Item</th>
            <th className="py-2 text-right">Qty</th>
            <th className="py-2 text-right">Price</th>
            <th className="py-2 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((item: any) => {
            const itemTotal = item.quantity * item.price
            return (
              <tr key={item.id} className="border-b">
                <td className="py-2">{item.item_name}</td>
                <td className="py-2 text-right">{item.quantity}</td>
                <td className="py-2 text-right">
                  {formatCurrency(item.price, lang)}
                </td>
                <td className="py-2 text-right">
                  {formatCurrency(itemTotal, lang)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <div className="flex justify-end">
        <div className="w-56">
          <div className="flex justify-between py-2">
            <span className="font-medium">Total</span>
            <span className="font-bold">
              {formatCurrency(invoice.total, lang)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
