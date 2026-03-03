// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

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

  // Regional preset & copy count
  regionPreset: z.string().max(50).optional(),
  customCopies: z.number().int().min(1).max(1000).optional(),
  spareCopies: z.number().int().min(0).max(50).default(2),
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
// COMPOSITION CONFIG SCHEMA
// ============================================================================

export const compositionSlotsSchema = z.object({
  header: z.enum(["standard", "ministry", "minimal", "bilingual", "centered"]),
  footer: z.enum(["standard", "disclaimer", "minimal", "grading"]),
  studentInfo: z.enum(["standard", "bubble-id", "table", "photo"]),
  instructions: z.enum(["standard", "compact", "rules", "sectioned"]),
  answerSheet: z.enum(["standard", "omr", "grid"]),
  cover: z.enum(["standard", "toc", "ministry"]),
})

export const compositionDecorationsSchema = z.object({
  accentBar: z.object({
    enabled: z.boolean(),
    height: z.number().min(1).max(20).optional(),
    colorKey: z.enum(["accent", "primary"]).optional(),
  }),
  watermark: z.object({
    enabled: z.boolean(),
    text: z.string().max(100).optional(),
    opacity: z.number().min(0).max(1).optional(),
  }),
  frame: z.object({
    enabled: z.boolean(),
    outerWidth: z.number().min(0.5).max(5).optional(),
    innerWidth: z.number().min(0.5).max(5).optional(),
  }),
})

export const compositionSlotPropsSchema = z
  .object({
    header: z
      .object({
        logoSize: z.number().min(20).max(200).optional(),
        ministryName: z.string().max(200).optional(),
        ministryLogoUrl: z.string().url().optional(),
      })
      .optional(),
    footer: z
      .object({
        disclaimerText: z.string().max(500).optional(),
        gradingScale: z.string().max(200).optional(),
      })
      .optional(),
    studentInfo: z
      .object({
        showSeatNumber: z.boolean().optional(),
        idDigits: z.number().min(4).max(12).optional(),
        photoSize: z.number().min(40).max(120).optional(),
      })
      .optional(),
    instructions: z
      .object({
        wrapWithAccentBorder: z.boolean().optional(),
      })
      .optional(),
  })
  .optional()

export const compositionConfigSchema = z.object({
  slots: compositionSlotsSchema,
  decorations: compositionDecorationsSchema,
  slotProps: compositionSlotPropsSchema,
})

export type CompositionConfigInput = z.input<typeof compositionConfigSchema>

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
