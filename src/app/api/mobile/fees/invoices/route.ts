// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"

import { authenticate, isAuthError } from "../../lib/authenticate"
import {
  familyMoneyFor,
  invoiceDto,
  langOf,
  pageOf,
  tenantBaseUrl,
} from "../shared"

const STATUSES = ["PAID", "PARTIAL", "PENDING", "OVERDUE", "CANCELLED"]

/**
 * GET /api/mobile/fees/invoices — the family's instalments (STUDENT/GUARDIAN)
 *
 * Query: student_id, status (PAID|PARTIAL|PENDING|OVERDUE|CANCELLED),
 * due=true (only what is still owed), lang (ar|en), page, per_page.
 * Ordered by due date (dateless lump fees last), like the web /finance page.
 * Adds `currency`, `totals` and `methods` next to the list envelope.
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
    if (!money) {
      return NextResponse.json({
        data: [],
        total: 0,
        page,
        per_page: perPage,
        currency: null,
        totals: null,
        methods: [],
      })
    }

    const status = url.searchParams.get("status")
    if (status && !STATUSES.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    let rows =
      url.searchParams.get("due") === "true" ? money.due : money.installments
    if (family.studentId) {
      rows = rows.filter((i) => i.studentId === family.studentId)
    }
    if (status) rows = rows.filter((i) => i.status === status)

    const lang = langOf(url)
    const base = await tenantBaseUrl(auth.schoolId)
    const start = (page - 1) * perPage

    return NextResponse.json({
      data: rows
        .slice(start, start + perPage)
        .map((i) => invoiceDto(i, money.currency, base, lang)),
      total: rows.length,
      page,
      per_page: perPage,
      currency: money.currency,
      // Whole family, not just this page / filter.
      totals: {
        billed: money.totals.billed,
        paid: money.totals.paid,
        pending_verification: money.totals.pendingVerification,
        remaining: money.totals.remaining,
        overdue: money.totals.overdue,
      },
      // Rails the school offers; tap/stripe are payable via /fees/pay.
      methods: money.methods,
    })
  } catch (error) {
    console.error("Mobile fee invoices error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
