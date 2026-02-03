"use server"

/**
 * Paper Configuration Server Actions
 * CRUD operations for exam paper configurations
 */
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

import { db } from "@/lib/db"

import { DEFAULT_PAPER_CONFIG } from "../config"
import type {
  ActionResult,
  CreatePaperConfigInput,
  PaperConfigWithRelations,
  UpdatePaperConfigInput,
} from "./types"

// ============================================================================
// CREATE PAPER CONFIG
// ============================================================================

export async function createPaperConfig(
  input: CreatePaperConfigInput
): Promise<ActionResult<PaperConfigWithRelations>> {
  try {
    const session = await auth()
    const schoolId = session?.user?.schoolId

    if (!schoolId) {
      return { success: false, error: "Unauthorized", code: "UNAUTHORIZED" }
    }

    // Check if config already exists for this generated exam
    const existing = await db.examPaperConfig.findUnique({
      where: { generatedExamId: input.generatedExamId },
    })

    if (existing) {
      return {
        success: false,
        error: "Paper config already exists for this exam",
        code: "ALREADY_EXISTS",
      }
    }

    // Verify the generated exam belongs to this school
    const generatedExam = await db.generatedExam.findFirst({
      where: {
        id: input.generatedExamId,
        schoolId,
      },
      include: {
        exam: {
          include: {
            class: { select: { name: true, id: true } },
            subject: { select: { subjectName: true, id: true } },
          },
        },
        questions: {
          include: { question: true },
          orderBy: { order: "asc" },
        },
      },
    })

    if (!generatedExam) {
      return {
        success: false,
        error: "Generated exam not found",
        code: "NOT_FOUND",
      }
    }

    // Create config with defaults
    const config = await db.examPaperConfig.create({
      data: {
        schoolId,
        generatedExamId: input.generatedExamId,
        template: input.template ?? DEFAULT_PAPER_CONFIG.template,
        layout: input.layout ?? DEFAULT_PAPER_CONFIG.layout,
        answerSheetType:
          input.answerSheetType ?? DEFAULT_PAPER_CONFIG.answerSheetType,
        showSchoolLogo:
          input.showSchoolLogo ?? DEFAULT_PAPER_CONFIG.showSchoolLogo,
        showExamTitle:
          input.showExamTitle ?? DEFAULT_PAPER_CONFIG.showExamTitle,
        showInstructions:
          input.showInstructions ?? DEFAULT_PAPER_CONFIG.showInstructions,
        customInstructions: input.customInstructions,
        showStudentInfo:
          input.showStudentInfo ?? DEFAULT_PAPER_CONFIG.showStudentInfo,
        showQuestionNumbers:
          input.showQuestionNumbers ?? DEFAULT_PAPER_CONFIG.showQuestionNumbers,
        showPointsPerQuestion:
          input.showPointsPerQuestion ??
          DEFAULT_PAPER_CONFIG.showPointsPerQuestion,
        showQuestionType:
          input.showQuestionType ?? DEFAULT_PAPER_CONFIG.showQuestionType,
        shuffleQuestions:
          input.shuffleQuestions ?? DEFAULT_PAPER_CONFIG.shuffleQuestions,
        shuffleOptions:
          input.shuffleOptions ?? DEFAULT_PAPER_CONFIG.shuffleOptions,
        answerLinesShort:
          input.answerLinesShort ?? DEFAULT_PAPER_CONFIG.answerLinesShort,
        answerLinesEssay:
          input.answerLinesEssay ?? DEFAULT_PAPER_CONFIG.answerLinesEssay,
        showPageNumbers:
          input.showPageNumbers ?? DEFAULT_PAPER_CONFIG.showPageNumbers,
        showTotalPages:
          input.showTotalPages ?? DEFAULT_PAPER_CONFIG.showTotalPages,
        customFooter: input.customFooter,
        pageSize: input.pageSize ?? DEFAULT_PAPER_CONFIG.pageSize,
        orientation: input.orientation ?? DEFAULT_PAPER_CONFIG.orientation,
        versionCount: input.versionCount ?? DEFAULT_PAPER_CONFIG.versionCount,
      },
      include: {
        generatedExam: {
          include: {
            exam: {
              include: {
                class: { select: { name: true, id: true } },
                subject: { select: { subjectName: true, id: true } },
              },
            },
            questions: {
              include: { question: true },
              orderBy: { order: "asc" },
            },
          },
        },
        papers: true,
      },
    })

    revalidatePath(`/exams/paper/${input.generatedExamId}`)

    return { success: true, data: config as PaperConfigWithRelations }
  } catch (error) {
    console.error("Error creating paper config:", error)
    return {
      success: false,
      error: "Failed to create paper configuration",
      code: "CREATE_FAILED",
    }
  }
}

// ============================================================================
// GET PAPER CONFIG
// ============================================================================

