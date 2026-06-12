// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Deploy-time catalog sync — the "Live-DB seed sync" runbook as one command.
 *
 * Replaces the legacy subjects-only GB/IB rows with the deep curriculum
 * trees and re-runs the asset seeds:
 *   1. Inventory stale `gb-national-g*` / `ib-diploma-g*` subjects
 *   2. Delete ONLY the ones no school references (SubjectSelection, Class,
 *      Enrollment, Timetable) — referenced ones are reported for manual
 *      migration, never touched (SubjectSelection/Enrollment CASCADE on
 *      subject delete, so a blind delete silently strips schools)
 *   3. Seed registry → gb → cbse → caie-igcse → ib → concepts → banners
 *
 * PLAN MODE BY DEFAULT (read-only report). Nothing is written without
 * --execute. Run only against prod AFTER the code deploy is live, per the
 * Neon branch-before-touch protocol.
 *
 * Usage: pnpm tsx scripts/catalog-deploy-sync.ts             (plan, read-only)
 *        pnpm tsx scripts/catalog-deploy-sync.ts --execute   (apply)
 */

import "dotenv/config"

import { PrismaClient } from "@prisma/client"

import { seedConceptBanners } from "../prisma/seeds/catalog/banners"
import { seedCaieIgcseCurriculum } from "../prisma/seeds/catalog/caie-igcse"
import { seedCbseCurriculum } from "../prisma/seeds/catalog/cbse"
import { seedConceptImages } from "../prisma/seeds/catalog/concepts"
import { seedGbCurriculum } from "../prisma/seeds/catalog/gb"
import { seedIbCurriculum } from "../prisma/seeds/catalog/ib"
import { seedCurriculumRegistry } from "../prisma/seeds/catalog/registry"

const STALE_SLUG_PREFIXES = ["gb-national-g", "ib-diploma-g"]

const prisma = new PrismaClient()

interface StaleSubject {
  id: string
  slug: string
  references: {
    selections: number
    classes: number
    enrollments: number
    timetableSlots: number
  }
  referenced: boolean
}

async function inventoryStale(): Promise<StaleSubject[]> {
  const subjects = await prisma.subject.findMany({
    where: {
      OR: STALE_SLUG_PREFIXES.map((p) => ({ slug: { startsWith: p } })),
    },
    select: { id: true, slug: true },
    orderBy: { slug: "asc" },
  })
  if (subjects.length === 0) return []

  const ids = subjects.map((s) => s.id)
  const [selections, classes, enrollments, timetableSlots] = await Promise.all([
    prisma.subjectSelection.groupBy({
      by: ["catalogSubjectId"],
      where: { catalogSubjectId: { in: ids } },
      _count: true,
    }),
    prisma.class.groupBy({
      by: ["subjectId"],
      where: { subjectId: { in: ids } },
      _count: true,
    }),
    prisma.enrollment.groupBy({
      by: ["catalogSubjectId"],
      where: { catalogSubjectId: { in: ids } },
      _count: true,
    }),
    prisma.timetable.groupBy({
      by: ["subjectId"],
      where: { subjectId: { in: ids } },
      _count: true,
    }),
  ])

  const counts = new Map<string, StaleSubject["references"]>()
  const ensure = (id: string) => {
    let c = counts.get(id)
    if (!c) {
      c = { selections: 0, classes: 0, enrollments: 0, timetableSlots: 0 }
      counts.set(id, c)
    }
    return c
  }
  for (const row of selections)
    ensure(row.catalogSubjectId).selections = row._count
  for (const row of classes)
    if (row.subjectId) ensure(row.subjectId).classes = row._count
  for (const row of enrollments)
    ensure(row.catalogSubjectId).enrollments = row._count
  for (const row of timetableSlots)
    if (row.subjectId) ensure(row.subjectId).timetableSlots = row._count

  return subjects.map((s) => {
    const references = counts.get(s.id) ?? {
      selections: 0,
      classes: 0,
      enrollments: 0,
      timetableSlots: 0,
    }
    const referenced =
      references.selections +
        references.classes +
        references.enrollments +
        references.timetableSlots >
      0
    return { ...s, references, referenced }
  })
}

async function curriculumCounts(): Promise<Record<string, number>> {
  const rows = await prisma.subject.groupBy({
    by: ["curriculum"],
    _count: true,
    orderBy: { curriculum: "asc" },
  })
  return Object.fromEntries(rows.map((r) => [r.curriculum, r._count]))
}

async function main() {
  const execute = process.argv.includes("--execute")
  console.log(
    execute
      ? "=== catalog-deploy-sync: EXECUTE ==="
      : "=== catalog-deploy-sync: PLAN (read-only — pass --execute to apply) ==="
  )

  console.log("\nSubjects per curriculum (before):")
  console.table(await curriculumCounts())

  // ---- Stage 1+2: stale legacy rows --------------------------------------
  const stale = await inventoryStale()
  const deletable = stale.filter((s) => !s.referenced)
  const blocked = stale.filter((s) => s.referenced)

  console.log(
    `\nStale legacy subjects: ${stale.length} (${deletable.length} deletable, ${blocked.length} referenced by schools)`
  )
  for (const s of blocked) {
    console.log(
      `  KEEP ${s.slug}: selections=${s.references.selections} classes=${s.references.classes} enrollments=${s.references.enrollments} slots=${s.references.timetableSlots} — migrate manually before deleting`
    )
  }

  if (execute && deletable.length > 0) {
    // Chapters/lessons cascade from the subject; bridge rows are zero by
    // definition of "deletable".
    const { count } = await prisma.subject.deleteMany({
      where: { id: { in: deletable.map((s) => s.id) } },
    })
    console.log(`  Deleted ${count} unreferenced legacy subjects`)
  } else if (deletable.length > 0) {
    console.log(
      `  Would delete: ${deletable
        .slice(0, 5)
        .map((s) => s.slug)
        .join(
          ", "
        )}${deletable.length > 5 ? ` … +${deletable.length - 5} more` : ""}`
    )
  }

  // ---- Stage 3: seeds ------------------------------------------------------
  if (execute) {
    console.log("\nSeeding registry + deep curricula + assets…")
    await seedCurriculumRegistry(prisma)
    await seedGbCurriculum(prisma)
    await seedCbseCurriculum(prisma)
    await seedCaieIgcseCurriculum(prisma)
    await seedIbCurriculum(prisma)
    await seedConceptImages(prisma)
    await seedConceptBanners()

    console.log("\nSubjects per curriculum (after):")
    console.table(await curriculumCounts())
  } else {
    console.log(
      "\nWould seed: registry, gb, cbse, caie-igcse, ib, concepts, banners"
    )
  }

  console.log("\nDone.")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
