// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"

import type { PaymentGateway } from "@/lib/payment/types"
import { createFeeCheckoutCore } from "@/components/school-dashboard/finance/fees/checkout-core"
import { resolveTenantBaseUrl } from "@/components/school-dashboard/finance/fees/tenant-url"

import { authenticate, isAuthError } from "../../lib/authenticate"
import { hasRole } from "../../lib/roles"

const REFUSALS = {
  unauthorized: [403, "UNAUTHORIZED"],
  notFound: [404, "NOT_FOUND"],
  fullyPaid: [409, "FEE_FULLY_PAID"],
  gatewayUnavailable: [422, "PAYMENT_GATEWAY_UNAVAILABLE"],
  failed: [502, "PAYMENT_FAILED"],
} as const

/**
 * POST /api/mobile/fees/pay — hosted checkout for a fee
 *
 * Body: { fee_assignment_id: string, gateway?: "stripe" | "tap", lang?: "ar" | "en" }
 * Returns: { checkout_url, gateway, amount, currency }
 *
 * The app opens `checkout_url` in a Custom Tab; no card data touches the
 * device. Charges the fee's whole remaining balance through the same core as
 * the web Pay button (ownership: the student themselves or a linked guardian).
 * The payment is recorded by the gateway webhook; the gateway returns the
 * payer to `/<lang>/finance?payment=success` on the school's host. Manual
 * rails (Bankak/Cashi/cash/transfer) have no checkout → 422.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth

    if (!hasRole(auth, "STUDENT", "GUARDIAN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    let body: { fee_assignment_id?: unknown; gateway?: unknown; lang?: unknown }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
    }

    const feeAssignmentId = body.fee_assignment_id
    if (typeof feeAssignmentId !== "string" || !feeAssignmentId) {
      return NextResponse.json(
        { error: "fee_assignment_id is required" },
        { status: 400 }
      )
    }
    if (body.gateway !== undefined && typeof body.gateway !== "string") {
      return NextResponse.json({ error: "Invalid gateway" }, { status: 400 })
    }

    const out = await createFeeCheckoutCore({
      schoolId: auth.schoolId,
      userId: auth.userId,
      email: auth.email,
      isFinanceAdmin: false,
      feeAssignmentId,
      lang: body.lang === "en" ? "en" : "ar",
      // Re-validated inside the core against the school's own rails.
      requestedGateway: body.gateway as PaymentGateway | undefined,
      baseUrl: (domain) => resolveTenantBaseUrl(domain),
    })

    if (out.status !== "ok") {
      const [status, error] = REFUSALS[out.status]
      return NextResponse.json({ error }, { status })
    }

    return NextResponse.json({
      checkout_url: out.checkoutUrl,
      gateway: out.gateway,
      amount: out.amount,
      currency: out.currency,
    })
  } catch (error) {
    console.error("Mobile fee pay error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
