"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

// ============================================================================
// Adopt a catalog exam into a school
// ============================================================================

interface AdoptExamResult {
  success: boolean
  error?: string
  code?: string
  data?: { examId: string; generatedExamId: string }
}

/**
 * Adopt a catalog exam into the school.
 * Creates school Exam + GeneratedExam + mirrors questions into school QBank.
 */
export async function adoptCatalogExam(input: {
  catalogExamId: string
  classId: string
  examDate: Date
  startTime: string
  endTime: string
}): Promise<AdoptExamResult> {
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

    // 1. Verify catalog exam is accessible
    const catalogExam = await db.catalogExam.findFirst({
      where: {
        id: input.catalogExamId,
        status: "PUBLISHED",
        approvalStatus: "APPROVED",
        OR: [{ visibility: "PUBLIC" }, { contributedSchoolId: schoolId }],
      },
      include: {
        examQuestions: {
          include: {
            catalogQuestion: true,
          },
          orderBy: { order: "asc" },
        },
      },
    })

    if (!catalogExam) {
      return {
        success: false,
        error: "Catalog exam not available",
        code: "NOT_FOUND",
      }
    }

    // 2. Resolve catalogSubjectId to school Subject
    const subject = await db.subject.findFirst({
      where: { schoolId, catalogSubjectId: catalogExam.subjectId },
    })

    if (!subject) {
      return {
        success: false,
        error: "Subject not available in your school. Adopt the subject first.",
        code: "SUBJECT_NOT_FOUND",
      }
    }

    // 3. Verify class belongs to school
    const classExists = await db.class.findFirst({
      where: { id: input.classId, schoolId },
    })

    if (!classExists) {
      return {
        success: false,
        error: "Class not found in your school",
        code: "INVALID_CLASS",
      }
    }

    // 4. Calculate duration from start/end time
    const [startH, startM] = input.startTime.split(":").map(Number)
    const [endH, endM] = input.endTime.split(":").map(Number)
    const duration =
      catalogExam.durationMinutes || endH * 60 + endM - (startH * 60 + startM)

    // 5. Create everything in a transaction
    const result = await db.$transaction(async (tx) => {
      // Create school Exam with catalog bridge FKs
      const exam = await tx.exam.create({
        data: {
          schoolId,
          title: catalogExam.title,
          description: catalogExam.description,
          classId: input.classId,
          subjectId: subject.id,
          examDate: input.examDate,
          startTime: input.startTime,
          endTime: input.endTime,
          duration,
          totalMarks: catalogExam.totalMarks || 100,
          passingMarks: catalogExam.passingMarks || 50,
          examType: catalogExam.examType.toUpperCase() as any,
          status: "PLANNED",
          catalogSubjectId: catalogExam.subjectId,
          catalogChapterId: catalogExam.chapterId,
          catalogLessonId: catalogExam.lessonId,
          catalogExamId: catalogExam.id,
        },
      })

      // Create GeneratedExam
      const generatedExam = await tx.generatedExam.create({
        data: {
          schoolId,
          examId: exam.id,
          totalQuestions: catalogExam.examQuestions.length,
          generatedBy: userId,
          generationNotes: `Adopted from catalog exam: ${catalogExam.title}`,
        },
      })

      // For each CatalogExamQuestion, find/create school QuestionBank mirror
      for (const ceq of catalogExam.examQuestions) {
        const cq = ceq.catalogQuestion

        // Check if already adopted
        let schoolQuestion = await tx.questionBank.findFirst({
          where: { schoolId, catalogQuestionId: cq.id },
        })

        if (!schoolQuestion) {
          // Create school mirror
          schoolQuestion = await tx.questionBank.create({
            data: {
              schoolId,
              subjectId: subject.id,
              catalogQuestionId: cq.id,
              catalogSubjectId: cq.catalogSubjectId,
              catalogChapterId: cq.catalogChapterId,
              catalogLessonId: cq.catalogLessonId,
              questionText: cq.questionText,
              questionType: cq.questionType,
              difficulty: cq.difficulty,
              bloomLevel: cq.bloomLevel,
              points: cq.points,
              options: cq.options ?? undefined,
              sampleAnswer: cq.sampleAnswer,
              explanation: cq.explanation,
              tags: cq.tags ?? [],
              source: "IMPORTED",
              createdBy: userId,
            },
          })

          // Create analytics
          await tx.questionAnalytics.create({
            data: {
              questionId: schoolQuestion.id,
              schoolId,
            },
          })

          // Increment catalog question usage
          await tx.catalogQuestion.update({
            where: { id: cq.id },
            data: { usageCount: { increment: 1 } },
          })
        }

        // Create GeneratedExamQuestion linking to school QBank
        await tx.generatedExamQuestion.create({
          data: {
            schoolId,
            generatedExamId: generatedExam.id,
            questionId: schoolQuestion.id,
            order: ceq.order,
            points: ceq.points,
          },
        })
      }

      // Increment CatalogExam.usageCount
      await tx.catalogExam.update({
        where: { id: catalogExam.id },
        data: { usageCount: { increment: 1 } },
      })

      return { examId: exam.id, generatedExamId: generatedExam.id }
    })

    revalidatePath("/exams")
    revalidatePath("/exams/generate")

    return { success: true, data: result }
  } catch (error) {
    console.error("Adopt catalog exam error:", error)
    return {
      success: false,
      error: "Failed to adopt catalog exam",
      code: "ADOPT_FAILED",
    }
  }
}

