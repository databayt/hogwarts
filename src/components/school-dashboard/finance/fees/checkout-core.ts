// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { db } from "@/lib/db"
import { resolveDefaultCurrency } from "@/lib/payment/gateway-config"
import type { PaymentGateway } from "@/lib/payment/types"

/**
 * Hosted checkout for a fee — the body of `createFeePaymentCheckout` without
 * the web session, so the mobile `POST /api/mobile/fees/pay` route mints the
 * exact same Stripe/Tap session. Plain module, NOT `"use server"`: callers
 * resolve who is paying, whether they are finance staff, and the tenant base
 * URL the gateway returns the payer to.
 */

/**
 * Check whether the given user is the student themselves OR a guardian linked
 * to the student that owns this assignment. The Pay-Online button on
 * `/finance/fees/my` is rendered for STUDENT and GUARDIAN roles, but
 * `requireFeePermission("view")` only honors finance admin roles. Without an
 * ownership check those button clicks would silently fail with UNAUTHORIZED.
 */
export async function userOwnsAssignment(args: {
  userId: string
  studentId: string
  schoolId: string
}): Promise<boolean> {
  // STUDENT: User row links directly to Student via Student.userId
  const student = await db.student.findFirst({
    where: { id: args.studentId, schoolId: args.schoolId },
    select: { userId: true },
  })
  if (student?.userId && student.userId === args.userId) return true

  // GUARDIAN: Guardian.userId links to a User; StudentGuardian links Guardian to Student
  const guardian = await db.guardian.findFirst({
    where: {
      schoolId: args.schoolId,
      userId: args.userId,
      studentGuardians: { some: { studentId: args.studentId } },
    },
    select: { id: true },
  })
  return Boolean(guardian)
}

export type FeeCheckoutOutcome =
  | {
      status: "ok"
      checkoutUrl: string
      gateway: PaymentGateway
      amount: number
      currency: string
    }
  | { status: "unauthorized" }
  | { status: "notFound" }
  | { status: "fullyPaid" }
  | { status: "gatewayUnavailable" }
  | { status: "failed" }

