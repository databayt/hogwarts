// Results Block Validation Schemas

import { z } from "zod"

// ========== PDF Generation Schemas ==========

export const pdfTemplateSchema = z.enum(["classic", "modern", "minimal"])

export const pdfGenerationOptionsSchema = z.object({
  template: pdfTemplateSchema,
  includeQuestionBreakdown: z.boolean().default(true),
  includeGradeDistribution: z.boolean().default(true),
  includeClassAnalytics: z.boolean().default(true),
  includeSchoolBranding: z.boolean().default(true),
  orientation: z.enum(["portrait", "landscape"]).default("portrait"),
  pageSize: z.enum(["A4", "Letter"]).default("A4"),
  language: z.enum(["en", "ar"]).default("en"),
})

export const generateSinglePDFSchema = z.object({
  examId: z.string().min(1),
  studentId: z.string().min(1),
  options: pdfGenerationOptionsSchema.optional(),
})

export const batchPDFRequestSchema = z.object({
  examId: z.string().min(1),
  studentIds: z.array(z.string()).optional(),
  options: pdfGenerationOptionsSchema,
})

// ========== Template Customization Schema ==========

export const pdfTemplateCustomizationSchema = z.object({
  headerColor: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, "Invalid hex color")
    .default("#3B82F6"),
  fontFamily: z.enum(["Inter", "Tajawal", "Roboto", "Arial"]).default("Inter"),
  fontSize: z.number().min(8).max(16).default(10),
  includeWatermark: z.boolean().default(false),
  watermarkText: z.string().max(50).optional(),
  customFooter: z.string().max(200).optional(),
})

// ========== Export Schemas ==========

export const resultExportOptionsSchema = z.object({
  format: z.enum(["pdf", "excel", "csv"]).default("pdf"),
  includeAbsent: z.boolean().default(false),
  sortBy: z.enum(["rank", "name", "marks"]).default("rank"),
  groupBy: z.enum(["grade", "status"]).optional(),
})

export const exportResultsSchema = z.object({
  examId: z.string().min(1),
  options: resultExportOptionsSchema,
})

// ========== Query Schemas ==========

export const getResultsSchema = z.object({
  examId: z.string().min(1),
  includeAbsent: z.boolean().default(true),
  includeQuestionBreakdown: z.boolean().default(false),
})

export const getAnalyticsSchema = z.object({
  examId: z.string().min(1),
})

export const getStudentResultSchema = z.object({
  examId: z.string().min(1),
  studentId: z.string().min(1),
  includeQuestionBreakdown: z.boolean().default(true),
})

// ========== Grade Calculation Schema ==========

export const gradeCalculationInputSchema = z.object({
  percentage: z.number().min(0).max(100),
  schoolId: z.string().min(1),
})

// ========== Template Selection Schema ==========

export const templateSelectionSchema = z.object({
  template: pdfTemplateSchema,
  customization: pdfTemplateCustomizationSchema.optional(),
})

// Type exports
export type PDFGenerationOptions = z.infer<typeof pdfGenerationOptionsSchema>
export type PDFTemplateCustomization = z.infer<
  typeof pdfTemplateCustomizationSchema
>
export type ResultExportOptions = z.infer<typeof resultExportOptionsSchema>
export type BatchPDFRequest = z.infer<typeof batchPDFRequestSchema>
