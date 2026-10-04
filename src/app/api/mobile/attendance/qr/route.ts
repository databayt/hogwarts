// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { randomBytes } from "crypto"
import { NextRequest, NextResponse } from "next/server"

import { db } from "@/lib/db"

import { authenticate, isAuthError } from "../../lib/authenticate"
import { hasRole } from "../../lib/roles"

/**
 * POST /api/mobile/attendance/qr — create a QR code session
 *
 * Body: { section_id (or legacy class_id), duration_minutes?, max_scans? }
 * `class_id` from older app builds is read as a section id first, then as a
 * legacy class.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth

    // Authorization: QR session generation is teacher-driven — STAFF excluded
    // intentionally because creating QR sessions requires class context.
    if (!hasRole(auth, "TEACHER", "ADMIN", "DEVELOPER")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { section_id, class_id, duration_minutes = 15, max_scans } = body
    const targetId: string | undefined = section_id ?? class_id

    if (!targetId) {
      return NextResponse.json(
        { error: "section_id required" },
        { status: 400 }
      )
    }

    // The target must belong to this tenant — a section, or a legacy class.
    // Without this a teacher could pass another school's id and create a QR
    // session in their own school with an FK pointing across tenants.
    const [section, legacyClass] = await Promise.all([
      db.section.findFirst({
        where: { id: targetId, schoolId: auth.schoolId },
        select: { id: true },
      }),
      db.class.findFirst({
        where: { id: targetId, schoolId: auth.schoolId },
        select: { id: true },
      }),
    ])
    if (!section && !legacyClass) {
      return NextResponse.json(
        { error: "section_id is not a member of this school" },
        { status: 404 }
      )
    }
    const target = section
      ? { sectionId: section.id }
      : { classId: legacyClass!.id }

    const code = randomBytes(16).toString("hex")
    const now = new Date()
    const expiresAt = new Date(now.getTime() + duration_minutes * 60 * 1000)

    const session = await db.qRCodeSession.create({
      data: {
        schoolId: auth.schoolId,
        ...target,
        code,
        payload: { ...target, generatedAt: now.toISOString() },
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
        sectionId: true,
        expiresAt: true,
        maxScans: true,
      },
    })

    return NextResponse.json(
      {
        id: session.id,
        code: session.code,
        section_id: session.sectionId,
        // Older app builds read class_id; it carries whichever id was given.
        class_id: session.sectionId ?? session.classId,
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
