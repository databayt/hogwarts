// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"

import { db } from "@/lib/db"

import { authenticate, isAuthError } from "../../../../lib/authenticate"

/**
 * GET /api/mobile/teacher/classes/:classId/students — students in a section
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ classId: string }> }
) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth

    const { classId } = await params

    const students = await db.student.findMany({
      where: { schoolId: auth.schoolId, sectionId: classId, status: "ACTIVE" },
      orderBy: { firstName: "asc" },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        grNumber: true,
        gender: true,
        profilePhotoUrl: true,
      },
    })

    const data = students.map((s) => ({
      id: s.id,
      given_name: s.firstName,
      family_name: s.lastName,
      gr_number: s.grNumber,
      gender: s.gender,
      photo_url: s.profilePhotoUrl,
    }))

    return NextResponse.json({ data, total: data.length })
  } catch (error) {
    console.error("Mobile class students error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
