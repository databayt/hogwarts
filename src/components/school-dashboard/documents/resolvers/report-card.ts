// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { db } from "@/lib/db"

import { formatDate, type ResolverCtx } from "./util"

/**
 * REPORT_CARD resolver — a `ReportCard` id → student/term metadata + a
 * `subjects` loop. The school's `.docx` renders the grade table body with
 * `{#subjects}{name}: {grade} ({percentage}%){/subjects}` and the header with
 * `{{studentName}}`, `{{className}}`, `{{termName}}`, `{{overallGrade}}`,
 * `{{gpa}}`, `{{rank}}`.
 */
export async function resolveReportCardData(
  reportCardId: string,
  ctx: ResolverCtx
): Promise<Record<string, unknown>> {
  const rc = await db.reportCard.findFirst({
    where: { id: reportCardId, schoolId: ctx.schoolId },
    select: {
      overallGrade: true,
      overallGPA: true,
      rank: true,
      totalStudents: true,
      createdAt: true,
      student: {
        select: {
          firstName: true,
          lastName: true,
          academicGrade: { select: { name: true } },
        },
      },
      term: { select: { termNumber: true } },
      grades: {
        orderBy: { subject: { name: "asc" } },
        select: {
          grade: true,
          percentage: true,
          subject: { select: { name: true } },
        },
      },
    },
  })
  if (!rc) throw new Error("Report card not found")

  const school = await db.school.findUnique({
    where: { id: ctx.schoolId },
    select: { name: true, nameEn: true, logoUrl: true },
  })

  const studentName = [rc.student.firstName, rc.student.lastName]
    .filter(Boolean)
    .join(" ")

  const termName =
    rc.term?.termNumber != null
      ? ctx.lang === "ar"
        ? `الفصل ${rc.term.termNumber}`
        : `Term ${rc.term.termNumber}`
      : ""

  const rank =
    rc.rank != null
      ? rc.totalStudents != null
        ? `${rc.rank} / ${rc.totalStudents}`
        : String(rc.rank)
      : ""

  const subjects = rc.grades.map((g) => ({
    name: g.subject?.name ?? "",
    grade: g.grade,
    percentage: g.percentage != null ? Math.round(g.percentage) : "",
  }))

  return {
    studentName,
    className: rc.student.academicGrade?.name ?? "",
    termName,
    overallGrade: rc.overallGrade ?? "",
    gpa: rc.overallGPA != null ? Number(rc.overallGPA).toFixed(2) : "",
    rank,
    date: formatDate(rc.createdAt, ctx.lang),
    schoolName: school?.name ?? "",
    schoolNameEn: school?.nameEn ?? school?.name ?? "",
    schoolLogo: school?.logoUrl ?? "",
    subjects,
  }
}
