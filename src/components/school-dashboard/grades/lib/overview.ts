// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import "server-only"

import type { Prisma } from "@prisma/client"

import { db } from "@/lib/db"

/** A score under this percentage puts a student on the "needs attention" list. */
export const AT_RISK_BELOW = 50

export type OverviewTerm = {
  id: string
  termNumber: number
  startDate: Date
  endDate: Date
  yearName: string | null
}

/**
 * The terms a school can look at, newest first, and the one to show: the
 * requested term, else the active one, else the newest.
 */
export async function getOverviewTerms(schoolId: string, termId?: string) {
  const rows = await db.term.findMany({
    where: { schoolId },
    select: {
      id: true,
      termNumber: true,
      startDate: true,
      endDate: true,
      isActive: true,
      schoolYear: { select: { yearName: true } },
    },
    orderBy: [{ startDate: "desc" }],
    take: 8,
  })
  const terms: OverviewTerm[] = rows.map((t) => ({
    id: t.id,
    termNumber: t.termNumber,
    startDate: t.startDate,
    endDate: t.endDate,
    yearName: t.schoolYear?.yearName ?? null,
  }))
  const current =
    (termId && terms.find((t) => t.id === termId)) ||
    terms.find((t) => rows.find((r) => r.id === t.id)?.isActive) ||
    terms[0] ||
    null
  return { terms, current }
}

/**
 * Rows from before scoping carry no `termId`; they belong to the term whose
 * dates they fall in. Every overview read uses this so a school that graded
 * before the term column existed still sees its numbers.
 */
function inTerm(term: OverviewTerm, dateField: string) {
  return {
    OR: [
      { termId: term.id },
      {
        termId: null,
        [dateField]: { gte: term.startDate, lte: term.endDate },
      },
    ],
  }
}

/**
 * Everything the grades hub shows for one term, in one parallel round:
 * what is still to collect, how the term is going, and how far report
 * cards and certificates have got. Set-based reads only — no per-student loop.
 */
export async function getGradesOverview(schoolId: string, term: OverviewTerm) {
  const now = new Date()
  const resultWhere: Prisma.ResultWhereInput = {
    schoolId,
    wizardStep: null,
    ...inTerm(term, "gradedAt"),
  }

  const [
    summary,
    distribution,
    perStudent,
    examsAwaiting,
    submissionsToGrade,
    cards,
    certificates,
    activeStudents,
  ] = await Promise.all([
    db.result.aggregate({
      where: resultWhere,
      _avg: { percentage: true },
      _count: { _all: true },
    }),
    db.result.groupBy({
      by: ["grade"],
      where: resultWhere,
      _count: { _all: true },
    }),
    db.result.groupBy({
      by: ["studentId"],
      where: resultWhere,
      _avg: { percentage: true },
    }),
    // Sat, not cancelled, and not a single mark recorded anywhere.
    db.schoolExam.count({
      where: {
        schoolId,
        wizardStep: null,
        examDate: { lt: now },
        status: { not: "CANCELLED" },
        examResults: { none: {} },
        results: { none: {} },
        ...inTerm(term, "examDate"),
      },
    }),
    db.assignmentSubmission.count({
      where: {
        schoolId,
        status: { in: ["SUBMITTED", "LATE_SUBMITTED"] },
        assignment: inTerm(term, "dueDate"),
      },
    }),
    db.reportCard.groupBy({
      by: ["isPublished"],
      where: { schoolId, termId: term.id },
      _count: { _all: true },
    }),
    db.examCertificate.count({
      where: {
        schoolId,
        examResult: { exam: inTerm(term, "examDate") },
      },
    }),
    db.student.count({ where: { schoolId } }),
  ])

  const graded = perStudent.length
  const atRiskRows = perStudent
    .filter((s) => (s._avg.percentage ?? 0) < AT_RISK_BELOW)
    .sort((a, b) => (a._avg.percentage ?? 0) - (b._avg.percentage ?? 0))

  const atRiskStudents = atRiskRows.length
    ? await db.student.findMany({
        where: {
          schoolId,
          id: { in: atRiskRows.slice(0, 5).map((s) => s.studentId) },
        },
        select: { id: true, firstName: true, middleName: true, lastName: true },
      })
    : []

  const published = cards.find((c) => c.isPublished)?._count._all ?? 0
  const drafts = cards.find((c) => !c.isPublished)?._count._all ?? 0

  return {
    results: summary._count._all,
    average: summary._avg.percentage,
    distribution: Object.fromEntries(
      distribution.map((d) => [d.grade, d._count._all])
    ) as Record<string, number>,
    gradedStudents: graded,
    activeStudents,
    atRisk: {
      count: atRiskRows.length,
      students: atRiskRows.slice(0, 5).flatMap((row) => {
        const s = atRiskStudents.find((st) => st.id === row.studentId)
        return s ? [{ ...s, average: row._avg.percentage ?? 0 }] : []
      }),
    },
    collect: { examsAwaiting, submissionsToGrade },
    reportCards: { total: published + drafts, published, drafts },
    certificates,
  }
}

