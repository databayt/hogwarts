// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"

import { db } from "@/lib/db"

import { authenticate, isAuthError } from "../../../lib/authenticate"

/**
 * POST /api/mobile/attendance/qr/scan — student scans a QR code to mark attendance
 *
 * Body: { code: string }
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth

    const body = await request.json()
    const { code } = body

    if (!code) {
      return NextResponse.json({ error: "code required" }, { status: 400 })
    }

    // Find the QR session
    const session = await db.qRCodeSession.findUnique({
      where: { code },
      select: {
        id: true,
        schoolId: true,
        classId: true,
        isActive: true,
        expiresAt: true,
        scanCount: true,
        maxScans: true,
        scannedBy: true,
      },
    })

    if (!session) {
      return NextResponse.json({ error: "Invalid QR code" }, { status: 404 })
    }

    if (session.schoolId !== auth.schoolId) {
      return NextResponse.json(
        { error: "QR code does not belong to your school" },
        { status: 403 }
      )
    }

    if (!session.isActive) {
      return NextResponse.json(
        { error: "QR session is no longer active" },
        { status: 410 }
      )
    }

    if (new Date() > session.expiresAt) {
      return NextResponse.json(
        { error: "QR code has expired" },
        { status: 410 }
      )
    }

    if (session.maxScans && session.scanCount >= session.maxScans) {
      return NextResponse.json(
        { error: "Maximum scans reached for this QR code" },
        { status: 409 }
      )
    }

    // Find the student linked to this user
    const student = await db.student.findFirst({
      where: { schoolId: auth.schoolId, userId: auth.userId },
      select: { id: true },
    })

    if (!student) {
      return NextResponse.json(
        { error: "No student profile linked to this account" },
        { status: 404 }
      )
    }

    // Check if student already scanned this session
    const scannedBy = session.scannedBy as string[]
    if (scannedBy.includes(student.id)) {
      return NextResponse.json(
        { error: "Attendance already marked via this QR code" },
        { status: 409 }
      )
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Mark attendance and update QR session in a transaction
    await db.$transaction(async (tx) => {
      // Upsert attendance record
      await tx.attendance.upsert({
        where: {
          schoolId_studentId_classId_date_periodId: {
            schoolId: auth.schoolId,
            studentId: student.id,
            classId: session.classId,
            date: today,
            periodId: "",
          },
        },
        create: {
          schoolId: auth.schoolId,
          studentId: student.id,
          classId: session.classId,
          date: today,
          status: "PRESENT",
          method: "QR_CODE",
          markedBy: auth.userId,
          markedAt: new Date(),
        },
        update: {
          status: "PRESENT",
          method: "QR_CODE",
          markedBy: auth.userId,
          markedAt: new Date(),
        },
      })

      // Update QR session scan count and scannedBy
      await tx.qRCodeSession.update({
        where: { id: session.id },
        data: {
          scanCount: { increment: 1 },
          scannedBy: [...scannedBy, student.id],
        },
      })
    })

    return NextResponse.json({
      success: true,
      student_id: student.id,
      status: "PRESENT",
    })
  } catch (error) {
    console.error("Mobile QR scan error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
