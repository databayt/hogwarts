"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

// ============================================================================
// Contribute a generated exam to the catalog
// ============================================================================

interface ContributeExamResult {
  success: boolean
  error?: string
  code?: string
  data?: { catalogExamId: string }
}

/**
 * Contribute a completed generated exam to the catalog.
 * Extracts questions/distribution and creates CatalogExam + CatalogExamQuestion junction.
 */
export async function contributeExamToCatalog(
  generatedExamId: string,
  options?: { visibility?: string }
): Promise<ContributeExamResult> {
  try {
    const session = await auth()
    if (!session?.user?.id || !session.user.schoolId) {
      return {
        success: false,
        error: "Unauthorized",
        code: "NO_SCHOOL_CONTEXT",
      }
    }

    const schoolId = session.user.schoolId
    const userId = session.user.id
    const visibility = options?.visibility || "PUBLIC"

    // Fetch the generated exam with its exam, questions, and subject
    const generatedExam = await db.generatedExam.findFirst({
      where: { id: generatedExamId, schoolId },
      include: {
        exam: {
          include: {
            subject: { select: { id: true, catalogSubjectId: true } },
          },
        },
        questions: {
          include: {
            question: {
              select: {
                id: true,
                catalogQuestionId: true,
                questionText: true,
                questionType: true,
                difficulty: true,
                bloomLevel: true,
                points: true,
                options: true,
                sampleAnswer: true,
                explanation: true,
                tags: true,
              },
            },
          },
          orderBy: { order: "asc" },
        },
        template: true,
      },
    })

    if (!generatedExam) {
      return {
        success: false,
        error: "Generated exam not found",
        code: "NOT_FOUND",
      }
    }

    const { exam } = generatedExam
    const catalogSubjectId = exam.subject.catalogSubjectId

    if (!catalogSubjectId) {
      return {
        success: false,
        error: "Subject has no catalog mapping",
        code: "NO_CATALOG_SUBJECT",
      }
    }

    // Check not already contributed
    const existing = await db.exam.findFirst({
      where: { id: exam.id, catalogExamId: { not: null } },
      select: { catalogExamId: true },
    })
    if (existing?.catalogExamId) {
      return {
        success: false,
        error: "Exam already contributed to catalog",
        code: "ALREADY_CONTRIBUTED",
      }
    }

    // Build distribution from template or generated exam metadata
    const distribution = generatedExam.template
      ? (generatedExam.template.distribution as Record<string, unknown>)
      : null
    const bloomDistribution = generatedExam.template
      ? (generatedExam.template.bloomDistribution as Record<string, unknown>)
      : null

    // Create CatalogExam + junction in transaction
    const catalogExam = await db.$transaction(async (tx) => {
      // 1. Create catalog exam
      const newCatalogExam = await tx.catalogExam.create({
        data: {
          subjectId: catalogSubjectId,
          chapterId: exam.catalogChapterId || undefined,
          lessonId: exam.catalogLessonId || undefined,
          title: exam.title,
          description: exam.description,
          examType: exam.examType.toLowerCase(),
          durationMinutes: exam.duration,
          totalMarks: exam.totalMarks,
          passingMarks: exam.passingMarks,
          totalQuestions: generatedExam.totalQuestions,
          distribution: (distribution as any) || undefined,
          bloomDistribution: (bloomDistribution as any) || undefined,
          contributedBy: userId,
          contributedSchoolId: schoolId,
          approvalStatus: "APPROVED",
          visibility: visibility as any,
          status: "PUBLISHED",
        },
      })

      // 2. Create CatalogExamQuestion junction records
      for (const geq of generatedExam.questions) {
        const { question } = geq

        // If the school question has a catalog mirror, link to it directly
        let catalogQuestionId = question.catalogQuestionId

        // If no catalog mirror exists, create one
        if (!catalogQuestionId) {
          const catalogQ = await tx.catalogQuestion.create({
            data: {
              catalogSubjectId,
              questionText: question.questionText,
              questionType: question.questionType,
              difficulty: question.difficulty,
              bloomLevel: question.bloomLevel,
              points: question.points,
              options: question.options ?? undefined,
              sampleAnswer: question.sampleAnswer,
              explanation: question.explanation,
              tags: question.tags ?? [],
              contributedBy: userId,
              contributedSchoolId: schoolId,
              approvalStatus: "APPROVED",
              visibility: visibility as any,
              status: "PUBLISHED",
            },
          })
          catalogQuestionId = catalogQ.id

          // Link school question to catalog
          await tx.questionBank.update({
            where: { id: question.id },
            data: { catalogQuestionId: catalogQ.id },
          })
        }

        await tx.catalogExamQuestion.create({
          data: {
            catalogExamId: newCatalogExam.id,
            catalogQuestionId,
            order: geq.order,
            points: geq.points,
          },
        })
      }

      // 3. Update school exam with catalog bridge FK
      await tx.exam.update({
        where: { id: exam.id },
        data: { catalogExamId: newCatalogExam.id },
      })

      return newCatalogExam
    })

    revalidatePath("/exams/generate")
    return { success: true, data: { catalogExamId: catalogExam.id } }
  } catch (error) {
    console.error("Contribute exam to catalog error:", error)
    return {
      success: false,
      error: "Failed to contribute exam",
      code: "CONTRIBUTE_FAILED",
    }
  }
}

