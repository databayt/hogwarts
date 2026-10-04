// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * One-off: give a school that predates subject teachers its SubjectTeacher
 * rows for the active term, then line the timetable up with them.
 *
 *   --from-slots      the timetable already names teachers (demo)
 *   --from-classes    legacy grade-level classes (King Fahd)
 *   --from-expertise  qualified teachers for whatever is left
 *   (no source flag)  slots, then expertise
 *
 * Additive: pairs that already have a teacher are never changed. Periods of
 * a newly assigned pair move inside their section when the teacher clashes.
 * Targets the DATABASE_URL in the central .env — for prod, export the prod
 * URL on the command line, behind a Neon restore point.
 *
 * Usage:
 *   pnpm tsx prisma/scripts/subject-teachers-backfill.ts --domain demo --from-slots
 *   pnpm tsx prisma/scripts/subject-teachers-backfill.ts --domain kingfahd --from-classes --dry
 */

// dotenv first — the @/lib/db singleton reads DATABASE_URL at import time.
import "dotenv/config"

import { PrismaClient } from "@prisma/client"

import { resolveActiveTerm } from "@/lib/term-resolver"
import {
  deriveFromClasses,
  deriveFromExpertise,
  deriveFromSlots,
  ensureAssignments,
} from "@/components/school-dashboard/timetable/assignments/derive"

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`)
  return i >= 0 ? process.argv[i + 1] : undefined
}
const flag = (name: string) => process.argv.includes(`--${name}`)

async function main() {
  const domain = arg("domain")
  if (!domain) throw new Error("--domain is required")

  const prisma = new PrismaClient()
  try {
    const school = await prisma.school.findFirst({
      where: { domain },
      select: { id: true, name: true },
    })
    if (!school) throw new Error(`No school with domain "${domain}"`)
    const { term } = await resolveActiveTerm(school.id)
    if (!term) throw new Error("No active term")

    const [assignments, teacherSlots, classes] = await Promise.all([
      prisma.subjectTeacher.count({
        where: { schoolId: school.id, termId: term.id },
      }),
      prisma.timetable.count({
        where: {
          schoolId: school.id,
          termId: term.id,
          teacherId: { not: null },
        },
      }),
      prisma.class.count({ where: { schoolId: school.id } }),
    ])
    console.log(
      `${school.name} (${domain}) term ${term.id}: ${assignments} assignments, ${teacherSlots} periods with a teacher, ${classes} legacy classes`
    )
    if (flag("dry")) {
      console.log("--dry: nothing written.")
      return
    }

    const result = flag("from-slots")
      ? await deriveFromSlots(prisma, school.id, term.id)
      : flag("from-classes")
        ? await deriveFromClasses(prisma, school.id, term.id)
        : flag("from-expertise")
          ? await deriveFromExpertise(prisma, school.id, term.id)
          : await ensureAssignments(prisma, school.id, term.id)
    console.log("Result:", result)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
