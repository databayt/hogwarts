// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * One-off: auto-provision (generate) a timetable for a school by domain.
 *
 * Additive only — `autoGenerateTimetableForSchool` uses
 * `createMany({ skipDuplicates: true })` and never deletes. Targets the school
 * resolved from the `--domain` arg (default: demo) on the DATABASE_URL in the
 * central .env.
 *
 * Usage:
 *   pnpm tsx prisma/scripts/provision-timetable.ts --domain demo
 *   pnpm tsx prisma/scripts/provision-timetable.ts --domain demo --dry
 *   pnpm tsx prisma/scripts/provision-timetable.ts --domain alabidae --clear
 *
 * --clear rebuilds the active term from scratch. It refuses (unless --force)
 * when the term's slots carry anything a rebuild would lose: an assigned
 * teacher, a live or upcoming Conference, or a substitution. Scheduled
 * conferences on the old slots are cancelled first, exactly as the Generate
 * page does, so the materialization sweep can't duplicate them.
 *
 * Prints the parallel-clash count (two sections of a grade on the same
 * subject at the same period) before and after — the bug placeholder
 * teachers fixed.
 */

// dotenv first — the @/lib/db singleton reads DATABASE_URL at import time.
import "dotenv/config"

import { PrismaClient } from "@prisma/client"

import { resolveActiveTerm } from "@/lib/term-resolver"
import {
  autoGenerateTimetableForSchool,
  getProvisioningStatus,
} from "@/components/catalog/provision"

function arg(name: string, fallback?: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`)
  if (i >= 0 && process.argv[i + 1]) return process.argv[i + 1]
  return fallback
}

/**
 * Slots that share (grade, subject, day, period) with another section of the
 * same grade — what one teacher could never cover.
 */
async function parallelClashes(
  prisma: PrismaClient,
  schoolId: string,
  termId: string
): Promise<number> {
  const slots = await prisma.timetable.findMany({
    where: { schoolId, termId, sectionId: { not: null }, weekOffset: 0 },
    select: {
      dayOfWeek: true,
      periodId: true,
      subjectId: true,
      section: { select: { gradeId: true } },
    },
  })
  const groups = new Map<string, number>()
  for (const s of slots) {
    const key = `${s.section?.gradeId}|${s.subjectId}|${s.dayOfWeek}|${s.periodId}`
    groups.set(key, (groups.get(key) ?? 0) + 1)
  }
  let clashes = 0
  for (const count of groups.values()) if (count > 1) clashes += count
  return clashes
}

async function main() {
  const domain = arg("domain", "demo")!
  const dry = process.argv.includes("--dry")

  const prisma = new PrismaClient()
  try {
    const school = await prisma.school.findFirst({
      where: { domain },
      select: { id: true, name: true, domain: true, timetableStructure: true },
    })
    if (!school) throw new Error(`No school with domain "${domain}"`)
    console.log(
      `School: ${school.name} (${school.domain}) id=${school.id} structure=${school.timetableStructure}`
    )

    const resolved = await resolveActiveTerm(school.id)
    console.log(
      `Active term: ${resolved.term?.id ?? "NONE"} (source=${resolved.source}, year=${resolved.term?.yearId ?? "-"})`
    )

    const before = await getProvisioningStatus(school.id)
    console.log("Provisioning status (before):", {
      missing: before.missing,
      slots: before.counts.timetableSlots,
      periods: before.counts.periods,
      terms: before.counts.terms,
      sections: before.counts.sections,
      subjectSelections: before.counts.subjectSelections,
    })

    const termId = resolved.term?.id
    if (termId) {
      console.log(
        `Parallel clashes (before): ${await parallelClashes(prisma, school.id, termId)}`
      )
    }

    const clear = process.argv.includes("--clear")
    const force = process.argv.includes("--force")
    if (clear && termId) {
      const slotIds = (
        await prisma.timetable.findMany({
          where: { schoolId: school.id, termId },
          select: { id: true },
        })
      ).map((s) => s.id)
      const [withTeacher, conferences, substitutions] = await Promise.all([
        prisma.timetable.count({
          where: { schoolId: school.id, termId, teacherId: { not: null } },
        }),
        prisma.conference.count({
          where: {
            schoolId: school.id,
            timetableId: { in: slotIds },
            OR: [
              { status: "live" },
              { status: "scheduled", scheduledStart: { gt: new Date() } },
            ],
          },
        }),
        prisma.substitutionRecord.count({
          where: { schoolId: school.id, originalSlotId: { in: slotIds } },
        }),
      ])
      console.log("--clear pre-checks:", {
        slots: slotIds.length,
        withTeacher,
        conferences,
        substitutions,
      })
      if ((withTeacher || conferences || substitutions) && !force) {
        throw new Error(
          "Refusing --clear: the term has assigned teachers, live/upcoming conferences or substitutions. Re-run with --force to rebuild anyway."
        )
      }
    }

    if (dry) {
      console.log("--dry: not generating.")
      return
    }

    // --clear: wipe the active term's slots before regenerating (the generator
    // is additive via skipDuplicates; clearing avoids mixing an old run's
    // distribution with a new one).
    if (clear && termId) {
      const oldSlotIds = (
        await prisma.timetable.findMany({
          where: { schoolId: school.id, termId },
          select: { id: true },
        })
      ).map((s) => s.id)
      if (oldSlotIds.length > 0) {
        const cancelled = await prisma.conference.updateMany({
          where: {
            schoolId: school.id,
            timetableId: { in: oldSlotIds },
            status: "scheduled",
            scheduledStart: { gt: new Date() },
          },
          data: { status: "cancelled" },
        })
        if (cancelled.count > 0) {
          console.log(
            `--clear: cancelled ${cancelled.count} scheduled conferences`
          )
        }
      }
      const del = await prisma.timetable.deleteMany({
        where: { schoolId: school.id, termId },
      })
      console.log(`--clear: deleted ${del.count} existing slots`)
    }

    const result = await autoGenerateTimetableForSchool(school.id)
    console.log("Generation result:", result)

    const after = await prisma.timetable.count({
      where: { schoolId: school.id },
    })
    console.log(`Timetable slots now: ${after}`)
    if (termId) {
      console.log(
        `Parallel clashes (after): ${await parallelClashes(prisma, school.id, termId)}`
      )
    }
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
