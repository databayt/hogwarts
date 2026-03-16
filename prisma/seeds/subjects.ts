// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Subjects Seed (NO-OP)
 *
 * The school-level Subject model has been REMOVED.
 * All FKs now point directly to CatalogSubject.
 * Schools bridge to catalog via SchoolSubjectSelection.
 *
 * This function returns CatalogSubject refs so downstream seeds
 * (classes, exams, qbank, etc.) continue to work unchanged.
 */

import type { PrismaClient } from "@prisma/client"

import type { SubjectRef } from "./types"
import { logSuccess } from "./utils"

// ============================================================================
// SUBJECTS SEEDING (returns CatalogSubject refs)
// ============================================================================

/**
 * Return CatalogSubject refs for the school's selected subjects.
 * No Subject records are created — they no longer exist.
 */
export async function seedSubjects(
  prisma: PrismaClient,
  schoolId: string,
  _departments: unknown[]
): Promise<SubjectRef[]> {
  // Get subjects via SchoolSubjectSelection bridge
  const selections = await prisma.schoolSubjectSelection.findMany({
    where: { schoolId, isActive: true },
    include: {
      subject: {
        select: { id: true, name: true, department: true },
      },
    },
    distinct: ["catalogSubjectId"],
  })

  const subjects: SubjectRef[] = selections.map((s) => ({
    id: s.subject.id,
    name: s.subject.name,
    department: s.subject.department ?? "",
  }))

  // Fallback: if no selections exist yet, query published catalog subjects directly
  if (subjects.length === 0) {
    const catalogSubjects = await prisma.catalogSubject.findMany({
      where: { status: "PUBLISHED" },
      select: { id: true, name: true, department: true },
      orderBy: { sortOrder: "asc" },
    })

    for (const cs of catalogSubjects) {
      subjects.push({
        id: cs.id,
        name: cs.name,
        department: cs.department ?? "",
      })
    }
  }

  logSuccess(
    "Subjects",
    subjects.length,
    "from CatalogSubject (no school-level Subject)"
  )

  return subjects
}
