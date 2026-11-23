// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Question Bank Validation (Exam Module)
 *
 * Comprehensive question bank for exam management with:
 * - 5 question types: Multiple choice, T/F, fill-blank, short answer, essay
 * - Difficulty alignment: Bloom's taxonomy levels (Remember through Create)
 * - Reusability: Questions stored in bank, referenced across multiple exams
 * - Bulk import: Up to 100 questions per import (CSV/JSON validation)
 * - AI generation: Create questions with topic, difficulty, Bloom level
 * - Templates: Distribute questions by type and difficulty (strategy-based)
 * - Conflict resolution: Auto-resolve scheduling conflicts with 4 strategies
 * - Analytics: Update scores and timing for question quality feedback
 *
 * Key patterns:
 * - Discriminated union: Each question type has specific requirements
 * - Base schema: Common fields (subject, text, difficulty, points, tags)
 * - Type-specific: MC=options array, essay=rubric, fill-blank=answers array
 * - Distribution matrix: Record<QuestionType, Record<Difficulty, count>>
 *   Example: { MULTIPLE_CHOICE: { EASY: 5, MEDIUM: 3 }, T/F: { HARD: 2 } }
 *
 * Why templates:
 * - Consistency: All 10-C history exams follow same difficulty distribution
 * - Compliance: 20% easy, 50% medium, 30% hard (educational best practice)
 * - Efficiency: Reuse template 10 times, auto-generate from bank
 *
 * Why filters:
 * - Search: Find questions by subject, type, difficulty, tags
 * - Export: Select subset of questions for specific exam/class
 * - Analytics: Track question effectiveness (by difficulty, type, subject)
 */

import {
  BloomLevel,
  DifficultyLevel,
  QuestionSource,
  QuestionType,
} from "@prisma/client"
import { z } from "zod"

/**
 * Messages come from the dictionary (`exams.qbank.validation`), the same
 * factory pattern as `createLoginSchema` in auth/validation.ts. A missing key
 * leaves zod's own default message — never hard-coded English. The plain
 * exports below are the builders called with `{}`, for server actions that
 * only need pass/fail.
 */
export type QbankValidationMessages = Record<string, string | undefined>

// ========== Question Bank Schemas ==========