// ============================================================================
// Contribute an exam template to the catalog
// ============================================================================

interface ContributeTemplateResult {
  success: boolean
  error?: string
  code?: string
  data?: { catalogExamTemplateId: string }
}

/**
 * Contribute an exam template to the catalog.
 * Called automatically when school creates a template (dual-write).
 */
export async function contributeExamTemplateToCatalog(
  templateId: string,
  options?: { visibility?: string }
): Promise<ContributeTemplateResult> {
  try {
    const session = await auth()
    if (!session?.user?.id || !session.user.schoolId) {
      return {
        success: false,
        error: "Unauthorized",
        code: "NO_SCHOOL_CONTEXT",
      }
    }

    const schoolId = session.user.schoolId
    const userId = session.user.id
    const visibility = options?.visibility || "PUBLIC"

    const template = await db.examTemplate.findFirst({
      where: { id: templateId, schoolId },
      include: {
        subject: { select: { catalogSubjectId: true } },
      },
    })

    if (!template) {
      return { success: false, error: "Template not found", code: "NOT_FOUND" }
    }

    if (template.catalogExamTemplateId) {
      return {
        success: false,
        error: "Template already contributed",
        code: "ALREADY_CONTRIBUTED",
      }
    }

    const catalogSubjectId = template.subject.catalogSubjectId
    if (!catalogSubjectId) {
      return {
        success: false,
        error: "Subject has no catalog mapping",
        code: "NO_CATALOG_SUBJECT",
      }
    }

    const catalogTemplate = await db.$transaction(async (tx) => {
      // Infer exam type from template name or default to "midterm"
      const nameLower = template.name.toLowerCase()
      const examType = nameLower.includes("final")
        ? "final"
        : nameLower.includes("quiz")
          ? "quiz"
          : nameLower.includes("chapter")
            ? "chapter_test"
            : nameLower.includes("practice")
              ? "practice"
              : nameLower.includes("diagnostic")
                ? "diagnostic"
                : "midterm"

      const newCatalogTemplate = await tx.catalogExamTemplate.create({
        data: {
          catalogSubjectId,
          name: template.name,
          description: template.description,
          examType,
          duration: template.duration,
          totalMarks: template.totalMarks,
          distribution: template.distribution as any,
          bloomDistribution: template.bloomDistribution ?? undefined,
          contributedBy: userId,
          contributedSchoolId: schoolId,
          approvalStatus: "APPROVED",
          visibility: visibility as any,
          status: "PUBLISHED",
        },
      })

      // Link school template to catalog
      await tx.examTemplate.update({
        where: { id: templateId },
        data: { catalogExamTemplateId: newCatalogTemplate.id },
      })

      return newCatalogTemplate
    })

    revalidatePath("/exams/generate")
    return {
      success: true,
      data: { catalogExamTemplateId: catalogTemplate.id },
    }
  } catch (error) {
    console.error("Contribute template to catalog error:", error)
    return {
      success: false,
      error: "Failed to contribute template",
      code: "CONTRIBUTE_FAILED",
    }
  }
}
