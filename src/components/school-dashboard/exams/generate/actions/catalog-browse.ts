"use server"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

// ============================================================================
// Browse catalog exams available for adoption
// ============================================================================

export interface ExamBrowseFilters {
  catalogSubjectId?: string
  examType?: string
  gradeRange?: string
  search?: string
  page?: number
}

export interface ExamRow {
  id: string
  title: string
  description: string | null
  examType: string
  durationMinutes: number | null
  totalMarks: number | null
  totalQuestions: number | null
  usageCount: number
  averageScore: number
  visibility: string
  catalogSubjectName: string | null
  catalogChapterName: string | null
  contributedSchoolId: string | null
  questionCount: number
  isAdopted: boolean
  variantOf: string | null
  variantLabel: string | null
}

export async function browseExams(
  filters: ExamBrowseFilters
): Promise<{ exams: ExamRow[]; total: number }> {
  const { schoolId } = await getTenantContext()
  if (!schoolId) {
    return { exams: [], total: 0 }
  }

  // Find already-adopted catalog exam IDs for this school
  const adopted = await db.schoolExam.findMany({
    where: { schoolId, catalogExamId: { not: null } },
    select: { catalogExamId: true },
  })
  const adoptedIds = new Set(
    adopted.map((e) => e.catalogExamId).filter(Boolean)
  )

  const where: Record<string, unknown> = {
    status: "PUBLISHED",
    approvalStatus: "APPROVED",
    OR: [{ visibility: "PUBLIC" }, { contributedSchoolId: schoolId }],
  }

  if (filters.catalogSubjectId) {
    where.subjectId = filters.catalogSubjectId
  }
  if (filters.examType) {
    where.examType = filters.examType
  }
  if (filters.search) {
    where.title = { contains: filters.search, mode: "insensitive" }
  }

  const page = filters.page || 0
  const take = 20

  const [exams, total] = await Promise.all([
    db.exam.findMany({
      where: where as any,
      include: {
        subject: { select: { name: true } },
        chapter: { select: { name: true } },
        _count: { select: { examQuestions: true } },
      },
      take,
      skip: page * take,
      orderBy: [{ usageCount: "desc" }, { createdAt: "desc" }],
    }),
    db.exam.count({ where: where as any }),
  ])

  return {
    exams: exams.map((e) => ({
      id: e.id,
      title: e.title,
      description: e.description,
      examType: e.examType,
      durationMinutes: e.durationMinutes,
      totalMarks: e.totalMarks,
      totalQuestions: e.totalQuestions,
      usageCount: e.usageCount,
      averageScore: e.averageScore,
      visibility: e.visibility,
      catalogSubjectName: e.subject?.name ?? null,
      catalogChapterName: e.chapter?.name ?? null,
      contributedSchoolId: e.contributedSchoolId,
      questionCount: e._count.examQuestions,
      isAdopted: adoptedIds.has(e.id),
      variantOf: e.variantOf,
      variantLabel: e.variantLabel,
    })),
    total,
  }
}

// ============================================================================
// Browse catalog exam templates
// ============================================================================

export interface ExamTemplateBrowseFilters {
  catalogSubjectId?: string
  examType?: string
  search?: string
  page?: number
}

export interface ExamTemplateRow {
  id: string
  name: string
  description: string | null
  examType: string
  duration: number
  totalMarks: number
  distribution: unknown
  bloomDistribution: unknown
  usageCount: number
  catalogSubjectName: string | null
  contributedSchoolId: string | null
  isAdopted: boolean
}

