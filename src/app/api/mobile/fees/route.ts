// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"

import { db } from "@/lib/db"

import { authenticate, isAuthError } from "../lib/authenticate"

/**
 * GET /api/mobile/fees — list fee records for the user/student
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth

    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get("student_id") || undefined
    const status = searchParams.get("status") || undefined
    const page = parseInt(searchParams.get("page") || "1")
    const perPage = parseInt(searchParams.get("per_page") || "30")
    const skip = (page - 1) * perPage

    // If no studentId provided, try to find the student linked to this user
    let targetStudentId = studentId
    if (!targetStudentId) {
      const student = await db.student.findFirst({
        where: { userId: auth.userId, schoolId: auth.schoolId },
        select: { id: true },
      })
      targetStudentId = student?.id
    }

    if (!targetStudentId) {
      return NextResponse.json({ data: [], total: 0, page, per_page: perPage })
    }

    const where = {
      schoolId: auth.schoolId,
      studentId: targetStudentId,
      ...(status ? { status } : {}),
    }

    const [fees, total] = await Promise.all([
      db.feeRecord.findMany({
        where,
        orderBy: { dueDate: "desc" },
        skip,
        take: perPage,
        select: {
          id: true,
          feeType: true,
          amount: true,
          paidAmount: true,
          dueDate: true,
          paymentDate: true,
          paymentMethod: true,
          status: true,
          lateFee: true,
          discount: true,
          receiptNumber: true,
          remarks: true,
        },
      }),
      db.feeRecord.count({ where }),
    ])

    const data = fees.map((f) => ({
      id: f.id,
      fee_type: f.feeType,
      amount: f.amount ? Number(f.amount) : 0,
      paid_amount: f.paidAmount ? Number(f.paidAmount) : 0,
      due_date: f.dueDate?.toISOString() || null,
      payment_date: f.paymentDate?.toISOString() || null,
      payment_method: f.paymentMethod,
      status: f.status,
      late_fee: f.lateFee ? Number(f.lateFee) : 0,
      discount: f.discount ? Number(f.discount) : 0,
      receipt_number: f.receiptNumber,
      remarks: f.remarks,
    }))

    return NextResponse.json({ data, total, page, per_page: perPage })
  } catch (error) {
    console.error("Mobile fees error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
