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
 * NOTE: no `revalidatePath` here. The core runs outside a request scope (cron,
 * seed) where it would throw; the action wrapper revalidates.
 */
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
  classId?: string
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
    const term = await db.term.findFirst({
      where: { id: input.termId, schoolId },
      select: { id: true, startDate: true, endDate: true },
    })
    if (!term) {
      return { success: false, error: "Term not found" }
    }

    const gradingConfig = await db.schoolGradingConfig.findUnique({
      where: { schoolId },
    })
    const boundaries = gradingConfig?.customBoundaries
      ? (gradingConfig.customBoundaries as unknown as GradeBoundary[])
      : DEFAULT_BOUNDARIES

    // ---- Scope --------------------------------------------------------
    // Classes carry the term, so they are the tightest handle on "what
    // counts this term". Everything else hangs off this id list.
    const classes = await db.class.findMany({
      where: {
        schoolId,
        termId: input.termId,
        ...(input.classId ? { id: input.classId } : {}),
      },
      select: { id: true, subjectId: true, credits: true },
    })
    if (classes.length === 0) {
      return { success: true, data: { created: 0, updated: 0, skipped: 0 } }
    }
    const classIds = classes.map((c) => c.id)
    const classById = new Map(classes.map((c) => [c.id, c]))

    const studentWhere: Record<string, unknown> = { schoolId }
    if (input.classId) {
      studentWhere.studentClasses = { some: { classId: input.classId } }
    } else if (input.gradeId) {
      studentWhere.academicGradeId = input.gradeId
    }

    const students = await db.student.findMany({
      where: studentWhere,
      select: { id: true, academicGradeId: true },
    })
    if (students.length === 0) {
      return { success: true, data: { created: 0, updated: 0, skipped: 0 } }
    }
    const studentIds = students.map((s) => s.id)
    // Only narrow by student when a filter is actually active — an unfiltered
    // run would otherwise ship every id in the school as an `IN` list.
    const studentScope =
      input.classId || input.gradeId ? { studentId: { in: studentIds } } : {}

    // ---- Reads (one query per source, whole cohort) --------------------
    const [enrollments, examResults, gradebookResults, attendance, academic] =
      await Promise.all([
        db.studentClass.findMany({
          where: { schoolId, classId: { in: classIds }, ...studentScope },
          select: { studentId: true, classId: true },
        }),
        db.examResult.findMany({
          where: {
            schoolId,
            exam: { classId: { in: classIds } },
            ...studentScope,
          },
          select: {
            studentId: true,
            examId: true,
            marksObtained: true,
            totalMarks: true,
            exam: { select: { classId: true } },
          },
        }),
        db.result.findMany({
          where: { schoolId, classId: { in: classIds }, ...studentScope },
          select: {
            studentId: true,
            classId: true,
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

    const key = (studentId: string, classId: string) =>
      `${studentId}:${classId}`

    // Result rows win over ExamResult rows for the same exam — they may carry
    // richer weighting written by `upsertGradebookResult`. Collect the covered
    // exam ids per (student, class) so each exam contributes exactly once.
    const scoresByPair = new Map<
      string,
      { score: number; maxScore: number }[]
    >()
    const coveredExams = new Map<string, Set<string>>()

    for (const r of gradebookResults) {
      const k = key(r.studentId, r.classId)
      const bucket = scoresByPair.get(k)
      const entry = { score: Number(r.score), maxScore: Number(r.maxScore) }
      if (bucket) bucket.push(entry)
      else scoresByPair.set(k, [entry])
      if (r.examId) {
        const seen = coveredExams.get(k)
        if (seen) seen.add(r.examId)
        else coveredExams.set(k, new Set([r.examId]))
      }
    }

    for (const er of examResults) {
      const classId = er.exam?.classId
      if (!classId) continue
      const k = key(er.studentId, classId)
      if (coveredExams.get(k)?.has(er.examId)) continue
      const entry = {
        score: er.marksObtained,
        maxScore: er.totalMarks || 100,
      }
      const bucket = scoresByPair.get(k)
      if (bucket) bucket.push(entry)
      else scoresByPair.set(k, [entry])
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

    const classesByStudent = new Map<string, string[]>()
    for (const e of enrollments) {
      const list = classesByStudent.get(e.studentId)
      if (list) list.push(e.classId)
      else classesByStudent.set(e.studentId, [e.classId])
    }

    // ---- Aggregate ----------------------------------------------------
    interface Computed {
      studentId: string
      overallGrade: string
      gpa: number
      daysPresent: number
      daysAbsent: number
      daysLate: number
      yearLevelId: string | null
      subjectGrades: SubjectGradeData[]
    }

    const computed: Computed[] = []
    let skipped = 0

    for (const student of students) {
      const subjectGrades: SubjectGradeData[] = []

      for (const classId of classesByStudent.get(student.id) ?? []) {
        const cls = classById.get(classId)
        if (!cls?.subjectId) continue

        const scores = scoresByPair.get(key(student.id, classId))
        if (!scores?.length) continue

        const totalScore = scores.reduce((sum, s) => sum + s.score, 0)
        const totalMax = scores.reduce((sum, s) => sum + s.maxScore, 0)
        const pct = totalMax > 0 ? (totalScore / totalMax) * 100 : 0
        const { grade } = percentageToGrade(pct, boundaries)

        subjectGrades.push({
          subjectId: cls.subjectId,
          score: totalScore,
          maxScore: totalMax,
          percentage: Math.round(pct * 100) / 100,
          grade,
          credits: cls.credits ? Number(cls.credits) : 1,
        })
      }

      if (subjectGrades.length === 0) {
        skipped++
        continue
      }

      const totalCredits = subjectGrades.reduce(
        (sum, sg) => sum + sg.credits,
        0
      )
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

      computed.push({
        studentId: student.id,
        overallGrade,
        gpa: weightedGPA,
        daysPresent: att?.present ?? 0,
        daysAbsent: att?.absent ?? 0,
        daysLate: att?.late ?? 0,
        yearLevelId: student.academicGradeId
          ? (yearLevelByGrade.get(student.academicGradeId) ?? null)
          : null,
        subjectGrades,
      })
    }

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

    const cardData = (c: Computed) => ({
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
