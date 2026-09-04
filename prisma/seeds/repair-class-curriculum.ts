// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Repair stale Class rows so every class matches its grade's curriculum.
 *
 * Classes seeded before `seedClasses` became curriculum-gated were a full
 * subject x year-level cross-product, so most grades ended up with classes
 * pointing at another grade's catalog subject — a grade-12 class for an
 * elementary-only subject, a grade-10 "الرياضيات" class wired to the grade-4
 * الرياضيات. Re-seeding does not repair them: the upsert's update branch omits
 * `subjectId`, and pairs outside the curriculum are skipped entirely.
 *
 * The school's active SubjectSelection rows are the authority on which
 * (grade, subject) pairs should exist.
 *
 * 1. A class whose pair is already in the curriculum is left alone.
 * 2. A wrong class is repointed when its grade's curriculum wants a subject of
 *    the same name — this keeps its enrollments, attendance and results, which
 *    were always about that subject, just linked to the wrong grade's row.
 * 3. Whatever is still unmatched is deleted. Those cascade into enrollments,
 *    attendance, results, assignments and exams, all of which describe classes
 *    that should never have existed. Re-run the `classes`, `attendance`,
 *    `assignments`, `exams` and `grades` seeds afterwards to repopulate.
 * 4. Duplicates of the same (grade, subject) are collapsed onto whichever row
 *    carries the most history. `seedClasses` names a class after the catalog
 *    subject while older rows were named after the selection's custom name, so
 *    its upsert misses them and adds a second class for the same pair. Run
 *    this after the seed to clear those.
 *
 * Dry-run by default; pass --apply to write.
 *
 *   npx tsx prisma/seeds/repair-class-curriculum.ts
 *   npx tsx prisma/seeds/repair-class-curriculum.ts --apply
 *   REPAIR_SCHOOL_DOMAIN=demo npx tsx prisma/seeds/repair-class-curriculum.ts --apply
 */

import "dotenv/config"

import { PrismaClient } from "@prisma/client"

export type RepairReport = {
  domain: string
  total: number
  alreadyCorrect: number
  repointed: number
  deleted: number
  deduped: number
  missingAfter: number
}

