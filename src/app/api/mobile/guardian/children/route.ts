// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"

import { db } from "@/lib/db"

import { authenticate, isAuthError } from "../../lib/authenticate"

/**
 * GET /api/mobile/guardian/children — list guardian's children
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth

    const guardian = await db.guardian.findFirst({
      where: { userId: auth.userId, schoolId: auth.schoolId },
      select: { id: true },
    })

    if (!guardian) {
      return NextResponse.json({ data: [] })
    }

    const links = await db.studentGuardian.findMany({
      where: { guardianId: guardian.id },
      select: {
        guardianType: { select: { name: true } },
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            gender: true,
            dateOfBirth: true,
            profilePhotoUrl: true,
            status: true,
            section: {
              select: {
                name: true,
                grade: { select: { name: true } },
              },
            },
          },
        },
      },
    })

    const data = links.map((l) => ({
      id: l.student.id,
      given_name: l.student.firstName,
      family_name: l.student.lastName,
      gender: l.student.gender,
      date_of_birth: l.student.dateOfBirth?.toISOString() || null,
      photo_url: l.student.profilePhotoUrl,
      status: l.student.status,
      relationship: l.guardianType?.name || null,
      section: l.student.section?.name || null,
      grade: l.student.section?.grade?.name || null,
    }))

    return NextResponse.json({ data })
  } catch (error) {
    console.error("Mobile guardian children error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
