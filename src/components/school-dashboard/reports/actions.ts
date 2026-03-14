"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Report Card Server Actions
 * Generate, fetch, and manage student report cards
 */
import React from "react"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { renderToBuffer } from "@react-pdf/renderer"

import { db } from "@/lib/db"
import { ReportCardTemplate } from "@/components/file/generate/report-card"
import type {
  ReportCardData,
  ReportCardSubject,
} from "@/components/file/generate/types"
import { getProvider } from "@/components/file/providers/factory"

type ActionResponse<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string }

// Default grade scale when no school boundaries are configured
const DEFAULT_BOUNDARIES = [
  { min: 90, grade: "A+", gpa: 4.0 },
  { min: 85, grade: "A", gpa: 3.7 },
  { min: 80, grade: "B+", gpa: 3.3 },
  { min: 75, grade: "B", gpa: 3.0 },
  { min: 70, grade: "C+", gpa: 2.7 },
  { min: 65, grade: "C", gpa: 2.3 },
  { min: 60, grade: "D+", gpa: 2.0 },
  { min: 50, grade: "D", gpa: 1.0 },
  { min: 0, grade: "F", gpa: 0 },
]

function gradeFromPercentage(pct: number): { grade: string; gpa: number } {
  for (const b of DEFAULT_BOUNDARIES) {
    if (pct >= b.min) return { grade: b.grade, gpa: b.gpa }
  }
  return { grade: "F", gpa: 0 }
}

/**
 * Generate report cards for students in a class for a specific term
 */
