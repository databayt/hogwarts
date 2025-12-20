"use server"

/**
 * Paper Generation Server Actions
 * Generate exam papers and answer keys as PDFs
 */
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

import { db } from "@/lib/db"

import { getVersionCode } from "../config"
import type {
  AnswerKeyEntry,
  ExamPaperData,
  QuestionForPaper,
  QuestionOption,
  SchoolForPaper,
} from "../types"
import { getOrCreatePaperConfig } from "./paper-config"
import type {
  ActionResult,
  GenerateAnswerKeyInput,
  GenerateAnswerKeyOutput,
  GeneratePaperInput,
  GeneratePaperOutput,
  GenerateVersionsInput,
  GenerateVersionsOutput,
} from "./types"

// ============================================================================
// HELPER: Transform Question Data
// ============================================================================

function transformQuestionForPaper(genQuestion: {
  order: number
  points: number | { toNumber: () => number }
  question: {
    id: string
    questionText: string
    questionType: string
    difficulty: string
    bloomLevel: string
    timeEstimate: number | null
    imageUrl: string | null
    options: unknown
    sampleAnswer: string | null
    gradingRubric: string | null
    explanation: string | null
  }
}): QuestionForPaper {
  const q = genQuestion.question

  // Parse options based on question type
  let options: QuestionOption[] | undefined
  let acceptedAnswers: string[] | undefined

  if (q.questionType === "MULTIPLE_CHOICE" || q.questionType === "TRUE_FALSE") {
    options = Array.isArray(q.options)
      ? (q.options as QuestionOption[])
      : undefined
  } else if (q.questionType === "FILL_BLANK" && q.options) {
    const fillOptions = q.options as { acceptedAnswers?: string[] }
    acceptedAnswers = fillOptions.acceptedAnswers
  }

  return {
    id: q.id,
    order: genQuestion.order,
    questionText: q.questionText,
    questionType: q.questionType as QuestionForPaper["questionType"],
    difficulty: q.difficulty as QuestionForPaper["difficulty"],
    bloomLevel: q.bloomLevel as QuestionForPaper["bloomLevel"],
    points:
      typeof genQuestion.points === "object"
        ? genQuestion.points.toNumber()
        : Number(genQuestion.points),
    timeEstimate: q.timeEstimate,
    imageUrl: q.imageUrl,
    options,
    acceptedAnswers,
    sampleAnswer: q.sampleAnswer,
    gradingRubric: q.gradingRubric,
    explanation: q.explanation,
  }
}

// ============================================================================
// HELPER: Shuffle Array (Fisher-Yates)
// ============================================================================

function shuffleArray<T>(array: T[], seed?: string): T[] {
  const result = [...array]

  // Simple seeded random (for reproducibility)
  let random = () => Math.random()
  if (seed) {
    let hash = 0
    for (let i = 0; i < seed.length; i++) {
      hash = (hash << 5) - hash + seed.charCodeAt(i)
      hash |= 0
    }
    random = () => {
      hash = (hash * 1103515245 + 12345) & 0x7fffffff
      return hash / 0x7fffffff
    }
  }

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }

  return result
}

// ============================================================================
// GENERATE EXAM PAPER
// ============================================================================

