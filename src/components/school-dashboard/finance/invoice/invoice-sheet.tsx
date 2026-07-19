// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// InvoiceSheet — print-first invoice document (Milan Vučković minimalist
// monospace reference): letterspaced micro-labels, hairline rules, generous
// whitespace, one big bold TOTAL. Pure presentational server component; the
// authed detail page and the public share page both render it, each doing its
// own data fetching + access control.
//
// Typography: IBM Plex Mono carries the whole sheet in English. Arabic prose
// stays in the app's Arabic stack (Plex Mono has no Arabic glyphs — forcing it
// would fall back to a random system font); only codes stay mono there, and
// numerals rely on tabular-nums. Layout is fully logical-property/RTL-safe.
import { IBM_Plex_Mono } from "next/font/google"

import { formatCurrency, formatDate } from "@/lib/i18n-format"
import { cn } from "@/lib/utils"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-invoice-mono",
})

const MONO = "[font-family:var(--font-invoice-mono)]"

export interface InvoiceSheetParty {
  name: string
  email?: string | null
  address1?: string | null
  address2?: string | null
  address3?: string | null
}

export interface InvoiceSheetItem {
  id?: string
  item_name: string
  quantity: number
  price: number
  total: number
}

export interface InvoiceSheetData {
  invoice_no: string
  invoice_date: Date | string
  due_date: Date | string
  currency: string
  status: string
  sub_total: number
  discount?: number | null
  tax_percentage?: number | null
  total: number
  amountPaid?: number
  notes?: string | null
  from: InvoiceSheetParty
  to: InvoiceSheetParty
  items: InvoiceSheetItem[]
  schoolName?: string | null
  schoolLogo?: string | null
  schoolEmail?: string | null
}

interface Props {
  data: InvoiceSheetData
  dictionary: Dictionary
  lang: Locale
}

