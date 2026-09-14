// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextResponse } from "next/server"

import { db } from "@/lib/db"

import {
  schoolDirectorySelect,
  toSchoolDirectoryDto,
} from "../lib/school-directory"

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
      select: schoolDirectorySelect,
      orderBy: { name: "asc" },
    })

    // Map to snake_case for mobile DTOs
    const response = schools.map(toSchoolDirectoryDto)

    return NextResponse.json(response)
  } catch (error) {
    console.error("Mobile schools list error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
