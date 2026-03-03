"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

// ============================================================================
// Browse catalog paper templates
// ============================================================================

export interface CatalogPaperTemplateRow {
  id: string
  name: string
  template: string
  layout: string
  lang: string
  usageCount: number
  tags: string[]
  isAdopted: boolean
}

export async function browseCatalogPaperTemplates(filters?: {
  template?: string
  search?: string
  page?: number
}): Promise<{ templates: CatalogPaperTemplateRow[]; total: number }> {
  const { schoolId } = await getTenantContext()
  if (!schoolId) return { templates: [], total: 0 }

  const where: Record<string, unknown> = {
    status: "PUBLISHED",
    approvalStatus: "APPROVED",
    OR: [{ visibility: "PUBLIC" }, { contributedSchoolId: schoolId }],
  }

  if (filters?.template) where.template = filters.template
  if (filters?.search) {
    where.name = { contains: filters.search, mode: "insensitive" }
  }

  const page = filters?.page || 0
  const take = 20

  // Check which catalog templates are already adopted
  const adoptedConfigs = await db.examPaperConfig.findMany({
    where: { schoolId, catalogPaperTemplateId: { not: null } },
    select: { catalogPaperTemplateId: true },
  })
  const adoptedIds = new Set(
    adoptedConfigs.map((c) => c.catalogPaperTemplateId).filter(Boolean)
  )

  const [templates, total] = await Promise.all([
    db.catalogPaperTemplate.findMany({
      where: where as any,
      take,
      skip: page * take,
      orderBy: [{ usageCount: "desc" }, { createdAt: "desc" }],
    }),
    db.catalogPaperTemplate.count({ where: where as any }),
  ])

  return {
    templates: templates.map((t) => ({
      id: t.id,
      name: t.name,
      template: t.template,
      layout: t.layout,
      lang: t.lang,
      usageCount: t.usageCount,
      tags: t.tags,
      isAdopted: adoptedIds.has(t.id),
    })),
    total,
  }
}

// ============================================================================
// Adopt a catalog paper template into a school ExamPaperConfig
// ============================================================================

interface AdoptPaperResult {
  success: boolean
  error?: string
  data?: { configId: string }
}

export async function adoptCatalogPaperTemplate(
  catalogPaperTemplateId: string,
  generatedExamId: string
): Promise<AdoptPaperResult> {
  try {
    const session = await auth()
    if (!session?.user?.id || !session.user.schoolId) {
      return { success: false, error: "Unauthorized" }
    }

    const schoolId = session.user.schoolId

    const catalogTemplate = await db.catalogPaperTemplate.findFirst({
      where: {
        id: catalogPaperTemplateId,
        status: "PUBLISHED",
        approvalStatus: "APPROVED",
        OR: [{ visibility: "PUBLIC" }, { contributedSchoolId: schoolId }],
      },
    })

    if (!catalogTemplate) {
      return { success: false, error: "Template not available" }
    }

    // Check if generated exam exists and belongs to school
    const generatedExam = await db.generatedExam.findFirst({
      where: { id: generatedExamId, schoolId },
    })
    if (!generatedExam) {
      return { success: false, error: "Generated exam not found" }
    }

    // Check if config already exists for this generated exam
    const existing = await db.examPaperConfig.findFirst({
      where: { generatedExamId, schoolId },
    })
    if (existing) {
      // Update existing config
      await db.examPaperConfig.update({
        where: { id: existing.id },
        data: {
          template: catalogTemplate.template as any,
          layout: catalogTemplate.layout as any,
          answerSheetType: catalogTemplate.answerSheetType as any,
          showSchoolLogo: catalogTemplate.showSchoolLogo,
          showExamTitle: catalogTemplate.showExamTitle,
          showInstructions: catalogTemplate.showInstructions,
          customInstructions: catalogTemplate.customInstructions,
          showStudentInfo: catalogTemplate.showStudentInfo,
          showQuestionNumbers: catalogTemplate.showQuestionNumbers,
          showPointsPerQuestion: catalogTemplate.showPointsPerQuestion,
          showQuestionType: catalogTemplate.showQuestionType,
          shuffleQuestions: catalogTemplate.shuffleQuestions,
          shuffleOptions: catalogTemplate.shuffleOptions,
          answerLinesShort: catalogTemplate.answerLinesShort,
          answerLinesEssay: catalogTemplate.answerLinesEssay,
          showPageNumbers: catalogTemplate.showPageNumbers,
          showTotalPages: catalogTemplate.showTotalPages,
          customFooter: catalogTemplate.customFooter,
          pageSize: catalogTemplate.pageSize,
          orientation: catalogTemplate.orientation,
          blockConfig: catalogTemplate.blockConfig ?? undefined,
          catalogPaperTemplateId: catalogTemplate.id,
        },
      })

      await db.catalogPaperTemplate.update({
        where: { id: catalogPaperTemplateId },
        data: { usageCount: { increment: 1 } },
      })

      revalidatePath("/exams/paper")
      return { success: true, data: { configId: existing.id } }
    }

    // Create new config from catalog template
    const config = await db.$transaction(async (tx) => {
      const newConfig = await tx.examPaperConfig.create({
        data: {
          schoolId,
          generatedExamId,
          template: catalogTemplate.template as any,
          layout: catalogTemplate.layout as any,
          answerSheetType: catalogTemplate.answerSheetType as any,
          showSchoolLogo: catalogTemplate.showSchoolLogo,
          showExamTitle: catalogTemplate.showExamTitle,
          showInstructions: catalogTemplate.showInstructions,
          customInstructions: catalogTemplate.customInstructions,
          showStudentInfo: catalogTemplate.showStudentInfo,
          showQuestionNumbers: catalogTemplate.showQuestionNumbers,
          showPointsPerQuestion: catalogTemplate.showPointsPerQuestion,
          showQuestionType: catalogTemplate.showQuestionType,
          shuffleQuestions: catalogTemplate.shuffleQuestions,
          shuffleOptions: catalogTemplate.shuffleOptions,
          answerLinesShort: catalogTemplate.answerLinesShort,
          answerLinesEssay: catalogTemplate.answerLinesEssay,
          showPageNumbers: catalogTemplate.showPageNumbers,
          showTotalPages: catalogTemplate.showTotalPages,
          customFooter: catalogTemplate.customFooter,
          pageSize: catalogTemplate.pageSize,
          orientation: catalogTemplate.orientation,
          blockConfig: catalogTemplate.blockConfig ?? undefined,
          catalogPaperTemplateId: catalogTemplate.id,
        },
      })

      await tx.catalogPaperTemplate.update({
        where: { id: catalogPaperTemplateId },
        data: { usageCount: { increment: 1 } },
      })

      return newConfig
    })

    revalidatePath("/exams/paper")
    return { success: true, data: { configId: config.id } }
  } catch (error) {
    console.error("Adopt catalog paper template error:", error)
    return { success: false, error: "Failed to adopt template" }
  }
}
