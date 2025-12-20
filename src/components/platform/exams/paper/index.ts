/**
 * Exam Paper System - Public API
 * Export all types, validation, and configuration
 */

// Types
export type {
  ActionResponse,
  AnswerKeyData,
  AnswerKeyEntry,
  ExamPaperData,
  ExamWithDetails,
  FillBlankOptions,
  GenerateAnswerKeyResult,
  GeneratePaperResult,
  GenerateVersionsResult,
  GeneratedExamQuestionWithQuestion,
  GeneratedExamWithDetails,
  PaperConfigDTO,
  PaperConfigFormData,
  PaperConfigFormState,
  PaperMetadata,
  PaperPreviewState,
  PaperRow,
  QuestionForPaper,
  QuestionOption,
  SchoolForPaper,
} from "./types"

// Re-export Prisma types
export type { AnswerSheetType, ExamPaperTemplate, PaperLayout } from "./types"

// Template constants
export { ANSWER_SHEET_TYPES, PAPER_LAYOUTS, PAPER_TEMPLATES } from "./types"

// Validation schemas
export {
  answerSheetTypeSchema,
  createPaperConfigSchema,
  deletePaperConfigSchema,
  downloadAnswerKeySchema,
  downloadPaperSchema,
  examPaperTemplateSchema,
  fillBlankOptionsSchema,
  generateAnswerKeyInputSchema,
  generateMultipleVersionsInputSchema,
  generatePaperInputSchema,
  getDefaultPaperConfig,
  mcqOptionSchema,
  orientationSchema,
  pageSizeSchema,
  paperConfigFormSchema,
  paperLayoutSchema,
  updatePaperConfigSchema,
  validateAnswerKeyInput,
  validateGeneratePaperInput,
  validatePaperConfig,
} from "./validation"

export type { PaperConfigFormInput, PaperConfigFormOutput } from "./validation"

// Configuration constants
export {
  ANSWER_LINE_CONFIG,
  ANSWER_SHEET_CONFIG,
  DEFAULT_INSTRUCTIONS,
  DEFAULT_PAPER_CONFIG,
  DIFFICULTY_LABELS,
  FONT_SIZES,
  FONTS,
  FOOTER_TEMPLATES,
  generateAnswerKeyFilename,
  generatePaperFilename,
  getVersionCode,
  LAYOUT_CONFIG,
  MCQ_CONFIG,
  MCQ_INSTRUCTIONS,
  PAGE_DIMENSIONS,
  PAGE_MARGINS,
  QUESTION_SPACING,
  QUESTION_TYPE_LABELS,
  STORAGE_PATHS,
  TEMPLATE_STYLES,
  VERSION_CODES,
} from "./config"

// Actions (re-exported for convenience)
export type {
  ActionResult,
  CreatePaperConfigInput,
  GenerateAnswerKeyInput,
  GenerateAnswerKeyOutput,
  GeneratePaperInput,
  GeneratePaperOutput,
  GenerateVersionsInput,
  GenerateVersionsOutput,
  PaperConfigWithRelations,
  UpdatePaperConfigInput,
} from "./actions"

// Templates
export { ClassicTemplate, getAllTemplates, getTemplate } from "./templates"
