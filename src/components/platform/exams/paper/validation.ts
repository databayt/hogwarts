/**
 * Exam Paper System - Zod Validation Schemas
 * Validates paper configuration and generation inputs
 */

import { z } from "zod"

// ============================================================================
// ENUM SCHEMAS
// ============================================================================

export const examPaperTemplateSchema = z.enum([
  "CLASSIC",
  "MODERN",
  "FORMAL",
  "CUSTOM",
])

export const paperLayoutSchema = z.enum([
  "SINGLE_COLUMN",
  "TWO_COLUMN",
  "BOOKLET",
])

export const answerSheetTypeSchema = z.enum(["NONE", "SEPARATE", "BUBBLE"])

export const pageSizeSchema = z.enum(["A4", "Letter"])

export const orientationSchema = z.enum(["portrait", "landscape"])

// ============================================================================
// PAPER CONFIG FORM SCHEMA
// ============================================================================

export const paperConfigFormSchema = z.object({
  // Template & Layout
  template: examPaperTemplateSchema.default("CLASSIC"),
  layout: paperLayoutSchema.default("SINGLE_COLUMN"),
  answerSheetType: answerSheetTypeSchema.default("SEPARATE"),

  // Header
  showSchoolLogo: z.boolean().default(true),
  showExamTitle: z.boolean().default(true),
  showInstructions: z.boolean().default(true),
  customInstructions: z.string().max(2000).optional(),
  showStudentInfo: z.boolean().default(true),

  // Questions
  showQuestionNumbers: z.boolean().default(true),
  showPointsPerQuestion: z.boolean().default(true),
  showQuestionType: z.boolean().default(false),
  shuffleQuestions: z.boolean().default(false),
  shuffleOptions: z.boolean().default(false),

  // Answer Space
  answerLinesShort: z.number().int().min(1).max(10).default(3),
  answerLinesEssay: z.number().int().min(5).max(30).default(12),

  // Footer & Print
  showPageNumbers: z.boolean().default(true),
  showTotalPages: z.boolean().default(true),
  customFooter: z.string().max(500).optional(),
  pageSize: pageSizeSchema.default("A4"),
  orientation: orientationSchema.default("portrait"),

  // Versioning
  versionCount: z.number().int().min(1).max(5).default(1),
})

export type PaperConfigFormInput = z.input<typeof paperConfigFormSchema>
export type PaperConfigFormOutput = z.output<typeof paperConfigFormSchema>

// ============================================================================
// PAPER GENERATION SCHEMAS
// ============================================================================

export const generatePaperInputSchema = z.object({
  generatedExamId: z.string().cuid(),
  configId: z.string().cuid().optional(),
  versionCode: z.string().max(5).optional(),
})

export const generateAnswerKeyInputSchema = z.object({
  generatedExamId: z.string().cuid(),
})

export const generateMultipleVersionsInputSchema = z.object({
  generatedExamId: z.string().cuid(),
  versionCount: z.number().int().min(1).max(5),
})

// ============================================================================
// PAPER CONFIG CRUD SCHEMAS
// ============================================================================

export const createPaperConfigSchema = z.object({
  generatedExamId: z.string().cuid(),
  config: paperConfigFormSchema,
})

export const updatePaperConfigSchema = z.object({
  configId: z.string().cuid(),
  config: paperConfigFormSchema.partial(),
})

export const deletePaperConfigSchema = z.object({
  configId: z.string().cuid(),
})

// ============================================================================
// DOWNLOAD SCHEMAS
// ============================================================================

export const downloadPaperSchema = z.object({
  paperId: z.string().cuid(),
})

export const downloadAnswerKeySchema = z.object({
  generatedExamId: z.string().cuid(),
})

// ============================================================================
// QUESTION OPTION SCHEMAS (for validation during generation)
// ============================================================================

export const mcqOptionSchema = z.object({
  text: z.string().min(1),
  isCorrect: z.boolean(),
  explanation: z.string().optional(),
})

export const fillBlankOptionsSchema = z.object({
  acceptedAnswers: z.array(z.string().min(1)).min(1),
  caseSensitive: z.boolean().optional().default(false),
})

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validate paper config form data
 */
export function validatePaperConfig(data: unknown) {
  return paperConfigFormSchema.safeParse(data)
}

/**
 * Validate generate paper input
 */
export function validateGeneratePaperInput(data: unknown) {
  return generatePaperInputSchema.safeParse(data)
}

/**
 * Validate answer key generation input
 */
export function validateAnswerKeyInput(data: unknown) {
  return generateAnswerKeyInputSchema.safeParse(data)
}

/**
 * Get default paper config values
 */
export function getDefaultPaperConfig(): PaperConfigFormOutput {
  return paperConfigFormSchema.parse({})
}
