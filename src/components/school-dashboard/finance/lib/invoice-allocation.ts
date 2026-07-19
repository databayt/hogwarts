// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { InvoiceStatus, type Prisma } from "@prisma/client"

import { db } from "@/lib/db"

type DbClient = typeof db | Prisma.TransactionClient

/**
 * Allocate a single cleared payment across a fee assignment's invoices,
 * oldest-first (multi-installment support).
 *
 * This is the ONE canonical allocator. It previously existed as four diverging
 * copies — `recordPayment` and `markPaymentCleared` inside `fees/actions.ts`,
 * plus the Stripe and Tap webhooks — on two different amount bases:
 *
 *   - `recordPayment`'s copy allocated against **`sub_total`** (pre-tax,
 *     pre-discount), so any taxed or discounted invoice was mis-marked: it
 *     flipped to PAID once `sub_total` was covered even though `total` (the
 *     real balance owed) was not, and recorded the wrong `amountPaid`.
 *   - `markPaymentCleared`'s copy was weaker still — a single `findFirst` with
 *     a blind PAID/UNPAID flip that never set `amountPaid` and never used
 *     PARTIAL, so a partially-paid manual (Bankak/Cashi/bank-transfer) payment
 *     lost its partial state entirely.
 *
 * Contract (matches the proven webhook logic):
 *
 *   - **Incremental**: `paymentAmount` is THIS payment's amount only. It is
 *     added on top of each invoice's existing `amountPaid`. Callers therefore
 *     invoke this exactly once per cleared payment. (Not idempotent on a double
 *     invocation for the same payment — recordPayment/markPaymentCleared each
 *     run it once per payment, and the webhooks are guarded by
 *     `ProcessedWebhookEvent` dedup.)
 *   - Allocates against **`total`** — sub_total − discount + tax, the actual
 *     balance owed.
 *   - Skips PAID and CANCELLED invoices. Excluding PAID means an invoice
 *     settled through a different path (e.g. the invoice block's
 *     `markInvoicePaid`) is never silently downgraded.
 *   - Stops once the payment is fully allocated, leaving later invoices'
 *     status (UNPAID / OVERDUE) untouched — an unpaid past-due installment
 *     keeps its OVERDUE signal.
 *
 * Non-fatal by contract: callers wrap this in try/catch. A payment is already
 * recorded and the ledger already posted before invoice sync runs, so a sync
 * failure is logged, never rolled back.
 *
 * Accepts an optional transaction client: a caller whose Payment AND invoices
 * were created inside a still-open $transaction (confirmEnrollment) MUST pass
 * its `tx` — the plain `db` singleton cannot see those uncommitted rows and
 * the allocation would silently no-op.
 */
export async function allocatePaymentToInvoices(
  schoolId: string,
  feeAssignmentId: string,
  paymentAmount: number,
  tx?: Prisma.TransactionClient
): Promise<void> {
  const client: DbClient = tx ?? db
  const invoices = await client.userInvoice.findMany({
    where: {
      schoolId,
      feeAssignmentId,
      status: { notIn: [InvoiceStatus.PAID, InvoiceStatus.CANCELLED] },
    },
    select: { id: true, total: true, amountPaid: true },
    orderBy: { due_date: "asc" },
  })
  if (invoices.length === 0) return

  let remaining = paymentAmount
  for (const inv of invoices) {
    if (remaining <= 0) break

    const invTotal = Number(inv.total)
    const alreadyPaid = Number(inv.amountPaid)
    const invRemaining = invTotal - alreadyPaid
    if (invRemaining <= 0) continue

    const applying = Math.min(remaining, invRemaining)
    const newAmountPaid = alreadyPaid + applying
    remaining -= applying

    await client.userInvoice.update({
      where: { id: inv.id },
      data: {
        amountPaid: newAmountPaid,
        status:
          newAmountPaid >= invTotal
            ? InvoiceStatus.PAID
            : InvoiceStatus.PARTIAL,
      },
    })
  }
}
