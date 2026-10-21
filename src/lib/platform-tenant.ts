// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import "server-only"

import { db } from "@/lib/db"

/**
 * The tenant that owns platform-level rows — funnel leads, the main-domain
 * chatbot's visitors, platform AI spend. Never a real school: `isActive:
 * false` keeps it out of active-tenant counts (the north-star metric), and
 * `platform` is a reserved subdomain, so it can't collide with a school.
 */
export const PLATFORM_SCHOOL_ID = "platform"

let ensured: Promise<void> | null = null

/**
 * Make sure the sentinel school row exists. Created on demand rather than
 * seeded, so no environment needs a migration step first. Once per process.
 */
export function ensurePlatformSchool(): Promise<void> {
  ensured ??= db.school
    .upsert({
      where: { id: PLATFORM_SCHOOL_ID },
      update: {},
      create: {
        id: PLATFORM_SCHOOL_ID,
        name: "Databayt Platform",
        domain: PLATFORM_SCHOOL_ID,
        isActive: false,
        planType: "free",
        maxStudents: 0,
        maxTeachers: 0,
      },
    })
    .then(() => undefined)
    .catch((error) => {
      ensured = null // try again next time
      throw error
    })
  return ensured
}
