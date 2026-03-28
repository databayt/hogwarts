// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Subjects Seed (NO-OP)
 *
 * The school-level Subject model has been REMOVED.
 * All FKs now point directly to Subject.
 * Schools bridge to catalog via SubjectSelection.
 *
 * This function returns Subject refs so downstream seeds
 * (classes, exams, qbank, etc.) continue to work unchanged.
 */

import type { PrismaClient } from "@prisma/client"

import type { SubjectRef } from "./types"
import { logSuccess } from "./utils"

// ============================================================================
// SUBJECTS SEEDING (returns Subject refs)
// ============================================================================

/**
 * Return Subject refs for the school's selected subjects.
 * No Subject records are created — they no longer exist.
 */
export async function seedSubjects(
  prisma: PrismaClient,
  schoolId: string,
  _departments: unknown[]
): Promise<SubjectRef[]> {
  // Get subjects via SubjectSelection bridge
  const selections = await prisma.subjectSelection.findMany({
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
    const catalogSubjects = await prisma.subject.findMany({
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
    "from Subject (no school-level Subject)"
  )

  return subjects
}
