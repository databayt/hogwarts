// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"

import { db } from "@/lib/db"

import { authenticate, isAuthError } from "../../../lib/authenticate"

/**
 * GET /api/mobile/fees/summary/:studentId — fee summary
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth

    const { studentId } = await params

    const fees = await db.feeRecord.findMany({
      where: { schoolId: auth.schoolId, studentId },
      select: {
        amount: true,
        paidAmount: true,
        status: true,
        lateFee: true,
        discount: true,
      },
    })

    const totalAmount = fees.reduce((sum, f) => sum + Number(f.amount || 0), 0)
    const totalPaid = fees.reduce(
      (sum, f) => sum + Number(f.paidAmount || 0),
      0
    )
    const totalPending = totalAmount - totalPaid
    const overdue = fees.filter((f) => f.status === "OVERDUE").length

    return NextResponse.json({
      total_amount: totalAmount,
      total_paid: totalPaid,
      total_pending: totalPending,
      total_records: fees.length,
      overdue_count: overdue,
      paid_count: fees.filter((f) => f.status === "PAID").length,
      pending_count: fees.filter(
        (f) => f.status === "PENDING" || f.status === "PARTIAL"
      ).length,
    })
  } catch (error) {
    console.error("Mobile fee summary error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