export async function generateExamPaper(
  input: GeneratePaperInput
): Promise<ActionResult<GeneratePaperOutput>> {
  try {
    const session = await auth()
    const schoolId = session?.user?.schoolId
    const userId = session?.user?.id

    if (!schoolId || !userId) {
      return { success: false, error: "Unauthorized", code: "UNAUTHORIZED" }
    }

    // Get or create paper config
    const configResult = await getOrCreatePaperConfig(input.generatedExamId)
    if (!configResult.success) {
      return configResult
    }

    const config = configResult.data

    // Fetch full exam data
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

    // Fetch school data
    const school = await db.school.findUnique({
      where: { id: schoolId },
      include: { branding: true },
    })

    if (!school) {
      return {
        success: false,
        error: "School not found",
        code: "NOT_FOUND",
      }
    }

    // Transform questions
    let questions = generatedExam.questions.map(transformQuestionForPaper)

    // Shuffle if configured
    const seed = input.versionCode || new Date().toISOString()
    if (config.shuffleQuestions) {
      questions = shuffleArray(questions, seed)
      // Re-number after shuffle
      questions = questions.map((q, idx) => ({ ...q, order: idx + 1 }))
    }

    if (config.shuffleOptions) {
      questions = questions.map((q) => {
        if (q.options && q.options.length > 0) {
          return { ...q, options: shuffleArray(q.options, `${seed}-${q.id}`) }
        }
        return q
      })
    }

    // Calculate metadata
    const totalMarks = questions.reduce((sum, q) => sum + q.points, 0)
    const totalQuestions = questions.length

    // Build paper data (for PDF generation - would use react-pdf in actual implementation)
    const _paperData: ExamPaperData = {
      exam: {
        ...generatedExam.exam,
        class: generatedExam.exam.class,
        subject: generatedExam.exam.subject,
      },
      school: {
        id: school.id,
        name: school.name,
        logoUrl: school.logoUrl,
        address: school.address,
        phoneNumber: school.phoneNumber,
        email: school.email,
        branding: school.branding,
      } as SchoolForPaper,
      questions,
      config: config as unknown as ExamPaperData["config"],
      metadata: {
        locale: "en", // TODO: Get from user preferences
        generatedAt: new Date(),
        generatedBy: userId,
        versionCode: input.versionCode,
        totalPages: Math.ceil(questions.length / 10) + 1,
        totalMarks,
        totalQuestions,
        duration: generatedExam.exam.duration,
      },
    }

    // Store question order and option order for this version
    const questionOrder = questions.map((q) => q.id)
    const optionOrder = config.shuffleOptions
      ? questions.reduce(
          (acc, q) => {
            if (q.options) {
              acc[q.id] = q.options.map((_, idx) => idx)
            }
            return acc
          },
          {} as Record<string, number[]>
        )
      : null

    // Create generated paper record
    const paper = await db.generatedPaper.create({
      data: {
        schoolId,
        configId: config.id,
        versionCode: input.versionCode,
        questionOrder,
        optionOrder,
        generatedBy: userId,
        // pdfUrl would be set after actual PDF generation and upload
      },
    })

    revalidatePath(`/exams/paper/${input.generatedExamId}`)

    return {
      success: true,
      data: {
        paperId: paper.id,
        pdfUrl: paper.pdfUrl ?? undefined,
        versionCode: paper.versionCode ?? undefined,
        questionCount: totalQuestions,
      },
    }
  } catch (error) {
    console.error("Error generating exam paper:", error)
    return {
      success: false,
      error: "Failed to generate exam paper",
      code: "GENERATION_FAILED",
    }
  }
}

// ============================================================================
// GENERATE ANSWER KEY
// ============================================================================

