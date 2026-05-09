// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { randomBytes } from "crypto"
import { NextRequest, NextResponse } from "next/server"

import { db } from "@/lib/db"

import { authenticate, isAuthError } from "../../lib/authenticate"

/**
 * POST /api/mobile/attendance/qr — create a QR code session
 *
 * Body: { class_id, duration_minutes?, max_scans? }
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth

    // Authorization: QR session generation is teacher-driven — STAFF excluded
    // intentionally because creating QR sessions requires class context.
    // "SUPER_ADMIN" is dead code — replaced with "DEVELOPER".
    if (
      auth.role !== "TEACHER" &&
      auth.role !== "ADMIN" &&
      auth.role !== "DEVELOPER"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { class_id, duration_minutes = 15, max_scans } = body

    if (!class_id) {
      return NextResponse.json({ error: "class_id required" }, { status: 400 })
    }

    // Verify the class belongs to this tenant. Without this, a teacher
    // could pass another school's classId and create a QR session in
    // their own school with an FK pointing across tenants.
    const classExists = await db.class.findFirst({
      where: { id: class_id, schoolId: auth.schoolId },
      select: { id: true },
    })
    if (!classExists) {
      return NextResponse.json(
        { error: "class_id is not a member of this school" },
        { status: 404 }
      )
    }

    const code = randomBytes(16).toString("hex")
    const now = new Date()
    const expiresAt = new Date(now.getTime() + duration_minutes * 60 * 1000)

    const session = await db.qRCodeSession.create({
      data: {
        schoolId: auth.schoolId,
        classId: class_id,
        code,
        payload: { classId: class_id, generatedAt: now.toISOString() },
        generatedBy: auth.userId,
        generatedAt: now,
        expiresAt,
        isActive: true,
        maxScans: max_scans || null,
      },
      select: {
        id: true,
        code: true,
        classId: true,
        expiresAt: true,
        maxScans: true,
      },
    })

    return NextResponse.json(
      {
        id: session.id,
        code: session.code,
        class_id: session.classId,
        expires_at: session.expiresAt.toISOString(),
        max_scans: session.maxScans,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Mobile create QR session error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