export function InvoiceSheet({ data, dictionary, lang }: Props) {
  const L = ((dictionary as Record<string, any>)?.finance?.invoiceSheet ??
    {}) as Record<string, string>
  const statusLabels = ((dictionary as Record<string, any>)?.finance
    ?.invoiceStatus ?? {}) as Record<string, string>
  const isAr = lang === "ar"

  // English gets the reference's all-mono look; Arabic keeps its own face for
  // prose and reserves mono for Latin codes.
  const sheetFont = isAr ? "" : MONO
  const codeFont = MONO

  const money = (n: number) => formatCurrency(n, lang, data.currency)
  const date = (d: Date | string) => {
    const s = formatDate(d, lang, {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
    return isAr ? s : s.toUpperCase()
  }

  const schoolName = data.schoolName || data.from.name
  const logoInitial = (schoolName || "•").trim().charAt(0)
  const taxAmount =
    data.tax_percentage != null && data.tax_percentage > 0
      ? Math.round(data.sub_total * data.tax_percentage) / 100
      : 0
  const amountPaid = data.amountPaid ?? 0
  const showPaymentRows = amountPaid > 0 && amountPaid < data.total
  const statusLabel =
    statusLabels[data.status.toLowerCase()] || data.status.toUpperCase()

  const label = cn(
    "text-[0.65rem] font-semibold tracking-[0.25em] text-foreground",
    isAr && "tracking-[0.08em]"
  )
  const mutedLine = "text-[0.8rem] leading-6 text-muted-foreground"

  return (
    <div
      dir={isAr ? "rtl" : "ltr"}
      className={cn(
        plexMono.variable,
        sheetFont,
        "invoice-sheet bg-background text-foreground mx-auto w-full max-w-3xl px-6 py-10 sm:px-12 sm:py-14"
      )}
    >
      {/* Header — logo start, school identity end */}
      <header className="flex items-start justify-between gap-6">
        {data.schoolLogo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={data.schoolLogo}
            alt={schoolName ?? ""}
            className="h-14 w-14 object-contain"
          />
        ) : (
          <div className="bg-foreground grid h-14 w-14 place-items-center">
            <span
              className={cn(
                "text-background text-xl font-bold lowercase",
                codeFont
              )}
            >
              {logoInitial}.
            </span>
          </div>
        )}
        <div className="text-end">
          <p className={cn(label, "text-[0.7rem]")}>{schoolName}</p>
          <div className="mt-5 space-y-0.5">
            {data.schoolEmail ? (
              <p className={mutedLine}>{data.schoolEmail}</p>
            ) : null}
            {data.from.address1 ? (
              <p className={mutedLine}>{data.from.address1}</p>
            ) : null}
            {data.from.address2 ? (
              <p className={mutedLine}>{data.from.address2}</p>
            ) : null}
          </div>
        </div>
      </header>

      {/* Recipient start — INVOICE title end */}
      <section className="mt-14 flex items-start justify-between gap-6">
        <div className="min-w-0">
          <p className={label}>{L.recipient || "RECIPIENT"}</p>
          <div className="mt-5 space-y-0.5">
            <p className="text-[0.85rem] leading-6">{data.to.name}</p>
            {data.to.address1 && data.to.address1 !== data.to.name ? (
              <p className={mutedLine}>{data.to.address1}</p>
            ) : null}
            {data.to.address2 ? (
              <p className={mutedLine}>{data.to.address2}</p>
            ) : null}
            {data.to.address3 ? (
              <p className={mutedLine}>{data.to.address3}</p>
            ) : null}
          </div>
          {data.to.email ? (
            <p className={cn(mutedLine, "mt-4")}>{data.to.email}</p>
          ) : null}
        </div>
        <div className="shrink-0 text-end">
          <h1 className="text-3xl font-bold tracking-wide sm:text-4xl">
            {L.invoice || "INVOICE"}
          </h1>
          <p className={cn(label, "mt-6")}>
            {L.invoiceNumber || "INVOICE NUMBER"}
          </p>
          <p className={cn(mutedLine, codeFont, "mt-1 tabular-nums")}>
            {data.invoice_no}
          </p>
          <p
            className={cn(
              "mt-3 text-[0.65rem] font-semibold tracking-[0.25em]",
              isAr && "tracking-[0.08em]",
              data.status === "PAID"
                ? "text-foreground"
                : data.status === "OVERDUE"
                  ? "text-destructive"
                  : "text-muted-foreground"
            )}
          >
            {statusLabel}
          </p>
        </div>
      </section>

      {/* Items */}
      <section className="mt-14">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className={cn(label, "w-[7.5rem] pb-4 text-start")}>
                {L.invoiceDate || "INVOICE DATE"}
              </th>
              <th className={cn(label, "pb-4 text-start")}>
                {L.description || "DESCRIPTION"}
              </th>
              <th className={cn(label, "w-[5.5rem] pb-4 text-end")}>
                {L.price || "PRICE"}
              </th>
              <th className={cn(label, "w-[3.5rem] pb-4 text-end")}>
                {L.qty || "QTY"}
              </th>
              <th className={cn(label, "w-[7rem] pb-4 text-end")}>
                {L.amount || "AMOUNT"}
              </th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item, i) => (
              <tr key={item.id ?? i}>
                <td className={cn(mutedLine, "py-3 align-top tabular-nums")}>
                  {i === 0 ? date(data.invoice_date) : null}
                </td>
                <td className={cn(mutedLine, "py-3 pe-4 align-top")}>
                  {item.item_name}
                </td>
                <td
                  className={cn(
                    mutedLine,
                    "py-3 text-end align-top tabular-nums"
                  )}
                >
                  {money(item.price)}
                </td>
                <td
                  className={cn(
                    mutedLine,
                    "py-3 text-end align-top tabular-nums"
                  )}
                >
                  {item.quantity}
                </td>
                <td
                  className={cn(
                    mutedLine,
                    "py-3 text-end align-top tabular-nums"
                  )}
                >
                  {money(item.total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals — hairline, end-aligned block, big bold TOTAL */}
        <div className="border-border mt-4 border-t pt-6">
          <div className="ms-auto w-full max-w-xs space-y-2">
            <div className="flex items-baseline justify-between gap-6">
              <span className="text-[0.8rem]">{L.subtotal || "Subtotal"}</span>
              <span className={cn(mutedLine, "tabular-nums")}>
                {money(data.sub_total)}
              </span>
            </div>
            {data.discount != null && data.discount > 0 ? (
              <div className="flex items-baseline justify-between gap-6">
                <span className="text-[0.8rem]">
                  {L.discount || "Discount"}
                </span>
                <span className={cn(mutedLine, "tabular-nums")}>
                  −{money(data.discount)}
                </span>
              </div>
            ) : null}
            {taxAmount > 0 ? (
              <div className="flex items-baseline justify-between gap-6">
                <span className="text-[0.8rem]">
                  {L.tax || "Tax"} ({data.tax_percentage}%)
                </span>
                <span className={cn(mutedLine, "tabular-nums")}>
                  {money(taxAmount)}
                </span>
              </div>
            ) : null}
            <div className="flex items-baseline justify-between gap-6 pt-4">
              <span className="text-[0.95rem] font-bold tracking-wide">
                {L.total || "TOTAL"}
              </span>
              <span className="text-lg font-bold tabular-nums">
                {money(data.total)}
              </span>
            </div>
            {showPaymentRows ? (
              <>
                <div className="flex items-baseline justify-between gap-6 pt-2">
                  <span className={cn(mutedLine)}>{L.paid || "Paid"}</span>
                  <span className={cn(mutedLine, "tabular-nums")}>
                    −{money(amountPaid)}
                  </span>
                </div>
                <div className="flex items-baseline justify-between gap-6">
                  <span className="text-[0.85rem] font-semibold">
                    {L.balanceDue || "Balance due"}
                  </span>
                  <span className="text-[0.9rem] font-semibold tabular-nums">
                    {money(data.total - amountPaid)}
                  </span>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </section>

      {/* Notes */}
      <section className="mt-16">
        <p className={label}>{L.notes || "NOTES"}</p>
        <div className="mt-5 space-y-1">
          {data.notes ? (
            <p className={cn(mutedLine, "whitespace-pre-line")}>{data.notes}</p>
          ) : (
            <p className={mutedLine}>
              {(L.paymentTerms || "Payment is due by {date}.").replace(
                "{date}",
                date(data.due_date)
              )}
            </p>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-border mt-16 border-t pt-5">
        <p className="text-muted-foreground text-[0.75rem]">
          {schoolName}
          {data.schoolEmail ? (
            <>
              {" "}
              <span className="mx-2">•</span> {data.schoolEmail}
            </>
          ) : null}
        </p>
      </footer>
    </div>
  )
}
