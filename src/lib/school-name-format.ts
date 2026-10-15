// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import "server-only"

import { cache } from "react"

import { db } from "@/lib/db"
import {
  isNameDisplay,
  NAME_CONTACT_DEFAULTS,
  NAME_DISPLAY_DEFAULT,
  type NameContact,
  type NameContactListing,
  type NameDisplay,
} from "@/lib/name-utils"

/**
 * The school's name layout ("full" or split first/last). The listing pages
 * hand it to their "+" button, which seeds the add wizard with it so the
 * wizard opens without a load round trip. Never throws — "full" is the
 * schema default.
 */
export async function schoolNameFormat(
  schoolId: string | null | undefined
): Promise<string> {
  if (!schoolId) return "full"
  try {
    const school = await db.school.findUnique({
      where: { id: schoolId },
      select: { nameFormat: true },
    })
    return school?.nameFormat ?? "full"
  } catch {
    return "full"
  }
}

/**
 * What a listing shows under a name: "email" or "phone", per listing. Never
 * throws — falls back to the listing's default (teachers and staff email, students and parents phone).
 */
export async function schoolNameContact(
  schoolId: string | null | undefined,
  listing: NameContactListing
): Promise<NameContact> {
  const fallback = NAME_CONTACT_DEFAULTS[listing]
  if (!schoolId) return fallback
  try {
    const school = await db.school.findUnique({
      where: { id: schoolId },
      select: {
        teacherNameContact: true,
        studentNameContact: true,
        guardianNameContact: true,
        staffNameContact: true,
        memberNameContact: true,
      },
    })
    const value = {
      teacher: school?.teacherNameContact,
      student: school?.studentNameContact,
      guardian: school?.guardianNameContact,
      staff: school?.staffNameContact,
      member: school?.memberNameContact,
    }[listing]
    return value === "email" || value === "phone" ? value : fallback
  } catch {
    return fallback
  }
}

/**
 * How listings and profiles show a name: "first-second" (given + father's)
 * or "first-last". Cached per request — a listing and its profile drawer
 * share one lookup. Never throws.
 */
export const schoolNameDisplay = cache(
  async (schoolId: string | null | undefined): Promise<NameDisplay> => {
    if (!schoolId) return NAME_DISPLAY_DEFAULT
    try {
      const school = await db.school.findUnique({
        where: { id: schoolId },
        select: { nameDisplay: true },
      })
      return isNameDisplay(school?.nameDisplay)
        ? school.nameDisplay
        : NAME_DISPLAY_DEFAULT
    } catch {
      return NAME_DISPLAY_DEFAULT
    }
  }
)
