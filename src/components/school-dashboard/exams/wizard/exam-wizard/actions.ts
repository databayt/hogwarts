"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import type { ExamType } from "@prisma/client"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

interface CreateExamFromWizardInput {
  // Template
  templateId: string

  // Exam - existing or new
  examMode: "existing" | "new"
  existingExamId?: string

  // New exam fields
  newExamTitle?: string
  newExamClassId?: string
  newExamSubjectId?: string
  newExamDate?: string
  newExamStartTime?: string
  newExamDuration?: number
  newExamTotalMarks?: number
  newExamPassingMarks?: number

  // Questions
  questionIds: string[]

  // Paper config
  paperTemplate?: "CLASSIC" | "MODERN" | "FORMAL" | "CUSTOM"
  pageSize?: "A4" | "Letter"
  shuffleQuestions?: boolean
  shuffleOptions?: boolean
  versionCount?: number
  showSchoolLogo?: boolean
  showInstructions?: boolean
  showPointsPerQuestion?: boolean
}

export async function createExamFromWizard(
  input: CreateExamFromWizardInput
): Promise<{ success: boolean; error?: string; generatedExamId?: string }> {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: "Not authenticated" }
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const role = session.user.role
    if (
      !role ||
      ["STUDENT", "GUARDIAN", "ACCOUNTANT", "STAFF"].includes(role)
    ) {
      return { success: false, error: "Unauthorized" }
    }

    if (!input.templateId || input.questionIds.length === 0) {
      return {
        success: false,
        error: "Template and questions are required",
      }
    }

    // Verify template belongs to school
    const template = await db.examTemplate.findUnique({
      where: { id: input.templateId, schoolId },
    })
    if (!template) {
      return { success: false, error: "Template not found" }
    }

    // Verify all questions belong to school
    const questionCount = await db.questionBank.count({
      where: {
        id: { in: input.questionIds },
        schoolId,
      },
    })
    if (questionCount !== input.questionIds.length) {
      return { success: false, error: "Some questions not found" }
    }

    let examId: string

    if (input.examMode === "existing" && input.existingExamId) {
      // Use existing exam
      const exam = await db.exam.findUnique({
        where: { id: input.existingExamId, schoolId },
      })
      if (!exam) {
        return { success: false, error: "Exam not found" }
      }
      examId = exam.id
    } else {
      // Create new exam
      if (!input.newExamTitle || !input.newExamClassId || !input.newExamDate) {
        return {
          success: false,
          error: "Title, class, and date are required for new exam",
        }
      }

      // Get subject from template
      const subjectId = input.newExamSubjectId || template.subjectId

      const newExam = await db.exam.create({
        data: {
          schoolId,
          title: input.newExamTitle,
          classId: input.newExamClassId,
          subjectId,
          examDate: new Date(input.newExamDate),
          startTime: input.newExamStartTime || "09:00",
          endTime: calculateEndTime(
            input.newExamStartTime || "09:00",
            input.newExamDuration || template.duration
          ),
          duration: input.newExamDuration || template.duration,
          totalMarks: input.newExamTotalMarks || Number(template.totalMarks),
          passingMarks:
            input.newExamPassingMarks ||
            Math.ceil(Number(template.totalMarks) * 0.5),
          examType: "MIDTERM" as ExamType,
          status: "PLANNED",
        },
      })
      examId = newExam.id
    }

    // Fetch question details for points
    const questions = await db.questionBank.findMany({
      where: {
        id: { in: input.questionIds },
        schoolId,
      },
      select: { id: true, points: true },
    })

    const pointsMap = new Map(questions.map((q) => [q.id, Number(q.points)]))

    // Create GeneratedExam + questions in transaction
    const generatedExam = await db.$transaction(async (tx) => {
      const ge = await tx.generatedExam.create({
        data: {
          schoolId,
          examId,
          templateId: input.templateId,
          isRandomized: input.shuffleQuestions ?? true,
          totalQuestions: input.questionIds.length,
          generatedBy: session.user.id!,
          generationNotes: `Generated via wizard from template: ${template.name}`,
        },
      })

      // Create question associations
      await tx.generatedExamQuestion.createMany({
        data: input.questionIds.map((qId, idx) => ({
          schoolId,
          generatedExamId: ge.id,
          questionId: qId,
          order: idx + 1,
          points: pointsMap.get(qId) ?? 1,
        })),
      })

      // Create paper config
      await tx.examPaperConfig.create({
        data: {
          schoolId,
          generatedExamId: ge.id,
          template: input.paperTemplate ?? "CLASSIC",
          pageSize: input.pageSize ?? "A4",
          shuffleQuestions: input.shuffleQuestions ?? true,
          shuffleOptions: input.shuffleOptions ?? true,
          versionCount: input.versionCount ?? 1,
          showSchoolLogo: input.showSchoolLogo ?? true,
          showInstructions: input.showInstructions ?? true,
          showPointsPerQuestion: input.showPointsPerQuestion ?? true,
        },
      })

      return ge
    })

    revalidatePath("/exams/generate")
    revalidatePath("/exams")
    return { success: true, generatedExamId: generatedExam.id }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate exam",
    }
  }
}

function calculateEndTime(startTime: string, durationMinutes: number): string {
  const [hours, minutes] = startTime.split(":").map(Number)
  const totalMinutes = hours * 60 + minutes + durationMinutes
  const endHours = Math.floor(totalMinutes / 60) % 24
  const endMinutes = totalMinutes % 60
  return `${String(endHours).padStart(2, "0")}:${String(endMinutes).padStart(2, "0")}`
}