export async function createFeeCheckoutCore(input: {
  schoolId: string
  userId: string
  email?: string | null
  /** Finance staff pay any assignment; families only their own children's. */
  isFinanceAdmin: boolean
  feeAssignmentId: string
  lang: string
  requestedGateway?: PaymentGateway
  /** Tenant origin for the gateway's return URLs, from the school subdomain. */
  baseUrl: (subdomain: string | null | undefined) => Promise<string> | string
}): Promise<FeeCheckoutOutcome> {
  const {
    schoolId,
    userId,
    email,
    isFinanceAdmin,
    feeAssignmentId,
    lang,
    requestedGateway,
  } = input

  const assignment = await db.feeAssignment.findFirst({
    where: { id: feeAssignmentId, schoolId },
    include: {
      student: { select: { id: true, firstName: true, lastName: true } },
      feeStructure: { select: { name: true } },
      payments: { where: { status: "SUCCESS" }, select: { amount: true } },
    },
  })

  if (!isFinanceAdmin) {
    // Without an assignment we can't verify ownership — return UNAUTHORIZED
    // (not NOT_FOUND) so a non-admin probing for assignment IDs gets a
    // uniform refusal regardless of whether the row exists.
    if (!assignment) {
      return { status: "unauthorized" }
    }
    const isOwner = await userOwnsAssignment({
      userId,
      studentId: assignment.studentId,
      schoolId,
    })
    if (!isOwner) {
      return { status: "unauthorized" }
    }
  }

  if (!assignment) {
    return { status: "notFound" }
  }

  // Calculate remaining amount
  const totalPaid = assignment.payments.reduce(
    (sum, p) => sum + Number(p.amount),
    0
  )
  const remaining = Number(assignment.finalAmount) - totalPaid
  if (remaining <= 0) {
    return { status: "fullyPaid" }
  }

  // Load school for currency + subdomain. `domain` is the per-school
  // subdomain (e.g. "alqabs" for alqabs.balqalam.com) that drives the
  // tenant-aware redirect — without it the gateway sends the payer back to
  // the SaaS apex, breaking the school dashboard URL contract. The root
  // domain comes from the current request (see tenant-url.ts).
  const school = await db.school.findFirst({
    where: { id: schoolId },
    select: {
      currency: true,
      name: true,
      domain: true,
      country: true,
      timezone: true,
    },
  })
  // Charge in the currency the assignment was DENOMINATED in (snapshot at
  // assignment time), not whatever the school's currency is today — the
  // webhook records `assignment.currency`, and the two must agree.
  const currency =
    assignment.currency ??
    school?.currency ??
    resolveDefaultCurrency(school?.country, school?.timezone)
  const baseUrl = await input.baseUrl(school?.domain)

  // B2: resolve the school's configured + currency-compatible gateway instead
  // of always hardcoding "stripe". Tap is the primary for Gulf/UAE schools.
  const { createPaymentCheckout, resolveAvailableMethods } =
    await import("@/lib/payment/provider")
  const { toSmallestUnit } = await import("@/lib/payment/currency")
  const { isManualGateway } = await import("@/lib/payment/types")
  const availableGateways = resolveAvailableMethods(
    school?.country,
    school?.timezone,
    currency
  )

  // Honour the rail the payer actually clicked, but only after re-resolving
  // it server-side: previously this always took availableGateways[0], so on a
  // multi-rail school (e.g. AE = [tap, stripe]) clicking "Stripe" silently
  // charged via Tap. An unavailable request is refused, never downgraded.
  if (requestedGateway && !availableGateways.includes(requestedGateway)) {
    return { status: "gatewayUnavailable" }
  }
  const gateway =
    requestedGateway ?? availableGateways.find((g) => !isManualGateway(g))

  // Manual rails (bankak/cashi/cash/bank_transfer) settle outside the app and
  // produce no checkout URL — they go through submitManualPaymentProof. This
  // also stops a Sudan school (whose list is wallet-first) from silently
  // falling into a redirect flow that can never complete.
  if (!gateway || isManualGateway(gateway)) {
    return { status: "gatewayUnavailable" }
  }

  // Where the payer lands afterwards. Families cannot open the admin-only
  // assignment page (it is gated on fees:view — every parent who was sent
  // there after paying saw "access denied"), so they return to their own
  // money surface at /finance, which mounts the return banner; finance staff
  // return to the assignment they were looking at.
  // `assignment` + `gateway` let the landing page verify the charge with
  // the gateway (Tap appends `tap_id`; Stripe substitutes
  // `{CHECKOUT_SESSION_ID}`), so it shows a truthful state even before the
  // webhook lands — or if it never does.
  const returnPath = isFinanceAdmin
    ? `/${lang}/finance/fees/assignments/${feeAssignmentId}`
    : `/${lang}/finance`
  const returnQuery = `assignment=${encodeURIComponent(feeAssignmentId)}&gateway=${gateway}`
  const stripeSessionParam =
    gateway === "stripe" ? "&session_id={CHECKOUT_SESSION_ID}" : ""
  const successUrl = `${baseUrl}${returnPath}?payment=success&${returnQuery}${stripeSessionParam}`
  const cancelUrl = `${baseUrl}${returnPath}?payment=cancelled&${returnQuery}`

  const result = await createPaymentCheckout(gateway, {
    amount: remaining,
    currency,
    context: "school_fee",
    schoolId,
    referenceId: feeAssignmentId,
    referenceNumber: `FEE-${feeAssignmentId.slice(-8).toUpperCase()}`,
    successUrl,
    cancelUrl,
    lineItems: [
      {
        name: assignment.feeStructure?.name || "School Fee",
        description: `${[assignment.student?.firstName, assignment.student?.lastName].filter(Boolean).join(" ")} — ${assignment.academicYear}`,
        quantity: 1,
        // Stripe needs the charge in the smallest currency unit. The adapter
        // uses this verbatim when lineItems are present (it does NOT fall back
        // to `amount`), so a hardcoded 0 here would create a $0 checkout while
        // the webhook still marks the fee PAID. Convert the remaining balance.
        unitAmount: toSmallestUnit(remaining, currency),
      },
    ],
    metadata: {
      type: "fee_payment",
      feeAssignmentId,
      studentId: assignment.studentId,
      schoolId,
    },
    customerEmail: email || undefined,
  })

  if (!result.success || !result.checkoutUrl) {
    return { status: "failed" }
  }

  return {
    status: "ok",
    checkoutUrl: result.checkoutUrl,
    gateway,
    amount: remaining,
    currency,
  }
}
