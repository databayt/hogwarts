// Auto-Marking System Validation Schemas

import {
  BloomLevel,
  DifficultyLevel,
  GradingMethod,
  MarkingStatus,
  QuestionType,
  SubmissionType,
} from "@prisma/client"
import { z } from "zod"

// ========== Question Bank Schemas ==========

export const questionOptionSchema = z.object({
  text: z.string().min(1, "Option text is required"),
  isCorrect: z.boolean(),
  explanation: z.string().optional(),
})

export const createQuestionSchema = z
  .object({
    subjectId: z.string().min(1, "Subject is required"),
    questionText: z.string().min(10, "Question must be at least 10 characters"),
    questionType: z.nativeEnum(QuestionType),
    difficulty: z.nativeEnum(DifficultyLevel),
    bloomLevel: z.nativeEnum(BloomLevel),
    points: z.number().min(1).max(100),
    timeEstimate: z.number().min(1).optional(),
    options: z.array(questionOptionSchema).optional(),
    acceptedAnswers: z.array(z.string()).optional(),
    sampleAnswer: z.string().optional(),
    tags: z.array(z.string()).optional(),
    explanation: z.string().optional(),
    imageUrl: z.string().url().optional(),
  })
  .refine(
    (data) => {
      // MCQ must have at least 2 options
      if (data.questionType === QuestionType.MULTIPLE_CHOICE) {
        return data.options && data.options.length >= 2
      }
      return true
    },
    {
      message: "Multiple choice questions must have at least 2 options",
      path: ["options"],
    }
  )
  .refine(
    (data) => {
      // MCQ must have at least one correct answer
      if (data.questionType === QuestionType.MULTIPLE_CHOICE) {
        return data.options && data.options.some((opt) => opt.isCorrect)
      }
      return true
    },
    {
      message:
        "Multiple choice questions must have at least one correct answer",
      path: ["options"],
    }
  )
  .refine(
    (data) => {
      // T/F must have exactly 2 options
      if (data.questionType === QuestionType.TRUE_FALSE) {
        return data.options && data.options.length === 2
      }
      return true
    },
    {
      message: "True/False questions must have exactly 2 options",
      path: ["options"],
    }
  )

export const updateQuestionSchema = createQuestionSchema.partial()

// ========== Rubric Schemas ==========

export const rubricCriterionSchema = z.object({
  criterion: z.string().min(3, "Criterion must be at least 3 characters"),
  description: z.string().optional(),
  maxPoints: z.number().min(1).max(100),
  order: z.number().min(0),
})

export const createRubricSchema = z.object({
  questionId: z.string().min(1, "Question is required"),
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  criteria: z
    .array(rubricCriterionSchema)
    .min(1, "At least one criterion is required")
    .max(10, "Maximum 10 criteria allowed"),
})

export const updateRubricSchema = createRubricSchema.partial()

// ========== Student Answer Schemas ==========

export const submitAnswerSchema = z
  .object({
    examId: z.string().min(1, "Exam ID is required"),
    questionId: z.string().min(1, "Question ID is required"),
    submissionType: z.nativeEnum(SubmissionType),
    answerText: z.string().optional(),
    selectedOptionIds: z.array(z.string()).optional(),
    uploadUrl: z.string().url().optional(),
  })
  .refine(
    (data) => {
      // At least one answer field must be provided
      return (
        data.answerText ||
        (data.selectedOptionIds && data.selectedOptionIds.length > 0) ||
        data.uploadUrl
      )
    },
    {
      message: "At least one answer field must be provided",
      path: ["answerText"],
    }
  )

export const bulkSubmitAnswersSchema = z.array(submitAnswerSchema)

// ========== Marking Schemas ==========

export const gradeAnswerSchema = z.object({
  studentAnswerId: z.string().min(1, "Student answer ID is required"),
  pointsAwarded: z.number().min(0),
  maxPoints: z.number().min(1),
  feedback: z.string().optional(),
  gradedBy: z.string().optional(),
})

export const gradeOverrideSchema = z.object({
  markingResultId: z.string().min(1, "Marking result ID is required"),
  newScore: z.number().min(0),
  reason: z.string().min(10, "Reason must be at least 10 characters"),
})

export const bulkGradeSchema = z.object({
  examId: z.string().min(1, "Exam ID is required"),
  studentIds: z.array(z.string()).optional(),
  questionIds: z.array(z.string()).optional(),
  autoGradeOnly: z.boolean().optional(),
})

// ========== Filter Schemas ==========

export const markingFiltersSchema = z.object({
  examId: z.string().optional(),
  studentId: z.string().optional(),
  questionType: z.nativeEnum(QuestionType).optional(),
  difficulty: z.nativeEnum(DifficultyLevel).optional(),
  status: z.nativeEnum(MarkingStatus).optional(),
  gradingMethod: z.nativeEnum(GradingMethod).optional(),
  needsReview: z.boolean().optional(),
  searchQuery: z.string().optional(),
})

export const questionBankFiltersSchema = z.object({
  subjectId: z.string().optional(),
  questionType: z.nativeEnum(QuestionType).optional(),
  difficulty: z.nativeEnum(DifficultyLevel).optional(),
  bloomLevel: z.nativeEnum(BloomLevel).optional(),
  tags: z.array(z.string()).optional(),
  createdBy: z.string().optional(),
  searchQuery: z.string().optional(),
})

// ========== Export/Import Schemas ==========

export const exportMarkingDataSchema = z.object({
  examId: z.string().min(1, "Exam ID is required"),
  format: z.enum(["csv", "pdf", "excel"]),
  includeAnswers: z.boolean().optional(),
  includeFeedback: z.boolean().optional(),
})

export const importQuestionsSchema = z.object({
  subjectId: z.string().min(1, "Subject is required"),
  file: z.instanceof(File),
  format: z.enum(["csv", "json", "qti"]), // QTI = Question & Test Interoperability
})

// ========== Type Inference ==========

export type CreateQuestionFormData = z.infer<typeof createQuestionSchema>
export type UpdateQuestionFormData = z.infer<typeof updateQuestionSchema>
export type CreateRubricFormData = z.infer<typeof createRubricSchema>
export type UpdateRubricFormData = z.infer<typeof updateRubricSchema>
export type SubmitAnswerFormData = z.infer<typeof submitAnswerSchema>
export type GradeAnswerFormData = z.infer<typeof gradeAnswerSchema>
export type GradeOverrideFormData = z.infer<typeof gradeOverrideSchema>
export type BulkGradeFormData = z.infer<typeof bulkGradeSchema>
export type MarkingFiltersData = z.infer<typeof markingFiltersSchema>
export type QuestionBankFiltersData = z.infer<typeof questionBankFiltersSchema>