export async function getPaperConfig(
  generatedExamId: string
): Promise<ActionResult<PaperConfigWithRelations | null>> {
  try {
    const session = await auth()
    const schoolId = session?.user?.schoolId

    if (!schoolId) {
      return { success: false, error: "Unauthorized", code: "UNAUTHORIZED" }
    }

    const config = await db.examPaperConfig.findFirst({
      where: {
        generatedExamId,
        schoolId,
      },
      include: {
        generatedExam: {
          include: {
            exam: {
              include: {
                class: { select: { name: true, id: true } },
                subject: { select: { subjectName: true, id: true } },
              },
            },
            questions: {
              include: { question: true },
              orderBy: { order: "asc" },
            },
          },
        },
        papers: {
          orderBy: { generatedAt: "desc" },
        },
      },
    })

    return { success: true, data: config as PaperConfigWithRelations | null }
  } catch (error) {
    console.error("Error fetching paper config:", error)
    return {
      success: false,
      error: "Failed to fetch paper configuration",
      code: "FETCH_FAILED",
    }
  }
}

// ============================================================================
// UPDATE PAPER CONFIG
// ============================================================================

export async function updatePaperConfig(
  input: UpdatePaperConfigInput
): Promise<ActionResult<PaperConfigWithRelations>> {
  try {
    const session = await auth()
    const schoolId = session?.user?.schoolId

    if (!schoolId) {
      return { success: false, error: "Unauthorized", code: "UNAUTHORIZED" }
    }

    // Verify config belongs to this school
    const existing = await db.examPaperConfig.findFirst({
      where: {
        id: input.configId,
        schoolId,
      },
    })

    if (!existing) {
      return {
        success: false,
        error: "Paper config not found",
        code: "NOT_FOUND",
      }
    }

    // Build update data
    const updateData: Record<string, unknown> = {}
    const fields = [
      "template",
      "layout",
      "answerSheetType",
      "showSchoolLogo",
      "showExamTitle",
      "showInstructions",
      "customInstructions",
      "showStudentInfo",
      "showQuestionNumbers",
      "showPointsPerQuestion",
      "showQuestionType",
      "shuffleQuestions",
      "shuffleOptions",
      "answerLinesShort",
      "answerLinesEssay",
      "showPageNumbers",
      "showTotalPages",
      "customFooter",
      "pageSize",
      "orientation",
      "versionCount",
    ] as const

    for (const field of fields) {
      if (input[field] !== undefined) {
        updateData[field] = input[field]
      }
    }

    const config = await db.examPaperConfig.update({
      where: { id: input.configId },
      data: updateData,
      include: {
        generatedExam: {
          include: {
            exam: {
              include: {
                class: { select: { name: true, id: true } },
                subject: { select: { subjectName: true, id: true } },
              },
            },
            questions: {
              include: { question: true },
              orderBy: { order: "asc" },
            },
          },
        },
        papers: {
          orderBy: { generatedAt: "desc" },
        },
      },
    })

    revalidatePath(`/exams/paper/${existing.generatedExamId}`)

    return { success: true, data: config as PaperConfigWithRelations }
  } catch (error) {
    console.error("Error updating paper config:", error)
    return {
      success: false,
      error: "Failed to update paper configuration",
      code: "UPDATE_FAILED",
    }
  }
}

// ============================================================================
// DELETE PAPER CONFIG
// ============================================================================

export async function deletePaperConfig(
  configId: string
): Promise<ActionResult<void>> {
  try {
    const session = await auth()
    const schoolId = session?.user?.schoolId

    if (!schoolId) {
      return { success: false, error: "Unauthorized", code: "UNAUTHORIZED" }
    }

    const config = await db.examPaperConfig.findFirst({
      where: {
        id: configId,
        schoolId,
      },
    })

    if (!config) {
      return {
        success: false,
        error: "Paper config not found",
        code: "NOT_FOUND",
      }
    }

    await db.examPaperConfig.delete({
      where: { id: configId },
    })

    revalidatePath(`/exams/paper/${config.generatedExamId}`)

    return { success: true, data: undefined }
  } catch (error) {
    console.error("Error deleting paper config:", error)
    return {
      success: false,
      error: "Failed to delete paper configuration",
      code: "DELETE_FAILED",
    }
  }
}

// ============================================================================
// GET OR CREATE CONFIG (Convenience)
// ============================================================================

export async function getOrCreatePaperConfig(
  generatedExamId: string
): Promise<ActionResult<PaperConfigWithRelations>> {
  const getResult = await getPaperConfig(generatedExamId)

  if (!getResult.success) {
    return getResult
  }

  if (getResult.data) {
    return { success: true, data: getResult.data }
  }

  // Create with defaults
  return createPaperConfig({ generatedExamId })
}
