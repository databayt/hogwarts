// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Gateway fee payment — ONE recorder for every online rail.
 *
 * A captured card/wallet charge reaches us three ways: the Stripe webhook, the
 * Tap webhook, and the post-checkout return page (which reads the charge back
 * from the gateway when the webhook has not landed yet, or never will — Tap
 * cannot post to localhost, and a mis-registered endpoint posts nowhere). All
 * three used to carry their own ~100-line copy of "create Payment, flip the
 * assignment, post the ledger, sync invoices, notify", and they had drifted:
 *
 *   - Stripe recorded `finalAmount − totalPaid` instead of what Stripe actually
 *     charged, so a cash payment recorded between checkout and webhook was
 *     silently subtracted from the card payment;
 *   - Tap capped the captured amount at the remaining balance, so an
 *     over-payment vanished from the books;
 *   - neither was idempotent on its own — a replayed event whose dedupe insert
 *     had failed would create a second Payment for the same charge.
 *
 * Contract:
 *   - `transactionId` is the gateway's charge / payment-intent id. Together
 *     with `schoolId` it is the idempotency key (`@@unique([schoolId,
 *     transactionId])` on Payment) — a second call for the same charge, from
 *     any path and in any order, returns `duplicate` and writes nothing. The
 *     race between webhook and return page is settled by the constraint, not
 *     by a pre-check.
 *   - `amount` is what the gateway captured, in MAJOR units of `currency`.
 *     It is recorded verbatim; the assignment status is derived from the new
 *     total, so an over-payment shows as PAID with a visible surplus rather
 *     than being trimmed to fit.
 *   - Payment + assignment status flip commit atomically. Ledger posting,
 *     invoice allocation and the family notification run after commit and are
 *     each individually non-fatal — money already recorded must never be rolled
 *     back by a bookkeeping side-effect.
 */

import "server-only"

import { randomUUID } from "node:crypto"
import { Prisma, type FeeStatus, type PaymentMethod } from "@prisma/client"

import { db } from "@/lib/db"
import { roundToCurrency } from "@/lib/payment/currency"

import { allocatePaymentToInvoices } from "./invoice-allocation"
import { notifyFeePaymentReceived } from "./payment-notify"

export interface GatewayFeePaymentInput {
  schoolId: string
  feeAssignmentId: string
  /** Gateway charge / payment-intent id — idempotency key with schoolId. */
  transactionId: string
  /** Captured amount in MAJOR units of `currency` (10.50, not 1050). */
  amount: number
  /** ISO code the gateway captured in; falls back to the assignment snapshot. */
  currency?: string | null
  paymentMethod: PaymentMethod
  /** Raw rail identity from the gateway (MADA, APPLE_PAY, visa, link…). */
  gatewayMethod?: string | null
  /** Ledger actor, e.g. "system:stripe-webhook". */
  actor: string
  paymentDate?: Date
  /** Optional language override for the family notification. */
  lang?: string | null
}

export type GatewayFeePaymentResult =
  | {
      outcome: "recorded"
      paymentId: string
      receiptNumber: string
      amount: number
      currency: string | null
      status: FeeStatus
      remaining: number
    }
  | { outcome: "duplicate"; paymentId: string }
  | { outcome: "assignment_not_found" }
  | { outcome: "invalid_amount" }

/**
 * Coarse `PaymentMethod` bucket for a gateway-reported rail. The raw value is
 * kept on `Payment.gatewayMethod`; this only drives reports/badges.
 */
export function mapGatewayMethod(raw?: string | null): PaymentMethod {
  switch ((raw ?? "").toUpperCase().replace(/[\s-]/g, "_")) {
    case "MADA":
      return "MADA"
    case "KNET":
      return "KNET"
    case "APPLE_PAY":
    case "APPLEPAY":
      return "APPLE_PAY"
    case "GOOGLE_PAY":
    case "GOOGLEPAY":
      return "GOOGLE_PAY"
    case "LINK":
    case "STC_PAY":
    case "STCPAY":
      return "WALLET"
    case "DEBIT":
    case "DEBIT_CARD":
      return "DEBIT_CARD"
    default:
      return "CREDIT_CARD"
  }
}

function shortHex(): string {
  return randomUUID().replace(/-/g, "").substring(0, 8).toUpperCase()
}

function isUniqueViolationOn(err: unknown, column: string): boolean {
  if (
    !(err instanceof Prisma.PrismaClientKnownRequestError) ||
    err.code !== "P2002"
  ) {
    return false
  }
  const target = (err.meta as { target?: unknown } | undefined)?.target
  if (Array.isArray(target)) return target.includes(column)
  if (typeof target === "string") return target.includes(column)
  // Unknown shape — assume it might be ours so the caller re-checks.
  return true
}