export function createQuestionBankSchemas(m: QbankValidationMessages = {}) {
  const questionOptionSchema = z.object({
    text: z.string().min(1, m.optionTextRequired),
    isCorrect: z.boolean(),
    explanation: z.string().optional(),
  })

  const questionBankBaseSchema = z.object({
    subjectId: z.string().min(1, m.subjectRequired),
    questionText: z.string().min(10, m.questionMin),
    questionType: z.nativeEnum(QuestionType),
    difficulty: z.nativeEnum(DifficultyLevel),
    bloomLevel: z.nativeEnum(BloomLevel),
    points: z.coerce.number().min(0.5).max(100),
    timeEstimate: z.coerce.number().min(0).max(480).optional(),
    tags: z.array(z.string()).default([]),
    explanation: z.string().optional(),
    imageUrl: z.string().url().optional().or(z.literal("")),
  })

  const multipleChoiceSchema = questionBankBaseSchema.extend({
    questionType: z.literal(QuestionType.MULTIPLE_CHOICE),
    options: z
      .array(questionOptionSchema)
      .min(2, m.optionsMin2)
      .max(6, m.optionsMax6)
      .refine(
        (options) => options.some((opt) => opt.isCorrect),
        m.correctRequired
      ),
  })

  const trueFalseSchema = questionBankBaseSchema.extend({
    questionType: z.literal(QuestionType.TRUE_FALSE),
    options: z
      .array(questionOptionSchema)
      .length(2, m.trueFalseTwo)
      .refine(
        (options) => options.some((opt) => opt.isCorrect),
        m.trueFalseCorrect
      ),
  })

  const fillBlankSchema = questionBankBaseSchema.extend({
    questionType: z.literal(QuestionType.FILL_BLANK),
    acceptedAnswers: z.array(z.string().min(1)).min(1, m.acceptedMin),
    caseSensitive: z.boolean().default(false),
  })

  const shortAnswerSchema = questionBankBaseSchema.extend({
    questionType: z.literal(QuestionType.SHORT_ANSWER),
    sampleAnswer: z.string().min(10, m.sampleMin10),
    gradingRubric: z.string().optional(),
  })

  const essaySchema = questionBankBaseSchema.extend({
    questionType: z.literal(QuestionType.ESSAY),
    sampleAnswer: z.string().min(50, m.sampleMin50),
    gradingRubric: z.string().min(20, m.rubricMin20),
  })

  const matchingSchema = questionBankBaseSchema.extend({
    questionType: z.literal(QuestionType.MATCHING),
    options: z
      .array(questionOptionSchema)
      .min(2, m.pairsMin2)
      .max(10, m.pairsMax10),
  })

  const orderingSchema = questionBankBaseSchema.extend({
    questionType: z.literal(QuestionType.ORDERING),
    options: z
      .array(questionOptionSchema)
      .min(2, m.itemsMin2)
      .max(10, m.itemsMax10),
  })

  const multiSelectSchema = questionBankBaseSchema.extend({
    questionType: z.literal(QuestionType.MULTI_SELECT),
    options: z
      .array(questionOptionSchema)
      .min(2, m.optionsMin2)
      .max(8, m.optionsMax8)
      .refine(
        (options) => options.filter((opt) => opt.isCorrect).length >= 2,
        m.twoCorrect
      ),
  })

  const questionBankSchema = z.discriminatedUnion("questionType", [
    multipleChoiceSchema,
    trueFalseSchema,
    fillBlankSchema,
    shortAnswerSchema,
    essaySchema,
    matchingSchema,
    orderingSchema,
    multiSelectSchema,
  ])

  return {
    questionOptionSchema,
    questionBankBaseSchema,
    multipleChoiceSchema,
    trueFalseSchema,
    fillBlankSchema,
    shortAnswerSchema,
    essaySchema,
    matchingSchema,
    orderingSchema,
    multiSelectSchema,
    questionBankSchema,
  }
}

/** The form's resolver schema, with dictionary messages. */
export function createQuestionBankSchema(m: QbankValidationMessages = {}) {
  return createQuestionBankSchemas(m).questionBankSchema
}

const defaultSchemas = createQuestionBankSchemas({})

export const questionOptionSchema = defaultSchemas.questionOptionSchema
export const questionBankBaseSchema = defaultSchemas.questionBankBaseSchema
export const multipleChoiceSchema = defaultSchemas.multipleChoiceSchema
export const trueFalseSchema = defaultSchemas.trueFalseSchema
export const fillBlankSchema = defaultSchemas.fillBlankSchema
export const shortAnswerSchema = defaultSchemas.shortAnswerSchema
export const essaySchema = defaultSchemas.essaySchema
export const matchingSchema = defaultSchemas.matchingSchema
export const orderingSchema = defaultSchemas.orderingSchema
export const multiSelectSchema = defaultSchemas.multiSelectSchema
export const questionBankSchema = defaultSchemas.questionBankSchema

export type QuestionBankSchema = z.infer<typeof questionBankSchema>

// ========== AI Generation Schema ==========

export function createAiGenerationSchema(m: QbankValidationMessages = {}) {
  return z.object({
    subjectId: z.string().min(1, m.subjectRequired),
    topic: z.string().min(3, m.topicMin3),
    questionType: z.nativeEnum(QuestionType),
    difficulty: z.nativeEnum(DifficultyLevel),
    bloomLevel: z.nativeEnum(BloomLevel),
    numberOfQuestions: z.coerce
      .number()
      .min(1, m.questionsMin1)
      .max(20, m.questionsMax20),
    additionalInstructions: z.string().max(500).optional(),
    tags: z.array(z.string()).default([]),
  })
}

export const aiGenerationSchema = createAiGenerationSchema({})

export type AIGenerationSchema = z.infer<typeof aiGenerationSchema>

