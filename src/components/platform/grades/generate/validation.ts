/**
 * Grade Generation & Question Bank Validation
 *
 * AI-powered grading and question generation for assessments including:
 * - Question types: 5 types (multiple choice, T/F, fill blank, short answer, essay)
 * - Difficulty levels: Aligned to Bloom's taxonomy (Remember, Understand, Apply, Analyze, Evaluate, Create)
 * - Question banks: Import (100 max), generate with AI (20 max per request)
 * - Exam templates: Distribute questions by type × difficulty matrix (50 distribution cells max)
 * - Analytics: Track question performance (score, time spent, success rate)
 * - Bulk operations: Import CSV/JSON with validation, export with filters
 *
 * Key validation rules:
 * - Question text: Min 10 chars (prevents vague questions)
 * - Points: 0.5-100 scale (granular partial credit, max 1000/exam)
 * - Time estimate: 0-480 minutes (8 hour max, prevents outliers)
 * - Options: MC 2-6 options, T/F exactly 2, ≥1 correct answer required
 * - Answers: Fill-blank case-sensitive toggle, essay grading rubric required
 * - Tags: Metadata for categorization (enables keyword search, analytics)
 * - Distribution: At least one question required (prevents empty exams)
 *
 * Why AI generation:
 * - Teachers create 20 questions at once (batch > one-by-one)
 * - LLM-generated: Reduces prep time, ensures pedagogical quality
 * - Bloom's levels: Questions test different cognitive skills (not just recall)
 * - Randomization: Prevents academic dishonesty (different question per student)
 *
 * Why discriminated union (type-specific schemas):
 * - MC needs options array
 * - T/F needs exactly 2 options
 * - Fill-blank needs acceptedAnswers
 * - Essay needs gradingRubric (human grading)
 * - Can't use single schema; type determines required fields
 */

import { z } from "zod";
import {
  BloomLevel,
  DifficultyLevel,
  QuestionSource,
  QuestionType,
} from "@prisma/client";

// ========== Question Bank Schemas ==========

export const questionOptionSchema = z.object({
  text: z.string().min(1, "Option text is required"),
  isCorrect: z.boolean(),
  explanation: z.string().optional(),
});

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
});

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
});

export const trueFalseSchema = questionBankBaseSchema.extend({
  questionType: z.literal(QuestionType.TRUE_FALSE),
  options: z
    .array(questionOptionSchema)
    .length(2, "True/False must have exactly 2 options")
    .refine(
      (options) => options.some((opt) => opt.isCorrect),
      "One option must be correct"
    ),
});

export const fillBlankSchema = questionBankBaseSchema.extend({
  questionType: z.literal(QuestionType.FILL_BLANK),
  acceptedAnswers: z
    .array(z.string().min(1))
    .min(1, "At least one accepted answer is required"),
  caseSensitive: z.boolean().default(false),
});

export const shortAnswerSchema = questionBankBaseSchema.extend({
  questionType: z.literal(QuestionType.SHORT_ANSWER),
  sampleAnswer: z
    .string()
    .min(10, "Sample answer must be at least 10 characters"),
  gradingRubric: z.string().optional(),
});

export const essaySchema = questionBankBaseSchema.extend({
  questionType: z.literal(QuestionType.ESSAY),
  sampleAnswer: z
    .string()
    .min(50, "Sample answer must be at least 50 characters"),
  gradingRubric: z
    .string()
    .min(20, "Grading rubric must be at least 20 characters"),
});

export const questionBankSchema = z.discriminatedUnion("questionType", [
  multipleChoiceSchema,
  trueFalseSchema,
  fillBlankSchema,
  shortAnswerSchema,
  essaySchema,
]);

export type QuestionBankSchema = z.infer<typeof questionBankSchema>;

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
});

export type AIGenerationSchema = z.infer<typeof aiGenerationSchema>;

// ========== Exam Template Schemas ==========

const distributionCellSchema = z.record(
  z.nativeEnum(DifficultyLevel),
  z.coerce.number().min(0).max(50)
);

const templateDistributionSchema = z.record(
  z.nativeEnum(QuestionType),
  distributionCellSchema
);

