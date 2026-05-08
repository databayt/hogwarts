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

    // Verify the student is actually enrolled in the class this QR code
    // was issued for. Without this check, a student in class A could scan
    // class B's QR and have a fake PRESENT record attached to class B.
    const enrolled = await db.studentClass.findFirst({
      where: { studentId: student.id, classId: session.classId },
      select: { id: true },
    })
    if (!enrolled) {
      return NextResponse.json(
        { error: "Student is not enrolled in this class" },
        { status: 403 }
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

    // Daily attendance is keyed with periodId = null (period-specific records
    // use a real periodId). We avoid an upsert here because the unique
    // compound index treats NULLs as distinct — an upsert with
    // `periodId: null` would always fall through to create and produce
    // duplicate daily rows.
    const existing = await db.attendance.findFirst({
      where: {
        schoolId: auth.schoolId,
        studentId: student.id,
        classId: session.classId,
        date: today,
        periodId: null,
      },
      select: { id: true },
    })

    await db.$transaction(async (tx) => {
      if (existing) {
        await tx.attendance.update({
          where: { id: existing.id },
          data: {
            status: "PRESENT",
            method: "QR_CODE",
            markedBy: auth.userId,
            markedAt: new Date(),
          },
        })
      } else {
        await tx.attendance.create({
          data: {
            schoolId: auth.schoolId,
            studentId: student.id,
            classId: session.classId,
            date: today,
            periodId: null,
            status: "PRESENT",
            method: "QR_CODE",
            markedBy: auth.userId,
            markedAt: new Date(),
          },
        })
      }

      // Update QR session scan count and scannedBy. We use `increment`
      // instead of `scanCount + 1` so two concurrent scans don't both
      // read N and write N+1 — the array push remains a last-writer-wins
      // race, but that just means a duplicate id may temporarily appear
      // in the array (already filtered above by the early `includes` guard).
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
