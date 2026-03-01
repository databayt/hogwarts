/**
 * Catalog-Level Exam Generation
 *
 * Pure function that generates a CatalogExam + CatalogExamQuestion records
 * from CatalogExamBlueprint + CatalogQuestion pool.
 * Used by seeds and admin actions.
 */

import type { PrismaClient } from "@prisma/client"

interface GenerateCatalogExamInput {
  catalogSubjectId: string
  examType: string // midterm, final, chapter_test, quiz, practice, diagnostic
  title: string
  description?: string
  chapterId?: string
  lessonId?: string
  blueprintCategory?: string // If not provided, auto-detected from subject
}

interface GenerateCatalogExamResult {
  catalogExamId: string
  questionsUsed: number
  totalMarks: number
  distributionMet: boolean
  missingCategories: string[]
}

/**
 * Generate a CatalogExam from CatalogQuestion pool using blueprint rules.
 * Falls back to simple distribution if no blueprint is found.
 */
export async function generateCatalogExam(
  prisma: PrismaClient,
  input: GenerateCatalogExamInput
): Promise<GenerateCatalogExamResult> {
  // 1. Find or auto-detect blueprint
  let blueprint = null
  if (input.blueprintCategory) {
    blueprint = await prisma.catalogExamBlueprint.findFirst({
      where: { category: input.blueprintCategory, isActive: true },
    })
  }

  // 2. Fetch available catalog questions for this subject scope
  const questionWhere: Record<string, unknown> = {
    catalogSubjectId: input.catalogSubjectId,
    status: "PUBLISHED",
    approvalStatus: "APPROVED",
  }
  if (input.chapterId) questionWhere.catalogChapterId = input.chapterId
  if (input.lessonId) questionWhere.catalogLessonId = input.lessonId

  const questions = await prisma.catalogQuestion.findMany({
    where: questionWhere as any,
    orderBy: [{ usageCount: "asc" }, { createdAt: "desc" }],
  })

  // 3. Build distribution from blueprint or use defaults
  let distribution: Record<string, Record<string, number>>
  let bloomDistribution: Record<string, number> | undefined
  let totalMarks: number
  let durationMinutes: number
  let passingMarks: number

  if (blueprint) {
    const examConfigs = blueprint.examTypeConfigs as Record<
      string,
      {
        duration: number[]
        marks: number[]
        questions: number[]
        passing: number
      }
    >
    const config = examConfigs[input.examType] ||
      examConfigs.quiz || {
        duration: [30, 60],
        marks: [30, 50],
        questions: [10, 20],
        passing: 0.5,
      }

    const totalQ = Math.min(
      Math.round((config.questions[0] + config.questions[1]) / 2),
      questions.length
    )
    totalMarks = Math.round((config.marks[0] + config.marks[1]) / 2)
    durationMinutes = Math.round((config.duration[0] + config.duration[1]) / 2)
    passingMarks = Math.round(totalMarks * config.passing)

    // Build distribution using blueprint weights
    const typeWeights = blueprint.questionTypeWeights as Record<string, number>
    const diffCurves = blueprint.difficultyCurves as Record<
      string,
      Record<string, number>
    >
    const bloomWeights = blueprint.bloomWeights as Record<string, number>

    // Use MIDDLE difficulty curve as default
    const diffCurve = diffCurves.MIDDLE ||
      diffCurves.HIGH || {
        EASY: 0.3,
        MEDIUM: 0.45,
        HARD: 0.25,
      }

    distribution = {}
    let allocated = 0
    for (const [type, weight] of Object.entries(typeWeights)) {
      const typeCount = Math.round(totalQ * weight)
      if (typeCount === 0) continue
      distribution[type] = {}
      for (const [diff, diffWeight] of Object.entries(diffCurve)) {
        const count = Math.max(1, Math.round(typeCount * diffWeight))
        distribution[type][diff] = count
        allocated += count
      }
    }

    // Build Bloom distribution
    bloomDistribution = {}
    for (const [level, weight] of Object.entries(bloomWeights)) {
      bloomDistribution[level] = Math.max(1, Math.round(totalQ * weight))
    }
  } else {
    // Default distribution: simple balanced split
    const totalQ = Math.min(20, questions.length)
    totalMarks = totalQ * 5
    durationMinutes = totalQ * 3
    passingMarks = Math.round(totalMarks * 0.5)

    distribution = {
      MULTIPLE_CHOICE: {
        EASY: Math.ceil(totalQ * 0.3),
        MEDIUM: Math.ceil(totalQ * 0.2),
      },
      SHORT_ANSWER: {
        MEDIUM: Math.ceil(totalQ * 0.2),
        HARD: Math.ceil(totalQ * 0.1),
      },
      ESSAY: { MEDIUM: Math.ceil(totalQ * 0.1), HARD: Math.ceil(totalQ * 0.1) },
    }
  }

  // 4. Select questions based on distribution
  const selectedQuestions: Array<{
    id: string
    order: number
    points: number
  }> = []
  const missingCategories: string[] = []
  const usedIds = new Set<string>()
  let order = 1

  // Points map
  const pointsMap: Record<string, number> = {
    MULTIPLE_CHOICE: 1,
    TRUE_FALSE: 1,
    FILL_BLANK: 2,
    SHORT_ANSWER: 3,
    MATCHING: 2,
    ORDERING: 2,
    MULTI_SELECT: 2,
    ESSAY: 5,
  }
  const diffMultiplier: Record<string, number> = {
    EASY: 1,
    MEDIUM: 1.5,
    HARD: 2,
  }

  for (const [qType, diffs] of Object.entries(distribution)) {
    for (const [diff, count] of Object.entries(diffs)) {
      const matching = questions.filter(
        (q) =>
          q.questionType === qType &&
          q.difficulty === diff &&
          !usedIds.has(q.id)
      )

      const toSelect = Math.min(count, matching.length)
      if (toSelect < count) {
        missingCategories.push(
          `${qType} (${diff}): need ${count}, have ${matching.length}`
        )
      }

      for (let i = 0; i < toSelect; i++) {
        const q = matching[i]
        usedIds.add(q.id)
        const points = (pointsMap[qType] || 1) * (diffMultiplier[diff] || 1)
        selectedQuestions.push({ id: q.id, order: order++, points })
      }
    }
  }

  // 5. Create CatalogExam + CatalogExamQuestion in transaction
  const actualTotalMarks = selectedQuestions.reduce(
    (sum, q) => sum + q.points,
    0
  )

  const catalogExam = await prisma.$transaction(async (tx) => {
    const exam = await tx.catalogExam.create({
      data: {
        subjectId: input.catalogSubjectId,
        chapterId: input.chapterId,
        lessonId: input.lessonId,
        title: input.title,
        description: input.description,
        examType: input.examType,
        durationMinutes,
        totalMarks: Math.round(actualTotalMarks),
        passingMarks,
        totalQuestions: selectedQuestions.length,
        distribution: distribution as any,
        bloomDistribution: bloomDistribution as any,
        approvalStatus: "APPROVED",
        visibility: "PUBLIC",
        status: "PUBLISHED",
      },
    })

    if (selectedQuestions.length > 0) {
      await tx.catalogExamQuestion.createMany({
        data: selectedQuestions.map((sq) => ({
          catalogExamId: exam.id,
          catalogQuestionId: sq.id,
          order: sq.order,
          points: sq.points,
        })),
      })
    }

    return exam
  })

  return {
    catalogExamId: catalogExam.id,
    questionsUsed: selectedQuestions.length,
    totalMarks: Math.round(actualTotalMarks),
    distributionMet: missingCategories.length === 0,
    missingCategories,
  }
}