export type GradesOverview = Awaited<ReturnType<typeof getGradesOverview>>

/**
 * A student's or guardian's own view: per child, the subject averages for
 * the term, and the report cards and certificates that are theirs to keep.
 */
export async function getSelfOverview(
  schoolId: string,
  studentIds: string[],
  term: OverviewTerm | null
) {
  if (studentIds.length === 0) return []
  const [students, subjectAverages, reportCards, certificates] =
    await Promise.all([
      db.student.findMany({
        where: { schoolId, id: { in: studentIds } },
        select: { id: true, firstName: true, middleName: true, lastName: true },
      }),
      db.result.groupBy({
        by: ["studentId", "subjectId"],
        where: {
          schoolId,
          wizardStep: null,
          studentId: { in: studentIds },
          ...(term ? inTerm(term, "gradedAt") : {}),
        },
        _avg: { percentage: true },
        _count: { _all: true },
      }),
      db.reportCard.findMany({
        where: { schoolId, studentId: { in: studentIds }, isPublished: true },
        select: {
          id: true,
          studentId: true,
          overallGrade: true,
          overallGPA: true,
          pdfUrl: true,
          term: {
            select: {
              termNumber: true,
              schoolYear: { select: { yearName: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 12,
      }),
      db.examCertificate.findMany({
        where: {
          schoolId,
          studentId: { in: studentIds },
          status: "active",
        },
        select: {
          id: true,
          studentId: true,
          pdfUrl: true,
          grade: true,
          issuedAt: true,
          examResult: { select: { exam: { select: { title: true } } } },
        },
        orderBy: { issuedAt: "desc" },
        take: 12,
      }),
    ])

  const subjectIds = [
    ...new Set(
      subjectAverages.flatMap((s) => (s.subjectId ? [s.subjectId] : []))
    ),
  ]
  const subjects = subjectIds.length
    ? await db.subject.findMany({
        // Subjects are the shared catalog — not school-scoped.
        where: { id: { in: subjectIds } },
        select: { id: true, name: true },
      })
    : []
  const subjectName = new Map(subjects.map((s) => [s.id, s.name]))

  return students.map((student) => ({
    student,
    subjects: subjectAverages
      .filter((s) => s.studentId === student.id && s.subjectId)
      .map((s) => ({
        id: s.subjectId as string,
        name: subjectName.get(s.subjectId as string) ?? "",
        average: s._avg.percentage ?? 0,
        count: s._count._all,
      }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    reportCards: reportCards
      .filter((r) => r.studentId === student.id)
      .map((r) => ({
        id: r.id,
        grade: r.overallGrade,
        gpa: r.overallGPA == null ? null : Number(r.overallGPA),
        pdfUrl: r.pdfUrl,
        termNumber: r.term?.termNumber ?? null,
        yearName: r.term?.schoolYear?.yearName ?? null,
      })),
    certificates: certificates
      .filter((c) => c.studentId === student.id)
      .map((c) => ({
        id: c.id,
        pdfUrl: c.pdfUrl,
        grade: c.grade,
        issuedAt: c.issuedAt,
        title: c.examResult?.exam?.title ?? "",
      })),
  }))
}

export type SelfOverview = Awaited<ReturnType<typeof getSelfOverview>>