const bloomDistributionSchema = z.record(
  z.nativeEnum(BloomLevel),
  z.coerce.number().min(0).max(50)
);

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
      );
      return totalQuestions > 0;
    },
    {
      message: "Template must have at least one question",
      path: ["distribution"],
    }
  );

export type ExamTemplateSchema = z.infer<typeof examTemplateSchema>;

// ========== Exam Generator Schema ==========

export const examGeneratorSchema = z.object({
  examId: z.string().min(1, "Exam is required"),
  templateId: z.string().optional(),
  isRandomized: z.boolean().default(false),
  seed: z.string().optional(),
  customDistribution: templateDistributionSchema.optional(),
  questionIds: z.array(z.string()).optional(),
  generationNotes: z.string().max(500).optional(),
});

export type ExamGeneratorSchema = z.infer<typeof examGeneratorSchema>;

// ========== Bulk Import Schema ==========

export const bulkImportQuestionSchema = questionBankBaseSchema.omit({
  subjectId: true,
});

export const bulkImportSchema = z.object({
  subjectId: z.string().min(1, "Subject is required"),
  source: z.nativeEnum(QuestionSource).default(QuestionSource.IMPORTED),
  questions: z
    .array(bulkImportQuestionSchema)
    .min(1, "At least one question required")
    .max(100, "Maximum 100 questions per import"),
});

export type BulkImportSchema = z.infer<typeof bulkImportSchema>;

// ========== Filter Schemas ==========

export const questionBankFiltersSchema = z.object({
  subjectId: z.string().optional(),
  questionType: z.nativeEnum(QuestionType).optional(),
  difficulty: z.nativeEnum(DifficultyLevel).optional(),
  bloomLevel: z.nativeEnum(BloomLevel).optional(),
  source: z.nativeEnum(QuestionSource).optional(),
  tags: z.array(z.string()).optional(),
  search: z.string().optional(),
});

export type QuestionBankFiltersSchema = z.infer<
  typeof questionBankFiltersSchema
>;

export const templateFiltersSchema = z.object({
  subjectId: z.string().optional(),
  isActive: z.boolean().optional(),
  search: z.string().optional(),
});

export type TemplateFiltersSchema = z.infer<typeof templateFiltersSchema>;

// ========== Update Schemas ==========

export const updateQuestionSchema = z.discriminatedUnion("questionType", [
  multipleChoiceSchema.partial(),
  trueFalseSchema.partial(),
  fillBlankSchema.partial(),
  shortAnswerSchema.partial(),
  essaySchema.partial(),
]).and(z.object({
  id: z.string().min(1, "Question ID is required"),
}));

export type UpdateQuestionSchema = z.infer<typeof updateQuestionSchema>;

export const updateTemplateSchema = examTemplateSchema.partial().extend({
  id: z.string().min(1, "Template ID is required"),
});

export type UpdateTemplateSchema = z.infer<typeof updateTemplateSchema>;

// ========== Analytics Update Schema ==========

export const updateAnalyticsSchema = z.object({
  questionId: z.string().min(1),
  score: z.number().min(0),
  maxPoints: z.number().min(0),
  timeSpent: z.number().min(0).optional(),
});

export type UpdateAnalyticsSchema = z.infer<typeof updateAnalyticsSchema>;

// ========== Helper Functions ==========

export function validateQuestionByType(
  questionType: QuestionType,
  data: unknown
) {
  switch (questionType) {
    case QuestionType.MULTIPLE_CHOICE:
      return multipleChoiceSchema.safeParse(data);
    case QuestionType.TRUE_FALSE:
      return trueFalseSchema.safeParse(data);
    case QuestionType.FILL_BLANK:
      return fillBlankSchema.safeParse(data);
    case QuestionType.SHORT_ANSWER:
      return shortAnswerSchema.safeParse(data);
    case QuestionType.ESSAY:
      return essaySchema.safeParse(data);
    default:
      return { success: false, error: { issues: [{ message: "Invalid question type" }] } };
  }
}

export function validateDistribution(distribution: unknown): {
  isValid: boolean;
  errors: string[];
} {
  const result = templateDistributionSchema.safeParse(distribution);
  if (result.success) {
    return { isValid: true, errors: [] };
  }
  return {
    isValid: false,
    errors: result.error.issues.map((issue) => issue.message),
  };
}
