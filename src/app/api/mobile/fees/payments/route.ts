// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"

import { authenticate, isAuthError } from "../../lib/authenticate"
import { familyMoneyFor, pageOf, paymentDto } from "../shared"

/**
 * GET /api/mobile/fees/payments — the family's payment history, newest first
 *
 * SUCCESS payments plus PENDING_VERIFICATION proofs the family submitted
 * (failed/cancelled stay hidden, as on the web). Query: student_id, page,
 * per_page.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth

    const url = new URL(request.url)
    const family = await familyMoneyFor(auth, url)
    if (!family.ok) return family.response

    const { page, perPage } = pageOf(url)
    const money = family.money
    let rows = money?.payments ?? []
    if (family.studentId) {
      rows = rows.filter((p) => p.studentId === family.studentId)
    }
    const start = (page - 1) * perPage

    return NextResponse.json({
      data: rows
        .slice(start, start + perPage)
        .map((p) => paymentDto(p, money!.currency)),
      total: rows.length,
      page,
      per_page: perPage,
    })
  } catch (error) {
    console.error("Mobile fee payments error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
