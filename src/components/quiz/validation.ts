// Quiz Module Validation Schemas

import { z } from "zod";
import { quizSettings } from "./config";

// ============================================
// Enum Schemas
// ============================================

export const questionTypeSchema = z.enum([
  "MULTIPLE_CHOICE",
  "TRUE_FALSE",
  "SHORT_ANSWER",
  "ESSAY",
  "FILL_BLANK",
]);

export const difficultyLevelSchema = z.enum(["EASY", "MEDIUM", "HARD"]);

export const bloomLevelSchema = z.enum([
  "REMEMBER",
  "UNDERSTAND",
  "APPLY",
  "ANALYZE",
  "EVALUATE",
  "CREATE",
]);

export const quizGameTypeSchema = z.enum([
  "PRACTICE",
  "TIMED",
  "CHALLENGE",
  "TOURNAMENT",
]);

export const quizGameStatusSchema = z.enum([
  "IN_PROGRESS",
  "COMPLETED",
  "ABANDONED",
]);

// ============================================
// Question Option Schema
// ============================================

export const questionOptionSchema = z.object({
  id: z.string().optional(),
  text: z.string().min(1, "Option text is required"),
  isCorrect: z.boolean(),
  explanation: z.string().optional(),
});

export const fillBlankConfigSchema = z.object({
  acceptedAnswers: z.array(z.string()).min(1, "At least one answer required"),
  caseSensitive: z.boolean().default(false),
});

// ============================================
// Quiz Creation Schemas
// ============================================

export const quizCreationSchema = z.object({
  topic: z
    .string()
    .min(3, "Topic must be at least 3 characters")
    .max(100, "Topic must not exceed 100 characters"),
  gameType: quizGameTypeSchema.default("PRACTICE"),
  questionType: questionTypeSchema.optional().nullable(),
  difficulty: difficultyLevelSchema.optional().nullable(),
  bloomLevel: bloomLevelSchema.optional().nullable(),
  totalQuestions: z
    .number()
    .int()
    .min(
      quizSettings.minQuestionCount,
      `Minimum ${quizSettings.minQuestionCount} questions required`
    )
    .max(
      quizSettings.maxQuestionCount,
      `Maximum ${quizSettings.maxQuestionCount} questions allowed`
    ),
  timeLimitMinutes: z
    .number()
    .int()
    .min(1, "Time limit must be at least 1 minute")
    .max(180, "Time limit must not exceed 180 minutes")
    .optional()
    .nullable(),
  aiGenerated: z.boolean().default(false),
  categoryId: z.string().optional(),
  subjectId: z.string().optional(),
});

export type QuizCreationFormData = z.infer<typeof quizCreationSchema>;

// ============================================
// Quiz Setup Schema (for existing questions)
// ============================================

export const quizSetupSchema = z.object({
  questionCount: z
    .number()
    .int()
    .min(quizSettings.minQuestionCount)
    .max(quizSettings.maxQuestionCount),
  category: z.string().nullable().optional(),
  difficulty: difficultyLevelSchema.nullable().optional(),
  bloomLevel: bloomLevelSchema.nullable().optional(),
  timeLimit: z.number().int().positive().nullable().optional(),
});

export type QuizSetupFormData = z.infer<typeof quizSetupSchema>;

// ============================================
// Question Bank Schemas
// ============================================

export const questionBankCreateSchema = z.object({
  subjectId: z.string().min(1, "Subject is required"),
  questionText: z
    .string()
    .min(10, "Question must be at least 10 characters")
    .max(2000, "Question must not exceed 2000 characters"),
  questionType: questionTypeSchema,
  difficulty: difficultyLevelSchema,
  bloomLevel: bloomLevelSchema,
  points: z.number().min(0.5).max(100).default(1),
  timeEstimate: z.number().int().positive().optional().nullable(),
  options: z.array(questionOptionSchema).optional().nullable(),
  sampleAnswer: z.string().optional().nullable(),
  gradingRubric: z.string().optional().nullable(),
  tags: z.array(z.string()).default([]),
  explanation: z.string().optional().nullable(),
  source: z.enum(["MANUAL", "AI", "IMPORTED"]).default("MANUAL"),
  aiPrompt: z.string().optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
});

export type QuestionBankFormData = z.infer<typeof questionBankCreateSchema>;

// Validation for question types
export const mcqQuestionSchema = questionBankCreateSchema.extend({
  questionType: z.literal("MULTIPLE_CHOICE"),
  options: z
    .array(questionOptionSchema)
    .min(2, "At least 2 options required")
    .max(6, "Maximum 6 options allowed")
    .refine(
      (options) => options.filter((o) => o.isCorrect).length === 1,
      "Exactly one option must be correct"
    ),
});

