// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Link from "next/link"
import { Download } from "lucide-react"

import { formatCurrency, formatDate } from "@/lib/i18n-format"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { SectionHeading } from "@/components/school-dashboard/dashboard/section-heading"

import type { FamilySectionProps } from "./types"

/**
 * What this family has already paid, newest first, each with its receipt.
 *
 * Payment numbers are plain text, not links: `/finance/fees/payments/[id]` is
 * admin-gated, and every family that clicked one landed on "access denied".
 * The receipt is the artifact a family can actually take away, so it is the
 * only action here.
 *
 * A payment still awaiting the bursar's verification is listed with that said
 * plainly — it is money the family has sent, and hiding it invites a second
 * payment for the same instalment — but it carries no receipt, because none
 * exists until the payment clears.
 */
export function FamilyReceipts({ money, lang, d }: FamilySectionProps) {
  if (money.payments.length === 0) return null

  return (
    <section>
      <SectionHeading title={d?.receipts || "Receipts"} />
      <ul className="space-y-3">
        {money.payments.slice(0, 20).map((p) => (
          <li
            key={p.id}
            className="bg-card flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="truncate font-medium">{p.feeName}</p>
              <p className="text-muted-foreground truncate text-xs">
                <span className="font-mono">{p.paymentNumber}</span>
                {" · "}
                {formatDate(p.paymentDate, lang, {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
                {" · "}
                {p.paymentMethod.replace(/_/g, " ")}
              </p>
            </div>

            <div className="flex items-center justify-between gap-3 sm:justify-end">
              <div className="sm:text-end">
                <p className="font-semibold tabular-nums">
                  {formatCurrency(p.amount, lang, money.currency)}
                </p>
                {p.status !== "SUCCESS" ? (
                  <Badge variant="secondary" className="mt-1 font-normal">
                    {d?.paymentStatusLabels?.[p.status] ||
                      d?.awaitingVerification ||
                      p.status}
                  </Badge>
                ) : null}
              </div>

              {/* One receipt action, not two. The route renders the same PDF
                  the client-side generator does, on the server and in the
                  reader's language — the in-page generator ships
                  @react-pdf/renderer to a phone and labels itself in English
                  unless the whole dictionary is threaded into it. */}
              {p.status === "SUCCESS" ? (
                <Button variant="outline" size="sm" asChild>
                  <Link
                    href={`/api/payment/${p.id}/receipt`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Download className="me-2 h-4 w-4" />
                    {d?.viewReceipt || "Receipt"}
                  </Link>
                </Button>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