/**
 * Record a captured gateway charge against a fee assignment. Idempotent per
 * (schoolId, transactionId). See the module docblock for the contract.
 */
export async function recordGatewayFeePayment(
  input: GatewayFeePaymentInput
): Promise<GatewayFeePaymentResult> {
  const {
    schoolId,
    feeAssignmentId,
    transactionId,
    paymentMethod,
    gatewayMethod,
    actor,
  } = input

  // Fast path — the common replay. The unique constraint below is the real
  // guard; this only saves the assignment read on an obvious duplicate.
  const existing = await db.payment.findFirst({
    where: { schoolId, transactionId },
    select: { id: true },
  })
  if (existing) return { outcome: "duplicate", paymentId: existing.id }

  const assignment = await db.feeAssignment.findFirst({
    where: { id: feeAssignmentId, schoolId },
    select: {
      id: true,
      studentId: true,
      currency: true,
      finalAmount: true,
      school: { select: { currency: true } },
      payments: { where: { status: "SUCCESS" }, select: { amount: true } },
    },
  })
  if (!assignment) return { outcome: "assignment_not_found" }

  const currency =
    input.currency?.toUpperCase() ??
    assignment.currency ??
    assignment.school?.currency ??
    null
  const amount = roundToCurrency(input.amount, currency ?? "USD")
  if (!Number.isFinite(amount) || amount <= 0) {
    return { outcome: "invalid_amount" }
  }

  const finalAmount = Number(assignment.finalAmount)
  const totalPaid = assignment.payments.reduce(
    (sum, p) => sum + Number(p.amount),
    0
  )
  const newTotalPaid = totalPaid + amount
  const status: FeeStatus = newTotalPaid >= finalAmount ? "PAID" : "PARTIAL"
  const paymentDate = input.paymentDate ?? new Date()

  // Create + flip atomically. Human-facing numbers are random and unique;
  // retry a handful of times on a number collision, but a collision on
  // transactionId means another path recorded this charge first → duplicate.
  let payment: { id: string; receiptNumber: string } | null = null
  for (let attempt = 0; attempt < 4 && !payment; attempt++) {
    try {
      payment = await db.$transaction(async (tx) => {
        const created = await tx.payment.create({
          data: {
            schoolId,
            feeAssignmentId,
            studentId: assignment.studentId,
            paymentNumber: `PAY-${shortHex()}`,
            amount,
            currency,
            paymentMethod,
            gatewayMethod: gatewayMethod ?? null,
            paymentDate,
            status: "SUCCESS",
            receiptNumber: `RCP-${shortHex()}`,
            transactionId,
          },
          select: { id: true, receiptNumber: true },
        })
        await tx.feeAssignment.update({
          where: { id: feeAssignmentId },
          data: { status },
        })
        return created
      })
    } catch (err) {
      if (isUniqueViolationOn(err, "transactionId")) {
        const winner = await db.payment.findFirst({
          where: { schoolId, transactionId },
          select: { id: true },
        })
        if (winner) return { outcome: "duplicate", paymentId: winner.id }
      }
      if (
        !(err instanceof Prisma.PrismaClientKnownRequestError) ||
        err.code !== "P2002" ||
        attempt === 3
      ) {
        throw err
      }
      // paymentNumber / receiptNumber collision — regenerate and retry.
    }
  }
  if (!payment) throw new Error("recordGatewayFeePayment: no payment created")

  // ---- post-commit, non-fatal side effects ---------------------------------

  try {
    const { postFeePayment } = await import("./accounting/actions")
    const posted = await postFeePayment(
      schoolId,
      {
        paymentId: payment.id,
        studentId: assignment.studentId,
        amount,
        paymentMethod,
        paymentDate,
      },
      actor
    )
    if (!posted.success) {
      console.error("[gateway-payment] postFeePayment failed:", posted.errors)
    }
  } catch (err) {
    console.error("[gateway-payment] ledger posting threw (continuing):", err)
  }

  try {
    await allocatePaymentToInvoices(schoolId, feeAssignmentId, amount)
  } catch (err) {
    console.error("[gateway-payment] invoice allocation failed:", err)
  }

  const remaining = Math.max(0, finalAmount - newTotalPaid)
  try {
    await notifyFeePaymentReceived({
      schoolId,
      studentId: assignment.studentId,
      paymentId: payment.id,
      receiptNumber: payment.receiptNumber,
      feeAssignmentId,
      amount,
      remaining,
      status,
      lang: input.lang ?? undefined,
    })
  } catch (err) {
    console.error("[gateway-payment] family notification failed:", err)
  }

  return {
    outcome: "recorded",
    paymentId: payment.id,
    receiptNumber: payment.receiptNumber,
    amount,
    currency,
    status,
    remaining,
  }
}
