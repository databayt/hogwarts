// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { formatCurrency } from "@/lib/i18n-format"
import { Progress } from "@/components/ui/progress"
import { SectionHeading } from "@/components/school-dashboard/dashboard/section-heading"

import { FamilyInstallmentRow } from "./installment-row"
import type { FamilySectionProps } from "./types"

/**
 * Every fee this family has been billed, with its full schedule.
 *
 * The section above answers "what do I pay next". This one answers "what am I
 * being charged for, and how far through it am I" — including the instalments
 * already settled, which the to-pay list deliberately drops. A guardian with
 * more than one child reads the child's name on each card, since two children
 * can carry the same fee name in the same year.
 */
export function FamilyFeeCards({ money, lang, d }: FamilySectionProps) {
  if (money.fees.length === 0) return null

  const showStudent = money.studentNames.length > 1

  return (
    <section>
      <SectionHeading title={d?.fees || "Your fees"} />
      {/* `items-start` so a fee with a four-row schedule does not stretch the
          fee beside it into a card that is mostly empty space. */}
      <div className="grid items-start gap-4 lg:grid-cols-2">
        {money.fees.map((fee) => {
          const progress =
            fee.total > 0
              ? Math.min(Math.round((fee.paid / fee.total) * 100), 100)
              : 0

          return (
            <article key={fee.id} className="bg-card rounded-2xl border p-5">
              <header className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="truncate font-medium">{fee.feeName}</h3>
                  <p className="text-muted-foreground text-xs">
                    {showStudent ? `${fee.studentName} · ` : ""}
                    {fee.academicYear}
                  </p>
                </div>
                <p className="shrink-0 font-semibold tabular-nums">
                  {formatCurrency(fee.total, lang, money.currency)}
                </p>
              </header>

              <div className="mt-4 space-y-2">
                <Progress value={progress} className="h-1.5" />
                <div className="text-muted-foreground flex justify-between text-xs tabular-nums">
                  <span>
                    {formatCurrency(fee.paid, lang, money.currency)}{" "}
                    {d?.paid || "paid"}
                  </span>
                  <span>
                    {formatCurrency(fee.remaining, lang, money.currency)}{" "}
                    {d?.remaining || "remaining"}
                  </span>
                </div>
              </div>

              {/* The schedule, only when there is more than one date to show.
                  A single-instalment fee is fully described by the line above
                  it; repeating it as a one-row list adds nothing. */}
              {fee.installments.length > 1 ? (
                <ul className="mt-4 space-y-2">
                  {fee.installments.map((installment) => (
                    <FamilyInstallmentRow
                      key={installment.id}
                      installment={installment}
                      lang={lang}
                      currency={money.currency}
                      d={d}
                      className="bg-muted/40 rounded-xl border-none p-3"
                    />
                  ))}
                </ul>
              ) : null}
            </article>
          )
        })}
      </div>
    </section>
  )
}
