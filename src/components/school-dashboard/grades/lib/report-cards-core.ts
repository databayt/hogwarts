// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Report-card aggregation core — a plain (NOT "use server") helper so it can be
 * called BOTH by the tenant-authed `generateReportCards` action AND by the
 * term-end cron (which has no session and passes an explicit `schoolId` read
 * from the term row) AND by the demo seed. Mirrors the gradebook-spine pattern:
 * the auth/tenant guard lives in the action wrapper; this core takes `schoolId`
 * as a param and scopes every query by it.
 *
 * IT IS DELIBERATELY SET-BASED. The first version walked one student at a time
 * and fired two score queries per enrolled class plus an attendance/year-level/
 * lookup round-trip per student, then one `updateMany` per student for the rank
 * pass. On the demo school (972 students × 36 classes) that is ~70,000
 * sequential round-trips — minutes to hours, far past any server-action or cron
 * timeout, which is why the demo had zero `ReportCardGrade` rows. Everything
 * below reads the whole cohort in a fixed handful of queries and writes in
 * chunks, so cost scales with rows, not with students × classes.
 *
 * Scores are grouped by (student, SUBJECT). Legacy rows reach a subject
 * through their class; rows written since classes were retired carry the term
 * and the subject themselves (exams set for a grade or section). Grouping by
 * class used to emit one row per class, so a student enrolled in two classes
 * of one subject lost one of them to the (reportCard, subject) unique key.
 *
 * NOTE: no `revalidatePath` here. The core runs outside a request scope (cron,
 * seed) where it would throw; the action wrapper revalidates.
 */
import type { Prisma } from "@prisma/client"

import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"

interface SubjectGradeData {
  subjectId: string
  score: number
  maxScore: number
  percentage: number
  grade: string
  credits: number
}

interface GradeBoundary {
  grade: string
  minScore: number
  maxScore: number
  gpa4?: number
  gpa5?: number
}

const DEFAULT_BOUNDARIES: GradeBoundary[] = [
  { grade: "A+", minScore: 97, maxScore: 100, gpa4: 4.0, gpa5: 5.0 },
  { grade: "A", minScore: 93, maxScore: 96, gpa4: 4.0, gpa5: 4.75 },
  { grade: "A-", minScore: 90, maxScore: 92, gpa4: 3.7, gpa5: 4.5 },
  { grade: "B+", minScore: 87, maxScore: 89, gpa4: 3.3, gpa5: 4.0 },
  { grade: "B", minScore: 83, maxScore: 86, gpa4: 3.0, gpa5: 3.75 },
  { grade: "B-", minScore: 80, maxScore: 82, gpa4: 2.7, gpa5: 3.5 },
  { grade: "C+", minScore: 77, maxScore: 79, gpa4: 2.3, gpa5: 3.0 },
  { grade: "C", minScore: 73, maxScore: 76, gpa4: 2.0, gpa5: 2.75 },
  { grade: "C-", minScore: 70, maxScore: 72, gpa4: 1.7, gpa5: 2.5 },
  { grade: "D+", minScore: 67, maxScore: 69, gpa4: 1.3, gpa5: 2.0 },
  { grade: "D", minScore: 60, maxScore: 66, gpa4: 1.0, gpa5: 1.5 },
  { grade: "F", minScore: 0, maxScore: 59, gpa4: 0, gpa5: 0 },
]

function percentageToGrade(
  pct: number,
  boundaries: GradeBoundary[]
): { grade: string; gpa: number } {
  const rounded = Math.round(pct)
  for (const b of boundaries) {
    if (rounded >= b.minScore && rounded <= b.maxScore) {
      return { grade: b.grade, gpa: b.gpa4 ?? 0 }
    }
  }
  return { grade: "F", gpa: 0 }
}

/** Row writes are batched; these bound one statement / one transaction. */
const WRITE_CHUNK = 200
const ROW_CHUNK = 5_000

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < items.length; i += size)
    out.push(items.slice(i, i + size))
  return out
}

export interface GenerateReportCardsInput {
  termId: string
  gradeId?: string
  sectionId?: string
  /** Legacy: only the students of one class. */
  classId?: string
}

export interface ComputedReportCard {
  studentId: string
  overallGrade: string
  gpa: number
  daysPresent: number
  daysAbsent: number
  daysLate: number
  yearLevelId: string | null
  subjectGrades: SubjectGradeData[]
}