export const trueFalseQuestionSchema = questionBankCreateSchema.extend({
  questionType: z.literal("TRUE_FALSE"),
  options: z
    .array(questionOptionSchema)
    .length(2, "True/False must have exactly 2 options")
    .refine(
      (options) => options.filter((o) => o.isCorrect).length === 1,
      "Exactly one option must be correct"
    ),
});

export const fillBlankQuestionSchema = questionBankCreateSchema.extend({
  questionType: z.literal("FILL_BLANK"),
  options: fillBlankConfigSchema,
});

export const shortAnswerQuestionSchema = questionBankCreateSchema.extend({
  questionType: z.literal("SHORT_ANSWER"),
  sampleAnswer: z
    .string()
    .min(5, "Sample answer required")
    .max(500, "Sample answer too long"),
});

export const essayQuestionSchema = questionBankCreateSchema.extend({
  questionType: z.literal("ESSAY"),
  sampleAnswer: z.string().min(50, "Sample answer should be detailed"),
  gradingRubric: z.string().min(20, "Grading rubric required for essays"),
});

// ============================================
// Answer Submission Schemas
// ============================================

export const submitAnswerSchema = z.object({
  gameId: z.string(),
  questionId: z.string(),
  userAnswer: z.string().nullable().optional(),
  selectedOptions: z.array(z.string()).default([]),
  timeSpent: z.number().int().nonnegative(),
});

export type SubmitAnswerFormData = z.infer<typeof submitAnswerSchema>;

export const skipQuestionSchema = z.object({
  gameId: z.string(),
  questionId: z.string(),
});

// ============================================
// Quiz Completion Schema
// ============================================

export const completeQuizSchema = z.object({
  gameId: z.string(),
  totalTimeSpent: z.number().int().nonnegative(),
});

export type CompleteQuizFormData = z.infer<typeof completeQuizSchema>;

// ============================================
// AI Generation Schemas
// ============================================

export const generateQuestionsSchema = z.object({
  topic: z.string().min(3, "Topic required"),
  questionType: questionTypeSchema,
  difficulty: difficultyLevelSchema,
  count: z
    .number()
    .int()
    .min(1)
    .max(20, "Maximum 20 questions can be generated at once"),
  bloomLevel: bloomLevelSchema.optional(),
  subjectId: z.string().optional(),
});

export type GenerateQuestionsFormData = z.infer<typeof generateQuestionsSchema>;

// ============================================
// Category Schemas
// ============================================

export const quizCategorySchema = z.object({
  name: z
    .string()
    .min(2, "Category name must be at least 2 characters")
    .max(50, "Category name must not exceed 50 characters"),
  description: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
  color: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, "Invalid color format")
    .optional()
    .nullable(),
  imageUrl: z.string().url().optional().nullable(),
  subjectId: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

export type QuizCategoryFormData = z.infer<typeof quizCategorySchema>;

// ============================================
// Filter Schemas
// ============================================

export const quizFilterSchema = z.object({
  gameType: quizGameTypeSchema.optional(),
  status: quizGameStatusSchema.optional(),
  difficulty: difficultyLevelSchema.optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
  categoryId: z.string().optional(),
  search: z.string().optional(),
});

export type QuizFilterFormData = z.infer<typeof quizFilterSchema>;

// ============================================
// Leaderboard Schema
// ============================================

export const leaderboardQuerySchema = z.object({
  period: z.enum(["daily", "weekly", "monthly", "all_time"]).default("all_time"),
  limit: z.number().int().positive().max(100).default(10),
  classId: z.string().optional(),
});

export type LeaderboardQueryFormData = z.infer<typeof leaderboardQuerySchema>;

// ============================================
// Statistics Query Schema
// ============================================

export const statisticsQuerySchema = z.object({
  gameId: z.string().optional(),
  userId: z.string().optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
  categoryId: z.string().optional(),
  includeAnalytics: z.boolean().default(false),
});

export type StatisticsQueryFormData = z.infer<typeof statisticsQuerySchema>;

// ============================================
// Bulk Operations Schemas
// ============================================

export const bulkImportQuestionsSchema = z.object({
  questions: z.array(questionBankCreateSchema).min(1).max(100),
  subjectId: z.string(),
  source: z.enum(["MANUAL", "AI", "IMPORTED"]).default("IMPORTED"),
});

export const bulkDeleteGamesSchema = z.object({
  gameIds: z.array(z.string()).min(1),
});

// ============================================
// Export Helper Types
// ============================================

export type QuestionType = z.infer<typeof questionTypeSchema>;
export type DifficultyLevel = z.infer<typeof difficultyLevelSchema>;
export type BloomLevel = z.infer<typeof bloomLevelSchema>;
export type QuizGameType = z.infer<typeof quizGameTypeSchema>;
export type QuizGameStatus = z.infer<typeof quizGameStatusSchema>;
