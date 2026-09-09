// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { SectionHeading } from "@/components/school-dashboard/dashboard/section-heading"

import { PayFeeDialog } from "../fees/pay-fee-dialog"
import { FamilyInstallmentRow } from "./installment-row"
import type { FamilySectionProps } from "./types"

interface Props extends FamilySectionProps {
  gatewayDictionary?: Record<string, unknown>
  manualRailDictionary?: Record<string, unknown>
}

/**
 * The instalments still to pay, in the order they fall due.
 *
 * Gated on the ROWS, like the live landing's shelves: a family with nothing
 * outstanding gets no heading saying so — the hero already said it, and a
 * second empty section under it reads as a page that failed to load.
 *
 * Every row's Pay opens the same dialog with the same rails. The redirect
 * rails (Tap/Stripe) charge the fee's whole remaining balance rather than this
 * one instalment — `createFeePaymentCheckout` has no per-instalment amount —
 * so the note under the list says so instead of the button implying otherwise.
 */
export function FamilyDueList({
  money,
  lang,
  d,
  gatewayDictionary,
  manualRailDictionary,
}: Props) {
  if (money.due.length === 0) return null

  return (
    <section>
      <SectionHeading title={d?.dueNow || "To pay"} />
      <ul className="space-y-3">
        {money.due.map((installment) => {
          const fee = money.fees.find(
            (f) => f.id === installment.feeAssignmentId
          )
          return (
            <FamilyInstallmentRow
              key={installment.id}
              installment={installment}
              lang={lang}
              currency={money.currency}
              d={d}
              action={
                <PayFeeDialog
                  feeAssignmentId={installment.feeAssignmentId}
                  lang={lang}
                  remaining={fee?.remaining ?? 0}
                  methods={money.methods}
                  label={`${installment.feeName} · ${installment.academicYear}`}
                  dictionary={{
                    ...(gatewayDictionary as object),
                    pay: d?.payNow,
                  }}
                  manualRailDictionary={manualRailDictionary as never}
                />
              }
            />
          )
        })}
      </ul>

      {/* Only where it can actually happen: a fee whose next instalment is
          smaller than its own remaining balance. */}
      {money.due.some((i) => {
        const fee = money.fees.find((f) => f.id === i.feeAssignmentId)
        return fee ? fee.remaining > Math.max(i.amount - i.paidAmount, 0) : false
      }) ? (
        <p className="text-muted-foreground mt-3 text-xs">
          {d?.fullBalanceNote ||
            "Paying online settles the whole remaining balance of that fee."}
        </p>
      ) : null}
    </section>
  )
}
