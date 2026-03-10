// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Backfill academicGradeId and sectionId on Student records
 *
 * Distributes unassigned students (no grade/section) across available
 * sections in round-robin fashion. Idempotent — only updates students
 * where both academicGradeId and sectionId are NULL.
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
    // Find unassigned students
    const unassigned = await prisma.student.findMany({
      where: {
        schoolId: school.id,
        academicGradeId: null,
        sectionId: null,
      },
      select: { id: true },
      orderBy: { createdAt: "asc" },
    })

    if (unassigned.length === 0) {
      console.log(`[${school.domain}] No unassigned students. Skipping.`)
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
        `[${school.domain}] No sections found. Cannot assign ${unassigned.length} students.`
      )
      continue
    }

    console.log(
      `[${school.domain}] Distributing ${unassigned.length} students across ${sections.length} sections...`
    )

    // Round-robin assignment in batches
    const BATCH_SIZE = 100
    for (let i = 0; i < unassigned.length; i += BATCH_SIZE) {
      const batch = unassigned.slice(i, i + BATCH_SIZE)

      await prisma.$transaction(
        batch.map((student, idx) => {
          const section = sections[(i + idx) % sections.length]
          return prisma.student.update({
            where: { id: student.id },
            data: {
              academicGradeId: section.gradeId,
              sectionId: section.id,
            },
          })
        })
      )

      totalUpdated += batch.length
      if (batch.length === BATCH_SIZE) {
        console.log(`  Updated ${totalUpdated}/${unassigned.length}...`)
      }
    }

    console.log(
      `[${school.domain}] Done. Assigned ${unassigned.length} students to ${sections.length} sections.`
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
