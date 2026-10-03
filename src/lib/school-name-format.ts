// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import "server-only"

import { db } from "@/lib/db"

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
