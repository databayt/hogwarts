"use server"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

// ============================================================================
// Smart Exam Recommendations
// ============================================================================

export interface ExamRecommendation {
  id: string
  title: string
  examType: string
  catalogSubjectName: string | null
  totalQuestions: number | null
  durationMinutes: number | null
  usageCount: number
  averageScore: number
  relevanceScore: number
  reason: string
}

/**
 * Get exam recommendations for the school.
 * Suggests catalog exams matching school subjects, popular at grade level,
 * and gap-filling for subjects without exams.
 */
export async function getExamRecommendations(
  subjectId?: string
): Promise<ExamRecommendation[]> {
  const { schoolId } = await getTenantContext()
  if (!schoolId) return []

  // Get school's subjects with catalog mappings
  const subjects = await db.subject.findMany({
    where: {
      schoolId,
      catalogSubjectId: { not: null },
      ...(subjectId ? { id: subjectId } : {}),
    },
    select: {
      id: true,
      subjectName: true,
      catalogSubjectId: true,
    },
  })

  if (subjects.length === 0) return []

  const catalogSubjectIds = subjects
    .map((s) => s.catalogSubjectId)
    .filter(Boolean) as string[]

  // Get already-adopted exam IDs
  const adopted = await db.exam.findMany({
    where: { schoolId, catalogExamId: { not: null } },
    select: { catalogExamId: true },
  })
  const adoptedIds = new Set(
    adopted.map((e) => e.catalogExamId).filter(Boolean)
  )

  // Get subjects that already have school exams
  const existingExamSubjects = await db.exam.findMany({
    where: { schoolId },
    select: { subjectId: true },
    distinct: ["subjectId"],
  })
  const subjectsWithExams = new Set(
    existingExamSubjects.map((e) => e.subjectId)
  )

  // Fetch catalog exams for school's subjects
  const catalogExams = await db.catalogExam.findMany({
    where: {
      subjectId: { in: catalogSubjectIds },
      status: "PUBLISHED",
      approvalStatus: "APPROVED",
      visibility: "PUBLIC",
      id: { notIn: Array.from(adoptedIds).filter(Boolean) as string[] },
    },
    include: {
      subject: { select: { name: true } },
      _count: { select: { examQuestions: true } },
    },
    orderBy: [{ usageCount: "desc" }],
    take: 50,
  })

  // Score and rank recommendations
  const recommendations: ExamRecommendation[] = catalogExams.map((exam) => {
    let relevanceScore = 0
    let reason = ""

    // High relevance: subject without any school exams (gap-filling)
    const matchingSubject = subjects.find(
      (s) => s.catalogSubjectId === exam.subjectId
    )
    if (matchingSubject && !subjectsWithExams.has(matchingSubject.id)) {
      relevanceScore += 50
      reason = "No exams yet for this subject"
    }

    // Popularity bonus
    if (exam.usageCount > 10) {
      relevanceScore += 20
      reason = reason || "Popular across schools"
    } else if (exam.usageCount > 5) {
      relevanceScore += 10
    }

    // Quality bonus
    if (exam.averageScore > 70) {
      relevanceScore += 15
      reason = reason || "High average score"
    }

    // Question count bonus (more complete exams rank higher)
    if (exam._count.examQuestions >= 20) {
      relevanceScore += 10
    }

    // Final exam types get priority
    if (exam.examType === "final" || exam.examType === "midterm") {
      relevanceScore += 5
      reason = reason || `${exam.examType} exam available`
    }

    return {
      id: exam.id,
      title: exam.title,
      examType: exam.examType,
      catalogSubjectName: exam.subject?.name ?? null,
      totalQuestions: exam.totalQuestions,
      durationMinutes: exam.durationMinutes,
      usageCount: exam.usageCount,
      averageScore: exam.averageScore,
      relevanceScore,
      reason: reason || "Matches your curriculum",
    }
  })

  // Sort by relevance score
  recommendations.sort((a, b) => b.relevanceScore - a.relevanceScore)

  return recommendations.slice(0, 10)
}