export async function generateAnswerKey(
  input: GenerateAnswerKeyInput
): Promise<ActionResult<GenerateAnswerKeyOutput>> {
  try {
    const session = await auth()
    const schoolId = session?.user?.schoolId
    const userId = session?.user?.id

    if (!schoolId || !userId) {
      return { success: false, error: "Unauthorized", code: "UNAUTHORIZED" }
    }

    // Check if answer key already exists
    const existing = await db.examAnswerKey.findUnique({
      where: { generatedExamId: input.generatedExamId },
    })

    if (existing) {
      // Return existing answer key
      return {
        success: true,
        data: {
          answerKeyId: existing.id,
          pdfUrl: existing.pdfUrl ?? undefined,
          answers: existing.answers as unknown as AnswerKeyEntry[],
        },
      }
    }

    // Fetch generated exam with questions
    const generatedExam = await db.generatedExam.findFirst({
      where: {
        id: input.generatedExamId,
        schoolId,
      },
      include: {
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

    // Build answer key entries
    const answers: AnswerKeyEntry[] = generatedExam.questions.map((gq) => {
      const q = gq.question
      let correctAnswer: string | string[] = ""

      switch (q.questionType) {
        case "MULTIPLE_CHOICE": {
          const options = q.options as QuestionOption[] | null
          if (options) {
            const correctOption = options.find((o) => o.isCorrect)
            const correctIndex = options.findIndex((o) => o.isCorrect)
            correctAnswer = correctOption
              ? `${String.fromCharCode(65 + correctIndex)}. ${correctOption.text}`
              : ""
          }
          break
        }

        case "TRUE_FALSE": {
          const options = q.options as QuestionOption[] | null
          if (options) {
            const correctOption = options.find((o) => o.isCorrect)
            correctAnswer = correctOption?.text ?? ""
          }
          break
        }

        case "FILL_BLANK": {
          const fillOptions = q.options as { acceptedAnswers?: string[] } | null
          correctAnswer = fillOptions?.acceptedAnswers ?? []
          break
        }

        case "SHORT_ANSWER":
        case "ESSAY":
          correctAnswer = q.sampleAnswer ?? ""
          break
      }

      return {
        questionId: q.id,
        order: gq.order,
        questionType: q.questionType as AnswerKeyEntry["questionType"],
        questionText: q.questionText,
        correctAnswer,
        points:
          typeof gq.points === "object"
            ? (gq.points as { toNumber: () => number }).toNumber()
            : Number(gq.points),
        explanation: q.explanation,
      }
    })

    // Create answer key record
    const answerKey = await db.examAnswerKey.create({
      data: {
        schoolId,
        generatedExamId: input.generatedExamId,
        answers,
        generatedBy: userId,
      },
    })

    revalidatePath(`/exams/paper/${input.generatedExamId}`)

    return {
      success: true,
      data: {
        answerKeyId: answerKey.id,
        pdfUrl: answerKey.pdfUrl ?? undefined,
        answers,
      },
    }
  } catch (error) {
    console.error("Error generating answer key:", error)
    return {
      success: false,
      error: "Failed to generate answer key",
      code: "GENERATION_FAILED",
    }
  }
}

// ============================================================================
// GENERATE MULTIPLE VERSIONS
// ============================================================================

export async function generateMultipleVersions(
  input: GenerateVersionsInput
): Promise<ActionResult<GenerateVersionsOutput>> {
  try {
    const session = await auth()
    const schoolId = session?.user?.schoolId

    if (!schoolId) {
      return { success: false, error: "Unauthorized", code: "UNAUTHORIZED" }
    }

    // Validate version count
    if (input.versionCount < 1 || input.versionCount > 5) {
      return {
        success: false,
        error: "Version count must be between 1 and 5",
        code: "INVALID_INPUT",
      }
    }

    // Generate answer key first
    const answerKeyResult = await generateAnswerKey({
      generatedExamId: input.generatedExamId,
    })

    if (!answerKeyResult.success) {
      return answerKeyResult as ActionResult<GenerateVersionsOutput>
    }

    // Generate each version
    const papers: GeneratePaperOutput[] = []

    for (let i = 0; i < input.versionCount; i++) {
      const versionCode = getVersionCode(i)

      const paperResult = await generateExamPaper({
        generatedExamId: input.generatedExamId,
        versionCode,
      })

      if (paperResult.success) {
        papers.push(paperResult.data)
      } else {
        // Log but continue with other versions
        console.warn(
          `Failed to generate version ${versionCode}:`,
          paperResult.error
        )
      }
    }

    if (papers.length === 0) {
      return {
        success: false,
        error: "Failed to generate any paper versions",
        code: "GENERATION_FAILED",
      }
    }

    return {
      success: true,
      data: {
        papers,
        answerKeyId: answerKeyResult.data.answerKeyId,
      },
    }
  } catch (error) {
    console.error("Error generating multiple versions:", error)
    return {
      success: false,
      error: "Failed to generate paper versions",
      code: "GENERATION_FAILED",
    }
  }
}

// ============================================================================
// GET PAPER DATA (for preview)
// ============================================================================

export async function getPaperData(
  generatedExamId: string,
  versionCode?: string
): Promise<ActionResult<ExamPaperData>> {
  try {
    const session = await auth()
    const schoolId = session?.user?.schoolId
    const userId = session?.user?.id

    if (!schoolId || !userId) {
      return { success: false, error: "Unauthorized", code: "UNAUTHORIZED" }
    }

    // Get paper config
    const configResult = await getOrCreatePaperConfig(generatedExamId)
    if (!configResult.success) {
      return configResult
    }

    const config = configResult.data

    // Fetch generated exam
    const generatedExam = await db.generatedExam.findFirst({
      where: {
        id: generatedExamId,
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

    // Fetch school
    const school = await db.school.findUnique({
      where: { id: schoolId },
      include: { branding: true },
    })

    if (!school) {
      return {
        success: false,
        error: "School not found",
        code: "NOT_FOUND",
      }
    }

    // Transform questions
    let questions = generatedExam.questions.map(transformQuestionForPaper)

    // Apply shuffling if configured
    const seed = versionCode || "preview"
    if (config.shuffleQuestions) {
      questions = shuffleArray(questions, seed)
      questions = questions.map((q, idx) => ({ ...q, order: idx + 1 }))
    }

    if (config.shuffleOptions) {
      questions = questions.map((q) => {
        if (q.options && q.options.length > 0) {
          return { ...q, options: shuffleArray(q.options, `${seed}-${q.id}`) }
        }
        return q
      })
    }

    // Calculate metadata
    const totalMarks = questions.reduce((sum, q) => sum + q.points, 0)
    const totalQuestions = questions.length

    const paperData: ExamPaperData = {
      exam: {
        ...generatedExam.exam,
        class: generatedExam.exam.class,
        subject: generatedExam.exam.subject,
      },
      school: {
        id: school.id,
        name: school.name,
        logoUrl: school.logoUrl,
        address: school.address,
        phoneNumber: school.phoneNumber,
        email: school.email,
        branding: school.branding,
      } as SchoolForPaper,
      questions,
      config: config as unknown as ExamPaperData["config"],
      metadata: {
        locale: "en",
        generatedAt: new Date(),
        generatedBy: userId,
        versionCode,
        totalPages: Math.ceil(questions.length / 10) + 1,
        totalMarks,
        totalQuestions,
        duration: generatedExam.exam.duration,
      },
    }

    return { success: true, data: paperData }
  } catch (error) {
    console.error("Error fetching paper data:", error)
    return {
      success: false,
      error: "Failed to fetch paper data",
      code: "FETCH_FAILED",
    }
  }
}
