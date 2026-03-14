// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Backfill academicGradeId and sectionId on Student records
 *
 * Distributes unassigned students (no grade/section) across available
 * sections in round-robin fashion. Idempotent — only updates students
 * where academicGradeId OR sectionId is NULL.
 *
 * Usage:
 *   pnpm db:seed:single backfill-student-sections
 *
 * Optional env var:
 *   BACKFILL_SCHOOL_DOMAIN=comboni  (defaults to processing ALL schools)
 */

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function backfillStudentSections(schoolDomain?: string) {
  // Find target schools
  const schools = await prisma.school.findMany({
    where: schoolDomain ? { domain: schoolDomain } : undefined,
    select: { id: true, domain: true, name: true },
  })

  if (schools.length === 0) {
    console.log("No schools found.")
    return
  }

  let totalUpdated = 0

  for (const school of schools) {
    // Find students missing academicGradeId OR sectionId (handles partial state)
    const incomplete = await prisma.student.findMany({
      where: {
        schoolId: school.id,
        OR: [{ academicGradeId: null }, { sectionId: null }],
      },
      select: { id: true, academicGradeId: true, sectionId: true },
      orderBy: { createdAt: "asc" },
    })

    if (incomplete.length === 0) {
      console.log(`[${school.domain}] No incomplete students. Skipping.`)
      continue
    }

    // Get sections with their grade info
    const sections = await prisma.section.findMany({
      where: { schoolId: school.id },
      select: { id: true, name: true, gradeId: true },
      orderBy: [{ gradeId: "asc" }, { name: "asc" }],
    })

    if (sections.length === 0) {
      console.log(
        `[${school.domain}] No sections found. Cannot assign ${incomplete.length} students.`
      )
      continue
    }

    // Build sectionId → gradeId lookup for students that have section but no grade
    const sectionGradeMap = new Map(sections.map((s) => [s.id, s.gradeId]))

    console.log(
      `[${school.domain}] Fixing ${incomplete.length} students across ${sections.length} sections...`
    )

    // Round-robin assignment in batches
    const BATCH_SIZE = 100
    let rrIndex = 0
    for (let i = 0; i < incomplete.length; i += BATCH_SIZE) {
      const batch = incomplete.slice(i, i + BATCH_SIZE)

      await prisma.$transaction(
        batch.map((student) => {
          // If student already has a section, just fill in the grade from that section
          if (student.sectionId && !student.academicGradeId) {
            const gradeId = sectionGradeMap.get(student.sectionId)
            return prisma.student.update({
              where: { id: student.id },
              data: { academicGradeId: gradeId },
            })
          }

          // Otherwise, assign both via round-robin
          const section = sections[rrIndex % sections.length]
          rrIndex++
          return prisma.student.update({
            where: { id: student.id },
            data: {
              academicGradeId: student.academicGradeId || section.gradeId,
              sectionId: student.sectionId || section.id,
            },
          })
        })
      )

      totalUpdated += batch.length
      if (batch.length === BATCH_SIZE) {
        console.log(`  Updated ${totalUpdated}/${incomplete.length}...`)
      }
    }

    console.log(
      `[${school.domain}] Done. Fixed ${incomplete.length} students across ${sections.length} sections.`
    )
  }

  console.log(`\nTotal students updated: ${totalUpdated}`)
}

// Direct execution
if (require.main === module) {
  const domain = process.env.BACKFILL_SCHOOL_DOMAIN
  backfillStudentSections(domain)
    .then(() => prisma.$disconnect())
    .catch((e) => {
      console.error(e)
      prisma.$disconnect()
      process.exit(1)
    })
}
