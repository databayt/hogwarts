// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextResponse } from "next/server"

import { db } from "@/lib/db"

/**
 * Mobile Schools List API
 *
 * Returns the list of published, active schools that the mobile app
 * can display during registration / school selection. No auth required.
 *
 * GET /api/mobile/schools
 * Returns: [{ id, name, name_en, logo_url, domain }]
 */

export async function GET() {
  try {
    const schools = await db.school.findMany({
      where: {
        isActive: true,
        isPublished: true,
      },
      select: {
        id: true,
        name: true,
        nameEn: true,
        logoUrl: true,
        domain: true,
      },
      orderBy: { name: "asc" },
    })

    // Map to snake_case for mobile DTOs
    const response = schools.map((school) => ({
      id: school.id,
      name: school.name,
      name_en: school.nameEn,
      logo_url: school.logoUrl,
      domain: school.domain,
    }))

    return NextResponse.json(response)
  } catch (error) {
    console.error("Mobile schools list error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
