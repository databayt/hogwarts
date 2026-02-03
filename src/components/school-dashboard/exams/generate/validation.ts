/**
 * Exam Generation Validation
 *
 * Exam paper generation and question selection for assessment creation:
 * - Template-based generation: Reuse distribution templates across exams
 * - Custom selection: Pick specific questions or use templates
 * - Randomization: Shuffle question order + optional seed for reproducibility
 * - Conflict resolution: 4 strategies for scheduling conflicts
 *   - prefer_senior_teacher: Assign experienced teachers first
 *   - prefer_larger_class: Prioritize classes with more students
 *   - prefer_core_subjects: Math/English over electives
 *   - distribute_evenly: Balance workload across teachers
 * - Dry-run mode: Preview changes before applying
 * - Exam duration: 15-480 minutes (15min quizzes to 8hr exams)
 * - Total marks: 1-1000 (flexible grading scales)
 *
 * Why templates + custom:
 * - Template: Fast (reuse, consistency) for regular exams
 * - Custom: Flexibility for supplementary/makeup exams
 * - Randomization: Prevents cheating (different question order per student)
 * - Seed: Deterministic shuffle (reconstruct exam if needed)
 *
 * Why dry-run:
 * - Conflict resolution moves 10+ questions
 * - Preview before applying → catch scheduling impossibilities
 * - Example: 5 teachers × 1 period = impossible for 20 classes
 *
 * Note: Partial update schema commented (discriminated union limitation)
 * - TODO: Make each question type partially updatable separately
 */

import {
  BloomLevel,
  DifficultyLevel,
  QuestionSource,
  QuestionType,
} from "@prisma/client"
import { z } from "zod"

// ========== Question Bank Schemas ==========

export const questionOptionSchema = z.object({
  text: z.string().min(1, "Option text is required"),
  isCorrect: z.boolean(),
  explanation: z.string().optional(),
})

export const questionBankBaseSchema = z.object({
  subjectId: z.string().min(1, "Subject is required"),
  questionText: z.string().min(10, "Question must be at least 10 characters"),
  questionType: z.nativeEnum(QuestionType),
  difficulty: z.nativeEnum(DifficultyLevel),
  bloomLevel: z.nativeEnum(BloomLevel),
  points: z.coerce.number().min(0.5).max(100),
  timeEstimate: z.coerce.number().min(0).max(480).optional(),
  tags: z.array(z.string()).default([]),
  explanation: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
})

export const multipleChoiceSchema = questionBankBaseSchema.extend({
  questionType: z.literal(QuestionType.MULTIPLE_CHOICE),
  options: z
    .array(questionOptionSchema)
    .min(2, "At least 2 options required")
    .max(6, "Maximum 6 options allowed")
    .refine(
      (options) => options.some((opt) => opt.isCorrect),
      "At least one correct answer is required"
    ),
})

export const trueFalseSchema = questionBankBaseSchema.extend({
  questionType: z.literal(QuestionType.TRUE_FALSE),
  options: z
    .array(questionOptionSchema)
    .length(2, "True/False must have exactly 2 options")
    .refine(
      (options) => options.some((opt) => opt.isCorrect),
      "One option must be correct"
    ),
})

export const fillBlankSchema = questionBankBaseSchema.extend({
  questionType: z.literal(QuestionType.FILL_BLANK),
  acceptedAnswers: z
    .array(z.string().min(1))
    .min(1, "At least one accepted answer is required"),
  caseSensitive: z.boolean().default(false),
})

export const shortAnswerSchema = questionBankBaseSchema.extend({
  questionType: z.literal(QuestionType.SHORT_ANSWER),
  sampleAnswer: z
    .string()
    .min(10, "Sample answer must be at least 10 characters"),
  gradingRubric: z.string().optional(),
})

export const essaySchema = questionBankBaseSchema.extend({
  questionType: z.literal(QuestionType.ESSAY),
  sampleAnswer: z
    .string()
    .min(50, "Sample answer must be at least 50 characters"),
  gradingRubric: z
    .string()
    .min(20, "Grading rubric must be at least 20 characters"),
})

export const questionBankSchema = z.discriminatedUnion("questionType", [
  multipleChoiceSchema,
  trueFalseSchema,
  fillBlankSchema,
  shortAnswerSchema,
  essaySchema,
])

export type QuestionBankSchema = z.infer<typeof questionBankSchema>

// ========== AI Generation Schema ==========

export const aiGenerationSchema = z.object({
  subjectId: z.string().min(1, "Subject is required"),
  topic: z.string().min(3, "Topic must be at least 3 characters"),
  questionType: z.nativeEnum(QuestionType),
  difficulty: z.nativeEnum(DifficultyLevel),
  bloomLevel: z.nativeEnum(BloomLevel),
  numberOfQuestions: z.coerce
    .number()
    .min(1, "At least 1 question")
    .max(20, "Maximum 20 questions at once"),
  additionalInstructions: z.string().max(500).optional(),
  tags: z.array(z.string()).default([]),
})

export type AIGenerationSchema = z.infer<typeof aiGenerationSchema>

// ========== Exam Template Schemas ==========

