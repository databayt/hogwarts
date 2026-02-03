/**
 * Import/Export Actions for Question Bank
 *
 * Server actions for:
 * - Exporting questions to CSV
 * - Importing questions from CSV
 * - Downloading question templates
 * - Bulk operations with validation
 */

"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { z } from "zod"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import {
  generateQuestionCSVTemplate,
  generateQuestionsCSV,
  parseQuestionsCSV,
} from "./csv-utils"
import type { ActionResponse } from "./types"

// Validation schemas
const exportQuestionsSchema = z.object({
  subjectId: z.string().optional(),
  questionType: z.string().optional(),
  difficulty: z.string().optional(),
  bloomLevel: z.string().optional(),
  tags: z.array(z.string()).optional(),
  includeAnalytics: z.boolean().optional().default(false),
})

const importQuestionsSchema = z.object({
  csvContent: z.string().min(1, "CSV content is required"),
  subjectId: z.string().min(1, "Subject is required"),
  validateOnly: z.boolean().optional().default(false),
})

// Types
export interface ImportResult {
  totalRows: number
  successCount: number
  errorCount: number
  errors: Array<{
    row: number
    errors: string[]
  }>
  importedIds?: string[]
}

export interface ExportResult {
  csv: string
  filename: string
  count: number
}

/**
 * Export questions to CSV
 */
export async function exportQuestionsToCSV(
  input: z.infer<typeof exportQuestionsSchema>
): Promise<ActionResponse<ExportResult>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const parsed = exportQuestionsSchema.parse(input)

    // Build query filters
    const where: any = { schoolId }

    if (parsed.subjectId) {
      where.subjectId = parsed.subjectId
    }

    if (parsed.questionType) {
      where.questionType = parsed.questionType
    }

    if (parsed.difficulty) {
      where.difficulty = parsed.difficulty
    }

    if (parsed.bloomLevel) {
      where.bloomLevel = parsed.bloomLevel
    }

    if (parsed.tags && parsed.tags.length > 0) {
      where.tags = {
        hasSome: parsed.tags,
      }
    }

    // Fetch questions
    const questions = await db.questionBank.findMany({
      where,
      include: {
        subject: {
          select: {
            subjectName: true,
          },
        },
        ...(parsed.includeAnalytics && {
          analytics: true,
        }),
      },
      orderBy: [
        { subjectId: "asc" },
        { questionType: "asc" },
        { difficulty: "asc" },
        { createdAt: "desc" },
      ],
    })

    if (questions.length === 0) {
      return {
        success: false,
        error: "No questions found matching the criteria",
      }
    }

    // Generate CSV
    const csv = generateQuestionsCSV(questions)

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split("T")[0]
    const filename = `questions_export_${timestamp}.csv`

    return {
      success: true,
      data: {
        csv,
        filename,
        count: questions.length,
      },
    }
  } catch (error) {
    console.error("Error exporting questions:", error)

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Invalid export parameters",
        details: error.issues,
      }
    }

    return {
      success: false,
      error: "Failed to export questions",
      details: error,
    }
  }
}

/**
 * Import questions from CSV
 */
export async function importQuestionsFromCSV(
  input: z.infer<typeof importQuestionsSchema>
): Promise<ActionResponse<ImportResult>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    const parsed = importQuestionsSchema.parse(input)

    // Verify subject exists and belongs to school
    const subject = await db.subject.findFirst({
      where: {
        id: parsed.subjectId,
        schoolId,
      },
    })

    if (!subject) {
      return {
        success: false,
        error: "Subject not found or does not belong to your school",
      }
    }

    // Parse CSV content
    const { valid, invalid } = parseQuestionsCSV(
      parsed.csvContent,
      schoolId,
      parsed.subjectId,
      session.user.id
    )

    // If validation only, return results without importing
    if (parsed.validateOnly) {
      return {
        success: true,
        data: {
          totalRows: valid.length + invalid.length,
          successCount: valid.length,
          errorCount: invalid.length,
          errors: invalid,
        },
      }
    }

    // Import valid questions
    const importedIds: string[] = []

    if (valid.length > 0) {
      // Use transaction for bulk import
      await db.$transaction(async (tx) => {
        for (const questionData of valid) {
          try {
            const question = await tx.questionBank.create({
              data: questionData,
            })
            importedIds.push(question.id)
          } catch (error) {
            // Add to invalid list if database insert fails
            invalid.push({
              row: valid.indexOf(questionData) + 2, // +2 for header and 0-index
              errors: [`Database error: ${error}`],
            })
          }
        }
      })
    }

    // Revalidate the questions page
    revalidatePath("/exams/questions")

    return {
      success: true,
      data: {
        totalRows: valid.length + invalid.length,
        successCount: importedIds.length,
        errorCount: invalid.length,
        errors: invalid,
        importedIds,
      },
    }
  } catch (error) {
    console.error("Error importing questions:", error)

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Invalid import data",
        details: error.issues,
      }
    }

    if (
      error instanceof Error &&
      error.message.includes("Missing required headers")
    ) {
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: false,
      error: "Failed to import questions",
      details: error,
    }
  }
}

