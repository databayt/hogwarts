// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import "server-only"

import { cache } from "react"

import { db } from "@/lib/db"
import { resolveSchoolCountry } from "@/lib/school-country"

/**
 * The grade-naming code for a school: its ISO country ("SD"), or null for
 * international schools (they teach a US-style programme and read "Grade n"
 * in both languages' structure). Feed it to `gradeLabel({ country })`.
 * Per-request cached — call it freely from server components and actions.
 */
export const getSchoolGradeCountry = cache(
  async (schoolId: string): Promise<string | null> => {
    const school = await db.school.findUnique({
      where: { id: schoolId },
      select: {
        country: true,
        timezone: true,
        currency: true,
        schoolType: true,
      },
    })
    if (!school || school.schoolType === "international") return null
    return resolveSchoolCountry(school)
  }
)