export async function generateReportCards(input: {
  termId: string
  classId?: string
  studentIds?: string[]
}): Promise<ActionResponse<{ generated: number; reportCardIds: string[] }>> {
  try {
    const session = await auth()
    const schoolId = session?.user?.schoolId
    if (!schoolId) {
      return { success: false, error: "Unauthorized" }
    }

    // Fetch term info
    const term = await db.term.findFirst({
      where: { id: input.termId, schoolId },
      include: { schoolYear: true },
    })
    if (!term) {
      return { success: false, error: "Term not found" }
    }

    // Get exams for this term (Exam has no termId — filter through Class.termId)
    const examWhere = {
      schoolId,
      class: { termId: input.termId },
      ...(input.classId ? { classId: input.classId } : {}),
    }

    const exams = await db.exam.findMany({
      where: examWhere,
      select: { id: true, classId: true, subjectId: true },
    })

    if (exams.length === 0) {
      return { success: false, error: "No exams found for this term" }
    }

    const examIds = exams.map((e) => e.id)

    // Get all results for these exams
    const resultWhere: {
      schoolId: string
      examId: { in: string[] }
      isAbsent: boolean
      studentId?: { in: string[] }
    } = {
      schoolId,
      examId: { in: examIds },
      isAbsent: false,
    }
    if (input.studentIds) {
      resultWhere.studentId = { in: input.studentIds }
    }

    const results = await db.examResult.findMany({
      where: resultWhere,
      include: {
        exam: {
          select: {
            subjectId: true,
            subject: { select: { id: true, subjectName: true } },
            classId: true,
            class: { select: { name: true } },
          },
        },
        student: {
          select: {
            id: true,
            givenName: true,
            surname: true,
            studentId: true,
          },
        },
      },
    })

    if (results.length === 0) {
      return { success: false, error: "No exam results found for this term" }
    }

    // Group results by student
    const byStudent = new Map<string, typeof results>()
    for (const r of results) {
      const existing = byStudent.get(r.studentId) ?? []
      existing.push(r)
      byStudent.set(r.studentId, existing)
    }

    // Fetch school info
    const school = await db.school.findUnique({
      where: { id: schoolId },
      select: {
        name: true,
        logoUrl: true,
        address: true,
        phoneNumber: true,
        email: true,
        preferredLanguage: true,
      },
    })

    const reportCardIds: string[] = []

    // Process each student
    for (const [studentId, studentResults] of byStudent) {
      const student = studentResults[0].student

      // Aggregate by subject
      const subjectMap = new Map<
        string,
        {
          subjectName: string
          totalMarks: number
          marksObtained: number
          count: number
        }
      >()

      for (const r of studentResults) {
        const subId = r.exam.subjectId
        const existing = subjectMap.get(subId) ?? {
          subjectName: r.exam.subject.subjectName,
          totalMarks: 0,
          marksObtained: 0,
          count: 0,
        }
        existing.totalMarks += r.totalMarks
        existing.marksObtained += r.marksObtained
        existing.count++
        subjectMap.set(subId, existing)
      }

      // Build grades
      const grades: Array<{
        subjectId: string
        subjectName: string
        score: number
        maxScore: number
        percentage: number
        grade: string
        gpa: number
      }> = []

      let totalScore = 0
      let totalMax = 0

      for (const [subId, data] of subjectMap) {
        const pct =
          data.totalMarks > 0 ? (data.marksObtained / data.totalMarks) * 100 : 0
        const { grade, gpa } = gradeFromPercentage(pct)
        grades.push({
          subjectId: subId,
          subjectName: data.subjectName,
          score: data.marksObtained,
          maxScore: data.totalMarks,
          percentage: Math.round(pct * 100) / 100,
          grade,
          gpa,
        })
        totalScore += data.marksObtained
        totalMax += data.totalMarks
      }

      const overallPct = totalMax > 0 ? (totalScore / totalMax) * 100 : 0
      const overall = gradeFromPercentage(overallPct)

      // Upsert ReportCard
      const reportCard = await db.reportCard.upsert({
        where: {
          schoolId_studentId_termId: {
            schoolId,
            studentId,
            termId: input.termId,
          },
        },
        create: {
          schoolId,
          studentId,
          termId: input.termId,
          overallGrade: overall.grade,
          overallGPA: overall.gpa,
        },
        update: {
          overallGrade: overall.grade,
          overallGPA: overall.gpa,
        },
      })

      // Upsert grades
      for (const g of grades) {
        await db.reportCardGrade.upsert({
          where: {
            reportCardId_subjectId: {
              reportCardId: reportCard.id,
              subjectId: g.subjectId,
            },
          },
          create: {
            schoolId,
            reportCardId: reportCard.id,
            subjectId: g.subjectId,
            grade: g.grade,
            score: g.score,
            maxScore: g.maxScore,
            percentage: g.percentage,
          },
          update: {
            grade: g.grade,
            score: g.score,
            maxScore: g.maxScore,
            percentage: g.percentage,
          },
        })
      }

      // Generate PDF
      const locale = (school?.preferredLanguage === "en" ? "en" : "ar") as
        | "en"
        | "ar"
      const className = studentResults[0].exam.class?.name ?? ""

      const subjects: ReportCardSubject[] = grades.map((g) => ({
        name: g.subjectName,
        grade: g.grade,
        score: g.score,
        maxScore: g.maxScore,
        percentage: g.percentage,
      }))

      const reportCardData: ReportCardData = {
        schoolName: school?.name ?? "",
        schoolLogo: school?.logoUrl ?? undefined,
        schoolAddress: school?.address ?? undefined,
        schoolPhone: school?.phoneNumber ?? undefined,
        schoolEmail: school?.email ?? undefined,
        issueDate: new Date(),
        locale,
        studentName: `${student.givenName} ${student.surname}`,
        studentId: student.studentId ?? student.id,
        studentPhoto: undefined,
        className,
        yearLevel: "",
        termName: `Term ${term.termNumber}`,
        academicYear: term.schoolYear.yearName,
        subjects,
        overallGrade: overall.grade,
        overallPercentage: Math.round(overallPct * 100) / 100,
        gpa: overall.gpa,
        rank: undefined,
        totalStudents: byStudent.size,
      }

      try {
        const doc = React.createElement(ReportCardTemplate, {
          data: reportCardData,
        })

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const buffer = await renderToBuffer(doc as any)

        const studentName = `${student.givenName}-${student.surname}`.replace(
          /[^a-zA-Z0-9-_]/g,
          "-"
        )
        const filename = `report-cards/${schoolId}/term-${term.termNumber}/${studentName}-${Date.now()}.pdf`

        const provider = getProvider("aws_s3")
        const pdfBlob = new Blob([buffer], { type: "application/pdf" })
        const pdfUrl = await provider.upload(pdfBlob, filename, {
          contentType: "application/pdf",
          access: "public",
        })

        await db.reportCard.update({
          where: { id: reportCard.id },
          data: { pdfUrl },
        })
      } catch (pdfError) {
        console.error(
          `PDF generation failed for student ${studentId}:`,
          pdfError
        )
      }

      reportCardIds.push(reportCard.id)
    }

    revalidatePath("/exams/report-cards")

    return {
      success: true,
      data: { generated: reportCardIds.length, reportCardIds },
    }
  } catch (error) {
    console.error("Report card generation error:", error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to generate report cards",
    }
  }
}