/**
 * Download CSV template for question import
 */
export async function downloadQuestionTemplate(): Promise<
  ActionResponse<{ csv: string; filename: string }>
> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const csv = generateQuestionCSVTemplate()
    const filename = "question_import_template.csv"

    return {
      success: true,
      data: {
        csv,
        filename,
      },
    }
  } catch (error) {
    console.error("Error generating template:", error)
    return {
      success: false,
      error: "Failed to generate template",
      details: error,
    }
  }
}

/**
 * Export questions with full details (including AI metadata)
 */
export async function exportQuestionsWithMetadata(
  filters?: z.infer<typeof exportQuestionsSchema>
): Promise<ActionResponse<ExportResult>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const parsed = filters
      ? exportQuestionsSchema.parse(filters)
      : {
          subjectId: undefined,
          questionType: undefined,
          difficulty: undefined,
          bloomLevel: undefined,
          tags: undefined,
          includeAnalytics: false,
        }

    // Build query
    const where: any = { schoolId }

    if (parsed.subjectId) where.subjectId = parsed.subjectId
    if (parsed.questionType) where.questionType = parsed.questionType
    if (parsed.difficulty) where.difficulty = parsed.difficulty
    if (parsed.bloomLevel) where.bloomLevel = parsed.bloomLevel
    if (parsed.tags?.length) where.tags = { hasSome: parsed.tags }

    // Fetch questions with all relationships
    const questions = await db.questionBank.findMany({
      where,
      include: {
        subject: true,
        analytics: true,
        generationJob: {
          select: {
            name: true,
            aiModel: true,
            completedAt: true,
          },
        },
        sourceMaterial: {
          select: {
            title: true,
            type: true,
            author: true,
          },
        },
        review: {
          select: {
            status: true,
            approved: true,
            qualityRating: true,
            accuracyRating: true,
            reviewedBy: true,
            reviewedAt: true,
          },
        },
      },
      orderBy: [{ subjectId: "asc" }, { createdAt: "desc" }],
    })

    if (questions.length === 0) {
      return {
        success: false,
        error: "No questions found",
      }
    }

    // Generate enhanced CSV with metadata
    const enhancedQuestions = questions.map((q) => ({
      ...q,
      // Add metadata fields
      analyticsUsageCount: q.analytics?.timesUsed || 0,
      analyticsSuccessRate: q.analytics?.successRate || null,
      aiGenerated: q.source === "AI" ? "Yes" : "No",
      aiModel: q.generationJob?.aiModel || "",
      sourceTitle: q.sourceMaterial?.title || "",
      reviewStatus: q.review?.status || "",
      qualityRating: q.review?.qualityRating || "",
    }))

    const csv = generateQuestionsCSV(enhancedQuestions)
    const timestamp = new Date().toISOString().split("T")[0]
    const filename = `questions_full_export_${timestamp}.csv`

    return {
      success: true,
      data: {
        csv,
        filename,
        count: questions.length,
      },
    }
  } catch (error) {
    console.error("Error exporting questions with metadata:", error)
    return {
      success: false,
      error: "Failed to export questions",
      details: error,
    }
  }
}
