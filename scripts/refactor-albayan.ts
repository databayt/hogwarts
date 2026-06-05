// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Convert the Albayan tenant to the US K-12 curriculum (like the demo school).
 *
 * SAFE + IDEMPOTENT + NON-DESTRUCTIVE — re-running is a no-op once converted:
 *   1. School        → timetableStructure = "us-standard", preferredLanguage = "en"
 *   2. Year levels   → ensure KG1, KG2, Grade 1..12 by levelOrder (upsert, NO delete)
 *   3. Periods/terms → provision from "us-standard" ONLY when there are zero of
 *      both (applyTimetableStructureForNewSchool duplicates periods on re-run,
 *      so the count guard is mandatory; never delete to "clean up").
 *
 * Run BRANCH-FIRST per CLAUDE.md database safety (create a Neon branch, point
 * DATABASE_URL at it, run + verify, then apply to the default branch):
 *   pnpm tsx scripts/refactor-albayan.ts
 *   pnpm tsx scripts/refactor-albayan.ts --domain=albayan   (override target)
 */

import "dotenv/config"

import { db } from "@/lib/db"
import { applyTimetableStructureForNewSchool } from "@/lib/catalog-setup"

const TARGET_STRUCTURE = "us-standard"

// US K-12 year levels — names + levelOrder match YEAR_LEVEL_DEFAULTS in
// src/lib/catalog-setup.ts (KG1=1, KG2=2, Grade 1=3 … Grade 12=14).
const US_YEAR_LEVELS: { name: string; order: number }[] = [
  { name: "KG1", order: 1 },
  { name: "KG2", order: 2 },
  ...Array.from({ length: 12 }, (_, i) => ({
    name: `Grade ${i + 1}`,
    order: i + 3,
  })),
]

function parseArg(name: string, fallback: string): string {
  return (
    process.argv
      .slice(2)
      .find((a) => a.startsWith(`--${name}=`))
      ?.split("=")[1] ?? fallback
  )
}

async function main() {
  const domain = parseArg("domain", "albayan")

  const school = await db.school.findUnique({
    where: { domain },
    select: { id: true, name: true, timetableStructure: true },
  })
  if (!school) {
    console.error(`✖ No school found with domain="${domain}". Aborting.`)
    process.exit(1)
  }
  const schoolId = school.id
  console.log(`→ Converting "${school.name}" (${domain} / ${schoolId})`)

  // 1) School curriculum + language --------------------------------------
  await db.school.update({
    where: { id: schoolId },
    data: { timetableStructure: TARGET_STRUCTURE, preferredLanguage: "en" },
  })
  console.log(`  ✓ School set to ${TARGET_STRUCTURE} / preferredLanguage=en`)

  // 2) Year levels — upsert by name|order, set lang=en. NEVER delete. ------
  let renamed = 0
  let created = 0
  for (const lvl of US_YEAR_LEVELS) {
    const existing = await db.yearLevel.findFirst({
      where: {
        schoolId,
        OR: [{ levelName: lvl.name }, { levelOrder: lvl.order }],
      },
      select: { id: true },
    })
    if (existing) {
      await db.yearLevel.update({
        where: { id: existing.id },
        data: { levelName: lvl.name, levelOrder: lvl.order, lang: "en" },
      })
      renamed++
    } else {
      await db.yearLevel.create({
        data: {
          schoolId,
          levelName: lvl.name,
          levelOrder: lvl.order,
          lang: "en",
        },
      })
      created++
    }
  }
  console.log(`  ✓ Year levels: ${renamed} updated, ${created} created (lang=en)`)

  // 3) Periods / terms / week — provision only when totally empty ----------
  const [periodCount, termCount] = await Promise.all([
    db.period.count({ where: { schoolId } }),
    db.term.count({ where: { schoolId } }),
  ])
  if (periodCount === 0 && termCount === 0) {
    const result = await applyTimetableStructureForNewSchool(
      schoolId,
      TARGET_STRUCTURE
    )
    console.log(`  ✓ Provisioned timetable structure:`, result)
  } else {
    console.log(
      `  • Skipped period/term provisioning (already has ${periodCount} periods, ${termCount} terms — non-destructive).`
    )
  }

  // Verify final state -----------------------------------------------------
  const [levels, terms, periods] = await Promise.all([
    db.yearLevel.count({ where: { schoolId } }),
    db.term.count({ where: { schoolId } }),
    db.period.count({ where: { schoolId } }),
  ])
  console.log(
    `✓ Done. ${levels} year levels, ${terms} terms, ${periods} periods.`
  )
}

main()
  .catch((e) => {
    console.error("✖ refactor-albayan failed:", e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
