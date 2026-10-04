// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * One-off: give every placed student the LMS courses of their grade's
 * subjects — what placement does on its own since 2026-10-04. Before that a
 * student reached Lumos only through a class enrollment, so the students of
 * class-less schools (every new one) have none.
 *
 * Additive and idempotent: inserts skip enrollments that exist. --dry runs
 * the same writes inside a transaction and rolls them back, so the counts
 * are exact. Targets the DATABASE_URL in the central .env — for prod, export
 * the prod URL on the command line, behind a Neon restore point.
 *
 * Usage:
 *   pnpm tsx prisma/scripts/subject-enrollments-backfill.ts --domain demo --dry
 *   pnpm tsx prisma/scripts/subject-enrollments-backfill.ts --all
 */

// dotenv first — the @/lib/db singleton reads DATABASE_URL at import time.
import "dotenv/config"

import { PrismaClient } from "@prisma/client"

import { syncGradeSubjectEnrollments } from "@/lib/enrollment-sync"

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`)
  return i >= 0 ? process.argv[i + 1] : undefined
}
const flag = (name: string) => process.argv.includes(`--${name}`)

class DryRun extends Error {}

async function main() {
  const domain = arg("domain")
  if (!domain && !flag("all")) throw new Error("--domain or --all is required")
  const dry = flag("dry")

  const prisma = new PrismaClient()
  try {
    const schools = await prisma.school.findMany({
      where: domain ? { domain } : {},
      select: { id: true, name: true, domain: true },
      orderBy: { domain: "asc" },
    })
    if (schools.length === 0)
      throw new Error(`No school with domain "${domain}"`)

    let total = 0
    for (const school of schools) {
      const grades = await prisma.academicGrade.findMany({
        where: { schoolId: school.id },
        select: { id: true, name: true },
        orderBy: { gradeNumber: "asc" },
      })
      let created = 0
      try {
        await prisma.$transaction(
          async (tx) => {
            for (const grade of grades) {
              const r = await syncGradeSubjectEnrollments(
                school.id,
                grade.id,
                tx
              )
              created += r.created
            }
            if (dry) throw new DryRun()
          },
          { timeout: 600_000 }
        )
      } catch (e) {
        if (!(e instanceof DryRun)) throw e
      }
      total += created
      console.log(
        `${school.name} (${school.domain}): ${created} enrollments ${dry ? "would be " : ""}created across ${grades.length} grades`
      )
    }
    console.log(`${dry ? "--dry, rolled back: " : ""}${total} in all.`)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