export async function browseExamTemplates(
  filters: ExamTemplateBrowseFilters
): Promise<{ templates: ExamTemplateRow[]; total: number }> {
  const { schoolId } = await getTenantContext()
  if (!schoolId) {
    return { templates: [], total: 0 }
  }

  // Find already-adopted template IDs
  const adoptedTemplates = await db.schoolExamTemplate.findMany({
    where: { schoolId, catalogExamTemplateId: { not: null } },
    select: { catalogExamTemplateId: true },
  })
  const adoptedIds = new Set(
    adoptedTemplates.map((t) => t.catalogExamTemplateId).filter(Boolean)
  )

  const where: Record<string, unknown> = {
    status: "PUBLISHED",
    approvalStatus: "APPROVED",
    OR: [{ visibility: "PUBLIC" }, { contributedSchoolId: schoolId }],
  }

  if (filters.catalogSubjectId) {
    where.catalogSubjectId = filters.catalogSubjectId
  }
  if (filters.examType) {
    where.examType = filters.examType
  }
  if (filters.search) {
    where.name = { contains: filters.search, mode: "insensitive" }
  }

  const page = filters.page || 0
  const take = 20

  const [templates, total] = await Promise.all([
    db.examTemplate.findMany({
      where: where as any,
      include: {
        catalogSubject: { select: { name: true } },
      },
      take,
      skip: page * take,
      orderBy: [{ usageCount: "desc" }, { createdAt: "desc" }],
    }),
    db.examTemplate.count({ where: where as any }),
  ])

  return {
    templates: templates.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      examType: t.examType,
      duration: t.duration,
      totalMarks: Number(t.totalMarks),
      distribution: t.distribution,
      bloomDistribution: t.bloomDistribution,
      usageCount: t.usageCount,
      catalogSubjectName: t.catalogSubject?.name ?? null,
      contributedSchoolId: t.contributedSchoolId,
      isAdopted: adoptedIds.has(t.id),
    })),
    total,
  }
}

// ============================================================================
// Get catalog exam detail (for preview modal)
// ============================================================================

export interface ExamDetail {
  id: string
  title: string
  description: string | null
  examType: string
  durationMinutes: number | null
  totalMarks: number | null
  passingMarks: number | null
  totalQuestions: number | null
  distribution: unknown
  bloomDistribution: unknown
  usageCount: number
  averageScore: number
  qualityScore: number
  ratingCount: number
  catalogSubjectName: string | null
  catalogChapterName: string | null
  variantOf: string | null
  variantLabel: string | null
  variantCount: number
  sampleQuestions: Array<{
    questionText: string
    questionType: string
    difficulty: string
    bloomLevel: string
    points: number
    order: number
  }>
  isAdopted: boolean
}

export async function getExamDetail(
  catalogExamId: string
): Promise<ExamDetail | null> {
  const { schoolId } = await getTenantContext()
  if (!schoolId) return null

  const exam = await db.exam.findFirst({
    where: {
      id: catalogExamId,
      status: "PUBLISHED",
      approvalStatus: "APPROVED",
      OR: [{ visibility: "PUBLIC" }, { contributedSchoolId: schoolId }],
    },
    include: {
      subject: { select: { name: true } },
      chapter: { select: { name: true } },
      examQuestions: {
        include: {
          question: {
            select: {
              questionText: true,
              questionType: true,
              difficulty: true,
              bloomLevel: true,
              points: true,
            },
          },
        },
        orderBy: { order: "asc" },
        take: 5,
      },
      _count: { select: { variants: true } },
    },
  })

  if (!exam) return null

  // Check if adopted
  const adopted = await db.schoolExam.findFirst({
    where: { schoolId, catalogExamId },
    select: { id: true },
  })

  return {
    id: exam.id,
    title: exam.title,
    description: exam.description,
    examType: exam.examType,
    durationMinutes: exam.durationMinutes,
    totalMarks: exam.totalMarks,
    passingMarks: exam.passingMarks,
    totalQuestions: exam.totalQuestions,
    distribution: exam.distribution,
    bloomDistribution: exam.bloomDistribution,
    usageCount: exam.usageCount,
    averageScore: exam.averageScore,
    qualityScore: exam.qualityScore,
    ratingCount: exam.ratingCount,
    catalogSubjectName: exam.subject?.name ?? null,
    catalogChapterName: exam.chapter?.name ?? null,
    variantOf: exam.variantOf,
    variantLabel: exam.variantLabel,
    variantCount: exam._count.variants,
    sampleQuestions: exam.examQuestions.map((eq) => ({
      questionText: eq.question.questionText,
      questionType: eq.question.questionType,
      difficulty: eq.question.difficulty,
      bloomLevel: eq.question.bloomLevel,
      points: Number(eq.question.points),
      order: eq.order,
    })),
    isAdopted: !!adopted,
  }
}
