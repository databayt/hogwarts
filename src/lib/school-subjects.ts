// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { CatalogSubject } from "@prisma/client"

import { db } from "@/lib/db"

/**
 * Get all active subjects for a school via SchoolSubjectSelection bridge.
 * Returns CatalogSubject records (deduplicated by catalogSubjectId).
 *
 * This replaces all `db.subject.findMany({ where: { schoolId } })` calls.
 */
export async function getSchoolSubjects(
  schoolId: string
): Promise<CatalogSubject[]> {
  const selections = await db.schoolSubjectSelection.findMany({
    where: { schoolId, isActive: true },
    include: { subject: true },
    distinct: ["catalogSubjectId"],
  })
  return selections.map((s) => s.subject)
}

/**
 * Get school subjects as options for dropdowns.
 * Returns { id, name, department } for each subject.
 */
export async function getSchoolSubjectOptions(schoolId: string) {
  const selections = await db.schoolSubjectSelection.findMany({
    where: { schoolId, isActive: true },
    include: {
      subject: {
        select: {
          id: true,
          name: true,
          department: true,
        },
      },
    },
    distinct: ["catalogSubjectId"],
  })
  return selections.map((s) => s.subject)
}

/**
 * Find a single school subject by CatalogSubject ID.
 * Verifies the school has selected this subject.
 */
export async function getSchoolSubject(
  schoolId: string,
  subjectId: string
): Promise<CatalogSubject | null> {
  const selection = await db.schoolSubjectSelection.findFirst({
    where: { schoolId, catalogSubjectId: subjectId, isActive: true },
    include: { subject: true },
  })
  return selection?.subject ?? null
}
