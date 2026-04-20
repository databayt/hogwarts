// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"

import { db } from "@/lib/db"

import { authenticate, isAuthError } from "../../lib/authenticate"

/**
 * GET /api/mobile/admin/school — school info
 * PUT /api/mobile/admin/school — update school info
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth

    const school = await db.school.findUnique({
      where: { id: auth.schoolId },
      select: {
        id: true,
        name: true,
        nameEn: true,
        domain: true,
        _count: {
          select: {
            students: { where: { status: "ACTIVE" } },
            teachers: { where: { employmentStatus: "ACTIVE" } },
            sections: true,
          },
        },
      },
    })

    if (!school) {
      return NextResponse.json({ error: "School not found" }, { status: 404 })
    }

    return NextResponse.json({
      id: school.id,
      name: school.name,
      name_en: school.nameEn,
      domain: school.domain,
      total_students: school._count.students,
      total_teachers: school._count.teachers,
      total_sections: school._count.sections,
    })
  } catch (error) {
    console.error("Mobile admin school error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth

    if (auth.role !== "ADMIN" && auth.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const updateData: Record<string, unknown> = {}
    if (body.name !== undefined) updateData.name = body.name
    if (body.name_en !== undefined) updateData.nameEn = body.name_en

    const school = await db.school.update({
      where: { id: auth.schoolId },
      data: updateData,
      select: { id: true, name: true, nameEn: true },
    })

    return NextResponse.json(school)
  } catch (error) {
    console.error("Mobile admin update school error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