/**
 * The aggregation without the writes — what `generateReportCardsCore` would
 * store for the term. `skipped` counts students with no score in any subject.
 */
export async function computeReportCards(
  schoolId: string,
  input: GenerateReportCardsInput
): Promise<
  | { ok: true; computed: ComputedReportCard[]; skipped: number }
  | { ok: false; error: string }
> {
  const term = await db.term.findFirst({
    where: { id: input.termId, schoolId },
    select: { id: true, startDate: true, endDate: true },
  })
  if (!term) return { ok: false, error: "Term not found" }

  const gradingConfig = await db.schoolGradingConfig.findUnique({
    where: { schoolId },
  })
  const boundaries = gradingConfig?.customBoundaries
    ? (gradingConfig.customBoundaries as unknown as GradeBoundary[])
    : DEFAULT_BOUNDARIES

  // ---- Scope --------------------------------------------------------
  // Legacy classes carry the term; newer rows carry it themselves. A school
  // with no classes simply has an empty legacy list.
  const classes = await db.class.findMany({
    where: {
      schoolId,
      termId: input.termId,
      ...(input.classId ? { id: input.classId } : {}),
    },
    select: { id: true, subjectId: true, credits: true },
  })
  const classIds = classes.map((c) => c.id)
  const classById = new Map(classes.map((c) => [c.id, c]))

  const studentWhere: Prisma.StudentWhereInput = { schoolId }
  if (input.classId) {
    studentWhere.studentClasses = { some: { classId: input.classId } }
  } else if (input.sectionId) {
    studentWhere.sectionId = input.sectionId
  } else if (input.gradeId) {
    studentWhere.OR = [
      { section: { gradeId: input.gradeId } },
      { sectionId: null, academicGradeId: input.gradeId },
    ]
  }

  const students = await db.student.findMany({
    where: studentWhere,
    select: {
      id: true,
      academicGradeId: true,
      section: { select: { gradeId: true } },
    },
  })
  if (students.length === 0) return { ok: true, computed: [], skipped: 0 }
  const studentIds = students.map((s) => s.id)
  // Only narrow by student when a filter is actually active — an unfiltered
  // run would otherwise ship every id in the school as an `IN` list.
  const filtered = !!(input.classId || input.sectionId || input.gradeId)
  const studentScope = filtered ? { studentId: { in: studentIds } } : {}

  // A score counts for the term when its legacy class is in the term, or
  // when the row (or its exam) names the term.
  const inTermResult: Prisma.ResultWhereInput = {
    OR: [
      ...(classIds.length > 0 ? [{ classId: { in: classIds } }] : []),
      { termId: input.termId },
    ],
  }
  const inTermExam: Prisma.SchoolExamWhereInput = {
    OR: [
      ...(classIds.length > 0 ? [{ classId: { in: classIds } }] : []),
      { termId: input.termId },
    ],
  }

  // ---- Reads (one query per source, whole cohort) --------------------
  const [examResults, gradebookResults, attendance, academic] =
    await Promise.all([
      db.examResult.findMany({
        where: { schoolId, exam: inTermExam, ...studentScope },
        select: {
          studentId: true,
          examId: true,
          marksObtained: true,
          totalMarks: true,
          exam: { select: { classId: true, subjectId: true } },
        },
      }),
      db.result.findMany({
        where: { schoolId, ...inTermResult, ...studentScope },
        select: {
          studentId: true,
          classId: true,
          subjectId: true,
          examId: true,
          score: true,
          maxScore: true,
        },
      }),
      db.attendance.groupBy({
        by: ["studentId", "status"],
        where: {
          schoolId,
          deletedAt: null,
          date: { gte: term.startDate, lte: term.endDate },
          ...studentScope,
        },
        _count: { status: true },
      }),
      db.academicGrade.findMany({
        where: { schoolId },
        select: { id: true, yearLevelId: true },
      }),
    ])

  const yearLevelByGrade = new Map(
    academic.map((a) => [a.id, a.yearLevelId ?? null])
  )
  const inCohort = new Set(studentIds)

  /**
   * A legacy row was earned in a class, so the class decides its subject —
   * seeded rows carry a `subjectId` that disagrees with their class's.
   * Rows without a class carry the subject themselves.
   */
  const subjectOf = (row: {
    subjectId: string | null
    classId: string | null
  }): string | null =>
    (row.classId ? classById.get(row.classId)?.subjectId : undefined) ??
    row.subjectId

  // Credits only exist on legacy classes; everything else weighs 1.
  const creditsBySubject = new Map<string, number>()
  for (const c of classes) {
    if (c.subjectId && c.credits) {
      creditsBySubject.set(
        c.subjectId,
        Math.max(creditsBySubject.get(c.subjectId) ?? 0, Number(c.credits))
      )
    }
  }

  const key = (studentId: string, subjectId: string) =>
    `${studentId}:${subjectId}`

  // Result rows win over ExamResult rows for the same exam — they may carry
  // richer weighting written by `upsertGradebookResult`. Collect the covered
  // exam ids per (student, subject) so each exam contributes exactly once.
  const scoresByPair = new Map<string, { score: number; maxScore: number }[]>()
  const subjectsByStudent = new Map<string, Set<string>>()
  const coveredExams = new Map<string, Set<string>>()

  const add = (
    studentId: string,
    subjectId: string,
    entry: { score: number; maxScore: number }
  ) => {
    const k = key(studentId, subjectId)
    const bucket = scoresByPair.get(k)
    if (bucket) bucket.push(entry)
    else scoresByPair.set(k, [entry])
    const subjects = subjectsByStudent.get(studentId) ?? new Set<string>()
    subjects.add(subjectId)
    subjectsByStudent.set(studentId, subjects)
  }

  for (const r of gradebookResults) {
    if (!inCohort.has(r.studentId)) continue
    const subjectId = subjectOf(r)
    if (!subjectId) continue
    add(r.studentId, subjectId, {
      score: Number(r.score),
      maxScore: Number(r.maxScore),
    })
    if (r.examId) {
      const k = key(r.studentId, subjectId)
      const seen = coveredExams.get(k)
      if (seen) seen.add(r.examId)
      else coveredExams.set(k, new Set([r.examId]))
    }
  }

  for (const er of examResults) {
    if (!inCohort.has(er.studentId) || !er.exam) continue
    const subjectId = subjectOf(er.exam)
    if (!subjectId) continue
    if (coveredExams.get(key(er.studentId, subjectId))?.has(er.examId)) {
      continue
    }
    add(er.studentId, subjectId, {
      score: er.marksObtained,
      maxScore: er.totalMarks || 100,
    })
  }

  const attendanceByStudent = new Map<
    string,
    { present: number; absent: number; late: number }
  >()
  for (const a of attendance) {
    const cur = attendanceByStudent.get(a.studentId) ?? {
      present: 0,
      absent: 0,
      late: 0,
    }
    const n = a._count.status
    if (a.status === "PRESENT") cur.present += n
    else if (a.status === "ABSENT") cur.absent += n
    else if (a.status === "LATE") cur.late += n
    attendanceByStudent.set(a.studentId, cur)
  }

  // ---- Aggregate ----------------------------------------------------
  const computed: ComputedReportCard[] = []
  let skipped = 0

  for (const student of students) {
    const subjectGrades: SubjectGradeData[] = []

    for (const subjectId of subjectsByStudent.get(student.id) ?? []) {
      const scores = scoresByPair.get(key(student.id, subjectId))
      if (!scores?.length) continue

      const totalScore = scores.reduce((sum, s) => sum + s.score, 0)
      const totalMax = scores.reduce((sum, s) => sum + s.maxScore, 0)
      const pct = totalMax > 0 ? (totalScore / totalMax) * 100 : 0
      const { grade } = percentageToGrade(pct, boundaries)

      subjectGrades.push({
        subjectId,
        score: totalScore,
        maxScore: totalMax,
        percentage: Math.round(pct * 100) / 100,
        grade,
        credits: creditsBySubject.get(subjectId) ?? 1,
      })
    }

    if (subjectGrades.length === 0) {
      skipped++
      continue
    }

    const totalCredits = subjectGrades.reduce((sum, sg) => sum + sg.credits, 0)
    const weightedGPA =
      totalCredits > 0
        ? subjectGrades.reduce((sum, sg) => {
            const { gpa } = percentageToGrade(sg.percentage, boundaries)
            return sum + gpa * sg.credits
          }, 0) / totalCredits
        : 0

    const overallPct =
      subjectGrades.reduce((sum, sg) => sum + sg.percentage, 0) /
      subjectGrades.length
    const { grade: overallGrade } = percentageToGrade(overallPct, boundaries)

    const att = attendanceByStudent.get(student.id)
    const gradeId = student.section?.gradeId ?? student.academicGradeId

    computed.push({
      studentId: student.id,
      overallGrade,
      gpa: weightedGPA,
      daysPresent: att?.present ?? 0,
      daysAbsent: att?.absent ?? 0,
      daysLate: att?.late ?? 0,
      yearLevelId: gradeId ? (yearLevelByGrade.get(gradeId) ?? null) : null,
      subjectGrades,
    })
  }

  return { ok: true, computed, skipped }
}

