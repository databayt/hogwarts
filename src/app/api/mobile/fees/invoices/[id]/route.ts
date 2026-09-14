// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"

import { authenticate, isAuthError } from "../../../lib/authenticate"
import {
  familyMoneyFor,
  invoiceDto,
  langOf,
  paymentDto,
  tenantBaseUrl,
} from "../../shared"

/**
 * GET /api/mobile/fees/invoices/:id — one instalment with its fee's balance
 * and payments. `:id` is an invoice id (or a fee assignment id for a lump fee
 * with no invoice). Anything outside the caller's family is a 404.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth

    const url = new URL(request.url)
    const family = await familyMoneyFor(auth, url)
    if (!family.ok) return family.response

    const { id } = await params
    const money = family.money
    const installment = money?.installments.find((i) => i.id === id)
    if (!money || !installment) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    const fee = money.fees.find((f) => f.id === installment.feeAssignmentId)
    const base = await tenantBaseUrl(auth.schoolId)

    return NextResponse.json({
      ...invoiceDto(installment, money.currency, base, langOf(url)),
      fee: fee
        ? {
            id: fee.id,
            name: fee.feeName,
            total: fee.total,
            discount: fee.discount,
            paid: fee.paid,
            pending_verification: fee.pendingVerification,
            remaining: fee.remaining,
            status: fee.status,
          }
        : null,
      payments: money.payments
        .filter((p) => p.feeAssignmentId === installment.feeAssignmentId)
        .map((p) => paymentDto(p, money.currency)),
      methods: money.methods,
      // Online checkout charges the fee's WHOLE remaining balance, not one
      // instalment — same as the web Pay button.
      can_pay_online:
        (fee?.remaining ?? 0) > 0 &&
        money.methods.some((m) => m === "stripe" || m === "tap"),
    })
  } catch (error) {
    console.error("Mobile fee invoice detail error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
