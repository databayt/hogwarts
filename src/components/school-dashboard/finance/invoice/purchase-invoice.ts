// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Purchase → PAID invoice (course / catalog / video checkouts).
//
// Stream course enrollments, catalog enrollments, and video purchases are paid
// through Stripe Checkout but historically left no trace in the finance
// system — the buyer had nothing in "My Invoices" and the school had no
// document for money it received. This module materializes a PAID UserInvoice
// for a completed checkout session.
//
// Deliberately NOT "use server": only the Stripe webhook calls this — it must
// never be a public POST endpoint (the webhook has no session; authorization
// is Stripe's signature check upstream).
//
// Idempotency (webhook retries + at-least-once delivery):
//   invoice_no = "PUR-" + checkout session id, under the DB-enforced
//   @@unique([schoolId, invoice_no]) — a pre-check plus a P2002 catch makes
//   redelivery a no-op.
//
// Ledger: intentionally NOT posted here. Existing posting rules
// (createFeePaymentEntry / createInvoicePaymentEntry) assume revenue was
// recognized as a receivable first (DR Cash / CR AR); a point-of-sale purchase
// needs DR Cash / CR Revenue, which has no posting rule yet. Wrong books are
// worse than no books — tracked in finance/invoice/ISSUE.md.
import { db } from "@/lib/db"

export type PurchaseType =
  | "video_purchase"
  | "catalog_enrollment"
  | "course_enrollment"

export interface PurchaseInvoiceInput {
  /** Tenant. Callers must skip (not error) when the checkout has no school. */
  schoolId: string
  /** Buyer's User id. */
  userId: string
  /** Whole currency units (Stripe amount_total / 100). */
  amount: number
  /** ISO 4217 uppercase. */
  currency: string
  /** Line-item label: course / subject / video title. */
  itemName: string
  /** Stripe checkout session id — the idempotency key. */
  sessionId: string
  purchaseType: PurchaseType
}

export interface PurchaseInvoiceResult {
  created: boolean
  invoiceId?: string
}

export async function createPurchaseInvoiceForCheckout(
  input: PurchaseInvoiceInput
): Promise<PurchaseInvoiceResult> {
  const { schoolId, userId, sessionId } = input
  const amount = Math.round(input.amount * 100) / 100
  if (!schoolId || !userId || !sessionId) return { created: false }
  if (!Number.isFinite(amount) || amount <= 0) return { created: false }

  const invoiceNo = `PUR-${sessionId}`

  const existing = await db.userInvoice.findFirst({
    where: { schoolId, invoice_no: invoiceNo },
    select: { id: true },
  })
  if (existing) return { created: false, invoiceId: existing.id }

  const [school, user] = await Promise.all([
    db.school.findUnique({
      where: { id: schoolId },
      select: { name: true, address: true, currency: true },
    }),
    db.user.findUnique({
      where: { id: userId },
      select: {
        username: true,
        email: true,
        student: { select: { firstName: true, lastName: true } },
        guardian: { select: { firstName: true, lastName: true } },
      },
    }),
  ])
  if (!school || !user) return { created: false }

  const buyerName =
    [user.student?.firstName, user.student?.lastName]
      .filter(Boolean)
      .join(" ") ||
    [user.guardian?.firstName, user.guardian?.lastName]
      .filter(Boolean)
      .join(" ") ||
    user.username ||
    user.email ||
    "Customer"

  const now = new Date()

  try {
    const invoice = await db.$transaction(async (tx) => {
      const fromAddress = await tx.userInvoiceAddress.create({
        data: {
          schoolId,
          name: school.name,
          address1: school.address ?? school.name,
        },
      })
      const toAddress = await tx.userInvoiceAddress.create({
        data: {
          schoolId,
          name: buyerName,
          email: user.email ?? null,
          address1: buyerName,
        },
      })
      return tx.userInvoice.create({
        data: {
          schoolId,
          userId,
          invoice_no: invoiceNo,
          invoice_date: now,
          due_date: now,
          currency: input.currency || school.currency || "USD",
          fromAddressId: fromAddress.id,
          toAddressId: toAddress.id,
          sub_total: amount,
          total: amount,
          amountPaid: amount,
          status: "PAID",
          notes: `Paid via Stripe checkout (${input.purchaseType})`,
          items: {
            create: {
              schoolId,
              item_name: input.itemName,
              quantity: 1,
              price: amount,
              total: amount,
            },
          },
        },
        select: { id: true },
      })
    })
    return { created: true, invoiceId: invoice.id }
  } catch (error) {
    // Concurrent webhook redelivery lost the race — the invoice exists.
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: string }).code === "P2002"
    ) {
      return { created: false }
    }
    throw error
  }
}