/**
 * Aggregate exam/gradebook results for a term into `ReportCard` +
 * `ReportCardGrade` rows (idempotent via the `schoolId_studentId_termId`
 * unique key). Does NOT publish — the admin reviews then publishes.
 */
export async function generateReportCardsCore(
  schoolId: string,
  input: GenerateReportCardsInput
): Promise<
  ActionResponse<{ created: number; updated: number; skipped: number }>
> {
  try {
    const result = await computeReportCards(schoolId, input)
    if (!result.ok) return { success: false, error: result.error }
    const { computed, skipped } = result

    if (computed.length === 0) {
      return { success: true, data: { created: 0, updated: 0, skipped } }
    }

    // Rank is resolved here, in memory, so it rides along on the same write
    // that carries the grade — the old code did one `updateMany` per student.
    const ranked = [...computed].sort((a, b) => b.gpa - a.gpa)
    const totalStudents = ranked.length
    const rankByStudent = new Map(ranked.map((c, i) => [c.studentId, i + 1]))

    // ---- Writes -------------------------------------------------------
    const existing = await db.reportCard.findMany({
      where: {
        schoolId,
        termId: input.termId,
        studentId: { in: computed.map((c) => c.studentId) },
      },
      select: { id: true, studentId: true },
    })
    const existingByStudent = new Map(existing.map((e) => [e.studentId, e.id]))

    const cardData = (c: ComputedReportCard) => ({
      overallGrade: c.overallGrade,
      overallGPA: Math.round(c.gpa * 100) / 100,
      rank: rankByStudent.get(c.studentId) ?? null,
      totalStudents,
      daysPresent: c.daysPresent,
      daysAbsent: c.daysAbsent,
      daysLate: c.daysLate,
      yearLevelId: c.yearLevelId ?? undefined,
    })

    const toCreate = computed.filter((c) => !existingByStudent.has(c.studentId))
    const toUpdate = computed.filter((c) => existingByStudent.has(c.studentId))

    for (const batch of chunk(toCreate, WRITE_CHUNK)) {
      await db.reportCard.createMany({
        data: batch.map((c) => ({
          schoolId,
          studentId: c.studentId,
          termId: input.termId,
          ...cardData(c),
        })),
        skipDuplicates: true,
      })
    }

    for (const batch of chunk(toUpdate, WRITE_CHUNK)) {
      await db.$transaction(
        batch.map((c) =>
          db.reportCard.update({
            where: { id: existingByStudent.get(c.studentId)! },
            data: cardData(c),
          })
        )
      )
    }

    // Re-read so the newly created rows contribute their ids to the grade
    // write below.
    const allCards = await db.reportCard.findMany({
      where: {
        schoolId,
        termId: input.termId,
        studentId: { in: computed.map((c) => c.studentId) },
      },
      select: { id: true, studentId: true },
    })
    const cardIdByStudent = new Map(allCards.map((c) => [c.studentId, c.id]))

    for (const batch of chunk(
      allCards.map((c) => c.id),
      WRITE_CHUNK
    )) {
      await db.reportCardGrade.deleteMany({
        where: { schoolId, reportCardId: { in: batch } },
      })
    }

    const gradeRows = computed.flatMap((c) => {
      const reportCardId = cardIdByStudent.get(c.studentId)
      if (!reportCardId) return []
      return c.subjectGrades.map((sg) => ({
        schoolId,
        reportCardId,
        subjectId: sg.subjectId,
        grade: sg.grade,
        score: sg.score,
        maxScore: sg.maxScore,
        percentage: sg.percentage,
        credits: sg.credits,
      }))
    })

    for (const batch of chunk(gradeRows, ROW_CHUNK)) {
      await db.reportCardGrade.createMany({ data: batch, skipDuplicates: true })
    }

    return {
      success: true,
      data: { created: toCreate.length, updated: toUpdate.length, skipped },
    }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to generate report cards",
    }
  }
}
