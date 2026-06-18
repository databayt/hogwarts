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

    if (dry) {
      console.log("--dry: not generating.")
      return
    }

    // --clear: wipe the active term's slots before regenerating (the generator
    // is additive via skipDuplicates; clearing avoids mixing an old run's
    // distribution with a new one).
    if (process.argv.includes("--clear") && resolved.term) {
      const del = await prisma.timetable.deleteMany({
        where: { schoolId: school.id, termId: resolved.term.id },
      })
      console.log(`--clear: deleted ${del.count} existing slots`)
    }

    const result = await autoGenerateTimetableForSchool(school.id)
    console.log("Generation result:", result)

    const after = await prisma.timetable.count({
      where: { schoolId: school.id },
    })
    console.log(`Timetable slots now: ${after}`)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
