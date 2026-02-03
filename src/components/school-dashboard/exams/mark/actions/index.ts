/**
 * Central export file for all mark actions
 * Refactored from original 714-line actions.ts into focused modules
 */

// Question Bank Operations
export { createQuestion, updateQuestion, deleteQuestion } from "./question-bank"

// Rubric Management
export { createRubric, updateRubric, deleteRubric } from "./rubric"

// Student Answer Submission
export {
  submitAnswer,
  getStudentAnswers,
  clearStudentAnswer,
} from "./submission"

// Automated Marking
export { autoGradeAnswer, autoGradeExam } from "./auto-mark"

// Enhanced Auto-Marking with Answer Key
export {
  getOrCreateAnswerKey,
  autoGradeWithKey,
  batchAutoGradeWithKey,
  refreshAnswerKey,
} from "./auto-mark-with-key"

// AI-Assisted Grading
export { aiGradeAnswer, batchAIGrade, getAIFeedback } from "./ai-grade"

// Manual Marking & Overrides
export {
  manualGrade,
  overrideGrade,
  reviewAIGrade,
  getGradeOverrides,
} from "./manual-mark"

// Bulk Operations
export {
  bulkGradeExam,
  bulkAIGrade,
  importMarksFromCSV,
  resetExamGrades,
} from "./bulk-operations"

// OCR Processing
export {
  processAnswerOCR,
  batchProcessOCR,
  correctOCRText,
  getOCRStatus,
} from "./ocr"

// Type Exports
export type {
  ActionResponse,
  QuestionWithRubrics,
  QuestionOption,
  StudentAnswerWithDetails,
  AutoGradeResult,
  AIGradeResult,
  OCRResult,
  BulkGradeResult,
  CreateQuestionInput,
  CreateRubricInput,
  SubmitAnswerInput,
  GradeOverrideInput,
  BulkGradeInput,
  TenantContext,
} from "./types"
