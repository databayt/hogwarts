// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
// Server component: prop composition plus one client dialog for paying.

import { CircleCheck, TriangleAlert } from "lucide-react"

import { formatCurrency, formatDate } from "@/lib/i18n-format"
import { cn } from "@/lib/utils"
import { Progress } from "@/components/ui/progress"

import { PayFeeDialog } from "../fees/pay-fee-dialog"
import type { FamilySectionProps } from "./types"

interface Props extends FamilySectionProps {
  gatewayDictionary?: Record<string, unknown>
  manualRailDictionary?: Record<string, unknown>
}

/**
 * What this family owes, as the first thing on the page.
 *
 * A phone opens on one number and one button. Everything else on this surface
 * — the schedule, the invoices, the receipts — explains that number, so the
 * number goes first and the explanation follows. The card is the page's only
 * tinted ground; the sections under it are plain, which is what keeps this one
 * reading as the answer rather than as decoration.
 *
 * Three states, and they are genuinely different answers: money is overdue,
 * money is owed but not yet late, or nothing is owed at all. A settled family
 * gets a settled card, not a zero with an alarm colour.
 */
export function FamilyBalanceHero({
  money,
  lang,
  d,
  gatewayDictionary,
  manualRailDictionary,
}: Props) {
  const { totals, nextDue, currency } = money
  const settled = totals.remaining <= 0
  const isOverdue = totals.overdue > 0
  const progress =
    totals.billed > 0
      ? Math.min(Math.round((totals.paid / totals.billed) * 100), 100)
      : 0

  return (
    <section
      className={cn(
        "rounded-3xl border p-6 sm:p-8",
        isOverdue
          ? "border-destructive/30 bg-destructive/5"
          : settled
            ? "border-emerald-500/30 bg-emerald-500/5"
            : "bg-muted/40"
      )}
    >
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-muted-foreground text-sm">
            {money.studentNames.join("، ") || d?.title}
          </p>

          {/* The balance. `tabular-nums` because this number sits directly
              above a column of other numbers and must not dance against them
              — and because Arabic-Indic digits vary in width more than Latin
              ones do. */}
          <p className="mt-1 text-4xl font-bold tabular-nums sm:text-5xl">
            {formatCurrency(totals.remaining, lang, currency)}
          </p>

          <p
            className={cn(
              "mt-2 flex items-center gap-2 text-sm",
              isOverdue ? "text-destructive" : "text-muted-foreground"
            )}
          >
            {settled ? (
              <>
                <CircleCheck className="h-4 w-4 text-emerald-600" />
                {d?.allSettled || "You're all paid up"}
              </>
            ) : isOverdue ? (
              <>
                <TriangleAlert className="h-4 w-4" />
                {(d?.overdue || "Overdue") +
                  " · " +
                  formatCurrency(totals.overdue, lang, currency)}
              </>
            ) : nextDue?.dueDate ? (
              <>
                {(d?.dueOn || "Due {date}").replace(
                  "{date}",
                  formatDate(nextDue.dueDate, lang, {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })
                )}
              </>
            ) : (
              <>{d?.outstanding || "Outstanding"}</>
            )}
          </p>
        </div>

        {/* Full width under the number on a phone, beside it from `sm` up —
            the thumb reaches a full-width button, a mouse does not need one. */}
        {nextDue ? (
          <div className="[&_button]:h-11 [&_button]:w-full [&_button]:rounded-full [&_button]:text-base sm:[&_button]:w-auto sm:[&_button]:px-8">
            <PayFeeDialog
              feeAssignmentId={nextDue.feeAssignmentId}
              lang={lang}
              remaining={
                money.fees.find((f) => f.id === nextDue.feeAssignmentId)
                  ?.remaining ?? 0
              }
              methods={money.methods}
              label={`${nextDue.feeName} · ${nextDue.academicYear}`}
              dictionary={{
                ...(gatewayDictionary as object),
                pay: d?.payNow,
              }}
              manualRailDictionary={manualRailDictionary as never}
            />
          </div>
        ) : null}
      </div>

      {/* Only once there is something to be part-way through. A progress bar
          on a family with nothing billed is a bar at 0% that means nothing. */}
      {totals.billed > 0 ? (
        <div className="mt-6 space-y-2">
          <Progress value={progress} className="h-2" />
          <div className="text-muted-foreground flex justify-between text-xs tabular-nums">
            <span>
              {formatCurrency(totals.paid, lang, currency)}{" "}
              {d?.paid || "paid"}
            </span>
            <span>
              {formatCurrency(totals.billed, lang, currency)}{" "}
              {d?.billed || "billed"}
            </span>
          </div>
        </div>
      ) : null}

      {/* A proof the bursar has not cleared yet is money the family has
          already sent. Saying so here stops a second payment for the same
          instalment. */}
      {totals.pendingVerification > 0 ? (
        <p className="text-muted-foreground mt-4 text-xs">
          {(d?.awaitingVerification || "Awaiting verification") +
            " · " +
            formatCurrency(totals.pendingVerification, lang, currency)}
        </p>
      ) : null}
    </section>
  )
}
