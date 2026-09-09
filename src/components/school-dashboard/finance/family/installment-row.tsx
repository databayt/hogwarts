// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Link from "next/link"
import { CircleCheck, Clock, FileText, TriangleAlert } from "lucide-react"

import { formatCurrency, formatDate } from "@/lib/i18n-format"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import type { Locale } from "@/components/internationalization/config"

import type { FamilyDictionary, FamilyInstallment } from "./types"

const STATUS_TONE: Record<string, string> = {
  PAID: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600",
  PARTIAL: "border-amber-500/30 bg-amber-500/10 text-amber-600",
  PENDING: "border-border bg-muted text-muted-foreground",
  OVERDUE: "border-destructive/30 bg-destructive/10 text-destructive",
  CANCELLED: "border-border bg-muted text-muted-foreground",
}

const STATUS_ICON = {
  PAID: CircleCheck,
  PARTIAL: Clock,
  PENDING: Clock,
  OVERDUE: TriangleAlert,
  CANCELLED: Clock,
} as const

/**
 * One instalment, as a phone row.
 *
 * The instalment and the invoice are the same object here — the school issues
 * one `UserInvoice` per scheduled payment and the payment allocator settles
 * them oldest-first — so this row carries both identities: what is owed and
 * when, plus the invoice number that proves it. Splitting them into two lists
 * would show a family the same money twice under two names.
 *
 * Layout is a single column that only becomes a row from `sm` up: on a phone
 * the amount belongs under the label at full size, not squeezed beside it.
 */
export function FamilyInstallmentRow({
  installment,
  lang,
  currency,
  d,
  action,
  className,
}: {
  installment: FamilyInstallment
  lang: Locale
  currency: string
  d?: FamilyDictionary
  /** The Pay control, when this row can be acted on. */
  action?: React.ReactNode
  className?: string
}) {
  const i = installment
  const Icon = STATUS_ICON[i.status] ?? Clock
  const outstanding = Math.max(i.amount - i.paidAmount, 0)
  const label =
    i.count > 1
      ? (d?.installmentOf || "Instalment {n} of {total}")
          .replace("{n}", String(i.number))
          .replace("{total}", String(i.count))
      : i.feeName

  return (
    <li
      className={cn(
        "bg-card flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6",
        className
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        <span
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border",
            STATUS_TONE[i.status]
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="truncate font-medium">{label}</p>
          <p className="text-muted-foreground truncate text-xs">
            {i.count > 1 ? `${i.feeName} · ` : ""}
            {i.dueDate
              ? (i.status === "OVERDUE"
                  ? d?.overdueSince || "Overdue since {date}"
                  : d?.dueOn || "Due {date}"
                ).replace(
                  "{date}",
                  formatDate(i.dueDate, lang, {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                )
              : d?.noDueDate || "No due date set"}
          </p>
          {/* The invoice number, and the hosted invoice when the school
              published one. A token on a private invoice is not offered —
              that link 404s for the family it was shown to. */}
          {i.invoiceNo ? (
            <p className="text-muted-foreground mt-1 flex items-center gap-1 text-xs">
              <FileText className="h-3 w-3" />
              {i.shareToken ? (
                <Link
                  href={`/${lang}/invoice/${i.shareToken}`}
                  className="hover:text-foreground underline underline-offset-2"
                >
                  {i.invoiceNo}
                </Link>
              ) : (
                <span className="font-mono">{i.invoiceNo}</span>
              )}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 sm:justify-end">
        <div className="sm:text-end">
          <p className="font-semibold tabular-nums">
            {formatCurrency(outstanding || i.amount, lang, currency)}
          </p>
          <Badge
            variant="outline"
            className={cn("mt-1 font-normal", STATUS_TONE[i.status])}
          >
            {d?.statusLabels?.[i.status] || i.status}
          </Badge>
        </div>
        {action}
      </div>
    </li>
  )
}