// ========== Exam Template Schemas ==========

// Zod 4 made `z.record(enumKey, …)` EXHAUSTIVE — it demands every member of the
// enum. A distribution names only the buckets a blueprint actually asks for
// ("5 easy multiple-choice"), so under `z.record` every realistic one was
// rejected and blueprint create/update threw. `partialRecord` is Zod 4's name
// for the old behaviour, and still rejects a key that is not in the enum.
const distributionCellSchema = z.partialRecord(
  z.nativeEnum(DifficultyLevel),
  z.coerce.number().min(0).max(50)
)

const templateDistributionSchema = z.partialRecord(
  z.nativeEnum(QuestionType),
  distributionCellSchema
)

const bloomDistributionSchema = z.partialRecord(
  z.nativeEnum(BloomLevel),
  z.coerce.number().min(0).max(50)
)

export function createExamTemplateSchema(m: QbankValidationMessages = {}) {
  return z
    .object({
      name: z.string().min(3, m.nameMin3),
      description: z.string().max(500).optional(),
      subjectId: z.string().min(1, m.subjectRequired),
      duration: z.coerce
        .number()
        .min(15, m.durationMin)
        .max(480, m.durationMax),
      totalMarks: z.coerce.number().min(1).max(1000),
      distribution: templateDistributionSchema,
      bloomDistribution: bloomDistributionSchema.optional(),
    })
    .refine(
      (data) => {
        // Ensure at least one question type has questions
        const totalQuestions = Object.values(data.distribution).reduce(
          (sum, difficulties) =>
            sum +
            Object.values(difficulties).reduce((s, count) => s + count, 0),
          0
        )
        return totalQuestions > 0
      },
      {
        message: m.templateNeedsQuestion,
        path: ["distribution"],
      }
    )
}

export const examTemplateSchema = createExamTemplateSchema({})

export type ExamTemplateSchema = z.infer<typeof examTemplateSchema>

// ========== Exam Generator Schema ==========

export function createExamGeneratorSchema(m: QbankValidationMessages = {}) {
  return z.object({
    examId: z.string().min(1, m.examRequired),
    templateId: z.string().optional(),
    isRandomized: z.boolean().default(false),
    seed: z.string().optional(),
    customDistribution: templateDistributionSchema.optional(),
    questionIds: z.array(z.string()).optional(),
    generationNotes: z.string().max(500).optional(),
  })
}

export const examGeneratorSchema = createExamGeneratorSchema({})

export type ExamGeneratorSchema = z.infer<typeof examGeneratorSchema>

// ========== Bulk Import Schema ==========

export const bulkImportQuestionSchema = questionBankBaseSchema.omit({
  subjectId: true,
})

export function createBulkImportSchema(m: QbankValidationMessages = {}) {
  return z.object({
    subjectId: z.string().min(1, m.subjectRequired),
    source: z.nativeEnum(QuestionSource).default(QuestionSource.IMPORTED),
    questions: z
      .array(bulkImportQuestionSchema)
      .min(1, m.importMin1)
      .max(100, m.importMax100),
  })
}

export const bulkImportSchema = createBulkImportSchema({})

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

export const updateQuestionSchema = questionBankBaseSchema.partial().extend({
  id: z.string().min(1),
  options: z.array(questionOptionSchema).optional(),
  acceptedAnswers: z.array(z.string().min(1)).optional(),
  caseSensitive: z.boolean().optional(),
  sampleAnswer: z.string().optional(),
  gradingRubric: z.string().optional(),
})

export type UpdateQuestionSchema = z.infer<typeof updateQuestionSchema>

export const updateTemplateSchema = examTemplateSchema.partial().extend({
  id: z.string().min(1),
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
    case QuestionType.MATCHING:
      return matchingSchema.safeParse(data)
    case QuestionType.ORDERING:
      return orderingSchema.safeParse(data)
    case QuestionType.MULTI_SELECT:
      return multiSelectSchema.safeParse(data)
    default:
      return {
        success: false,
        error: { issues: [{ message: "invalidType" }] },
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
