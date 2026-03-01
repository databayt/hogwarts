"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import type { QuestionBankDTO, TemplateDistribution } from "../types"
import { generateExamQuestions } from "../utils"

// ============================================================================
// Exam Version Library Actions (Story 6.2)
//
// Manages multiple generated exam versions per exam. Each version is a
// separate GeneratedExam record with a different seed/question selection.
//
// NOTE: Requires the @@unique([examId]) constraint on GeneratedExam to be
// relaxed to @@index([schoolId, examId]) for multiple versions per exam.
// ============================================================================

export interface ExamVersion {
  id: string // GeneratedExam id
  title: string
  createdAt: Date
  questionCount: number
  totalMarks: number | null
  hasPaper: boolean
  paperUrl: string | null
  isActive: boolean
}

/**
 * Gets all GeneratedExam records (versions) for a given exam.
 * Returns version cards with title, created date, question count, paper status.
 */
export async function getExamVersions(
  examId: string
): Promise<ActionResponse<{ versions: ExamVersion[] }>> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" }
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    // Verify exam belongs to this school
    const exam = await db.exam.findFirst({
      where: { id: examId, schoolId },
      select: { id: true, title: true },
    })

    if (!exam) {
      return { success: false, error: "Exam not found" }
    }

    // Fetch all generated exam versions for this exam
    const generatedExams = await db.generatedExam.findMany({
      where: {
        examId,
        schoolId, // Multi-tenant scope
      },
      include: {
        questions: {
          select: {
            points: true,
          },
        },
        paperConfig: {
          include: {
            papers: {
              select: {
                pdfUrl: true,
              },
              take: 1,
              orderBy: { generatedAt: "desc" },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    const versions: ExamVersion[] = generatedExams.map((ge, index) => {
      const totalMarks = ge.questions.reduce(
        (sum, q) => sum + Number(q.points),
        0
      )
      const latestPaper = ge.paperConfig?.papers?.[0]

      return {
        id: ge.id,
        title: `Version ${generatedExams.length - index}`,
        createdAt: ge.createdAt,
        questionCount: ge.totalQuestions,
        totalMarks: totalMarks || null,
        hasPaper: !!latestPaper?.pdfUrl,
        paperUrl: latestPaper?.pdfUrl || null,
        isActive: index === 0, // Most recent is active
      }
    })

    return { success: true, data: { versions } }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to get exam versions",
    }
  }
}

/**
 * Creates a new version of an exam by re-running the generation algorithm
 * with a different seed. Uses the exam's existing template/distribution
 * to generate a fresh question selection.
 */
export async function createExamVersion(
  examId: string
): Promise<ActionResponse<{ generatedExamId: string }>> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" }
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const userId = session.user.id

    // Fetch the exam with its subject
    const exam = await db.exam.findFirst({
      where: { id: examId, schoolId },
      select: {
        id: true,
        subjectId: true,
        title: true,
      },
    })

    if (!exam) {
      return { success: false, error: "Exam not found" }
    }

    // Find the most recent generated exam to reuse its template/distribution
    const latestVersion = await db.generatedExam.findFirst({
      where: { examId, schoolId },
      include: {
        template: true,
      },
      orderBy: { createdAt: "desc" },
    })

    // Resolve the distribution to use
    let distribution: TemplateDistribution | null = null
    let templateId: string | null = null

    if (latestVersion?.template) {
      // Use the same template
      templateId = latestVersion.template.id
      distribution = latestVersion.template.distribution as TemplateDistribution
    } else if (latestVersion?.templateId) {
      // Template ID exists but template may have been deleted
      const template = await db.examTemplate.findFirst({
        where: { id: latestVersion.templateId, schoolId },
      })
      if (template) {
        templateId = template.id
        distribution = template.distribution as TemplateDistribution
      }
    }

    if (!distribution) {
      return {
        success: false,
        error:
          "No template or distribution found. Generate an initial version first using a template.",
      }
    }

    // Get available questions from the school's question bank
    const availableQuestions = await db.questionBank.findMany({
      where: {
        schoolId,
        subjectId: exam.subjectId,
      },
      include: {
        analytics: true,
      },
    })

    // Generate a unique seed for this version
    const newSeed = `v-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`

    // Run the generation algorithm with the new seed
    const result = generateExamQuestions(
      availableQuestions as QuestionBankDTO[],
      distribution,
      undefined, // bloomDistribution
      true, // isRandomized - always randomize for new versions
      newSeed
    )

    if (!result.metadata.distributionMet) {
      return {
        success: false,
        error: `Cannot generate version: ${result.metadata.missingCategories.join(", ")}`,
      }
    }

    // Create the new generated exam version in a transaction
    const generatedExam = await db.$transaction(async (tx) => {
      const ge = await tx.generatedExam.create({
        data: {
          schoolId,
          examId,
          templateId,
          isRandomized: true,
          seed: newSeed,
          totalQuestions: result.selectedQuestions.length,
          generationNotes: `Version generated with seed: ${newSeed}`,
          generatedBy: userId,
        },
      })

      // Create question associations
      await tx.generatedExamQuestion.createMany({
        data: result.selectedQuestions.map((q, index) => ({
          schoolId,
          generatedExamId: ge.id,
          questionId: q.id,
          order: index + 1,
          points: q.points,
        })),
      })

      return ge
    })

    revalidatePath("/exams")
    revalidatePath(`/exams/generate`)
    return { success: true, data: { generatedExamId: generatedExam.id } }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to create exam version",
    }
  }
}

/**
 * Deletes a specific generated exam version.
 * Cannot delete if it is the only version for that exam.
 */
export async function deleteExamVersion(
  generatedExamId: string
): Promise<ActionResponse> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" }
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    // Find the generated exam and verify ownership
    const generatedExam = await db.generatedExam.findFirst({
      where: {
        id: generatedExamId,
        schoolId, // Multi-tenant scope
      },
      select: {
        id: true,
        examId: true,
      },
    })

    if (!generatedExam) {
      return { success: false, error: "Generated exam version not found" }
    }

    // Count how many versions exist for this exam
    const versionCount = await db.generatedExam.count({
      where: {
        examId: generatedExam.examId,
        schoolId,
      },
    })

    if (versionCount <= 1) {
      return {
        success: false,
        error:
          "Cannot delete the only version. At least one version must exist.",
      }
    }

    // Delete in a transaction: questions first, then papers/config, answer key, then the generated exam
    await db.$transaction(async (tx) => {
      // Delete generated exam questions
      await tx.generatedExamQuestion.deleteMany({
        where: {
          generatedExamId,
          schoolId,
        },
      })

      // Delete answer key if exists
      await tx.examAnswerKey.deleteMany({
        where: {
          generatedExamId,
          schoolId,
        },
      })

      // Delete generated papers and paper config if they exist
      const paperConfig = await tx.examPaperConfig.findUnique({
        where: { generatedExamId },
        select: { id: true },
      })

      if (paperConfig) {
        await tx.generatedPaper.deleteMany({
          where: {
            configId: paperConfig.id,
            schoolId,
          },
        })

        await tx.examPaperConfig.delete({
          where: { generatedExamId },
        })
      }

      // Delete the generated exam itself
      await tx.generatedExam.delete({
        where: { id: generatedExamId },
      })
    })

    revalidatePath("/exams")
    revalidatePath(`/exams/generate`)
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to delete exam version",
    }
  }
}