// ============================================================================
// Adopt a catalog exam template into the school
// ============================================================================

interface AdoptTemplateResult {
  success: boolean
  error?: string
  code?: string
  data?: { templateId: string }
}

export async function adoptCatalogExamTemplate(
  catalogExamTemplateId: string,
  subjectId: string
): Promise<AdoptTemplateResult> {
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

    // Verify template is accessible
    const catalogTemplate = await db.catalogExamTemplate.findFirst({
      where: {
        id: catalogExamTemplateId,
        status: "PUBLISHED",
        approvalStatus: "APPROVED",
        OR: [{ visibility: "PUBLIC" }, { contributedSchoolId: schoolId }],
      },
    })

    if (!catalogTemplate) {
      return {
        success: false,
        error: "Template not available",
        code: "NOT_FOUND",
      }
    }

    // Check not already adopted
    const existing = await db.examTemplate.findFirst({
      where: { schoolId, catalogExamTemplateId },
    })
    if (existing) {
      return {
        success: false,
        error: "Template already adopted",
        code: "ALREADY_ADOPTED",
      }
    }

    // Verify subject belongs to school
    const subject = await db.subject.findFirst({
      where: { id: subjectId, schoolId },
    })
    if (!subject) {
      return {
        success: false,
        error: "Subject not found in your school",
        code: "INVALID_SUBJECT",
      }
    }

    const template = await db.$transaction(async (tx) => {
      const newTemplate = await tx.examTemplate.create({
        data: {
          schoolId,
          name: catalogTemplate.name,
          description: catalogTemplate.description,
          subjectId,
          duration: catalogTemplate.duration,
          totalMarks: catalogTemplate.totalMarks,
          distribution: catalogTemplate.distribution as any,
          bloomDistribution: catalogTemplate.bloomDistribution ?? undefined,
          catalogExamTemplateId: catalogTemplate.id,
          createdBy: userId,
        },
      })

      // Increment usage count
      await tx.catalogExamTemplate.update({
        where: { id: catalogExamTemplateId },
        data: { usageCount: { increment: 1 } },
      })

      return newTemplate
    })

    revalidatePath("/exams/generate")
    return { success: true, data: { templateId: template.id } }
  } catch (error) {
    console.error("Adopt catalog template error:", error)
    return {
      success: false,
      error: "Failed to adopt template",
      code: "ADOPT_FAILED",
    }
  }
}