/**
 * Publish report cards (make visible to students/guardians)
 */
export async function publishReportCards(input: {
  reportCardIds: string[]
}): Promise<ActionResponse> {
  try {
    const session = await auth()
    const schoolId = session?.user?.schoolId
    if (!schoolId) return { success: false, error: "Unauthorized" }

    await db.reportCard.updateMany({
      where: {
        id: { in: input.reportCardIds },
        schoolId,
      },
      data: {
        isPublished: true,
        publishedAt: new Date(),
      },
    })

    revalidatePath("/exams/report-cards")
    return { success: true }
  } catch (error) {
    console.error("Publish error:", error)
    return { success: false, error: "Failed to publish report cards" }
  }
}

/**
 * Update report card comments
 */
export async function updateReportCardComments(input: {
  reportCardId: string
  teacherComments?: string
  principalComments?: string
}): Promise<ActionResponse> {
  try {
    const session = await auth()
    const schoolId = session?.user?.schoolId
    if (!schoolId) return { success: false, error: "Unauthorized" }

    await db.reportCard.update({
      where: { id: input.reportCardId, schoolId },
      data: {
        ...(input.teacherComments !== undefined
          ? { teacherComments: input.teacherComments }
          : {}),
        ...(input.principalComments !== undefined
          ? { principalComments: input.principalComments }
          : {}),
      },
    })

    revalidatePath("/exams/report-cards")
    return { success: true }
  } catch (error) {
    console.error("Update comments error:", error)
    return { success: false, error: "Failed to update comments" }
  }
}

/**
 * Get report cards for a term (admin/teacher view)
 */
export async function getReportCards(input: {
  termId: string
  classId?: string
}): Promise<
  ActionResponse<
    Array<{
      id: string
      studentName: string
      studentId: string
      overallGrade: string | null
      overallGPA: number | null
      isPublished: boolean
      pdfUrl: string | null
      gradesCount: number
    }>
  >
> {
  try {
    const session = await auth()
    const schoolId = session?.user?.schoolId
    if (!schoolId) return { success: false, error: "Unauthorized" }

    const reportCards = await db.reportCard.findMany({
      where: {
        schoolId,
        termId: input.termId,
      },
      include: {
        student: {
          select: {
            givenName: true,
            surname: true,
            studentId: true,
          },
        },
        grades: { select: { id: true } },
      },
      orderBy: { student: { givenName: "asc" } },
    })

    const data = reportCards.map((rc) => ({
      id: rc.id,
      studentName: `${rc.student.givenName} ${rc.student.surname}`,
      studentId: rc.student.studentId ?? "",
      overallGrade: rc.overallGrade,
      overallGPA: rc.overallGPA ? Number(rc.overallGPA) : null,
      isPublished: rc.isPublished,
      pdfUrl: rc.pdfUrl,
      gradesCount: rc.grades.length,
    }))

    return { success: true, data }
  } catch (error) {
    console.error("Get report cards error:", error)
    return { success: false, error: "Failed to fetch report cards" }
  }
}