const distributionCellSchema = z.record(
  z.nativeEnum(DifficultyLevel),
  z.coerce.number().min(0).max(50)
)

const templateDistributionSchema = z.record(
  z.nativeEnum(QuestionType),
  distributionCellSchema
)

const bloomDistributionSchema = z.record(
  z.nativeEnum(BloomLevel),
  z.coerce.number().min(0).max(50)
)

export const examTemplateSchema = z
  .object({
    name: z.string().min(3, "Name must be at least 3 characters"),
    description: z.string().max(500).optional(),
    subjectId: z.string().min(1, "Subject is required"),
    duration: z.coerce
      .number()
      .min(15, "Minimum 15 minutes")
      .max(480, "Maximum 8 hours"),
    totalMarks: z.coerce.number().min(1).max(1000),
    distribution: templateDistributionSchema,
    bloomDistribution: bloomDistributionSchema.optional(),
  })
  .refine(
    (data) => {
      // Ensure at least one question type has questions
      const totalQuestions = Object.values(data.distribution).reduce(
        (sum, difficulties) =>
          sum + Object.values(difficulties).reduce((s, count) => s + count, 0),
        0
      )
      return totalQuestions > 0
    },
    {
      message: "Template must have at least one question",
      path: ["distribution"],
    }
  )

export type ExamTemplateSchema = z.infer<typeof examTemplateSchema>

// ========== Exam Generator Schema ==========

export const examGeneratorSchema = z.object({
  examId: z.string().min(1, "Exam is required"),
  templateId: z.string().optional(),
  isRandomized: z.boolean().default(false),
  seed: z.string().optional(),
  customDistribution: templateDistributionSchema.optional(),
  questionIds: z.array(z.string()).optional(),
  generationNotes: z.string().max(500).optional(),
})

export type ExamGeneratorSchema = z.infer<typeof examGeneratorSchema>

// ========== Bulk Import Schema ==========

export const bulkImportQuestionSchema = questionBankBaseSchema.omit({
  subjectId: true,
})

export const bulkImportSchema = z.object({
  subjectId: z.string().min(1, "Subject is required"),
  source: z.nativeEnum(QuestionSource).default(QuestionSource.IMPORTED),
  questions: z
    .array(bulkImportQuestionSchema)
    .min(1, "At least one question required")
    .max(100, "Maximum 100 questions per import"),
})

export type BulkImportSchema = z.infer<typeof bulkImportSchema>

// ========== Filter Schemas ==========

export const questionBankFiltersSchema = z.object({
  subjectId: z.string().optional(),
  questionType: z.nativeEnum(QuestionType).optional(),
  difficulty: z.nativeEnum(DifficultyLevel).optional(),
  bloomLevel: z.nativeEnum(BloomLevel).optional(),
  source: z.nativeEnum(QuestionSource).optional(),
  tags: z.array(z.string()).optional(),
  search: z.string().optional(),
})

export type QuestionBankFiltersSchema = z.infer<
  typeof questionBankFiltersSchema
>

export const templateFiltersSchema = z.object({
  subjectId: z.string().optional(),
  isActive: z.boolean().optional(),
  search: z.string().optional(),
})

export type TemplateFiltersSchema = z.infer<typeof templateFiltersSchema>

// ========== Update Schemas ==========

// TODO: Fix this - .partial() doesn't work on discriminated unions
// Need to make each variant partial individually
// export const updateQuestionSchema = questionBankSchema.partial().extend({
//   id: z.string().min(1, "Question ID is required"),
// });
// export type UpdateQuestionSchema = z.infer<typeof updateQuestionSchema>;

export const updateTemplateSchema = examTemplateSchema.partial().extend({
  id: z.string().min(1, "Template ID is required"),
})

export type UpdateTemplateSchema = z.infer<typeof updateTemplateSchema>

// ========== Analytics Update Schema ==========

export const updateAnalyticsSchema = z.object({
  questionId: z.string().min(1),
  score: z.number().min(0),
  maxPoints: z.number().min(0),
  timeSpent: z.number().min(0).optional(),
})

export type UpdateAnalyticsSchema = z.infer<typeof updateAnalyticsSchema>

// ========== Helper Functions ==========

export function validateQuestionByType(
  questionType: QuestionType,
  data: unknown
) {
  switch (questionType) {
    case QuestionType.MULTIPLE_CHOICE:
      return multipleChoiceSchema.safeParse(data)
    case QuestionType.TRUE_FALSE:
      return trueFalseSchema.safeParse(data)
    case QuestionType.FILL_BLANK:
      return fillBlankSchema.safeParse(data)
    case QuestionType.SHORT_ANSWER:
      return shortAnswerSchema.safeParse(data)
    case QuestionType.ESSAY:
      return essaySchema.safeParse(data)
    default:
      return {
        success: false,
        error: { issues: [{ message: "Invalid question type" }] },
      }
  }
}

export function validateDistribution(distribution: unknown): {
  isValid: boolean
  errors: string[]
} {
  const result = templateDistributionSchema.safeParse(distribution)
  if (result.success) {
    return { isValid: true, errors: [] }
  }
  return {
    isValid: false,
    errors: result.error.issues.map((issue) => issue.message),
  }
}