export async function repairClassCurriculum(
  prisma: PrismaClient,
  schoolId: string,
  domain: string,
  apply: boolean
): Promise<RepairReport> {
  const selections = await prisma.subjectSelection.findMany({
    where: { schoolId, isActive: true },
    select: { gradeId: true, catalogSubjectId: true },
  })

  // A school with no curriculum has nothing to check against — leave it alone
  // rather than deleting every class it has.
  if (selections.length === 0) {
    const total = await prisma.class.count({ where: { schoolId } })
    return {
      domain,
      total,
      alreadyCorrect: total,
      repointed: 0,
      deleted: 0,
      deduped: 0,
      missingAfter: 0,
    }
  }

  const wantedByGrade = new Map<string, Set<string>>()
  for (const s of selections) {
    if (!s.gradeId) continue
    const set = wantedByGrade.get(s.gradeId) ?? new Set<string>()
    set.add(s.catalogSubjectId)
    wantedByGrade.set(s.gradeId, set)
  }

  const classes = await prisma.class.findMany({
    where: { schoolId },
    select: {
      id: true,
      name: true,
      gradeId: true,
      subjectId: true,
      subject: { select: { name: true } },
    },
  })

  // Names of every catalog subject the curriculum asks for, so a wrong class
  // can be matched to the right row by the subject it was always about.
  const wantedIds = [...new Set(selections.map((s) => s.catalogSubjectId))]
  const wantedSubjects = await prisma.subject.findMany({
    where: { id: { in: wantedIds } },
    select: { id: true, name: true },
  })
  const wantedName = new Map(wantedSubjects.map((s) => [s.id, s.name]))

  const covered = new Map<string, Set<string>>()
  const wrong: typeof classes = []

  for (const c of classes) {
    if (c.gradeId && wantedByGrade.get(c.gradeId)?.has(c.subjectId)) {
      const set = covered.get(c.gradeId) ?? new Set<string>()
      set.add(c.subjectId)
      covered.set(c.gradeId, set)
    } else {
      wrong.push(c)
    }
  }

  const alreadyCorrect = classes.length - wrong.length

  // Repoint a wrong class onto a curriculum subject of the same name at its
  // own grade. The class name is "<subject name> - <level name>", so the name
  // already reads correctly and stays unique.
  const repoint: { id: string; subjectId: string }[] = []
  for (const c of wrong.slice()) {
    if (!c.gradeId || !c.subject?.name) continue
    const wanted = wantedByGrade.get(c.gradeId)
    if (!wanted) continue
    const taken = covered.get(c.gradeId) ?? new Set<string>()
    const target = [...wanted].find(
      (id) => !taken.has(id) && wantedName.get(id) === c.subject!.name
    )
    if (!target) continue

    repoint.push({ id: c.id, subjectId: target })
    taken.add(target)
    covered.set(c.gradeId, taken)
    wrong.splice(wrong.indexOf(c), 1)
  }

  // Collapse duplicates of the same (grade, subject) onto the row carrying the
  // most history, so the survivor keeps its results, assignments and exams.
  const surviving = classes.filter((c) => !wrong.some((w) => w.id === c.id))
  const repointedTo = new Map(repoint.map((r) => [r.id, r.subjectId]))
  const byPair = new Map<string, typeof classes>()
  for (const c of surviving) {
    if (!c.gradeId) continue
    const key = `${c.gradeId}:${repointedTo.get(c.id) ?? c.subjectId}`
    byPair.set(key, [...(byPair.get(key) ?? []), c])
  }

  const dedupe: string[] = []
  for (const group of byPair.values()) {
    if (group.length < 2) continue
    const weighed = await Promise.all(
      group.map(async (c) => ({
        id: c.id,
        history:
          (await prisma.result.count({ where: { classId: c.id } })) +
          (await prisma.schoolAssignment.count({ where: { classId: c.id } })) +
          (await prisma.schoolExam.count({ where: { classId: c.id } })) +
          (await prisma.attendance.count({ where: { classId: c.id } })),
      }))
    )
    weighed.sort((a, b) => b.history - a.history)
    for (const loser of weighed.slice(1)) dedupe.push(loser.id)
  }

  if (apply) {
    for (const r of repoint) {
      await prisma.class.update({
        where: { id: r.id },
        data: { subjectId: r.subjectId },
      })
    }
    const remove = [...wrong.map((c) => c.id), ...dedupe]
    if (remove.length > 0) {
      await prisma.class.deleteMany({ where: { id: { in: remove } } })
    }
  }

  let missingAfter = 0
  for (const [gradeId, wanted] of wantedByGrade) {
    const taken = covered.get(gradeId) ?? new Set<string>()
    for (const id of wanted) if (!taken.has(id)) missingAfter++
  }

  return {
    domain,
    total: classes.length,
    alreadyCorrect,
    repointed: repoint.length,
    deleted: wrong.length,
    deduped: dedupe.length,
    missingAfter,
  }
}

async function main() {
  const apply = process.argv.includes("--apply")
  const prisma = new PrismaClient()
  const only = process.env.REPAIR_SCHOOL_DOMAIN

  try {
    const schools = await prisma.school.findMany({
      where: only ? { domain: only } : {},
      select: { id: true, domain: true },
    })

    console.log(
      apply
        ? "Repairing classes against each school's curriculum"
        : "DRY RUN — nothing is written. Pass --apply to commit."
    )

    for (const school of schools) {
      const r = await repairClassCurriculum(
        prisma,
        school.id,
        school.domain ?? school.id,
        apply
      )
      console.log(
        `\n${r.domain}: ${r.total} classes` +
          `\n  already correct   ${r.alreadyCorrect}` +
          `\n  repointed         ${r.repointed}` +
          `\n  deleted           ${r.deleted}` +
          `\n  duplicates merged ${r.deduped}` +
          `\n  curriculum pairs still without a class ${r.missingAfter}` +
          (r.missingAfter > 0 ? "  (run: pnpm db:seed:single classes)" : "")
      )
    }
  } finally {
    await prisma.$disconnect()
  }
}

if (process.argv[1]?.includes("repair-class-curriculum")) {
  main().catch((e) => {
    console.error(e)
    process.exit(1)
  })
}
